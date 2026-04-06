package controllers

import (
	"keuangan-keluarga/internal/models"
	"keuangan-keluarga/internal/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"log"
)

type SavingController struct {
	service services.SavingService
}

func NewSavingController(svc services.SavingService) *SavingController {
	return &SavingController{service: svc}
}

func (ctrl *SavingController) ListSavings(c *gin.Context) {
	familyIDStr := c.GetString("family_id")
	familyID, _ := uuid.Parse(familyIDStr)

	monthStr := c.DefaultQuery("month", "0")
	yearStr := c.DefaultQuery("year", "0")
	month, _ := strconv.Atoi(monthStr)
	year, _ := strconv.Atoi(yearStr)

	savings, err := ctrl.service.GetByFamilyID(familyID, month, year)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, savings)
}

func (ctrl *SavingController) CreateSaving(c *gin.Context) {
	familyIDStr := c.GetString("family_id")
	familyID, _ := uuid.Parse(familyIDStr)
	userIDStr := c.GetString("user_id")
	userID, _ := uuid.Parse(userIDStr)

	var saving models.Saving
	if err := c.ShouldBindJSON(&saving); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	saving.FamilyID = familyID
	saving.UserID = userID
	if err := ctrl.service.Create(&saving); err != nil {
		log.Printf("[ERROR] Failed to create saving: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, saving)
}

func (ctrl *SavingController) UpdateSaving(c *gin.Context) {
	familyIDStr := c.GetString("family_id")
	familyID, _ := uuid.Parse(familyIDStr)
	userIDStr := c.GetString("user_id")
	userID, _ := uuid.Parse(userIDStr)
	role := c.GetString("role")

	var req struct {
		ID               uuid.UUID  `json:"id" binding:"required"`
		Name             string     `json:"name"`
		TargetAmount     float64    `json:"target_amount"`
		CurrentBalance   float64    `json:"current_balance"`
		Category         string     `json:"category"`
		BudgetCategoryID *uuid.UUID `json:"budget_category_id"`
		Emoji            string     `json:"emoji"`
		DueDate          int        `json:"due_date"`
		Month            int        `json:"month"`
		Year             int        `json:"year"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Fetch existing
	existing, err := ctrl.service.GetByID(req.ID)
	if err != nil || existing.FamilyID != familyID {
		c.JSON(http.StatusNotFound, gin.H{"error": "Saving not found or access denied"})
		return
	}

	existing.Name = req.Name
	existing.TargetAmount = req.TargetAmount
	existing.CurrentBalance = req.CurrentBalance
	existing.Category = req.Category
	existing.BudgetCategoryID = req.BudgetCategoryID
	existing.Emoji = req.Emoji
	existing.DueDate = req.DueDate
	existing.Month = req.Month
	existing.Year = req.Year

	if err := ctrl.service.Update(existing, userID, role); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, existing)
}

func (ctrl *SavingController) DeleteSaving(c *gin.Context) {
	idStr := c.Param("id")
	id, _ := uuid.Parse(idStr)

	familyIDStr := c.GetString("family_id")
	familyID, _ := uuid.Parse(familyIDStr)
	userIDStr := c.GetString("user_id")
	userID, _ := uuid.Parse(userIDStr)
	role := c.GetString("role")

	if err := ctrl.service.Delete(id, familyID, userID, role); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Saving deleted"})
}
