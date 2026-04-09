package controllers

import (
	"keuangan-keluarga/internal/models"
	"keuangan-keluarga/internal/services"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ReportController struct {
	service services.ReportService
}

func NewReportController(service services.ReportService) *ReportController {
	return &ReportController{service: service}
}

func (c *ReportController) GetFinancialSummary(ctx *gin.Context) {
	period := ctx.DefaultQuery("period", "month")
	dateStr := ctx.Query("date")
	
	var start time.Time
	var err error

	if dateStr != "" {
		start, err = time.Parse(time.RFC3339, dateStr)
		if err != nil {
			// Try simple YYYY-MM-DD
			start, err = time.Parse("2006-01-02", dateStr)
		}
	} else {
		start = time.Now()
	}

	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Use RFC3339 or YYYY-MM-DD"})
		return
	}

	var periodStart, periodEnd time.Time

	switch period {
	case "day":
		periodStart = time.Date(start.Year(), start.Month(), start.Day(), 0, 0, 0, 0, time.UTC)
		periodEnd = periodStart.AddDate(0, 0, 1)
	case "week":
		// Start of week (Monday)
		daysSinceMonday := int(start.Weekday()) - 1
		if daysSinceMonday < 0 {
			daysSinceMonday = 6
		}
		periodStart = time.Date(start.Year(), start.Month(), start.Day(), 0, 0, 0, 0, time.UTC).AddDate(0, 0, -daysSinceMonday)
		periodEnd = periodStart.AddDate(0, 0, 7)
	case "year":
		periodStart = time.Date(start.Year(), 1, 1, 0, 0, 0, 0, time.UTC)
		periodEnd = periodStart.AddDate(1, 0, 0)
	case "last-month":
		// Get first day of current month, then subtract 1 month
		periodStart = time.Date(start.Year(), start.Month(), 1, 0, 0, 0, 0, time.UTC).AddDate(0, -1, 0)
		periodEnd = periodStart.AddDate(0, 1, 0)
	case "rolling-7":
		periodStart = start.AddDate(0, 0, -7)
		periodEnd = start
	case "rolling-30":
		periodStart = start.AddDate(0, 0, -30)
		periodEnd = start
	case "rolling-365":
		periodStart = start.AddDate(0, 0, -365)
		periodEnd = start
	default: // month
		periodStart = time.Date(start.Year(), start.Month(), 1, 0, 0, 0, 0, time.UTC)
		periodEnd = periodStart.AddDate(0, 1, 0)
	}

	summary, err := c.service.GetFinancialSummary(periodStart, periodEnd)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, summary)
}

func (c *ReportController) AddExpense(ctx *gin.Context) {
	var expense models.PlatformExpense
	if err := ctx.ShouldBindJSON(&expense); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Failed to bind JSON: " + err.Error()})
		return
	}

	if err := c.service.AddPlatformExpense(&expense); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"message": "Expense recorded successfully", "data": expense})
}

func (c *ReportController) UpdateExpense(ctx *gin.Context) {
	var expense models.PlatformExpense
	if err := ctx.ShouldBindJSON(&expense); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Failed to bind JSON: " + err.Error()})
		return
	}

	idStr := ctx.Param("id")
	if idStr != "" {
		id, err := uuid.Parse(idStr)
		if err == nil {
			expense.ID = id
		}
	}

	if err := c.service.UpdatePlatformExpense(&expense); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Expense updated successfully", "data": expense})
}

func (c *ReportController) DeleteExpense(ctx *gin.Context) {
	id := ctx.Param("id")
	if err := c.service.DeletePlatformExpense(id); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Expense deleted successfully"})
}

func (c *ReportController) ListCategories(ctx *gin.Context) {
	cats, err := c.service.GetAllCategories()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, cats)
}

func (c *ReportController) AddCategory(ctx *gin.Context) {
	var cat models.PlatformExpenseCategory
	if err := ctx.ShouldBindJSON(&cat); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.service.CreateCategory(&cat); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"message": "Category created successfully", "data": cat})
}

func (c *ReportController) UpdateCategory(ctx *gin.Context) {
	var cat models.PlatformExpenseCategory
	if err := ctx.ShouldBindJSON(&cat); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.service.UpdateCategory(&cat); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Category updated successfully", "data": cat})
}

func (c *ReportController) DeleteCategory(ctx *gin.Context) {
	id := ctx.Param("id")
	if err := c.service.DeleteCategory(id); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Category deleted successfully"})
}

func (c *ReportController) CreateBudgetTransfer(ctx *gin.Context) {
	var transfer models.PlatformBudgetTransfer
	if err := ctx.ShouldBindJSON(&transfer); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Failed to bind JSON: " + err.Error()})
		return
	}

	if err := c.service.CreateBudgetTransfer(&transfer); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"message": "Budget transfer recorded successfully", "data": transfer})
}

func (c *ReportController) UpdateBudgetTransfer(ctx *gin.Context) {
	var transfer models.PlatformBudgetTransfer
	if err := ctx.ShouldBindJSON(&transfer); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Failed to bind JSON: " + err.Error()})
		return
	}

	idStr := ctx.Param("id")
	if idStr != "" {
		id, err := uuid.Parse(idStr)
		if err == nil {
			transfer.ID = id
		}
	}

	if err := c.service.UpdateBudgetTransfer(&transfer); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Budget transfer updated successfully", "data": transfer})
}

func (c *ReportController) DeleteBudgetTransfer(ctx *gin.Context) {
	id := ctx.Param("id")
	if err := c.service.DeleteBudgetTransfer(id); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Budget transfer deleted successfully"})
}
