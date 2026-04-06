package controllers

import (
	"fmt"
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"
	"keuangan-keluarga/internal/repositories"
	"keuangan-keluarga/internal/services"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"keuangan-keluarga/internal/utils"
)

type FamilyController struct{}

func NewFamilyController() *FamilyController {
	return &FamilyController{}
}

func (ctrl *FamilyController) UpdateFamily(c *gin.Context) {
	familyIDStr := c.GetString("family_id")
	userIDStr := c.GetString("user_id")
	familyID, err := uuid.Parse(familyIDStr)
	userID, _ := uuid.Parse(userIDStr)

	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Konteks keluarga tidak valid atau tidak ditemukan"})
		return
	}

	// Check if requester is head_of_family
	var requester models.FamilyMember
	if err := config.DB.First(&requester, "family_id = ? AND user_id = ?", familyID, userID).Error; err != nil || requester.Role != "head_of_family" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Hanya Kepala Keluarga yang dapat memperbarui data keluarga"})
		return
	}

	name := c.PostForm("name")
	
	var family models.Family
	if err := config.DB.First(&family, "id = ?", familyID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Keluarga tidak ditemukan"})
		return
	}

	if name != "" {
		family.Name = name
	}

	// Handle Photo Upload
	file, err := c.FormFile("photo")
	if err == nil {
		// Create uploads directory if not exists
		uploadDir := "./uploads/families"
		if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
			os.MkdirAll(uploadDir, os.ModePerm)
		}

		// 1. Save as temporary file first
		ext := filepath.Ext(file.Filename)
		tempFilename := fmt.Sprintf("temp_family_%d%s", time.Now().UnixNano(), ext)
		tempPath := filepath.Join(uploadDir, tempFilename)

		if err := c.SaveUploadedFile(file, tempPath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save temporary file"})
			return
		}
		defer os.Remove(tempPath)

		// 2. Prepare final WebP filename
		filename := fmt.Sprintf("%s_%d.webp", familyID.String(), time.Now().Unix())
		filePath := filepath.Join(uploadDir, filename)

		// 3. Convert to WebP
		if err := utils.ConvertToWebP(tempPath, filePath, 80); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to convert photo to WebP"})
			return
		}

		// Delete old photo if exists
		if family.PhotoURL != "" {
			oldPath := filepath.Join(".", family.PhotoURL)
			os.Remove(oldPath)
		}

		family.PhotoURL = "/uploads/families/" + filename
	}

	if err := config.DB.Save(&family).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui data keluarga"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Profil keluarga berhasil diperbarui",
		"family":  family,
	})
}

func (ctrl *FamilyController) GetFamilyProfile(c *gin.Context) {
	familyIDStr := c.GetString("family_id")
	familyID, err := uuid.Parse(familyIDStr)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Konteks keluarga tidak valid atau tidak ditemukan"})
		return
	}

	var family models.Family
	if err := config.DB.First(&family, "id = ?", familyID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Keluarga tidak ditemukan"})
		return
	}

	var memberCount int64
	config.DB.Model(&models.FamilyMember{}).Where("family_id = ?", familyID).Count(&memberCount)

	var invitationCount int64
	config.DB.Model(&models.FamilyInvitation{}).Where("family_id = ?", familyID).Count(&invitationCount)

	var plan models.SubscriptionPlan
	config.DB.First(&plan, "name = ?", family.SubscriptionPlan)

	c.JSON(http.StatusOK, gin.H{
		"family":           family,
		"member_count":     memberCount,
		"invitation_count": invitationCount,
		"plan":             plan,
	})
}

