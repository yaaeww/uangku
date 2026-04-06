package controllers

import (
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"
	"keuangan-keluarga/internal/services"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"
	"fmt"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"keuangan-keluarga/internal/utils"
)

type AdminController struct {
	service services.AdminService
}

func NewAdminController(service services.AdminService) *AdminController {
	return &AdminController{service: service}
}

func (c *AdminController) GetStats(ctx *gin.Context) {
	chartDays := 7
	if d := ctx.Query("chart_days"); d != "" {
		if parsed, err := strconv.Atoi(d); err == nil && parsed > 0 && parsed <= 365 {
			chartDays = parsed
		}
	}
	stats, err := c.service.GetDashboardStats(chartDays)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, stats)
}

func (c *AdminController) GetApplications(ctx *gin.Context) {
	apps, err := c.service.GetAllApplications()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, apps)
}

func (c *AdminController) ApproveApplication(ctx *gin.Context) {
	id := ctx.Param("id")
	if err := c.service.ApproveApplication(id); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "Application approved successfully"})
}

func (c *AdminController) RejectApplication(ctx *gin.Context) {
	id := ctx.Param("id")
	if err := c.service.RejectApplication(id); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "Application rejected successfully"})
}

func (c *AdminController) GetFamilies(ctx *gin.Context) {
	var query struct {
		Page   int    `form:"page"`
		Limit  int    `form:"limit"`
		Search string `form:"search"`
		Status string `form:"status"`
	}
	if err := ctx.ShouldBindQuery(&query); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid query parameters"})
		return
	}

	// Default values
	if query.Page <= 0 { query.Page = 1 }
	if query.Limit <= 0 { query.Limit = 10 }

	offset := (query.Page - 1) * query.Limit
	families, total, err := c.service.GetFamiliesPaginated(offset, query.Limit, query.Search, query.Status)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	stats, _ := c.service.GetFamilyStats()

	ctx.JSON(http.StatusOK, gin.H{
		"data":  families,
		"total": total,
		"page":  query.Page,
		"limit": query.Limit,
		"stats": stats,
	})
}

func (c *AdminController) DeleteFamily(ctx *gin.Context) {
	id := ctx.Param("id")
	if err := c.service.DeleteFamily(id); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "Family deleted successfully"})
}

func (c *AdminController) ToggleFamilyBlock(ctx *gin.Context) {
	id := ctx.Param("id")
	if err := c.service.ToggleFamilyBlock(id); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "Family block status toggled successfully"})
}

func (c *AdminController) GetUsers(ctx *gin.Context) {
	var query struct {
		Page   int    `form:"page"`
		Limit  int    `form:"limit"`
		Search string `form:"search"`
		Status string `form:"status"`
	}
	if err := ctx.ShouldBindQuery(&query); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid query parameters"})
		return
	}

	// Default values
	if query.Page <= 0 { query.Page = 1 }
	if query.Limit <= 0 { query.Limit = 10 }

	offset := (query.Page - 1) * query.Limit
	users, total, err := c.service.GetUsersPaginated(offset, query.Limit, query.Search, query.Status)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	stats, _ := c.service.GetUserStats()

	ctx.JSON(http.StatusOK, gin.H{
		"data":  users,
		"total": total,
		"page":  query.Page,
		"limit": query.Limit,
		"stats": stats,
	})
}

func (c *AdminController) CreateUserAdmin(ctx *gin.Context) {
	var input struct {
		FullName   string `json:"full_name" binding:"required"`
		Email      string `json:"email" binding:"required,email"`
		Password   string `json:"password" binding:"required,min=6"`
		Role       string `json:"role" binding:"required"`
		FamilyName string `json:"family_name"`
	}

	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.service.CreateUserWithRole(input.FullName, input.Email, input.Password, input.Role, input.FamilyName); err != nil {
		ctx.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"message": "User created successfully"})
}

func (c *AdminController) UpdateUserAdmin(ctx *gin.Context) {
	id := ctx.Param("id")
	var input struct {
		FullName string `json:"full_name"`
		Email    string `json:"email"`
		Password string `json:"password"`
		Role     string `json:"role"`
	}

	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.service.UpdateUserAdmin(id, input.FullName, input.Email, input.Password, input.Role); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "User updated successfully"})
}

func (c *AdminController) DeleteUserAdmin(ctx *gin.Context) {
	id := ctx.Param("id")
	if err := c.service.DeleteUserAdmin(id); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}

func (c *AdminController) UpdateUser(ctx *gin.Context) {
	var user models.User
	if err := ctx.ShouldBindJSON(&user); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.service.UpdateUser(&user); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "User updated successfully"})
}

