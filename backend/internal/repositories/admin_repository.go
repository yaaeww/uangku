package repositories

import (
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"
	"time"
	"errors"

	"gorm.io/gorm"
)

type AdminRepository interface {
	GetAllApplications() ([]models.FamilyApplication, error)
	GetApplicationByID(id string) (*models.FamilyApplication, error)
	UpdateApplicationStatus(id string, status string) error
	GetAllFamilies() ([]models.Family, error)
	GetFamiliesPaginated(offset, limit int, search, status string) ([]models.Family, int64, error)
	GetFamilyStats() (map[string]int64, error)
	DeleteFamily(id string) error
	ToggleFamilyBlock(id string) error
	
	// User Management Methods
	GetUsersPaginated(offset, limit int, search, status string) ([]models.User, int64, error)
	GetUserStats() (map[string]int64, error)
	GetUserByID(id string) (*models.User, error)
	UpdateUser(user *models.User) error
	ToggleUserBlock(id string) error
	CreateUserAdmin(user *models.User) error
	DeleteUserAdmin(id string) error
	CreateFamilyWithAdmin(familyName string, user *models.User) error
	GetSuperAdmins() ([]models.User, error)
	GetSuperAdminByID(id string) (*models.User, error)
	CreateSuperAdmin(admin *models.User) error
	DeleteSuperAdmin(id string) error
	
	// Subscription Plan Methods
	GetAllPlans() ([]models.SubscriptionPlan, error)
	GetPlanByID(id string) (*models.SubscriptionPlan, error)
	CreatePlan(plan *models.SubscriptionPlan) error
	UpdatePlan(plan *models.SubscriptionPlan) error
	DeletePlan(id string) error

	// Settings Methods
	GetSettings() ([]models.SystemSetting, error)
	UpdateSetting(key, value string) error

	// Payment Transaction Methods
	GetPaymentTransactionsPaginated(offset, limit int, search, status, period string) ([]models.PaymentTransaction, int64, error)

	// Payment Channel Methods
	GetAllPaymentChannels() ([]models.PaymentChannel, error)
	UpdatePaymentChannel(channel *models.PaymentChannel) error
	UpsertPaymentChannel(channel *models.PaymentChannel) error
	CreatePaymentChannel(channel *models.PaymentChannel) error
	DeletePaymentChannel(id string) error
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
	if err != nil {
		return nil, err
	}

	// Populate virtual fields for each family
	for i := range families {
		var walletStats struct {
			Count int
			Total float64
		}
		
		config.DB.Model(&models.Wallet{}).
			Select("COUNT(*) as count, SUM(balance) as total").
			Where("family_id = ?", families[i].ID).
			Scan(&walletStats)
		
		families[i].WalletsCount = walletStats.Count
		families[i].TotalBalance = walletStats.Total
	}

	return families, nil
}

func (r *adminRepository) GetFamiliesPaginated(offset, limit int, search, status string) ([]models.Family, int64, error) {
	var families []models.Family
	var total int64

	query := config.DB.Model(&models.Family{})

	if search != "" {
		searchTerm := "%" + search + "%"
		query = query.Where("name ILIKE ?", searchTerm)
	}

	if status != "" {
		switch status {
		case "blocked":
			query = query.Where("is_blocked = ?", true)
		case "trial":
			query = query.Where("status = ?", "trial")
		case "active":
			query = query.Where("status = ?", "active")
		}
	}

	query.Session(&gorm.Session{}).Count(&total)
	err := query.Preload("Members.User").Order("created_at desc").Offset(offset).Limit(limit).Find(&families).Error
	if err != nil {
		return nil, 0, err
	}

	// Populate virtual fields for each family
	for i := range families {
		var walletStats struct {
			Count int
			Total float64
		}
		
		config.DB.Model(&models.Wallet{}).
			Select("COUNT(*) as count, SUM(balance) as total").
			Where("family_id = ?", families[i].ID).
			Scan(&walletStats)
		
		families[i].WalletsCount = walletStats.Count
		families[i].TotalBalance = walletStats.Total
	}

	return families, total, nil
}

