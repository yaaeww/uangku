package controllers

import (
	"keuangan-keluarga/internal/models"
	"keuangan-keluarga/internal/services"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
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

	savings, err := ctrl.service.GetByFamilyID(familyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, savings)
}

func (ctrl *SavingController) CreateSaving(c *gin.Context) {
	familyIDStr := c.GetString("family_id")
	familyID, _ := uuid.Parse(familyIDStr)

	var saving models.Saving
	if err := c.ShouldBindJSON(&saving); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	saving.FamilyID = familyID
	if err := ctrl.service.Create(&saving); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, saving)
}

func (ctrl *SavingController) UpdateSaving(c *gin.Context) {
	familyIDStr := c.GetString("family_id")
	familyID, _ := uuid.Parse(familyIDStr)

	var req struct {
		ID             uuid.UUID `json:"id" binding:"required"`
		Name           string    `json:"name"`
		TargetAmount   float64   `json:"target_amount"`
		CurrentBalance float64   `json:"current_balance"`
		Category       string    `json:"category"`
		Emoji          string    `json:"emoji"`
		DueDate        int       `json:"due_date"`
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
	existing.Emoji = req.Emoji
	existing.DueDate = req.DueDate

	if err := ctrl.service.Update(existing); err != nil {
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

	if err := ctrl.service.Delete(id, familyID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Saving deleted"})
}
