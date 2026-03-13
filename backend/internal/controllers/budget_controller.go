package controllers

import (
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"
	"keuangan-keluarga/internal/services"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"fmt"
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

	categories, err := c.budgetService.GetBudgetCategories(familyID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, categories)
}

func (c *BudgetController) CreateCategory(ctx *gin.Context) {
	familyIDStr, _ := ctx.Get("family_id")
	familyID, _ := uuid.Parse(familyIDStr.(string))

	var category models.BudgetCategory
	if err := ctx.ShouldBindJSON(&category); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	category.FamilyID = familyID
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

	var category models.BudgetCategory
	if err := ctx.ShouldBindJSON(&category); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Fetch existing to preserve CreatedAt and potentially other fields
	var existing models.BudgetCategory
	if err := config.DB.First(&existing, "id = ? AND family_id = ?", id, familyID).Error; err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
		return
	}

	category.ID = id
	category.FamilyID = familyID
	category.CreatedAt = existing.CreatedAt

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


	dbTx := config.DB.Begin()

	// 1. Fetch all savings associated with this category
	var savings []models.Saving
	if err := dbTx.Where("budget_category_id = ? AND family_id = ?", id, familyID).Find(&savings).Error; err != nil {
		log.Printf("[ERROR] Failed to fetch associated savings: %v", err)
		dbTx.Rollback()
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 2. Delete each saving via savingSvc (which reverts wallet impacts)
	for _, s := range savings {
		if err := c.savingSvc.Delete(s.ID, familyID); err != nil {
			log.Printf("[ERROR] Failed to delete sub-item %s: %v", s.ID, err)
			dbTx.Rollback()
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Gagal menghapus item %s: %v", s.Name, err)})
			return
		}
	}

	// 3. Delete category itself
	result := dbTx.Delete(&models.BudgetCategory{}, "id = ? AND family_id = ?", id, familyID)
	if err := result.Error; err != nil {
		log.Printf("[ERROR] Failed to delete category: %v", err)
		dbTx.Rollback()
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	dbTx.Commit()
	ctx.JSON(http.StatusOK, gin.H{"message": "Category and all sub-items deleted"})
}
