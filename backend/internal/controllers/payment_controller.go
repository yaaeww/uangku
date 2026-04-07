package controllers

import (
	"encoding/json"
	"fmt"
	"io"
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"
	"keuangan-keluarga/internal/services"
	"keuangan-keluarga/internal/utils"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type PaymentController struct {
	TripayService services.TripayService
	NotifService  services.NotificationService
}

func NewPaymentController(tripay services.TripayService, notif services.NotificationService) *PaymentController {
	return &PaymentController{
		TripayService: tripay,
		NotifService:  notif,
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

	// 3. Get Payment Channel Config
	var channel models.PaymentChannel
	if err := config.DB.Where("code = ?", req.Method).First(&channel).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Metode pembayaran tidak ditemukan"})
		return
	}

	if !channel.IsActive {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Metode pembayaran sedang dinonaktifkan"})
		return
	}

	if channel.IsManual {
		merchantRef := fmt.Sprintf("MB-%d", time.Now().UnixNano())
		// For manual, we use locally generated reference
		payment := models.PaymentTransaction{
			Reference:     merchantRef,
			MerchantRef:   merchantRef,
			FamilyID:      user.FamilyMember.FamilyID,
			PlanID:        plan.ID,
			PlanName:      plan.Name,
			Amount:        plan.Price,
			Fee:           channel.CustomFeeMerchant, // For manual, fee is the custom admin fee (if any)
			FeeMerchant:   0,
			FeeCustomer:   channel.CustomFeeMerchant,
			TotalAmount:   plan.Price + channel.CustomFeeMerchant,
			Status:        "UNPAID",
			PaymentMethod: channel.Code,
			PaymentName:   channel.Name,
			PayCode:       "MANUAL",
			QRCodeURL:     channel.IconURL,
			AccountName:   channel.AccountName,
			AccountNumber: channel.AccountNumber,
			Instructions:  fmt.Sprintf(`[{"title": "Transfer Bank %s", "steps": ["Silahkan transfer ke rekening %s a/n %s", "Upload bukti transfer di halaman invoice untuk verifikasi otomatis", "%s"]}]`, channel.Name, channel.AccountNumber, channel.AccountName, channel.Description),
			ExpiredAt:     time.Now().Add(24 * time.Hour),
		}

		if err := config.DB.Create(&payment).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create manual payment"})
			return
		}

		c.JSON(http.StatusOK, payment)
		return
	}

	// 4. Request TriPay Transaction
	tripayResp, err := pc.TripayService.CreateTransaction(&plan, &user, &channel)
	if err != nil {
		log.Printf("[Payment] Failed to create TriPay transaction: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 4. Save to Database
	instr, _ := json.Marshal(tripayResp.Data.Instructions)
	// Determine fee breakdown based on TriPay gateway fees only
	feeMerchant := tripayResp.Data.TotalFee
	feeCustomer := 0.0
	if channel.FeeBorneBy == "customer" {
		feeMerchant = 0.0
		feeCustomer = tripayResp.Data.TotalFee // TriPay gateway fee only
	}

	payment := models.PaymentTransaction{
		Reference:     tripayResp.Data.Reference,
		MerchantRef:   tripayResp.Data.MerchantRef,
		FamilyID:      user.FamilyMember.FamilyID,
		PlanID:        plan.ID,
		PlanName:      plan.Name,
		Amount:        tripayResp.Data.AmountReceived, // Net received from Tripay (Success amount)
		Fee:           feeMerchant + feeCustomer,      // Total Tax/Fee overhead
		FeeMerchant:   feeMerchant,                    // Fee borne by us
		FeeCustomer:   feeCustomer,                    // Fee borne by buyer
		TotalAmount:   tripayResp.Data.Amount,         // Total customer pays (Gross)
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
		Status      string `json:"status"`
		PaidAt      int64  `json:"paid_at"`
	}

	if err := json.Unmarshal(body, &callback); err != nil {
		log.Printf("[Callback] Failed to parse body: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid body"})
		return
	}

	// Clean and Normalize
	callback.Reference = strings.TrimSpace(callback.Reference)
	callback.MerchantRef = strings.TrimSpace(callback.MerchantRef)
	callback.Status = strings.ToUpper(strings.TrimSpace(callback.Status))

	log.Printf("[Callback] Received: Ref=%s, MerchantRef=%s, Status=%s", callback.Reference, callback.MerchantRef, callback.Status)

	// 3. Find Transaction
	var payment models.PaymentTransaction
	err := config.DB.Where("reference = ?", callback.Reference).First(&payment).Error
	if err != nil {
		err = config.DB.Where("merchant_ref = ?", callback.MerchantRef).First(&payment).Error
	}

	if err != nil {
		log.Printf("[Callback] Transaction not found: ref=%s, merchant_ref=%s", callback.Reference, callback.MerchantRef)
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "Transaction not found"})
		return
	}

	// 4. Update Transaction Status (idempotent check)
	if payment.Status == "PAID" {
		log.Printf("[Callback] Transaction already PAID: %s", payment.Reference)
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

	log.Printf("[Callback] Successfully updated status to %s for %s", callback.Status, payment.Reference)

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

// ListPayments - Returns all payment transactions for the family (protected)
func (pc *PaymentController) ListPayments(c *gin.Context) {
	familyID, exists := c.Get("family_id")
	if !exists {
		// Fallback for head_of_family if family_id is not in context but user_id is
		userID, _ := c.Get("user_id")
		var member models.FamilyMember
		if err := config.DB.Where("user_id = ?", userID).First(&member).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
			return
		}
		familyID = member.FamilyID
	}

	var payments []models.PaymentTransaction
	if err := config.DB.Where("family_id = ?", familyID).Order("created_at desc").Find(&payments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch payments"})
		return
	}

	c.JSON(http.StatusOK, payments)
}