func (r *adminRepository) GetFamilyStats() (map[string]int64, error) {
	var total, trial, active, blocked int64

	if err := config.DB.Model(&models.Family{}).Count(&total).Error; err != nil {
		return nil, err
	}
	if err := config.DB.Model(&models.Family{}).Where("status = ?", "trial").Count(&trial).Error; err != nil {
		return nil, err
	}
	if err := config.DB.Model(&models.Family{}).Where("status = ?", "active").Count(&active).Error; err != nil {
		return nil, err
	}
	if err := config.DB.Model(&models.Family{}).Where("is_blocked = ?", true).Count(&blocked).Error; err != nil {
		return nil, err
	}

	return map[string]int64{
		"total":   total,
		"trial":   trial,
		"active":  active,
		"blocked": blocked,
	}, nil
}

func (r *adminRepository) DeleteFamily(id string) error {
	return config.DB.Transaction(func(tx *gorm.DB) error {
		// 1. Get all member user IDs before they are unlinked
		var userIDs []string
		if err := tx.Table("family_members").Where("family_id = ?", id).Pluck("user_id", &userIDs).Error; err != nil {
			return err
		}

		// 2. Clean up user-tied data for all these members
		for _, uid := range userIDs {
			tx.Exec("DELETE FROM notifications WHERE user_id = ?", uid)
			tx.Exec("DELETE FROM support_reports WHERE user_id = ?", uid)
			tx.Exec("DELETE FROM transactions WHERE user_id = ?", uid)
			tx.Exec("DELETE FROM assets WHERE user_id = ?", uid)
			tx.Exec("DELETE FROM goals WHERE user_id = ?", uid)
			tx.Exec("DELETE FROM savings WHERE user_id = ? OR target_user_id = ?", uid, uid)
			tx.Exec("DELETE FROM wallets WHERE user_id = ?", uid)
			tx.Exec("DELETE FROM debt_payments WHERE user_id = ?", uid)
			tx.Exec("DELETE FROM debts WHERE created_by = ?", uid)
			tx.Exec("DELETE FROM blog_posts WHERE author_id = ?", uid)
			tx.Exec("DELETE FROM family_applications WHERE applicant_id = ?", uid)
			tx.Exec("DELETE FROM family_invitations WHERE invited_by = ?", uid)
			tx.Exec("DELETE FROM budget_categories WHERE user_id = ?", uid)
			tx.Exec("DELETE FROM family_members WHERE user_id = ?", uid)
		}

		// 3. Clean up family-wide/shared data
		tx.Exec("DELETE FROM transactions WHERE family_id = ?", id)
		tx.Exec("DELETE FROM wallets WHERE family_id = ?", id)
		tx.Exec("DELETE FROM savings WHERE family_id = ?", id)
		tx.Exec("DELETE FROM goals WHERE family_id = ?", id)
		tx.Exec("DELETE FROM assets WHERE family_id = ?", id)
		tx.Exec("DELETE FROM debts WHERE family_id = ?", id)
		tx.Exec("DELETE FROM family_challenges WHERE family_id = ?", id)
		tx.Exec("DELETE FROM family_invitations WHERE family_id = ?", id)
		tx.Exec("DELETE FROM budget_categories WHERE family_id = ?", id)
		tx.Exec("DELETE FROM payment_transactions WHERE family_id = ?", id)
		tx.Exec("DELETE FROM support_reports WHERE family_id = ?", id)
		tx.Exec("DELETE FROM family_members WHERE family_id = ?", id)

		// 4. Finally delete the User accounts themselves
		if len(userIDs) > 0 {
			if err := tx.Exec("DELETE FROM users WHERE id IN ?", userIDs).Error; err != nil {
				return err
			}
		}

		// 5. Finally delete the family record
		return tx.Delete(&models.Family{}, "id = ?", id).Error
	})
}

