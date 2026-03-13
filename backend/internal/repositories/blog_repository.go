package repositories

import (
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type BlogRepository interface {
	Create(post *models.BlogPost) error
	GetBySlug(slug string) (*models.BlogPost, error)
	List(status string, categorySlug string) ([]models.BlogPost, error)
	Update(post *models.BlogPost) error
	Delete(id uuid.UUID) error
	GetByID(id uuid.UUID) (*models.BlogPost, error)
	GetCategories() ([]models.BlogCategory, error)
	CreateCategory(category *models.BlogCategory) error
	UpdateCategory(category *models.BlogCategory) error
	DeleteCategory(id uuid.UUID) error
	IncrementViews(id uuid.UUID) error
}

type blogRepository struct{}

func NewBlogRepository() BlogRepository {
	return &blogRepository{}
}

func (r *blogRepository) Create(post *models.BlogPost) error {
	return config.DB.Create(post).Error
}

func (r *blogRepository) GetBySlug(slug string) (*models.BlogPost, error) {
	var post models.BlogPost
	err := config.DB.Preload("Author").Preload("Category").Where("slug = ?", slug).First(&post).Error
	if err == nil {
		r.IncrementViews(post.ID)
	}
	return &post, err
}

func (r *blogRepository) List(status string, categorySlug string) ([]models.BlogPost, error) {
	var posts []models.BlogPost
	query := config.DB.Preload("Author").Preload("Category")
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if categorySlug != "" {
		query = query.Joins("Category").Where("\"Category\".slug = ?", categorySlug)
	}
	err := query.Order("created_at DESC").Find(&posts).Error
	return posts, err
}

func (r *blogRepository) Update(post *models.BlogPost) error {
	return config.DB.Save(post).Error
}

func (r *blogRepository) Delete(id uuid.UUID) error {
	return config.DB.Delete(&models.BlogPost{}, "id = ?", id).Error
}

func (r *blogRepository) GetByID(id uuid.UUID) (*models.BlogPost, error) {
	var post models.BlogPost
	err := config.DB.Preload("Category").First(&post, "id = ?", id).Error
	return &post, err
}

func (r *blogRepository) GetCategories() ([]models.BlogCategory, error) {
	var categories []models.BlogCategory
	err := config.DB.Find(&categories).Error
	return categories, err
}

func (r *blogRepository) CreateCategory(category *models.BlogCategory) error {
	return config.DB.Create(category).Error
}

func (r *blogRepository) UpdateCategory(category *models.BlogCategory) error {
	return config.DB.Save(category).Error
}

func (r *blogRepository) DeleteCategory(id uuid.UUID) error {
	// Check if any posts are using this category first? 
	// For now, let's just delete or set to null. 
	// The DB might have constraints.
	return config.DB.Delete(&models.BlogCategory{}, "id = ?", id).Error
}

func (r *blogRepository) IncrementViews(id uuid.UUID) error {
	return config.DB.Model(&models.BlogPost{}).Where("id = ?", id).Update("views_count", gorm.Expr("views_count + 1")).Error
}
