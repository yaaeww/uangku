package controllers

import (
	"keuangan-keluarga/internal/services"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type WalletController struct {
	service services.WalletService
}

func NewWalletController(svc services.WalletService) *WalletController {
	return &WalletController{service: svc}
}

type CreateWalletRequest struct {
	Name           string  `json:"name" binding:"required"`
	WalletType     string  `json:"wallet_type" binding:"required"`
	AccountNumber  string  `json:"account_number"`
	InitialBalance float64 `json:"initial_balance"`
}

func (ctrl *WalletController) Create(c *gin.Context) {
	familyIDRaw, _ := c.Get("family_id")
	familyID, _ := uuid.Parse(familyIDRaw.(string))
	userIDRaw, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDRaw.(string))

	var req CreateWalletRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := ctrl.service.CreateWallet(familyID, userID, req.Name, req.WalletType, req.AccountNumber, req.InitialBalance); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Wallet created successfully"})
}

func (ctrl *WalletController) List(c *gin.Context) {
	familyIDRaw, _ := c.Get("family_id")
	familyID, _ := uuid.Parse(familyIDRaw.(string))
	userIDRaw, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDRaw.(string))
	role := c.GetString("family_role")

	wallets, err := ctrl.service.GetFamilyWallets(familyID, userID, role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, wallets)
}

func (ctrl *WalletController) Update(c *gin.Context) {
	familyIDRaw, _ := c.Get("family_id")
	familyID, _ := uuid.Parse(familyIDRaw.(string))

	var req struct {
		ID            uuid.UUID `json:"id" binding:"required"`
		Name          string    `json:"name"`
		WalletType    string    `json:"wallet_type"`
		AccountNumber string    `json:"account_number"`
		Balance       float64   `json:"balance"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 1. Fetch existing wallet to ensure ownership
	existing, err := ctrl.service.GetWalletByID(req.ID)
	if err != nil || existing.FamilyID != familyID {
		c.JSON(http.StatusNotFound, gin.H{"error": "Wallet not found or access denied"})
		return
	}

	// 2. Ownership check: ONLY the original creator can edit
	userIDRaw, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDRaw.(string))

	if existing.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Anda tidak memiliki izin untuk mengubah dompet ini. Hanya pembuat dompet yang diperbolehkan."})
		return
	}

	// 2. Update fields
	existing.Name = req.Name
	existing.WalletType = req.WalletType
	existing.AccountNumber = req.AccountNumber
	existing.Balance = req.Balance

	if err := ctrl.service.UpdateWallet(userID, existing); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Wallet updated successfully"})
}

func (ctrl *WalletController) Delete(c *gin.Context) {
	idRaw := c.Param("id")
	id, err := uuid.Parse(idRaw)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	// Ownership check
	existing, err := ctrl.service.GetWalletByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Wallet not found"})
		return
	}
	// Ownership check: ONLY the original creator can delete
	userIDRaw, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDRaw.(string))

	if existing.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Anda tidak memiliki izin untuk menghapus dompet ini. Hanya pembuat dompet yang diperbolehkan."})
		return
	}

	if err := ctrl.service.DeleteWallet(userID, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Wallet deleted successfully"})
}