func (r *adminRepository) ToggleFamilyBlock(id string) error {
	var family models.Family
	if err := config.DB.First(&family, "id = ?", id).Error; err != nil {
		return err
	}
	
	now := time.Now()
	if family.IsBlocked {
		return config.DB.Model(&family).Updates(map[string]interface{}{
			"is_blocked": false,
			"blocked_at": nil,
		}).Error
	} else {
		return config.DB.Model(&family).Updates(map[string]interface{}{
			"is_blocked": true,
			"blocked_at": &now,
		}).Error
	}
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
		case "pending":
			query = query.Where("is_verified = ?", false)
		case "verified":
			query = query.Where("is_verified = ?", true)
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

	query.Session(&gorm.Session{}).Count(&total)
	err := query.Order("created_at desc").Offset(offset).Limit(limit).Find(&users).Error
	
	return users, total, err
}

func (r *adminRepository) GetUserStats() (map[string]int64, error) {
	var total, active, pendingUsers, pendingInvitations, blocked int64

	if err := config.DB.Model(&models.User{}).Count(&total).Error; err != nil {
		return nil, err
	}
	if err := config.DB.Model(&models.User{}).Where("is_verified = ? AND is_blocked = ?", true, false).Count(&active).Error; err != nil {
		return nil, err
	}
	if err := config.DB.Model(&models.User{}).Where("is_verified = ?", false).Count(&pendingUsers).Error; err != nil {
		return nil, err
	}
	if err := config.DB.Model(&models.FamilyInvitation{}).Count(&pendingInvitations).Error; err != nil {
		// Log error but don't fail if table doesn't exist or other error
		pendingInvitations = 0
	}
	if err := config.DB.Model(&models.User{}).Where("is_blocked = ?", true).Count(&blocked).Error; err != nil {
		return nil, err
	}

	return map[string]int64{
		"total":   total + pendingInvitations,
		"active":  active,
		"pending": pendingUsers + pendingInvitations,
		"blocked": blocked,
	}, nil
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

func (r *adminRepository) GetUserByID(id string) (*models.User, error) {
	var user models.User
	err := config.DB.First(&user, "id = ?", id).Error
	return &user, err
}

func (r *adminRepository) CreateUserAdmin(user *models.User) error {
	return config.DB.Create(user).Error
}

func (r *adminRepository) DeleteUserAdmin(id string) error {
	return config.DB.Transaction(func(tx *gorm.DB) error {
		// 1. Clean up transactional/activity data
		tx.Exec("DELETE FROM notifications WHERE user_id = ?", id)
		tx.Exec("DELETE FROM support_reports WHERE user_id = ?", id)
		tx.Exec("DELETE FROM transactions WHERE user_id = ?", id)
		
		// 2. Clean up finance modules
		tx.Exec("DELETE FROM assets WHERE user_id = ?", id)
		tx.Exec("DELETE FROM goals WHERE user_id = ?", id)
		tx.Exec("DELETE FROM savings WHERE user_id = ? OR target_user_id = ?", id, id)
		tx.Exec("DELETE FROM wallets WHERE user_id = ?", id)
		tx.Exec("DELETE FROM debt_payments WHERE user_id = ?", id)
		tx.Exec("DELETE FROM debts WHERE created_by = ?", id)
		
		// 3. Clean up content, applications & social
		tx.Exec("DELETE FROM blog_posts WHERE author_id = ?", id)
		tx.Exec("DELETE FROM family_applications WHERE applicant_id = ?", id)
		tx.Exec("DELETE FROM family_invitations WHERE invited_by = ?", id)
		tx.Exec("DELETE FROM budget_categories WHERE user_id = ?", id)
		
		// 4. Clean up membership
		tx.Exec("DELETE FROM family_members WHERE user_id = ?", id)
		
		// 5. Finally delete the user
		return tx.Delete(&models.User{}, "id = ?", id).Error
	})
}

func (r *adminRepository) CreateFamilyWithAdmin(familyName string, user *models.User) error {
	return config.DB.Transaction(func(tx *gorm.DB) error {
		// 1. Create User
		if err := tx.Create(user).Error; err != nil {
			return err
		}

		// 2. Create Family
		family := &models.Family{
			Name: familyName,
		}
		if err := tx.Create(family).Error; err != nil {
			return err
		}

		// 3. Link them as head of family
		member := &models.FamilyMember{
			FamilyID: family.ID,
			UserID:   user.ID,
			Role:     "head_of_family", // Owner
		}
		
		return tx.Create(member).Error
	})
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

func (r *adminRepository) GetPaymentTransactionsPaginated(offset, limit int, search, status, period string) ([]models.PaymentTransaction, int64, error) {
	var txs []models.PaymentTransaction
	var total int64

	query := config.DB.Model(&models.PaymentTransaction{}).Preload("Family")

	if search != "" {
		searchTerm := "%" + search + "%"
		query = query.Joins("JOIN families ON families.id = payment_transactions.family_id").
			Where("payment_transactions.reference ILIKE ? OR payment_transactions.merchant_ref ILIKE ? OR families.name ILIKE ?", searchTerm, searchTerm, searchTerm)
	}

	if status != "" {
		query = query.Where("payment_transactions.status = ?", status)
	}

	if period != "" {
		now := time.Now()
		var startTime time.Time
		switch period {
		case "day":
			startTime = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.Local)
		case "week":
			// Start of week (Monday)
			weekday := int(now.Weekday())
			if weekday == 0 { weekday = 7 } // Sunday
			startTime = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.Local).AddDate(0, 0, -weekday+1)
		case "month":
			startTime = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.Local)
		case "year":
			startTime = time.Date(now.Year(), 1, 1, 0, 0, 0, 0, time.Local)
		}
		if !startTime.IsZero() {
			query = query.Where("payment_transactions.created_at >= ?", startTime)
		}
	}

	query.Session(&gorm.Session{}).Count(&total)
	err := query.Order("payment_transactions.created_at desc").Offset(offset).Limit(limit).Find(&txs).Error
	return txs, total, err
}

