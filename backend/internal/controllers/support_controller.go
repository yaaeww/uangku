package controllers

import (
	"keuangan-keluarga/internal/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

type SupportController struct {
	service services.SupportService
}

func NewSupportController(service services.SupportService) *SupportController {
	return &SupportController{service: service}
}

func (sc *SupportController) CreateTicket(c *gin.Context) {
	var req struct {
		Subject string `json:"subject" binding:"required"`
		Message string `json:"message" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	familyID, _ := c.Get("family_id")

	ticket, err := sc.service.CreateTicket(userID.(string), familyID.(string), req.Subject, req.Message)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat laporan"})
		return
	}

	c.JSON(http.StatusCreated, ticket)
}

func (sc *SupportController) ListMyTickets(c *gin.Context) {
	userID, _ := c.Get("user_id")
	tickets, err := sc.service.GetMyTickets(userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data laporan"})
		return
	}
	c.JSON(http.StatusOK, tickets)
}

func (sc *SupportController) AdminListAllTickets(c *gin.Context) {
	tickets, err := sc.service.GetAllTickets()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data laporan semua user"})
		return
	}
	c.JSON(http.StatusOK, tickets)
}

func (sc *SupportController) AdminReplyTicket(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Reply string `json:"reply" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := sc.service.ReplyTicket(id, req.Reply); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengirim balasan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Balasan terkirim"})
}