// DeletePayment - Deletes a payment record (protected)
func (pc *PaymentController) DeletePayment(c *gin.Context) {
	id := c.Param("id")
	familyID, _ := c.Get("family_id")

	var payment models.PaymentTransaction
	if err := config.DB.Where("id = ? AND family_id = ?", id, familyID).First(&payment).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transaction not found"})
		return
	}

	if err := config.DB.Delete(&payment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete transaction"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Transaction record deleted"})
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
		pc.NotifService.NotifyUser(member.UserID, "subscription", "Pembayaran Berhasil!", 
			fmt.Sprintf("Selamat! Paket '%s' Anda telah aktif hingga %s. Semua limit fitur Anda telah diperbarui secara otomatis.", plan.Name, newEnd.Format("02 Jan 2006")))
	}
}

// SimulatePayment - Mock payment for testing/dev to avoid real TriPay costs
func (pc *PaymentController) SimulatePayment(c *gin.Context) {
	var req struct {
		PlanID string `json:"plan_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID Paket diperlukan"})
		return
	}

	// 1. Get Plan
	var plan models.SubscriptionPlan
	if err := config.DB.Where("id = ?", req.PlanID).First(&plan).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Paket tidak ditemukan"})
		return
	}

	// 2. Get User
	userIDStr := c.GetString("user_id")
	userID, _ := uuid.Parse(userIDStr)
	var user models.User
	if err := config.DB.Preload("FamilyMember").Where("id = ?", userID).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User tidak ditemukan"})
		return
	}

	if user.FamilyMember == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User tidak memiliki keluarga"})
		return
	}

	// 3. Create a Successful Mock Transaction
	now := time.Now()
	merchantRef := fmt.Sprintf("SIM-%d", now.UnixNano())
	payment := models.PaymentTransaction{
		Reference:     "SIM-" + uuid.New().String()[:8],
		MerchantRef:   merchantRef,
		FamilyID:      user.FamilyMember.FamilyID,
		PlanID:        plan.ID,
		PlanName:      plan.Name,
		Amount:        plan.Price,
		Fee:           2500, // Mock fee
		FeeMerchant:   1500, // Mock merchant fee
		FeeCustomer:   1000, // Mock customer fee
		TotalAmount:   plan.Price + 1000, // If customer pays the fee
		Status:        "PAID",
		PaymentMethod: "SIMULATION",
		PaymentName:   "Simulasi Pembayaran",
		PaidAt:        &now,
		ExpiredAt:     now.Add(24 * time.Hour),
	}

	if err := config.DB.Create(&payment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mencatat simulasi transaksi"})
		return
	}

	// 4. Activate Subscription
	pc.activateSubscription(payment)

	c.JSON(http.StatusOK, gin.H{
		"message":   fmt.Sprintf("Simulasi pembayaran paket %s berhasil!", plan.Name),
		"reference": payment.Reference,
		"plan":      plan.Name,
	})
}

// GetLatestPending - Check for existing unpaid transaction for a plan
func (pc *PaymentController) GetLatestPending(c *gin.Context) {
	planID := c.Query("plan_id")
	if planID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Plan ID required"})
		return
	}

	familyID, exists := c.Get("family_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized - Family context missing"})
		return
	}

	var payment models.PaymentTransaction
	// Find latest UNPAID transaction for this plan and family within last 24h
	err := config.DB.Where("family_id = ? AND plan_id = ? AND status = ? AND created_at > ?",
		familyID, planID, "UNPAID", time.Now().Add(-24*time.Hour)).
		Order("created_at DESC").
		First(&payment).Error

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No pending payment found"})
		return
	}

	c.JSON(http.StatusOK, payment)
}

// GetActiveChannels - Returns only active payment channels for checkout
func (pc *PaymentController) GetActiveChannels(c *gin.Context) {
	var channels []models.PaymentChannel
	if err := config.DB.Where("is_active = ?", true).Order("\"group\" ASC, name ASC").Find(&channels).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch payment methods"})
		return
	}
	c.JSON(http.StatusOK, channels)
}

// UploadBankLogo - Admin only, uploads manual bank logo and converts to WebP
func (pc *PaymentController) UploadBankLogo(c *gin.Context) {
	file, err := c.FormFile("image")
	if err != nil {
		log.Printf("[UploadBankLogo] FormFile error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "No image uploaded: " + err.Error()})
		return
	}

	code := c.PostForm("code") // Bank code (e.g., MANDIRI)
	if code == "" {
		code = "manual"
	}

	// 1. Ensure directories exist
	tempFolder := "./uploads/temp"
	finalFolder := "./uploads/payments"
	if err := os.MkdirAll(tempFolder, os.ModePerm); err != nil {
		log.Printf("[UploadBankLogo] MkdirAll temp error: %v", err)
	}
	if err := os.MkdirAll(finalFolder, os.ModePerm); err != nil {
		log.Printf("[UploadBankLogo] MkdirAll final error: %v", err)
	}

	// 2. Save Initial File
	ext := filepath.Ext(file.Filename)
	tempFilename := fmt.Sprintf("temp_%d_%s%s", time.Now().UnixNano(), uuid.New().String()[:8], ext)
	tempPath := filepath.Join(tempFolder, tempFilename)

	if err := c.SaveUploadedFile(file, tempPath); err != nil {
		log.Printf("[UploadBankLogo] SaveUploadedFile error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save temp file: " + err.Error()})
		return
	}
	defer os.Remove(tempPath)

	// 3. Prepare final WebP path
	filename := fmt.Sprintf("logo-%s-%d.webp", strings.ToLower(strings.ReplaceAll(code, " ", "-")), time.Now().Unix())
	filePath := filepath.Join(finalFolder, filename)

	// 4. Convert to WebP using our utility
	if err := utils.ConvertToWebP(tempPath, filePath, 80); err != nil {
		log.Printf("[UploadBankLogo] WebP Conversion Failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengonversi logo ke WebP"})
		return
	}

	url := "/uploads/payments/" + filename
	c.JSON(http.StatusOK, gin.H{"url": url})
}

// UploadProof - User only, uploads payment proof and converts to WebP
func (pc *PaymentController) UploadProof(c *gin.Context) {
	id := c.Param("id") // Transaction ID
	file, err := c.FormFile("image")
	if err != nil {
		log.Printf("[UploadProof] FormFile error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "No proof image uploaded: " + err.Error()})
		return
	}

	var payment models.PaymentTransaction
	if err := config.DB.Where("id = ?", id).First(&payment).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transaction not found"})
		return
	}

	// 1. Ensure directories exist
	tempFolder := "./uploads/temp"
	finalFolder := "./uploads/payments"
	os.MkdirAll(tempFolder, os.ModePerm)
	os.MkdirAll(finalFolder, os.ModePerm)

	// 2. Save Temp
	ext := filepath.Ext(file.Filename)
	tempFilename := fmt.Sprintf("proof_temp_%s_%d%s", id[:8], time.Now().UnixNano(), ext)
	tempPath := filepath.Join(tempFolder, tempFilename)

	if err := c.SaveUploadedFile(file, tempPath); err != nil {
		log.Printf("[UploadProof] SaveUploadedFile error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save temp file: " + err.Error()})
		return
	}
	defer os.Remove(tempPath)

	// 3. Convert to WebP
	filename := fmt.Sprintf("proof-%s-%d.webp", id[:8], time.Now().Unix())
	filePath := filepath.Join(finalFolder, filename)

	if err := utils.ConvertToWebP(tempPath, filePath, 80); err != nil {
		log.Printf("[UploadProof] WebP Conversion Failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengonversi bukti pembayaran ke WebP"})
		return
	}
	
	url := "/uploads/payments/" + filename
	
	// 4. Update Transaction
	if err := config.DB.Model(&payment).Updates(map[string]interface{}{
		"proof_url": url,
		"status":    "PENDING_APPROVAL", // Change status after proof upload
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update transaction status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"url": url, "status": "PENDING_APPROVAL"})
}

// UpdateManualStatus - Admin only, approve or reject manual payment
func (pc *PaymentController) UpdateManualStatus(c *gin.Context) {
	var req struct {
		ID     string `json:"id" binding:"required"`
		Status string `json:"status" binding:"required"` // APPROVED, REJECTED
		Notes  string `json:"notes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	var payment models.PaymentTransaction
	if err := config.DB.Where("id = ?", req.ID).First(&payment).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transaction not found"})
		return
	}

	if payment.Status != "PENDING_APPROVAL" && payment.Status != "UNPAID" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Transaction is already processed"})
		return
	}

	updates := map[string]interface{}{
		"status":      req.Status,
		"admin_notes": req.Notes,
	}

	switch req.Status {
	case "APPROVED":
		now := time.Now()
		updates["status"] = "PAID"
		updates["paid_at"] = &now
	case "REJECTED":
		updates["status"] = "FAILED"
	}

	if err := config.DB.Model(&payment).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update status"})
		return
	}

	// If approved, activate subscription
	if req.Status == "APPROVED" {
		payment.Status = "PAID" // Update local object for activation
		pc.activateSubscription(payment)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Status updated successfully", "status": updates["status"]})
}

