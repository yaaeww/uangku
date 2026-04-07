package controllers

import (
	"keuangan-keluarga/internal/models"
	"keuangan-keluarga/internal/services"
	"log"
	"net/http"
	"strconv"
	"time"

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
	familyID, _ := uuid.Parse(familyIDStr)
	userIDStr := c.GetString("user_id")
	userID, _ := uuid.Parse(userIDStr)
	role := c.GetString("family_role")

	startDateStr := c.Query("start_date")
	endDateStr := c.Query("end_date")

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "25"))
	if page < 1 { page = 1 }
	if limit < 1 { limit = 25 }

	var transactions []models.Transaction
	var total int64
	var totalIncome, totalExpense float64
	var err error

	if startDateStr != "" && endDateStr != "" {
		startDate, _ := time.Parse("2006-01-02", startDateStr)
		endDate, _ := time.Parse("2006-01-02", endDateStr)
		// Ensure end of day for endDate
		endDate = time.Date(endDate.Year(), endDate.Month(), endDate.Day(), 23, 59, 59, 999999999, time.UTC)
		
		transactions, total, totalIncome, totalExpense, err = ctrl.service.GetTransactionsByRange(familyID, userID, role, startDate, endDate, page, limit)
	} else {
		month, _ := strconv.Atoi(c.DefaultQuery("month", strconv.Itoa(int(time.Now().Month()))))
		year, _ := strconv.Atoi(c.DefaultQuery("year", strconv.Itoa(time.Now().Year())))
		week, _ := strconv.Atoi(c.DefaultQuery("week", "0"))
		transactions, total, totalIncome, totalExpense, err = ctrl.service.GetMonthlyTransactions(familyID, userID, role, month, year, week, page, limit)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":          transactions,
		"total":         total,
		"total_income":  totalIncome,
		"total_expense": totalExpense,
		"page":          page,
		"limit":         limit,
	})
}

func (ctrl *FinanceController) GetDashboardSummary(c *gin.Context) {
	familyIDStr := c.GetString("family_id")
	familyID, _ := uuid.Parse(familyIDStr)
	userIDStr := c.GetString("user_id")
	userID, _ := uuid.Parse(userIDStr)
	role := c.GetString("family_role")

	month, _ := strconv.Atoi(c.DefaultQuery("month", strconv.Itoa(int(time.Now().Month()))))
	year, _ := strconv.Atoi(c.DefaultQuery("year", strconv.Itoa(time.Now().Year())))

	summary, err := ctrl.service.GetDashboardSummary(familyID, userID, role, month, year)
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

	// Reload to get association data (User) using efficient GetByID
	if reloadedTx, err := ctrl.service.GetByID(tx.ID, tx.FamilyID, tx.Date); err == nil {
		tx = *reloadedTx
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
	userID, _ := uuid.Parse(userIDStr)
	tx.UserID = userID

	// Ownership check BEFORE update
	originalDateStr := c.Query("date")
	var originalDate time.Time
	if originalDateStr != "" {
		originalDate, _ = time.Parse("2006-01-02", originalDateStr)
	}

	// Helper to fetch existing
	// We use the month/year of the original date to list and find (simplified ownership check)
	// But let's assume we can fetch by ID directly if we had a GetByID in Service.
	// Ownership check is now enforced inside s.UpdateTransaction
	role := c.GetString("family_role")
	if err := ctrl.service.UpdateTransaction(id, originalDate, userID, role, &tx); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Reload to get association data (User) using efficient GetByID
	if reloadedTx, err := ctrl.service.GetByID(id, tx.FamilyID, tx.Date); err == nil {
		tx = *reloadedTx
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

	// Original date for partition pruning
	dateStr := c.Query("date")
	var date time.Time
	if dateStr != "" {
		date, _ = time.Parse("2006-01-02", dateStr)
	}

	userIDRaw, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDRaw.(string))

	role := c.GetString("family_role")
	if err := ctrl.service.DeleteTransaction(id, familyID, date, userID, role); err != nil {
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

	period := c.DefaultQuery("period", "30d") // Match dashboard default or user preference

	summary, err := ctrl.service.GetBehaviorSummary(familyID, period)
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

func (ctrl *FinanceController) GetCoachAnalysis(c *gin.Context) {
	familyIDStr := c.GetString("family_id")
	familyID, _ := uuid.Parse(familyIDStr)
	userIDStr := c.GetString("user_id")
	userID, _ := uuid.Parse(userIDStr)
	role := c.GetString("family_role")

	month, _ := strconv.Atoi(c.DefaultQuery("month", strconv.Itoa(int(time.Now().Month()))))
	year, _ := strconv.Atoi(c.DefaultQuery("year", strconv.Itoa(time.Now().Year())))

	analysis, err := ctrl.service.GetCoachAnalysis(familyID, userID, role, month, year)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, analysis)
}
