package repositories

import (
	"fmt"
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"

	"gorm.io/gorm"
)

type AdminRepository interface {
	GetAllApplications() ([]models.FamilyApplication, error)
	GetApplicationByID(id string) (*models.FamilyApplication, error)
	UpdateApplicationStatus(id string, status string) error
	GetAllFamilies() ([]models.Family, error)
	DeleteFamily(id string) error
	
	// User Management Methods
	GetUsersPaginated(offset, limit int, search, status string) ([]models.User, int64, error)
	UpdateUser(user *models.User) error
	ToggleUserBlock(id string) error
	
	// Subscription Plan Methods
	GetAllPlans() ([]models.SubscriptionPlan, error)
	GetPlanByID(id string) (*models.SubscriptionPlan, error)
	CreatePlan(plan *models.SubscriptionPlan) error
	UpdatePlan(plan *models.SubscriptionPlan) error
	DeletePlan(id string) error

	// Settings Methods
	GetSettings() ([]models.SystemSetting, error)
	UpdateSetting(key, value string) error
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
	err := config.DB.Preload("Members.User").Order("created_at desc").Find(&families).Error
	return families, err
}

func (r *adminRepository) DeleteFamily(id string) error {
	return config.DB.Transaction(func(tx *gorm.DB) error {
		// 1. Delete Transactions (Partitioned table)
		if err := tx.Exec("DELETE FROM transactions WHERE family_id = ?", id).Error; err != nil {
			return err
		}

		// 2. Delete Debt Payments (No direct family_id, must use subquery from debts)
		if err := tx.Exec("DELETE FROM debt_payments WHERE debt_id IN (SELECT id FROM debts WHERE family_id = ?)", id).Error; err != nil {
			return err
		}

		// 3. Delete Notifications (via users in family)
		if err := tx.Exec("DELETE FROM notifications WHERE user_id IN (SELECT user_id FROM family_members WHERE family_id = ?)", id).Error; err != nil {
			return err
		}

		// 4. Delete other dependent tables (direct family_id)
		tables := []string{
			"family_members",
			"wallets",
			"savings",
			"debts",
			"family_invitations",
		}

		for _, table := range tables {
			if err := tx.Exec(fmt.Sprintf("DELETE FROM %s WHERE family_id = ?", table), id).Error; err != nil {
				return err
			}
		}

		// 5. Finally delete the family record
		return tx.Delete(&models.Family{}, "id = ?", id).Error
	})
}

func (r *adminRepository) GetUsersPaginated(offset, limit int, search, status string) ([]models.User, int64, error) {
	var users []models.User
	var total int64
	
	query := config.DB.Model(&models.User{})
	
	// Filtering: Search by Name or Email
	if search != "" {
		searchTerm := "%" + search + "%"
		query = query.Where("full_name ILIKE ? OR email ILIKE ?", searchTerm, searchTerm)
	}

	// Filtering: Status-based
	if status != "" {
		switch status {
		case "blocked":
			query = query.Where("is_blocked = ?", true)
		case "active":
			query = query.Where("is_blocked = ?", false)
		case "trial":
			// Need to join with family to check trial status
			query = query.Joins("JOIN family_members ON family_members.user_id = users.id").
				Joins("JOIN families ON families.id = family_members.family_id").
				Where("families.status = ?", "trial")
		case "subscribed":
			query = query.Joins("JOIN family_members ON family_members.user_id = users.id").
				Joins("JOIN families ON families.id = family_members.family_id").
				Where("families.status = ?", "active")
		}
	}

	query.Count(&total)
	err := query.Order("created_at desc").Offset(offset).Limit(limit).Find(&users).Error
	
	return users, total, err
}

func (r *adminRepository) UpdateUser(user *models.User) error {
	return config.DB.Save(user).Error
}

func (r *adminRepository) ToggleUserBlock(id string) error {
	var user models.User
	if err := config.DB.First(&user, "id = ?", id).Error; err != nil {
		return err
	}
	return config.DB.Model(&user).Update("is_blocked", !user.IsBlocked).Error
}

func (r *adminRepository) GetAllPlans() ([]models.SubscriptionPlan, error) {
	var plans []models.SubscriptionPlan
	err := config.DB.Order("price asc").Find(&plans).Error
	return plans, err
}

func (r *adminRepository) GetPlanByID(id string) (*models.SubscriptionPlan, error) {
	var plan models.SubscriptionPlan
	err := config.DB.Where("id = ?", id).First(&plan).Error
	if err != nil {
		return nil, err
	}
	return &plan, nil
}

func (r *adminRepository) CreatePlan(plan *models.SubscriptionPlan) error {
	return config.DB.Create(plan).Error
}

func (r *adminRepository) UpdatePlan(plan *models.SubscriptionPlan) error {
	return config.DB.Save(plan).Error
}

func (r *adminRepository) DeletePlan(id string) error {
	return config.DB.Delete(&models.SubscriptionPlan{}, "id = ?", id).Error
}

func (r *adminRepository) GetSettings() ([]models.SystemSetting, error) {
	var settings []models.SystemSetting
	err := config.DB.Find(&settings).Error
	return settings, err
}

func (r *adminRepository) UpdateSetting(key, value string) error {
	var setting models.SystemSetting
	if err := config.DB.Where("key = ?", key).First(&setting).Error; err != nil {
		setting = models.SystemSetting{Key: key, Value: value}
		return config.DB.Create(&setting).Error
	}
	setting.Value = value
	return config.DB.Save(&setting).Error
}
