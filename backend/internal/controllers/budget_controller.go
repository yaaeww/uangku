package controllers

import (
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"
	"keuangan-keluarga/internal/services"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type BudgetController struct {
	budgetService *services.BudgetService
}

func NewBudgetController(budgetService *services.BudgetService) *BudgetController {
	return &BudgetController{budgetService: budgetService}
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

	var category models.BudgetCategory
	if err := ctx.ShouldBindJSON(&category); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	category.ID = id
	if err := config.DB.Save(&category).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, category)
}

func (c *BudgetController) DeleteCategory(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, _ := uuid.Parse(idStr)

	if err := config.DB.Delete(&models.BudgetCategory{}, "id = ?", id).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Category deleted"})
}