func (c *AdminController) GetSuperAdmins(ctx *gin.Context) {
	admins, err := c.service.GetSuperAdmins()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, admins)
}

func (c *AdminController) CreateSuperAdmin(ctx *gin.Context) {
	var input struct {
		FullName string `json:"full_name" binding:"required"`
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=6"`
	}

	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.service.CreateSuperAdmin(input.FullName, input.Email, input.Password); err != nil {
		// e.g., email already exists
		ctx.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"message": "Super Admin created successfully"})
}

func (c *AdminController) UpdateSuperAdmin(ctx *gin.Context) {
	id := ctx.Param("id")
	var input struct {
		FullName string `json:"full_name"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.service.UpdateSuperAdmin(id, input.FullName, input.Email, input.Password); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "Super Admin updated successfully"})
}

func (c *AdminController) DeleteSuperAdmin(ctx *gin.Context) {
	id := ctx.Param("id")
	if err := c.service.DeleteSuperAdmin(id); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "Super Admin deleted successfully"})
}

func (c *AdminController) ToggleUserBlock(ctx *gin.Context) {
	id := ctx.Param("id")
	if err := c.service.ToggleUserBlock(id); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "User block status toggled successfully"})
}

func (c *AdminController) GetMembers(ctx *gin.Context) {
	familyIDStr := ctx.GetString("family_id")
	familyID, err := uuid.Parse(familyIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid family ID"})
		return
	}

	members, err := c.service.GetMembers(familyID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, members)
}

func (c *AdminController) UpdateMemberRole(ctx *gin.Context) {
	familyIDStr := ctx.GetString("family_id")
	userIDStr := ctx.GetString("user_id")
	familyID, _ := uuid.Parse(familyIDStr)
	userID, _ := uuid.Parse(userIDStr)

	// Check if requester is head_of_family
	var requester models.FamilyMember
	if err := config.DB.First(&requester, "family_id = ? AND user_id = ?", familyID, userID).Error; err != nil || requester.Role != "head_of_family" {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "Hanya Kepala Keluarga yang dapat mengubah profil atau mengelola anggota"})
		return
	}

	memberIDStr := ctx.Param("id")
	memberID, err := uuid.Parse(memberIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid member ID"})
		return
	}

	var input struct {
		Role string `json:"role" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.service.UpdateMemberRole(memberID, familyID, input.Role); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "Member role updated successfully"})
}

func (c *AdminController) RemoveMember(ctx *gin.Context) {
	familyIDStr := ctx.GetString("family_id")
	userIDStr := ctx.GetString("user_id")
	familyID, _ := uuid.Parse(familyIDStr)
	userID, _ := uuid.Parse(userIDStr)

	// Check if requester is head_of_family
	var requester models.FamilyMember
	if err := config.DB.First(&requester, "family_id = ? AND user_id = ?", familyID, userID).Error; err != nil || requester.Role != "head_of_family" {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "Hanya Kepala Keluarga yang dapat menghapus anggota"})
		return
	}

	memberIDStr := ctx.Param("id")
	memberID, err := uuid.Parse(memberIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid member ID"})
		return
	}

	if err := c.service.RemoveMember(memberID, familyID); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "Member removed successfully"})
}

