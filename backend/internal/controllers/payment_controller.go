package controllers

import (
	"encoding/json"
	"io"
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"
	"keuangan-keluarga/internal/services"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type PaymentController struct {
	TripayService services.TripayService
}

func NewPaymentController(tripay services.TripayService) *PaymentController {
	return &PaymentController{
		TripayService: tripay,
	}
}

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
		TotalAmount:   tripayResp.Data.AmountReceived, // Amount + Fee usually
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save transaction"})
		return
	}

	c.JSON(http.StatusOK, payment)
}

func (pc *PaymentController) HandleCallback(c *gin.Context) {
	// 1. Validate Signature
	signature := c.GetHeader("X-Callback-Signature")
	body, _ := io.ReadAll(c.Request.Body)
	
	if !pc.TripayService.ValidateCallback(body, signature) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Invalid signature"})
		return
	}

	// 2. Parse Callback Content
	var callback struct {
		Reference    string `json:"reference"`
		MerchantRef  string `json:"merchant_ref"`
		Status       string `json:"status"` // PAID, EXPIRED, FAILED
		PaidAt       int64  `json:"paid_at"`
	}

	if err := json.Unmarshal(body, &callback); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid body"})
		return
	}

	// 3. Find Transaction
	var payment models.PaymentTransaction
	if err := config.DB.Where("reference = ?", callback.Reference).First(&payment).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transaction not found"})
		return
	}

	// 4. Update Transaction Status
	if payment.Status != "PAID" {
		updates := map[string]interface{}{
			"status": callback.Status,
		}
		if callback.Status == "PAID" {
			now := time.Now()
			updates["paid_at"] = &now
		}
		config.DB.Model(&payment).Updates(updates)

		// 5. If PAID, Activate Subscription
		if callback.Status == "PAID" {
			pc.activateSubscription(payment)
		}
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}

func (pc *PaymentController) activateSubscription(payment models.PaymentTransaction) {
	var family models.Family
	if err := config.DB.Where("id = ?", payment.FamilyID).First(&family).Error; err == nil {
		var plan models.SubscriptionPlan
		if err := config.DB.Where("id = ?", payment.PlanID).First(&plan).Error; err == nil {
			
			// Extend subscription or start new
			var newEnd time.Time
			if family.SubscriptionEndsAt.After(time.Now()) {
				newEnd = family.SubscriptionEndsAt.AddDate(0, 0, plan.DurationDays)
			} else {
				newEnd = time.Now().AddDate(0, 0, plan.DurationDays)
			}

			config.DB.Model(&family).Updates(map[string]interface{}{
				"status":               "active",
				"subscription_plan":    plan.Name,
				"subscription_ends_at": newEnd,
			})
		}
	}
}

func (pc *PaymentController) GetPayment(c *gin.Context) {
	id := c.Param("id")
	var payment models.PaymentTransaction
	if err := config.DB.Where("id = ?", id).First(&payment).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transaction not found"})
		return
	}
	c.JSON(http.StatusOK, payment)
}
