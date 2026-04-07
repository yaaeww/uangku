package controllers

import (
	"fmt"
	"keuangan-keluarga/internal/models"
	"keuangan-keluarga/internal/repositories"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"keuangan-keluarga/internal/utils"
)

func calculateSEOScore(post *models.BlogPost) int {
	score := 0
	totalChecks := 8

	// 1. Title length (50-60 chars ideal)
	titleLen := len(post.Title)
	if titleLen >= 30 && titleLen <= 70 {
		score++
	}

	// 2. Meta description length (120-160 chars ideal)
	metaLen := len(post.MetaDescription)
	if metaLen >= 80 && metaLen <= 160 {
		score++
	}

	// 3. Keywords field is populated
	if strings.TrimSpace(post.Keywords) != "" {
		score++
	}

	// 4. Focus keyword appears in title
	if post.Keywords != "" {
		keywords := strings.Split(post.Keywords, ",")
		if len(keywords) > 0 {
			focusKw := strings.TrimSpace(strings.ToLower(keywords[0]))
			if focusKw != "" && strings.Contains(strings.ToLower(post.Title), focusKw) {
				score++
			}
		}
	}

	// 5. Content length (>= 300 words)
	wordCount := len(strings.Fields(post.Content))
	if wordCount >= 300 {
		score++
	}

	// 6. Featured image present
	if strings.TrimSpace(post.FeaturedImage) != "" {
		score++
	}

	// 7. Image alt text present
	if strings.TrimSpace(post.ImageAltText) != "" {
		score++
	}

	// 8. Heading structure (H2 or H3 detected in content via ## or ###)
	if strings.Contains(post.Content, "## ") || strings.Contains(post.Content, "### ") {
		score++
	}

	return int(float64(score) / float64(totalChecks) * 100)
}

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
	post.SeoScore = calculateSEOScore(&post)

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

	post.SeoScore = calculateSEOScore(&post)

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

	// 1. Save as temporary file first
	ext := filepath.Ext(file.Filename)
	tempFilename := fmt.Sprintf("temp_blog_%d%s", time.Now().UnixNano(), ext)
	tempPath := filepath.Join(uploadDir, tempFilename)

	if err := c.SaveUploadedFile(file, tempPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save temporary file"})
		return
	}
	defer os.Remove(tempPath)

	// 2. Prepare final WebP filename
	filename := fmt.Sprintf("blog_%d.webp", time.Now().UnixNano())
	filePath := filepath.Join(uploadDir, filename)

	// 3. Convert to WebP
	if err := utils.ConvertToWebP(tempPath, filePath, 80); err != nil {
		fmt.Printf("[UploadImage] WebP conversion failed: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengonversi gambar ke WebP"})
		return
	}

	url := "/uploads/blog/" + filename
	c.JSON(http.StatusOK, gin.H{"url": url})
}
