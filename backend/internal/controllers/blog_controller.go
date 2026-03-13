package controllers

import (
	"fmt"
	"keuangan-keluarga/internal/models"
	"keuangan-keluarga/internal/repositories"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type BlogController struct {
	repo repositories.BlogRepository
}

func NewBlogController(repo repositories.BlogRepository) *BlogController {
	return &BlogController{repo: repo}
}

func (ctrl *BlogController) Create(c *gin.Context) {
	var post models.BlogPost
	if err := c.ShouldBindJSON(&post); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	authorIDStr := c.GetString("user_id")
	authorID, _ := uuid.Parse(authorIDStr)
	post.AuthorID = authorID

	if err := ctrl.repo.Create(&post); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat artikel"})
		return
	}

	c.JSON(http.StatusCreated, post)
}

func (ctrl *BlogController) List(c *gin.Context) {
	status := c.Query("status")
	category := c.Query("category")
	posts, err := ctrl.repo.List(status, category)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data artikel"})
		return
	}
	c.JSON(http.StatusOK, posts)
}

func (ctrl *BlogController) Get(c *gin.Context) {
	slug := c.Param("slug")
	post, err := ctrl.repo.GetBySlug(slug)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Artikel tidak ditemukan"})
		return
	}
	c.JSON(http.StatusOK, post)
}

func (ctrl *BlogController) Update(c *gin.Context) {
	var post models.BlogPost
	if err := c.ShouldBindJSON(&post); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := ctrl.repo.Update(&post); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal update artikel"})
		return
	}

	c.JSON(http.StatusOK, post)
}

func (ctrl *BlogController) Delete(c *gin.Context) {
	idStr := c.Param("id")
	id, _ := uuid.Parse(idStr)
	if err := ctrl.repo.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus artikel"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Artikel berhasil dihapus"})
}

func (ctrl *BlogController) GetCategories(c *gin.Context) {
	categories, err := ctrl.repo.GetCategories()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil kategori"})
		return
	}
	c.JSON(http.StatusOK, categories)
}

func (ctrl *BlogController) CreateCategory(c *gin.Context) {
	var category models.BlogCategory
	if err := c.ShouldBindJSON(&category); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := ctrl.repo.CreateCategory(&category); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat kategori"})
		return
	}

	c.JSON(http.StatusCreated, category)
}

func (ctrl *BlogController) UpdateCategory(c *gin.Context) {
	var category models.BlogCategory
	if err := c.ShouldBindJSON(&category); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := ctrl.repo.UpdateCategory(&category); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal update kategori"})
		return
	}

	c.JSON(http.StatusOK, category)
}

func (ctrl *BlogController) DeleteCategory(c *gin.Context) {
	idStr := c.Param("id")
	id, _ := uuid.Parse(idStr)
	if err := ctrl.repo.DeleteCategory(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus kategori"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Kategori berhasil dihapus"})
}

func (ctrl *BlogController) UploadImage(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}

	uploadDir := "./uploads/blog"
	if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
		os.MkdirAll(uploadDir, os.ModePerm)
	}

	filename := fmt.Sprintf("blog_%d.webp", time.Now().UnixNano())
	filePath := filepath.Join(uploadDir, filename)

	if err := c.SaveUploadedFile(file, filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image"})
		return
	}

	url := "/uploads/blog/" + filename
	c.JSON(http.StatusOK, gin.H{"url": url})
}
