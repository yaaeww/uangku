package controllers

import (
	"keuangan-keluarga/internal/models"
	"keuangan-keluarga/internal/services"
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type FinanceController struct {
	service services.FinanceService
}

func NewFinanceController(svc services.FinanceService) *FinanceController {
	return &FinanceController{service: svc}
}

func (ctrl *FinanceController) ListTransactions(c *gin.Context) {
	familyIDStr := c.GetString("family_id")
	familyID, err := uuid.Parse(familyIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid family ID"})
		return
	}

	month, _ := strconv.Atoi(c.DefaultQuery("month", "3"))
	year, _ := strconv.Atoi(c.DefaultQuery("year", "2026"))

	transactions, err := ctrl.service.GetMonthlyTransactions(familyID, month, year)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, transactions)
}

func (ctrl *FinanceController) GetDashboardSummary(c *gin.Context) {
	familyIDStr := c.GetString("family_id")
	familyID, err := uuid.Parse(familyIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid family ID"})
		return
	}

	month, _ := strconv.Atoi(c.DefaultQuery("month", "3"))
	year, _ := strconv.Atoi(c.DefaultQuery("year", "2026"))

	summary, err := ctrl.service.GetDashboardSummary(familyID, month, year)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, summary)
}

func (ctrl *FinanceController) CreateTransaction(c *gin.Context) {
	familyIDStr := c.GetString("family_id")
	userIDStr := c.GetString("user_id")

	familyID, _ := uuid.Parse(familyIDStr)
	userID, _ := uuid.Parse(userIDStr)

	var tx models.Transaction
	if err := c.ShouldBindJSON(&tx); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tx.FamilyID = familyID
	tx.UserID = userID

	if err := ctrl.service.CreateTransaction(&tx); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, tx)
}

func (ctrl *FinanceController) CreateBulkTransactions(c *gin.Context) {
	familyIDStr := c.GetString("family_id")
	userIDStr := c.GetString("user_id")

	familyID, _ := uuid.Parse(familyIDStr)
	userID, _ := uuid.Parse(userIDStr)

	var txs []models.Transaction
	if err := c.ShouldBindJSON(&txs); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	for i := range txs {
		txs[i].FamilyID = familyID
		txs[i].UserID = userID
	}

	if err := ctrl.service.CreateBulkTransactions(txs); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, txs)
}
func (ctrl *FinanceController) UpdateTransaction(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid transaction ID"})
		return
	}

	familyIDStr := c.GetString("family_id")
	familyID, _ := uuid.Parse(familyIDStr)

	var tx models.Transaction
	if err := c.ShouldBindJSON(&tx); err != nil {
		log.Printf("[ERROR] Binding JSON failed: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}


	tx.FamilyID = familyID
	userIDStr := c.GetString("user_id")
	tx.UserID, _ = uuid.Parse(userIDStr)

	if err := ctrl.service.UpdateTransaction(id, &tx); err != nil {
		log.Printf("[ERROR] Service.UpdateTransaction failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, tx)
}

func (ctrl *FinanceController) DeleteTransaction(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid transaction ID"})
		return
	}

	familyIDStr := c.GetString("family_id")
	familyID, _ := uuid.Parse(familyIDStr)

	if err := ctrl.service.DeleteTransaction(id, familyID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Transaction deleted successfully"})
}

func (ctrl *FinanceController) GetBehaviorSummary(c *gin.Context) {
	familyIDStr := c.GetString("family_id")
	familyID, err := uuid.Parse(familyIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid family ID"})
		return
	}

	summary, err := ctrl.service.GetBehaviorSummary(familyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, summary)
}

func (ctrl *FinanceController) JoinChallenge(c *gin.Context) {
	familyIDStr := c.GetString("family_id")
	familyID, err := uuid.Parse(familyIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid family ID"})
		return
	}

	var challenge models.FamilyChallenge
	if err := c.ShouldBindJSON(&challenge); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := ctrl.service.JoinChallenge(familyID, challenge); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Challenge joined successfully"})
}

func (ctrl *FinanceController) UpdateFamilyBudget(c *gin.Context) {
	familyIDStr := c.GetString("family_id")
	familyID, err := uuid.Parse(familyIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid family ID"})
		return
	}

	var input struct {
		Amount float64 `json:"amount"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	if err := ctrl.service.UpdateFamilyBudget(familyID, input.Amount); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Budget updated successfully"})
}
