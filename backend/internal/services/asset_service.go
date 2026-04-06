package services

import (
	"keuangan-keluarga/internal/models"
	"keuangan-keluarga/internal/repositories"
	"github.com/google/uuid"
)

type AssetService interface {
	CreateAsset(asset *models.Asset) error
	GetFamilyAssets(familyID uuid.UUID) ([]models.Asset, error)
	GetAssetByID(id uuid.UUID) (*models.Asset, error)
	UpdateAsset(asset *models.Asset) error
	DeleteAsset(id uuid.UUID) error
}

type assetService struct {
	repo     repositories.AssetRepository
	goalRepo repositories.GoalRepository
}

func NewAssetService(repo repositories.AssetRepository, goalRepo repositories.GoalRepository) AssetService {
	return &assetService{repo: repo, goalRepo: goalRepo}
}

func (s *assetService) CreateAsset(asset *models.Asset) error {
	return s.repo.Create(asset)
}

func (s *assetService) GetFamilyAssets(familyID uuid.UUID) ([]models.Asset, error) {
	return s.repo.GetByFamilyID(familyID)
}

func (s *assetService) GetAssetByID(id uuid.UUID) (*models.Asset, error) {
	return s.repo.GetByID(id)
}

func (s *assetService) UpdateAsset(asset *models.Asset) error {
	// 1. If the asset has a linked Goal, update the goal as well
	if asset.GoalID != nil {
		goal, err := s.goalRepo.GetByID(*asset.GoalID)
		if err == nil {
			// Sync Name and Value
			goal.Name = asset.Name
			goal.TargetAmount = asset.Value
			goal.CurrentBalance = asset.Value
			_ = s.goalRepo.Update(goal)
		}
	}
	return s.repo.Update(asset)
}

func (s *assetService) DeleteAsset(id uuid.UUID) error {
	// 1. Fetch the asset to check for GoalID
	asset, err := s.repo.GetByID(id)
	if err == nil && asset.GoalID != nil {
		// 2. If it's linked to a Goal, revert goal status to 'active'
		goal, err := s.goalRepo.GetByID(*asset.GoalID)
		if err == nil {
			goal.Status = "active"
			_ = s.goalRepo.Update(goal)
		}
	}
	return s.repo.Delete(id)
}