func (r *adminRepository) GetSuperAdmins() ([]models.User, error) {
	var users []models.User
	err := config.DB.Where("role = ?", "super_admin").Order("created_at desc").Find(&users).Error
	return users, err
}

func (r *adminRepository) GetSuperAdminByID(id string) (*models.User, error) {
	var user models.User
	err := config.DB.First(&user, "id = ? AND role = ?", id, "super_admin").Error
	return &user, err
}

func (r *adminRepository) CreateSuperAdmin(admin *models.User) error {
	admin.Role = "super_admin"
	return config.DB.Create(admin).Error
}

func (r *adminRepository) DeleteSuperAdmin(id string) error {
	return config.DB.Delete(&models.User{}, "id = ? AND role = ?", id, "super_admin").Error
}

func (r *adminRepository) GetAllPaymentChannels() ([]models.PaymentChannel, error) {
	var channels []models.PaymentChannel
	err := config.DB.Order("\"group\" asc, name asc").Find(&channels).Error
	return channels, err
}

func (r *adminRepository) UpdatePaymentChannel(channel *models.PaymentChannel) error {
	return config.DB.Save(channel).Error
}

func (r *adminRepository) UpsertPaymentChannel(channel *models.PaymentChannel) error {
	var existing models.PaymentChannel
	err := config.DB.Where("code = ?", channel.Code).First(&existing).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return config.DB.Create(channel).Error
		}
		return err
	}
	// Update only fields from Tripay that might change, preserve our settings if they exist?
	// Actually, Tripay fields are Name, Group, Type, FeeFlat, FeePercent.
	// Our settings are IsActive, FeeBorneBy, CustomFeeMerchant.
	existing.Name = channel.Name
	existing.Group = channel.Group
	existing.Type = channel.Type
	existing.FeeFlat = channel.FeeFlat
	existing.FeePercent = channel.FeePercent
	existing.IconURL = channel.IconURL
	return config.DB.Save(&existing).Error
}
func (r *adminRepository) CreatePaymentChannel(channel *models.PaymentChannel) error {
	return config.DB.Create(channel).Error
}

func (r *adminRepository) DeletePaymentChannel(id string) error {
	return config.DB.Delete(&models.PaymentChannel{}, "id = ?", id).Error
}
