package services

import (
	"errors"
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"
	"keuangan-keluarga/internal/repositories"
	"time"

	"github.com/google/uuid"
)

type AdminService interface {
	GetDashboardStats() (map[string]interface{}, error)
	GetAllApplications() ([]models.FamilyApplication, error)
	ApproveApplication(id string) error
	RejectApplication(id string) error
	GetAllFamilies() ([]models.Family, error)
}

type adminService struct {
	repo repositories.AdminRepository
}

func NewAdminService(repo repositories.AdminRepository) AdminService {
	return &adminService{
		repo: repo,
	}
}

func (s *adminService) GetDashboardStats() (map[string]interface{}, error) {
	families, err := s.repo.GetAllFamilies()
	if err != nil {
		return nil, err
	}

	apps, err := s.repo.GetAllApplications()
	if err != nil {
		return nil, err
	}

	pendingApps := 0
	for _, app := range apps {
		if app.Status == "pending" {
			pendingApps++
		}
	}

	stats := map[string]interface{}{
		"total_families":       len(families),
		"total_applications":   len(apps),
		"pending_applications": pendingApps,
	}

	return stats, nil
}

func (s *adminService) GetAllApplications() ([]models.FamilyApplication, error) {
	return s.repo.GetAllApplications()
}

func (s *adminService) ApproveApplication(id string) error {
	app, err := s.repo.GetApplicationByID(id)
	if err != nil {
		return err
	}

	if app.Status != "pending" {
		return errors.New("application is not pending")
	}

	// Use a transaction from config.DB
	tx := config.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 1. Create Family
	family := models.Family{
		Name:               app.FamilyName,
		ApplicationID:      &app.ID,
		SubscriptionPlan:   app.SelectedPlan,
		Status:             "trial",
		TrialEndsAt:        time.Now().AddDate(0, 0, 7), // 7 days trial
		SubscriptionEndsAt: time.Now().AddDate(0, 0, 7),
	}

	if err := tx.Create(&family).Error; err != nil {
		tx.Rollback()
		return err
	}

	// 2. Locate User (Applicant)
	var user models.User
	if err := tx.Where("id = ?", app.ApplicantID).First(&user).Error; err != nil {
		// If user doesn't exist (unlikely in this flow), handle error
		tx.Rollback()
		return errors.New("applicant user not found")
	}

	// Update user role to family_admin
	if err := tx.Model(&user).Update("role", "family_admin").Error; err != nil {
		tx.Rollback()
		return err
	}

	// 3. Create Family Member Connection
	member := models.FamilyMember{
		ID:       uuid.New(),
		FamilyID: family.ID,
		UserID:   user.ID,
		Role:     "admin",
		JoinedAt: time.Now(),
	}

	if err := tx.Create(&member).Error; err != nil {
		tx.Rollback()
		return err
	}

	// 4. Update Application Status
	if err := tx.Model(app).Update("status", "approved").Error; err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit().Error
}

func (s *adminService) RejectApplication(id string) error {
	return s.repo.UpdateApplicationStatus(id, "rejected")
}

func (s *adminService) GetAllFamilies() ([]models.Family, error) {
	return s.repo.GetAllFamilies()
}
