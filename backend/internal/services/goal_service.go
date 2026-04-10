package services

import (
	"fmt"
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"
	"keuangan-keluarga/internal/repositories"
	"github.com/google/uuid"
	"time"
)

type GoalService interface {
	CreateGoal(goal *models.Goal) error
	GetFamilyGoals(familyID uuid.UUID) ([]models.Goal, error)
	GetGoalByID(id uuid.UUID) (*models.Goal, error)
	UpdateGoal(requestingUserID uuid.UUID, goal *models.Goal) error
	DeleteGoal(requestingUserID uuid.UUID, id uuid.UUID) error
	ConvertToAsset(goalID uuid.UUID, assetType string) error
	GetGoalHistory(goalID uuid.UUID) ([]models.Transaction, error)
}

type goalService struct {
	repo      repositories.GoalRepository
	assetRepo repositories.AssetRepository
	notif     NotificationService
}

func NewGoalService(repo repositories.GoalRepository, assetRepo repositories.AssetRepository, notif NotificationService) GoalService {
	return &goalService{repo: repo, assetRepo: assetRepo, notif: notif}
}

func (s *goalService) CreateGoal(goal *models.Goal) error {
	if err := s.repo.Create(goal); err != nil {
		return err
	}

	go func() {
		var user models.User
		config.DB.Select("full_name").First(&user, "id = ?", goal.UserID)
		
		s.notif.NotifyFamily(goal.FamilyID, goal.UserID, "info", "Target Baru", 
			fmt.Sprintf("%s membuat target baru: %s (Target: Rp%.0f)", user.FullName, goal.Name, goal.TargetAmount))
	}()

	return nil
}

func (s *goalService) GetFamilyGoals(familyID uuid.UUID) ([]models.Goal, error) {
	return s.repo.GetByFamilyID(familyID)
}

func (s *goalService) GetGoalByID(id uuid.UUID) (*models.Goal, error) {
	return s.repo.GetByID(id)
}

func (s *goalService) UpdateGoal(requestingUserID uuid.UUID, goal *models.Goal) error {
	existing, err := s.repo.GetByID(goal.ID)
	if err != nil {
		return err
	}
	if existing.UserID != requestingUserID {
		return fmt.Errorf("anda tidak memiliki izin untuk mengubah goal ini. Hanya pembuat goal yang diperbolehkan.")
	}
	return s.repo.Update(goal)
}

func (s *goalService) DeleteGoal(requestingUserID uuid.UUID, id uuid.UUID) error {
	existing, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}
	if existing.UserID != requestingUserID {
		return fmt.Errorf("anda tidak memiliki izin untuk menghapus goal ini. Hanya pembuat goal yang diperbolehkan.")
	}
	return s.repo.Delete(id)
}

func (s *goalService) ConvertToAsset(goalID uuid.UUID, assetType string) error {
	goal, err := s.repo.GetByID(goalID)
	if err != nil {
		return err
	}

	asset := &models.Asset{
		FamilyID:     goal.FamilyID,
		UserID:       goal.UserID,
		Name:         goal.Name,
		Type:         assetType,
		Value:        goal.TargetAmount,
		AcquiredDate: time.Now(),
		GoalID:       &goal.ID,
	}

	if err := s.assetRepo.Create(asset); err != nil {
		return err
	}

	goal.Status = "converted"
	return s.repo.Update(goal)
}

func (s *goalService) GetGoalHistory(goalID uuid.UUID) ([]models.Transaction, error) {
	var txs []models.Transaction
	err := config.DB.Preload("User").
		Where("goal_id = ?", goalID).
		Order("date desc").
		Find(&txs).Error
	return txs, err
}
