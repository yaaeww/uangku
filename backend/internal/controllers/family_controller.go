package controllers

import (
	"fmt"
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
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

		// Generate unique filename with .webp extension
		filename := fmt.Sprintf("%s_%d.webp", familyID.String(), time.Now().Unix())
		filePath := filepath.Join(uploadDir, filename)

		// Save the file
		// Frontend is expected to have already converted it to WebP
		if err := c.SaveUploadedFile(file, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan foto"})
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
