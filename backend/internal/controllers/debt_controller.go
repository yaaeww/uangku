package controllers

import (
	"keuangan-keluarga/internal/models"
	"keuangan-keluarga/internal/services"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type DebtController struct {
	service services.DebtService
}

func NewDebtController(svc services.DebtService) *DebtController {
	return &DebtController{service: svc}
}

func (ctrl *DebtController) ListDebts(c *gin.Context) {
	familyIDStr := c.GetString("family_id")
	familyID, _ := uuid.Parse(familyIDStr)

	debts, err := ctrl.service.GetByFamilyID(familyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, debts)
}

func (ctrl *DebtController) CreateDebt(c *gin.Context) {
	familyIDStr := c.GetString("family_id")
	familyID, _ := uuid.Parse(familyIDStr)

	var debt models.Debt
	if err := c.ShouldBindJSON(&debt); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	debt.FamilyID = familyID
	if err := ctrl.service.Create(&debt); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, debt)
}

func (ctrl *DebtController) RecordPayment(c *gin.Context) {
	var payment models.DebtPayment
	if err := c.ShouldBindJSON(&payment); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := ctrl.service.RecordPayment(&payment); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, payment)
}

func (ctrl *DebtController) DeleteDebt(c *gin.Context) {
	idStr := c.Param("id")
	id, _ := uuid.Parse(idStr)

	if err := ctrl.service.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Debt deleted"})
}
