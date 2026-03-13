package controllers

import (
	"io"
	"keuangan-keluarga/internal/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

type ScannerController struct {
	service services.ScannerService
}

func NewScannerController(svc services.ScannerService) *ScannerController {
	return &ScannerController{service: svc}
}

func (ctrl *ScannerController) ScanReceipt(c *gin.Context) {
	file, _, err := c.Request.FormFile("receipt")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Receipt image is required"})
		return
	}
	defer file.Close()

	imageData, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read image data"})
		return
	}

	result, err := ctrl.service.ScanReceipt(imageData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}