func (c *AdminController) InviteMember(ctx *gin.Context) {
	familyIDStr := ctx.GetString("family_id")
	userIDStr := ctx.GetString("user_id")
	familyID, _ := uuid.Parse(familyIDStr)
	invitedBy, _ := uuid.Parse(userIDStr)

	var input struct {
		Email string `json:"email" binding:"required,email"`
		Role  string `json:"role" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	invitationID, err := c.service.InviteMember(input.Email, input.Role, familyID, invitedBy)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{
		"message":       "Invitation sent successfully",
		"invitation_id": invitationID,
	})
}

func (c *AdminController) GetInvitations(ctx *gin.Context) {
	familyIDStr := ctx.GetString("family_id")
	familyID, err := uuid.Parse(familyIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid family ID"})
		return
	}

	invitations, err := c.service.GetInvitations(familyID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, invitations)
}

func (c *AdminController) DeleteInvitation(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid invitation ID"})
		return
	}

	if err := config.DB.Delete(&models.FamilyInvitation{}, "id = ?", id).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "Invitation canceled successfully"})
}

func (c *AdminController) GetSettings(ctx *gin.Context) {
	settings, err := c.service.GetSettings()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, settings)
}

func (c *AdminController) UpdateSetting(ctx *gin.Context) {
	key := ctx.Param("key")
	var input struct {
		Value string `json:"value"` // Removed binding:"required" to allow empty strings/logos
	}

	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.service.UpdateSetting(key, input.Value); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Setting updated successfully"})
}

func (c *AdminController) GetPlans(ctx *gin.Context) {
	plans, err := c.service.GetAllPlans()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, plans)
}

func (c *AdminController) CreatePlan(ctx *gin.Context) {
	var input models.SubscriptionPlan
	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.service.CreatePlan(&input); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusCreated, gin.H{"message": "Plan created successfully", "plan": input})
}

func (c *AdminController) UpdatePlan(ctx *gin.Context) {
	var input models.SubscriptionPlan
	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.service.UpdatePlan(&input); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "Plan updated successfully", "plan": input})
}

func (c *AdminController) DeletePlan(ctx *gin.Context) {
	id := ctx.Param("id")
	if err := c.service.DeletePlan(id); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "Plan deleted successfully"})
}

func (c *AdminController) GetPlanByID(ctx *gin.Context) {
	id := ctx.Param("id")
	plan, err := c.service.GetPlanByID(id)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Plan not found"})
		return
	}
	ctx.JSON(http.StatusOK, plan)
}

func (c *AdminController) GetPublicSettings(ctx *gin.Context) {
	settings, err := c.service.GetPublicSettings()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, settings)
}

func (c *AdminController) GetPublicPlans(ctx *gin.Context) {
	plans, err := c.service.GetAllPlans() // Existing service method is fine for public use
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, plans)
}

func (c *AdminController) GetPaymentTransactions(ctx *gin.Context) {
	var query struct {
		Page   int    `form:"page"`
		Limit  int    `form:"limit"`
		Search string `form:"search"`
		Status string `form:"status"`
		Period string `form:"period"`
	}
	if err := ctx.ShouldBindQuery(&query); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid query parameters"})
		return
	}

	if query.Page <= 0 { query.Page = 1 }
	if query.Limit <= 0 { query.Limit = 10 }

	offset := (query.Page - 1) * query.Limit
	txs, total, err := c.service.GetPaymentTransactionsPaginated(offset, query.Limit, query.Search, query.Status, query.Period)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"data":  txs,
		"total": total,
		"page":  query.Page,
		"limit": query.Limit,
	})
}

func (c *AdminController) UploadLogo(ctx *gin.Context) {
	file, err := ctx.FormFile("file")
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}

	uploadDir := "./uploads/system"
	if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
		os.MkdirAll(uploadDir, os.ModePerm)
	}

	// 1. Save as temporary file first
	ext := filepath.Ext(file.Filename)
	tempFilename := fmt.Sprintf("temp_%d%s", time.Now().UnixNano(), ext)
	tempPath := filepath.Join(uploadDir, tempFilename)

	if err := ctx.SaveUploadedFile(file, tempPath); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save temporary file"})
		return
	}
	defer os.Remove(tempPath) // Clean up temp file

	// 2. Prepare final WebP filename
	filename := fmt.Sprintf("logo_%d.webp", time.Now().UnixNano())
	filePath := filepath.Join(uploadDir, filename)

	// 3. Convert to WebP using our utility
	if err := utils.ConvertToWebP(tempPath, filePath, 80); err != nil {
		log.Printf("[UploadLogo] WebP Conversion Failed: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengonversi logo ke WebP"})
		return
	}

	url := "/uploads/system/" + filename
	log.Printf("[UploadLogo] Success: %s", url)
	ctx.JSON(http.StatusOK, gin.H{"url": url})
}

func (c *AdminController) GetPaymentChannels(ctx *gin.Context) {
	channels, err := c.service.ListPaymentChannels()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, channels)
}

func (c *AdminController) SyncPaymentChannels(ctx *gin.Context) {
	if err := c.service.SyncPaymentChannels(); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "Payment channels synchronized successfully"})
}

func (c *AdminController) UpdatePaymentChannel(ctx *gin.Context) {
	var channel models.PaymentChannel
	if err := ctx.ShouldBindJSON(&channel); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.service.UpdatePaymentChannel(&channel); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "Payment channel updated successfully", "data": channel})
}
func (c *AdminController) CreatePaymentChannel(ctx *gin.Context) {
	var channel models.PaymentChannel
	if err := ctx.ShouldBindJSON(&channel); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.service.CreatePaymentChannel(&channel); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusCreated, gin.H{"message": "Payment channel created successfully", "data": channel})
}

func (c *AdminController) DeletePaymentChannel(ctx *gin.Context) {
	id := ctx.Param("id")
	// Safety: Only allow deleting manual channels
	var channel models.PaymentChannel
	if err := config.DB.Where("id = ?", id).First(&channel).Error; err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Payment channel not found"})
		return
	}
	
	if !channel.IsManual {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Hanya metode pembayaran manual yang dapat dihapus"})
		return
	}

	if err := c.service.DeletePaymentChannel(id); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "Payment channel deleted successfully"})
}
