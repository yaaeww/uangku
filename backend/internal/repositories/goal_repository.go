package repositories

import (
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"
	"github.com/google/uuid"
)

type GoalRepository interface {
	Create(goal *models.Goal) error
	GetByFamilyID(familyID uuid.UUID) ([]models.Goal, error)
	GetByID(id uuid.UUID) (*models.Goal, error)
	Update(goal *models.Goal) error
	Delete(id uuid.UUID) error
}

type goalRepository struct{}

func NewGoalRepository() GoalRepository {
	return &goalRepository{}
}

func (r *goalRepository) Create(goal *models.Goal) error {
	return config.DB.Create(goal).Error
}

func (r *goalRepository) GetByFamilyID(familyID uuid.UUID) ([]models.Goal, error) {
	var goals []models.Goal
	err := config.DB.Where("family_id = ?", familyID).Order("created_at desc").Find(&goals).Error
	return goals, err
}

func (r *goalRepository) GetByID(id uuid.UUID) (*models.Goal, error) {
	var goal models.Goal
	err := config.DB.First(&goal, "id = ?", id).Error
	return &goal, err
}

func (r *goalRepository) Update(goal *models.Goal) error {
	return config.DB.Save(goal).Error
}

func (r *goalRepository) Delete(id uuid.UUID) error {
	return config.DB.Delete(&models.Goal{}, "id = ?", id).Error
}
