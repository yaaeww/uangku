package controllers

import (
	"encoding/json"
	"fmt"
	"io"
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"
	"keuangan-keluarga/internal/services"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type PaymentController struct {
	TripayService services.TripayService
}

func NewPaymentController(tripay services.TripayService) *PaymentController {
	return &PaymentController{
		TripayService: tripay,
	}
}

// CreatePayment - Creates a new TriPay transaction
func (pc *PaymentController) CreatePayment(c *gin.Context) {
	var req struct {
		PlanID string `json:"plan_id"`
		Method string `json:"method"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// 1. Get Plan
	var plan models.SubscriptionPlan
	if err := config.DB.Where("id = ?", req.PlanID).First(&plan).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Plan not found"})
		return
	}

	// 2. Get User (from context/token)
	userID, _ := c.Get("user_id")
	var user models.User
	if err := config.DB.Preload("FamilyMember").Where("id = ?", userID).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	if user.FamilyMember == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User does not belong to any family"})
		return
	}

	// 3. Request TriPay Transaction
	tripayResp, err := pc.TripayService.CreateTransaction(&plan, &user, req.Method)
	if err != nil {
		log.Printf("[Payment] Failed to create TriPay transaction: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 4. Save to Database
	instr, _ := json.Marshal(tripayResp.Data.Instructions)
	payment := models.PaymentTransaction{
		Reference:     tripayResp.Data.Reference,
		MerchantRef:   tripayResp.Data.MerchantRef,
		FamilyID:      user.FamilyMember.FamilyID,
		PlanID:        plan.ID,
		PlanName:      plan.Name,
		Amount:        tripayResp.Data.Amount,
		Fee:           tripayResp.Data.TotalFee,
		TotalAmount:   tripayResp.Data.AmountReceived,
		Status:        "UNPAID",
		PaymentMethod: tripayResp.Data.PaymentMethod,
		PaymentName:   tripayResp.Data.PaymentName,
		PayCode:       tripayResp.Data.PayCode,
		QRCodeURL:     tripayResp.Data.QRCodeURL,
		CheckoutURL:   tripayResp.Data.CheckoutURL,
		Instructions:  string(instr),
		ExpiredAt:     time.Unix(tripayResp.Data.ExpiredTime, 0),
	}

	if err := config.DB.Create(&payment).Error; err != nil {
		log.Printf("[Payment] Failed to save transaction: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save transaction"})
		return
	}

	c.JSON(http.StatusOK, payment)
}

// HandleCallback - Receives TriPay payment callback
func (pc *PaymentController) HandleCallback(c *gin.Context) {
	// 1. Read body and validate signature
	signature := c.GetHeader("X-Callback-Signature")
	body, _ := io.ReadAll(c.Request.Body)

	if !pc.TripayService.ValidateCallback(body, signature) {
		log.Printf("[Callback] Invalid signature received")
		c.JSON(http.StatusForbidden, gin.H{"error": "Invalid signature"})
		return
	}

	// 2. Parse Callback Content
	var callback struct {
		Reference   string `json:"reference"`
		MerchantRef string `json:"merchant_ref"`
		Status      string `json:"status"` // PAID, EXPIRED, FAILED
		PaidAt      int64  `json:"paid_at"`
	}

	if err := json.Unmarshal(body, &callback); err != nil {
		log.Printf("[Callback] Failed to parse body: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid body"})
		return
	}

	// Clean whitespace from keys
	callback.Reference = strings.TrimSpace(callback.Reference)
	callback.MerchantRef = strings.TrimSpace(callback.MerchantRef)


	// 3. Find Transaction (search by reference, fallback to merchant_ref)
	var payment models.PaymentTransaction
	err := config.DB.Where("reference = ?", callback.Reference).First(&payment).Error
	if err != nil {
		err = config.DB.Where("merchant_ref = ?", callback.MerchantRef).First(&payment).Error
	}

	if err != nil {
		log.Printf("[Callback] Transaction not found: ref=%s, merchant_ref=%s", callback.Reference, callback.MerchantRef)
		// Return 200 to prevent TriPay from retrying — transaction genuinely missing
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "Transaction not found"})
		return
	}

	// 4. Update Transaction Status (idempotent check)
	if payment.Status == "PAID" {
		c.JSON(http.StatusOK, gin.H{"success": true})
		return
	}

	updates := map[string]interface{}{
		"status": callback.Status,
	}
	if callback.Status == "PAID" {
		now := time.Now()
		updates["paid_at"] = &now
	}
	if err := config.DB.Model(&payment).Updates(updates).Error; err != nil {
		log.Printf("[Callback] Failed to update payment status: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update status"})
		return
	}


	// 5. If PAID, Activate Subscription
	if callback.Status == "PAID" {
		pc.activateSubscription(payment)
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}

// GetPaymentStatus - Frontend polls this to check payment status by Tripay reference
func (pc *PaymentController) GetPaymentStatus(c *gin.Context) {
	reference := strings.TrimSpace(c.Param("reference"))

	var payment models.PaymentTransaction
	if err := config.DB.Where("reference = ? OR merchant_ref = ?", reference, reference).First(&payment).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transaction not found"})
		return
	}

	// Return minimal safe data for polling
	c.JSON(http.StatusOK, gin.H{
		"id":         payment.ID,
		"reference":  payment.Reference,
		"status":     payment.Status,
		"paid_at":    payment.PaidAt,
		"expired_at": payment.ExpiredAt,
	})
}

// GetPayment - Get full payment details by ID (protected)
func (pc *PaymentController) GetPayment(c *gin.Context) {
	id := c.Param("id")
	var payment models.PaymentTransaction
	if err := config.DB.Where("id = ?", id).First(&payment).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transaction not found"})
		return
	}
	c.JSON(http.StatusOK, payment)
}

// activateSubscription - Activates/extends the family's subscription after payment
func (pc *PaymentController) activateSubscription(payment models.PaymentTransaction) {
	var family models.Family
	if err := config.DB.Where("id = ?", payment.FamilyID).First(&family).Error; err != nil {
		log.Printf("[Subscription] Family not found: %s", payment.FamilyID)
		return
	}

	var plan models.SubscriptionPlan
	if err := config.DB.Where("id = ?", payment.PlanID).First(&plan).Error; err != nil {
		log.Printf("[Subscription] Plan not found: %s", payment.PlanID)
		return
	}

	// Extend or start new subscription
	var newEnd time.Time
	if family.SubscriptionEndsAt.After(time.Now()) {
		newEnd = family.SubscriptionEndsAt.AddDate(0, 0, plan.DurationDays)
	} else {
		newEnd = time.Now().AddDate(0, 0, plan.DurationDays)
	}

	if err := config.DB.Model(&family).Updates(map[string]interface{}{
		"status":               "active",
		"subscription_plan":    plan.Name,
		"subscription_ends_at": newEnd,
	}).Error; err != nil {
		log.Printf("[Subscription] Failed to update family: %v", err)
		return
	}


	// 4. Record Notification for the first member we find (usually the one who created/pays)
	var member models.FamilyMember
	config.DB.Where("family_id = ?", payment.FamilyID).First(&member)

	if member.UserID != uuid.Nil {
		notification := models.Notification{
			UserID:  member.UserID,
			Type:    "subscription",
			Title:   "Pembayaran Berhasil!",
			Message: fmt.Sprintf("Selamat! Paket '%s' Anda telah aktif hingga %s. Semua limit fitur Anda telah diperbarui secara otomatis.", plan.Name, newEnd.Format("02 Jan 2006")),
		}
		if err := config.DB.Create(&notification).Error; err != nil {
			log.Printf("[Subscription] Warning: Failed to create notification: %v", err)
		}
	}
}
