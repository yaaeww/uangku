package repositories

import (
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"
)

type SupportRepository interface {
	Create(report *models.SupportReport) error
	GetByID(id string) (*models.SupportReport, error)
	ListByUser(userID string) ([]models.SupportReport, error)
	ListAll() ([]models.SupportReport, error)
	Update(report *models.SupportReport) error
}

type supportRepository struct{}

func NewSupportRepository() SupportRepository {
	return &supportRepository{}
}

func (r *supportRepository) Create(report *models.SupportReport) error {
	return config.DB.Create(report).Error
}

func (r *supportRepository) GetByID(id string) (*models.SupportReport, error) {
	var report models.SupportReport
	err := config.DB.Preload("User").Preload("Family").First(&report, "id = ?", id).Error
	return &report, err
}

func (r *supportRepository) ListByUser(userID string) ([]models.SupportReport, error) {
	var reports []models.SupportReport
	err := config.DB.Where("user_id = ?", userID).Order("created_at desc").Find(&reports).Error
	return reports, err
}

func (r *supportRepository) ListAll() ([]models.SupportReport, error) {
	var reports []models.SupportReport
	err := config.DB.Preload("User").Preload("Family").Order("created_at desc").Find(&reports).Error
	return reports, err
}

func (r *supportRepository) Update(report *models.SupportReport) error {
	return config.DB.Save(report).Error
}
