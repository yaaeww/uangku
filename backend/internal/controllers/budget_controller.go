package controllers

import (
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"
	"keuangan-keluarga/internal/services"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type BudgetController struct {
	budgetService *services.BudgetService
	savingSvc     services.SavingService
}

func NewBudgetController(budgetService *services.BudgetService, savingSvc services.SavingService) *BudgetController {
	return &BudgetController{
		budgetService: budgetService,
		savingSvc:     savingSvc,
	}
}

func (c *BudgetController) ListCategories(ctx *gin.Context) {
	familyIDStr, _ := ctx.Get("family_id")
	familyID, _ := uuid.Parse(familyIDStr.(string))
	authenticatedUserIDStr, _ := ctx.Get("user_id")
	authenticatedUserID, _ := uuid.Parse(authenticatedUserIDStr.(string))

	// Get target user_id from query or default to authenticated user
	targetUserIDStr := ctx.DefaultQuery("user_id", authenticatedUserIDStr.(string))
	targetUserID, err := uuid.Parse(targetUserIDStr)
	if err != nil {
		targetUserID = authenticatedUserID
	}

	// Permission Check: If trying to see someone else's budget, must be Admin (Head of Family or Treasurer)
	if targetUserID != authenticatedUserID {
		familyRole, _ := ctx.Get("family_role")
		if familyRole != "head_of_family" && familyRole != "treasurer" {
			ctx.JSON(http.StatusForbidden, gin.H{"error": "Anda tidak memiliki izin untuk melihat budget anggota lain"})
			return
		}
	}

	monthStr := ctx.DefaultQuery("month", "0")
	yearStr := ctx.DefaultQuery("year", "0")
	month, _ := strconv.Atoi(monthStr)
	year, _ := strconv.Atoi(yearStr)

	if month == 0 {
		month = int(time.Now().Month())
	}
	if year == 0 {
		year = time.Now().Year()
	}

	categories, err := c.budgetService.GetBudgetCategories(config.DB, familyID, targetUserID, month, year)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, categories)
}

func (c *BudgetController) CreateCategory(ctx *gin.Context) {
	familyIDStr := ctx.GetString("family_id")
	familyID, _ := uuid.Parse(familyIDStr)
	authenticatedUserIDStr := ctx.GetString("user_id")
	authenticatedUserID, _ := uuid.Parse(authenticatedUserIDStr)

	var category models.BudgetCategory
	if err := ctx.ShouldBindJSON(&category); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	category.FamilyID = familyID
	
	category.UserID = authenticatedUserID

	// If month/year not in JSON, get from query params as fallback
	if category.Month == 0 {
		mStr := ctx.Query("month")
		m, _ := strconv.Atoi(mStr)
		category.Month = m
	}
	if category.Year == 0 {
		yStr := ctx.Query("year")
		y, _ := strconv.Atoi(yStr)
		category.Year = y
	}

	if err := config.DB.Create(&category).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, category)
}

func (c *BudgetController) UpdateCategory(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, _ := uuid.Parse(idStr)
	familyIDStr := ctx.GetString("family_id")
	familyID, _ := uuid.Parse(familyIDStr)
	authenticatedUserIDStr := ctx.GetString("user_id")
	authenticatedUserID, _ := uuid.Parse(authenticatedUserIDStr)

	var category models.BudgetCategory
	if err := config.DB.Where("id = ? AND family_id = ? AND user_id = ?", id, familyID, authenticatedUserID).First(&category).Error; err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Kategori tidak ditemukan atau Anda tidak memiliki akses untuk mengubahnya"})
		return
	}

	if err := ctx.ShouldBindJSON(&category); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Ensure ID and FamilyID remain correct just in case they were in the JSON
	category.ID = id
	category.FamilyID = familyID

	if err := config.DB.Save(&category).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, category)
}

func (c *BudgetController) DeleteCategory(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, _ := uuid.Parse(idStr)
	familyIDStr := ctx.GetString("family_id")
	familyID, _ := uuid.Parse(familyIDStr)
	authenticatedUserIDStr := ctx.GetString("user_id")
	authenticatedUserID, _ := uuid.Parse(authenticatedUserIDStr)

	monthStr := ctx.Query("month")
	yearStr := ctx.Query("year")
	month, _ := strconv.Atoi(monthStr)
	year, _ := strconv.Atoi(yearStr)

	// Check permissions and get category
	var cat models.BudgetCategory
	if err := config.DB.Where("id = ? AND family_id = ? AND user_id = ?", id, familyID, authenticatedUserID).First(&cat).Error; err != nil {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "Kategori tidak ditemukan atau Anda tidak memiliki akses untuk menghapusnya"})
		return
	}

	// If month and year are provided, only clear items for THAT month/year
	if month > 0 && year > 0 {
		var savings []models.Saving
		config.DB.Where("budget_category_id = ? AND family_id = ? AND month = ? AND year = ?", id, familyID, month, year).Find(&savings)
		
		for _, s := range savings {
			c.savingSvc.Delete(s.ID, familyID, s.UserID, "head_of_family") 
		}

		if cat.Month == month && cat.Year == year {
			config.DB.Delete(&cat)
			ctx.JSON(http.StatusOK, gin.H{"message": "Kategori berhasil dihapus untuk periode ini."})
			return
		}

		ctx.JSON(http.StatusOK, gin.H{"message": "Budget kategori berhasil dikosongkan untuk periode ini."})
		return
	}

	// 1. Delete associated savings
	var savings []models.Saving
	config.DB.Where("budget_category_id = ? AND family_id = ?", id, familyID).Find(&savings)
	for _, s := range savings {
		c.savingSvc.Delete(s.ID, familyID, s.UserID, "head_of_family") 
	}

	// 2. Finally delete the Category
	if err := config.DB.Delete(&models.BudgetCategory{}, "id = ? AND family_id = ?", id, familyID).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus kategori: " + err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Kategori dan semua item terkait berhasil dihapus permanen"})
}

func (c *BudgetController) ClearCategoryItems(ctx *gin.Context) {
	categoryIDStr := ctx.Param("id")
	categoryID, _ := uuid.Parse(categoryIDStr)
	familyIDStr := ctx.GetString("family_id")
	familyID, _ := uuid.Parse(familyIDStr)
	authenticatedUserIDStr := ctx.GetString("user_id")
	authenticatedUserID, _ := uuid.Parse(authenticatedUserIDStr)

	if err := c.savingSvc.DeleteByCategory(categoryID, familyID, authenticatedUserID); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Semua subkategori berhasil dihapus."})
}

func (c *BudgetController) ClearAllCategories(ctx *gin.Context) {
	familyIDStr := ctx.GetString("family_id")
	familyID, _ := uuid.Parse(familyIDStr)
	authenticatedUserIDStr := ctx.GetString("user_id")
	authenticatedUserID, _ := uuid.Parse(authenticatedUserIDStr)

	var savings []models.Saving
	config.DB.Where("family_id = ? AND user_id = ?", familyID, authenticatedUserID).Find(&savings)
	for _, s := range savings {
		c.savingSvc.Delete(s.ID, familyID, authenticatedUserID, "member")
	}

	if err := config.DB.Delete(&models.BudgetCategory{}, "family_id = ? AND user_id = ?", familyID, authenticatedUserID).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus semua kategori: " + err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Semua kategori budget Anda berhasil dihapus."})
}
