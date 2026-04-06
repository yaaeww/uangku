package repositories

import (
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"
	"github.com/google/uuid"
)

type AssetRepository interface {
	Create(asset *models.Asset) error
	GetByFamilyID(familyID uuid.UUID) ([]models.Asset, error)
	GetByID(id uuid.UUID) (*models.Asset, error)
	Update(asset *models.Asset) error
	Delete(id uuid.UUID) error
}

type assetRepository struct{}

func NewAssetRepository() AssetRepository {
	return &assetRepository{}
}

func (r *assetRepository) Create(asset *models.Asset) error {
	return config.DB.Create(asset).Error
}

func (r *assetRepository) GetByFamilyID(familyID uuid.UUID) ([]models.Asset, error) {
	var assets []models.Asset
	err := config.DB.Preload("User").Where("family_id = ?", familyID).Order("created_at desc").Find(&assets).Error
	return assets, err
}

func (r *assetRepository) GetByID(id uuid.UUID) (*models.Asset, error) {
	var asset models.Asset
	err := config.DB.First(&asset, "id = ?", id).Error
	return &asset, err
}

func (r *assetRepository) Update(asset *models.Asset) error {
	return config.DB.Save(asset).Error
}

func (r *assetRepository) Delete(id uuid.UUID) error {
	return config.DB.Delete(&models.Asset{}, "id = ?", id).Error
}
