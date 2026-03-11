package controllers

import (
	"keuangan-keluarga/internal/services"
	"net/http"

	"github.com/gin-gonic/gin"
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
