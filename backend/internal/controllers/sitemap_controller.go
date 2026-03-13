package controllers

import (
	"fmt"
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type SitemapController struct{}

func NewSitemapController() *SitemapController {
	return &SitemapController{}
}

func (ctrl *SitemapController) GenerateSitemap(c *gin.Context) {
	// Fetch all published blog posts
	var posts []models.BlogPost
	config.DB.Where("status = ?", "published").Order("updated_at DESC").Find(&posts)

	// Fetch sitemap configurations
	var configs []models.SitemapConfig
	config.DB.Find(&configs)

	// Create a map for quick lookup
	configMap := make(map[string]models.SitemapConfig)
	for _, cfg := range configs {
		configMap[cfg.Path] = cfg
	}

	baseUrl := "http://localhost:5173" // In production, use env variable

	xml := `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`

	// Default home page
	homeCfg, exists := configMap["/"]
	if !exists || (!homeCfg.IsPrivate && homeCfg.AllowBots) {
		xml += fmt.Sprintf(`
	<url>
		<loc>%s/</loc>
		<lastmod>%s</lastmod>
		<changefreq>%s</changefreq>
		<priority>%.1f</priority>
	</url>`, baseUrl, time.Now().Format("2006-01-02"), 
			ifThen(exists, homeCfg.ChangeFreq, "daily"), 
			ifThen(exists, homeCfg.Priority, 1.0))
	}

	// Dynamic Blog Posts
	for _, post := range posts {
		path := "/blog/" + post.Slug
		cfg, exists := configMap[path]
		if exists && (cfg.IsPrivate || !cfg.AllowBots) {
			continue
		}

		xml += fmt.Sprintf(`
	<url>
		<loc>%s/blog/%s</loc>
		<lastmod>%s</lastmod>
		<changefreq>%s</changefreq>
		<priority>%.1f</priority>
	</url>`, baseUrl, post.Slug, post.UpdatedAt.Format("2006-01-02"),
			ifThen(exists, cfg.ChangeFreq, "weekly"),
			ifThen(exists, cfg.Priority, 0.8))
	}

	xml += `
</urlset>`

	c.Header("Content-Type", "application/xml")
	c.String(http.StatusOK, xml)
}

func (ctrl *SitemapController) GetRobotsTxt(c *gin.Context) {
	var privateConfigs []models.SitemapConfig
	config.DB.Where("is_private = ? OR allow_bots = ?", true, false).Find(&privateConfigs)

	content := "User-agent: *\n"
	for _, cfg := range privateConfigs {
		content += fmt.Sprintf("Disallow: %s\n", cfg.Path)
	}
	content += "\nSitemap: http://localhost:5173/sitemap.xml"

	c.Header("Content-Type", "text/plain")
	c.String(http.StatusOK, content)
}

// Helper function because Go doesn't have ternary in templates/logic easily here
func ifThen(cond bool, a interface{}, b interface{}) interface{} {
	if cond {
		return a
	}
	return b
}
