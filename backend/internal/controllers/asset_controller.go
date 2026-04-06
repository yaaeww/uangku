package controllers

import (
	"keuangan-keluarga/internal/models"
	"keuangan-keluarga/internal/services"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AssetController struct {
	service services.AssetService
}

func NewAssetController(svc services.AssetService) *AssetController {
	return &AssetController{service: svc}
}

func (ctrl *AssetController) Create(c *gin.Context) {
	familyIDRaw, _ := c.Get("family_id")
	familyID, _ := uuid.Parse(familyIDRaw.(string))

	var req struct {
		Name         string    `json:"name" binding:"required"`
		Type         string    `json:"type" binding:"required"`
		Value        float64   `json:"value" binding:"required"`
		Description  string    `json:"description"`
		AcquiredDate time.Time `json:"acquired_date"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userIDRaw, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDRaw.(string))

	asset := &models.Asset{
		FamilyID:     familyID,
		UserID:       userID,
		Name:         req.Name,
		Type:         req.Type,
		Value:        req.Value,
		Description:  req.Description,
		AcquiredDate: req.AcquiredDate,
	}

	if err := ctrl.service.CreateAsset(asset); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, asset)
}

func (ctrl *AssetController) List(c *gin.Context) {
	familyIDRaw, _ := c.Get("family_id")
	familyID, _ := uuid.Parse(familyIDRaw.(string))

	assets, err := ctrl.service.GetFamilyAssets(familyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, assets)
}

func (ctrl *AssetController) Update(c *gin.Context) {
	familyIDRaw, _ := c.Get("family_id")
	familyID, _ := uuid.Parse(familyIDRaw.(string))

	var req struct {
		ID           uuid.UUID `json:"id" binding:"required"`
		Name         string    `json:"name"`
		Type         string    `json:"type"`
		Value        float64   `json:"value"`
		Description  string    `json:"description"`
		AcquiredDate time.Time `json:"acquired_date"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	existing, err := ctrl.service.GetAssetByID(req.ID)
	if err != nil || existing.FamilyID != familyID {
		c.JSON(http.StatusNotFound, gin.H{"error": "Asset not found"})
		return
	}

	// Ownership check: Owner OR (Head of Family/Treasurer) can update
	userIDRaw, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDRaw.(string))
	role := c.GetString("family_role")
	isAdmin := role == "head_of_family" || role == "treasurer"

	if !isAdmin && existing.UserID != userID && existing.UserID != uuid.Nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Anda tidak memiliki izin untuk mengubah aset ini"})
		return
	}

	existing.Name = req.Name
	existing.Type = req.Type
	existing.Value = req.Value
	existing.Description = req.Description
	existing.AcquiredDate = req.AcquiredDate

	if err := ctrl.service.UpdateAsset(existing); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, existing)
}
func (ctrl *AssetController) Delete(c *gin.Context) {
	familyIDRaw, _ := c.Get("family_id")
	familyID, _ := uuid.Parse(familyIDRaw.(string))

	idRaw := c.Param("id")
	id, _ := uuid.Parse(idRaw)

	existing, err := ctrl.service.GetAssetByID(id)
	if err != nil || existing.FamilyID != familyID {
		c.JSON(http.StatusNotFound, gin.H{"error": "Asset not found"})
		return
	}

	// Ownership check: Owner OR (Head of Family/Treasurer) can delete
	userIDRaw, _ := c.Get("user_id")
	userID, _ := uuid.Parse(userIDRaw.(string))
	role := c.GetString("family_role")
	isAdmin := role == "head_of_family" || role == "treasurer"

	if !isAdmin && existing.UserID != userID && existing.UserID != uuid.Nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Anda tidak memiliki izin untuk menghapus aset ini"})
		return
	}

	if err := ctrl.service.DeleteAsset(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Asset deleted successfully"})
}
