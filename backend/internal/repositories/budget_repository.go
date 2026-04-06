package repositories

import (
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type BudgetRepository interface {
	GetBudgetCategories(familyID uuid.UUID, month int, year int) ([]models.BudgetCategory, error)
	GetCategoryByID(id uuid.UUID) (*models.BudgetCategory, error)
}

type budgetRepository struct{}

func NewBudgetRepository() BudgetRepository {
	return &budgetRepository{}
}

func (r *budgetRepository) GetBudgetCategories(familyID uuid.UUID, month int, year int) ([]models.BudgetCategory, error) {
	var categories []models.BudgetCategory
	err := config.DB.Preload("Items", func(db *gorm.DB) *gorm.DB {
		return db.Where("(month = ? AND year = ?) OR month = 0", month, year)
	}).Where("family_id = ? AND ((month = 0 AND year = 0) OR (month = ? AND year = ?))", familyID, month, year).Order("\"order\" asc").Find(&categories).Error
	return categories, err
}

func (r *budgetRepository) GetCategoryByID(id uuid.UUID) (*models.BudgetCategory, error) {
	var category models.BudgetCategory
	err := config.DB.First(&category, "id = ?", id).Error
	return &category, err
}
