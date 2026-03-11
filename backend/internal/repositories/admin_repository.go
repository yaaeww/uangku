package repositories

import (
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"
)

type AdminRepository interface {
	GetAllApplications() ([]models.FamilyApplication, error)
	GetApplicationByID(id string) (*models.FamilyApplication, error)
	UpdateApplicationStatus(id string, status string) error
	GetAllFamilies() ([]models.Family, error)
}

type adminRepository struct{}

func NewAdminRepository() AdminRepository {
	return &adminRepository{}
}

func (r *adminRepository) GetAllApplications() ([]models.FamilyApplication, error) {
	var applications []models.FamilyApplication
	err := config.DB.Order("created_at desc").Find(&applications).Error
	return applications, err
}

func (r *adminRepository) GetApplicationByID(id string) (*models.FamilyApplication, error) {
	var app models.FamilyApplication
	err := config.DB.Where("id = ?", id).First(&app).Error
	if err != nil {
		return nil, err
	}
	return &app, nil
}

func (r *adminRepository) UpdateApplicationStatus(id string, status string) error {
	return config.DB.Model(&models.FamilyApplication{}).Where("id = ?", id).Update("status", status).Error
}

func (r *adminRepository) GetAllFamilies() ([]models.Family, error) {
	var families []models.Family
	err := config.DB.Order("created_at desc").Find(&families).Error
	return families, err
}
