package controllers

import (
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"
	"keuangan-keluarga/internal/services"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AdminController struct {
	service services.AdminService
}

func NewAdminController(service services.AdminService) *AdminController {
	return &AdminController{service: service}
}

func (c *AdminController) GetStats(ctx *gin.Context) {
	stats, err := c.service.GetDashboardStats()
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
	families, err := c.service.GetAllFamilies()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, families)
}

func (c *AdminController) DeleteFamily(ctx *gin.Context) {
	id := ctx.Param("id")
	if err := c.service.DeleteFamily(id); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "Family deleted successfully"})
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

	ctx.JSON(http.StatusOK, gin.H{
		"data":  users,
		"total": total,
		"page":  query.Page,
		"limit": query.Limit,
	})
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
		Value string `json:"value" binding:"required"`
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
	txs, err := c.service.GetPaymentTransactions()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, txs)
}