func (ctrl *FamilyController) DeleteFamilyPhoto(c *gin.Context) {
	familyIDStr := c.GetString("family_id")
	familyID, err := uuid.Parse(familyIDStr)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Konteks keluarga tidak valid atau tidak ditemukan"})
		return
	}

	var family models.Family
	if err := config.DB.First(&family, "id = ?", familyID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Keluarga tidak ditemukan"})
		return
	}

	if family.PhotoURL != "" {
		oldPath := filepath.Join(".", family.PhotoURL)
		os.Remove(oldPath)
		family.PhotoURL = ""
		
		if err := config.DB.Save(&family).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mereset foto keluarga"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Foto keluarga berhasil dihapus"})
}
func (ctrl *FamilyController) UpdateSubscriptionPlan(c *gin.Context) {
	familyIDStr := c.GetString("family_id")
	userIDStr := c.GetString("user_id")
	familyID, _ := uuid.Parse(familyIDStr)
	userID, _ := uuid.Parse(userIDStr)

	// Check if requester is head_of_family
	var requester models.FamilyMember
	if err := config.DB.First(&requester, "family_id = ? AND user_id = ?", familyID, userID).Error; err != nil || requester.Role != "head_of_family" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Hanya Kepala Keluarga yang dapat mengubah paket langganan"})
		return
	}

	var input struct {
		PlanName string `json:"plan_name" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nama paket tidak valid"})
		return
	}

	var family models.Family
	if err := config.DB.First(&family, "id = ?", familyID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Keluarga tidak ditemukan"})
		return
	}

	// If already Premium, we still allow "renewal" to extend the period (useful for testing duration changes)
	// But we should notify if it's a renewal vs upgrade
	isRenewal := family.SubscriptionPlan == input.PlanName

	// Fetch plan details to get duration
	var plan models.SubscriptionPlan
	if err := config.DB.First(&plan, "name = ?", input.PlanName).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Paket tidak ditemukan"})
		return
	}

	// Update logic
	now := time.Now()
	family.SubscriptionPlan = plan.Name
	family.Status = "active"
	
	if family.SubscriptionEndsAt.After(now) {
		family.SubscriptionEndsAt = family.SubscriptionEndsAt.AddDate(0, 0, plan.DurationDays)
	} else {
		family.SubscriptionEndsAt = now.AddDate(0, 0, plan.DurationDays)
	}

	if err := config.DB.Save(&family).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui paket langganan"})
		return
	}

	msg := fmt.Sprintf("Berhasil upgrade ke paket %s", plan.Name)
	if isRenewal {
		msg = fmt.Sprintf("Berhasil perpanjang paket %s. Masa aktif bertambah %d hari.", plan.Name, plan.DurationDays)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": msg,
		"family":  family,
	})
}
func (ctrl *FamilyController) UpdateMemberBudget(c *gin.Context) {
	familyIDStr := c.GetString("family_id")
	userIDStr := c.GetString("user_id")
	familyID, _ := uuid.Parse(familyIDStr)
	userID, _ := uuid.Parse(userIDStr)

	var input struct {
		TargetUserID string  `json:"target_user_id"`
		Amount       float64 `json:"amount"`
		Month        int     `json:"month"`
		Year         int     `json:"year"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format data tidak valid"})
		return
	}

	targetUserID := userID
	if input.TargetUserID != "" {
		if tid, err := uuid.Parse(input.TargetUserID); err == nil {
			targetUserID = tid
		}
	}

	// If month and year are provided, we use SetMonthlyBudget (dynamic plan)
	if input.Month > 0 && input.Year > 0 {
		financeSvc := services.NewFinanceService(
			repositories.NewFinanceRepository(),
			repositories.NewWalletRepository(),
			repositories.NewBehaviorRepository(),
			repositories.NewAssetRepository(),
			repositories.NewGoalRepository(),
			repositories.NewBudgetRepository(),
			services.NewAIService(),
		)
		if err := financeSvc.SetMonthlyBudget(familyID, targetUserID, input.Month, input.Year, input.Amount); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui budget bulanan: " + err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Budget untuk periode tersebut berhasil diperbarui"})
		return
	}

	// Fallback to updating default monthly budget (static)
	if err := config.DB.Model(&models.FamilyMember{}).
		Where("family_id = ? AND user_id = ?", familyID, targetUserID).
		Update("monthly_budget", input.Amount).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui budget default anggota"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Budget default berhasil diperbarui"})
}

func (ctrl *FamilyController) ApplyDefaultAllocation(c *gin.Context) {
	familyIDStr := c.GetString("family_id")
	userIDStr := c.GetString("user_id")
	familyID, _ := uuid.Parse(familyIDStr)
	userID, _ := uuid.Parse(userIDStr)

	var input struct {
		TargetUserID string `json:"target_user_id"`
		Month        int    `json:"month"`
		Year         int    `json:"year"`
	}
	c.ShouldBindJSON(&input)

	if input.Month == 0 {
		input.Month = int(time.Now().Month())
	}
	if input.Year == 0 {
		input.Year = time.Now().Year()
	}

	targetUserID := userID
	if input.TargetUserID != "" {
		if tid, err := uuid.Parse(input.TargetUserID); err == nil {
			targetUserID = tid
		}
	}

	budgetSvc := services.NewBudgetService()
	if err := budgetSvc.SeedDefaultBudget(nil, familyID, targetUserID, input.Month, input.Year); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menerapkan alokasi default: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Alokasi budget default berhasil diterapkan"})
}
