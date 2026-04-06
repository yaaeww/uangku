package controllers

import (
	"keuangan-keluarga/internal/models"
	"keuangan-keluarga/internal/services"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"time"
)

type GoalController struct {
	service services.GoalService
	finance services.FinanceService
	wallet  services.WalletService
}

func NewGoalController(svc services.GoalService, finance services.FinanceService, wallet services.WalletService) *GoalController {
	return &GoalController{service: svc, finance: finance, wallet: wallet}
}

func (ctrl *GoalController) Create(c *gin.Context) {
	familyIDRaw, _ := c.Get("family_id")
	familyID, _ := uuid.Parse(familyIDRaw.(string))

	var req struct {
		Name         string  `json:"name" binding:"required"`
		TargetAmount float64 `json:"target_amount" binding:"required"`
		Category     string  `json:"category"`
		Emoji        string  `json:"emoji"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userIDRaw, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDRaw.(string))

	goal := &models.Goal{
		FamilyID:     familyID,
		UserID:       userID,
		Name:         req.Name,
		TargetAmount: req.TargetAmount,
		Category:     req.Category,
		Emoji:        req.Emoji,
	}

	if err := ctrl.service.CreateGoal(goal); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, goal)
}

func (ctrl *GoalController) List(c *gin.Context) {
	familyIDRaw, _ := c.Get("family_id")
	familyID, _ := uuid.Parse(familyIDRaw.(string))

	goals, err := ctrl.service.GetFamilyGoals(familyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, goals)
}

func (ctrl *GoalController) Update(c *gin.Context) {
	familyIDRaw, _ := c.Get("family_id")
	familyID, _ := uuid.Parse(familyIDRaw.(string))

	var req struct {
		ID           uuid.UUID `json:"id" binding:"required"`
		Name         string    `json:"name"`
		TargetAmount float64   `json:"target_amount"`
		Status       string    `json:"status"`
		Category     string    `json:"category"`
		Emoji        string    `json:"emoji"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	existing, err := ctrl.service.GetGoalByID(req.ID)
	if err != nil || existing.FamilyID != familyID {
		c.JSON(http.StatusNotFound, gin.H{"error": "Goal not found"})
		return
	}

	// Ownership check: ONLY the original creator can edit
	userIDRaw, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDRaw.(string))

	if existing.UserID != userID && existing.UserID != uuid.Nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Anda tidak memiliki izin untuk mengubah goal ini. Hanya pembuat goal yang diperbolehkan."})
		return
	}

	if req.Name != "" {
		existing.Name = req.Name
	}
	if req.TargetAmount > 0 {
		existing.TargetAmount = req.TargetAmount
	}
	if req.Status != "" {
		existing.Status = req.Status
	}
	if req.Category != "" {
		existing.Category = req.Category
	}
	if req.Emoji != "" {
		existing.Emoji = req.Emoji
	}

	if err := ctrl.service.UpdateGoal(userID, existing); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, existing)
}

func (ctrl *GoalController) ConvertToAsset(c *gin.Context) {
	var req struct {
		GoalID    uuid.UUID `json:"goal_id" binding:"required"`
		AssetType string    `json:"asset_type" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Ownership check
	userIDRaw, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDRaw.(string))

	existing, err := ctrl.service.GetGoalByID(req.GoalID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Goal tidak ditemukan"})
		return
	}

	// Ownership check: ONLY the original creator can convert
	if existing.UserID != userID && existing.UserID != uuid.Nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Anda tidak memiliki izin untuk mengonversi goal ini. Hanya pembuat goal yang diperbolehkan."})
		return
	}

	if err := ctrl.service.ConvertToAsset(req.GoalID, req.AssetType); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Goal successfully converted to Asset"})
}

func (ctrl *GoalController) Delete(c *gin.Context) {
	idRaw := c.Param("id")
	id, _ := uuid.Parse(idRaw)

	familyIDRaw, _ := c.Get("family_id")
	familyID, _ := uuid.Parse(familyIDRaw.(string))

	existing, err := ctrl.service.GetGoalByID(id)
	if err != nil || existing.FamilyID != familyID {
		c.JSON(http.StatusNotFound, gin.H{"error": "Goal tidak ditemukan"})
		return
	}

	// Ownership check: ONLY the original creator can delete
	userIDRaw, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDRaw.(string))

	if existing.UserID != userID && existing.UserID != uuid.Nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Anda tidak memiliki izin untuk menghapus goal ini. Hanya pembuat goal yang diperbolehkan."})
		return
	}

	if err := ctrl.service.DeleteGoal(userID, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Goal deleted successfully"})
}

func (ctrl *GoalController) AllocateFromWallet(c *gin.Context) {
	familyIDRaw, _ := c.Get("family_id")
	familyID, _ := uuid.Parse(familyIDRaw.(string))
	userIDRaw, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDRaw.(string))

	var req struct {
		GoalID      uuid.UUID `json:"goal_id" binding:"required"`
		WalletID    uuid.UUID `json:"wallet_id" binding:"required"`
		Amount      float64   `json:"amount" binding:"required"`
		Description string    `json:"description"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 2. Verify Wallet ownership
	wallet, err := ctrl.wallet.GetWalletByID(req.WalletID)
	if err != nil || wallet.FamilyID != familyID {
		c.JSON(http.StatusNotFound, gin.H{"error": "Wallet not found"})
		return
	}

	if wallet.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Anda tidak memiliki izin untuk menggunakan dompet ini"})
		return
	}

	// 3. Create Transaction using FinanceService
	tx := &models.Transaction{
		FamilyID:    familyID,
		UserID:      userID,
		WalletID:    req.WalletID,
		GoalID:      &req.GoalID,
		Type:        "goal_allocation",
		Amount:      req.Amount,
		Description: req.Description,
		Date:        time.Now(),
	}

	if err := ctrl.finance.CreateTransaction(tx); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Berhasil mengalokasikan dana ke goal", "transaction": tx})
}

func (ctrl *GoalController) GetHistory(c *gin.Context) {
	idRaw := c.Param("id")
	id, _ := uuid.Parse(idRaw)

	history, err := ctrl.service.GetGoalHistory(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, history)
}
