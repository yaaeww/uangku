package services

import (
	"errors"
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"
	"keuangan-keluarga/internal/repositories"
	"log"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"time"
	"fmt"
	"golang.org/x/crypto/bcrypt"
	"strings"
	"strconv"
	"math"
)

type UserWithFamily struct {
	models.User
	IsVerified    bool      `json:"is_verified"`
	IsBlocked     bool      `json:"is_blocked"`
	FamilyName    string    `json:"family_name"`
	Plan          string    `json:"plan"`
	Status        string    `json:"status"`
	TrialEndsAt   time.Time `json:"trial_ends_at"`
	DaysRemaining int       `json:"days_remaining"`
}

type AdminService interface {
	// Super Admin Methods
	GetDashboardStats(chartDays int) (map[string]interface{}, error)
	GetAllApplications() ([]models.FamilyApplication, error)
	ApproveApplication(id string) error
	RejectApplication(id string) error
	GetAllFamilies() ([]models.Family, error)
	GetFamiliesPaginated(offset, limit int, search, status string) ([]models.Family, int64, error)
	GetFamilyStats() (map[string]int64, error)
	DeleteFamily(id string) error
	ToggleFamilyBlock(id string) error

	// User Management Methods
	GetUsersPaginated(offset, limit int, search, status string) ([]UserWithFamily, int64, error)
	GetUserStats() (map[string]int64, error)
	UpdateUser(user *models.User) error
	ToggleUserBlock(id string) error
	GetSuperAdmins() ([]models.User, error)
	CreateSuperAdmin(fullName, email, password string) error
	UpdateSuperAdmin(id, fullName, email, password string) error
	DeleteSuperAdmin(id string) error
	CreateUserWithRole(fullName, email, password, role, familyName string) error
	UpdateUserAdmin(id, fullName, email, password, role string) error
	DeleteUserAdmin(id string) error

	// Family Admin Methods
	GetMembers(familyID uuid.UUID) ([]repositories.MemberWithUser, error)
	UpdateMemberRole(memberID uuid.UUID, familyID uuid.UUID, role string) error
	RemoveMember(memberID uuid.UUID, familyID uuid.UUID) error
	InviteMember(email string, role string, familyID uuid.UUID, invitedBy uuid.UUID) (uuid.UUID, error)
	GetInvitations(familyID uuid.UUID) ([]models.FamilyInvitation, error)

	// Settings Methods
	GetSettings() ([]models.SystemSetting, error)
	GetPublicSettings() (map[string]string, error)
	UpdateSetting(key, value string) error

	// Subscription Plan Methods
	GetAllPlans() ([]models.SubscriptionPlan, error)
	CreatePlan(plan *models.SubscriptionPlan) error
	UpdatePlan(plan *models.SubscriptionPlan) error
	DeletePlan(id string) error
	GetPlanByID(id string) (models.SubscriptionPlan, error)

	// Payment Transaction Methods
	GetPaymentTransactionsPaginated(offset, limit int, search, status, period string) ([]models.PaymentTransaction, int64, error)

	// Payment Channel Methods
	ListPaymentChannels() ([]models.PaymentChannel, error)
	SyncPaymentChannels() error
	UpdatePaymentChannel(channel *models.PaymentChannel) error
	CreatePaymentChannel(channel *models.PaymentChannel) error
	DeletePaymentChannel(id string) error
}

type adminService struct {
	adminRepo  repositories.AdminRepository
	memberRepo repositories.MemberRepository
	mail       MailService
	tripay     TripayService
}

func NewAdminService(adminRepo repositories.AdminRepository, memberRepo repositories.MemberRepository, mail MailService, tripay TripayService) AdminService {
	return &adminService{
		adminRepo:  adminRepo,
		memberRepo: memberRepo,
		mail:       mail,
		tripay:     tripay,
	}
}

func (s *adminService) GetDashboardStats(chartDays int) (map[string]interface{}, error) {
	if chartDays <= 0 {
		chartDays = 7
	}
	var totalUsers int64
	var totalFamilies int64
	var pendingApps int64
	var blockedUsers int64
	var trialFamilies int64
	var activeFamilies int64

	config.DB.Model(&models.User{}).Count(&totalUsers)
	config.DB.Model(&models.User{}).Where("is_blocked = ?", true).Count(&blockedUsers)
	config.DB.Model(&models.Family{}).Count(&totalFamilies)
	config.DB.Model(&models.Family{}).Where("status = ?", "trial").Count(&trialFamilies)
	config.DB.Model(&models.Family{}).Where("status = ?", "active").Count(&activeFamilies)
	config.DB.Model(&models.FamilyApplication{}).Where("status = ?", "pending").Count(&pendingApps)

	// Financial Stats (Dynamic Period)
	startTime := time.Now().AddDate(0, 0, -chartDays)
	
	var totalRevenue float64
	config.DB.Model(&models.PaymentTransaction{}).
		Where("status = ? AND created_at >= ?", "PAID", startTime).
		Select("COALESCE(SUM(total_amount), 0)").Scan(&totalRevenue)

	var gatewayFees float64
	config.DB.Model(&models.PaymentTransaction{}).
		Where("status = ? AND created_at >= ?", "PAID", startTime).
		Select("COALESCE(SUM(fee), 0)").Scan(&gatewayFees)

	var taxPctStr string
	config.DB.Model(&models.SystemSetting{}).Where("key = ?", "tax_percentage").Select("value").Scan(&taxPctStr)
	taxPct, _ := strconv.ParseFloat(taxPctStr, 64)
	if taxPct == 0 {
		taxPct = 11
	}
	ppnAmount := math.Round(totalRevenue * (taxPct / 100))

	var totalExpenses float64
	config.DB.Table("platform_expenses").
		Where("expense_date >= ?", startTime).
		Select("COALESCE(SUM(amount), 0)").Scan(&totalExpenses)

	// Combine all "Costs" for Overview consistency
	realizedExpenses := totalExpenses
	pendingLiabilities := gatewayFees + ppnAmount
	actualNetProfit := totalRevenue - ppnAmount - gatewayFees - totalExpenses

	// Activity Data (configurable period)
	type DailyActivity struct {
		Date    string  `json:"date"`
		Revenue float64 `json:"revenue"`
	}
	var activities []DailyActivity
	for i := chartDays - 1; i >= 0; i-- {
		date := time.Now().AddDate(0, 0, -i).Format("2006-01-02")
		var dailyRev float64
		config.DB.Model(&models.PaymentTransaction{}).
			Where("status = ? AND DATE(created_at) = ?", "PAID", date).
			Select("COALESCE(SUM(total_amount), 0)").Scan(&dailyRev)
		
		activities = append(activities, DailyActivity{
			Date:    date,
			Revenue: dailyRev,
		})
	}

	return map[string]interface{}{
		"total_users":          totalUsers,
		"blocked_users":        blockedUsers,
		"total_families":       totalFamilies,
		"trial_families":       trialFamilies,
		"active_families":      activeFamilies,
		"pending_applications": pendingApps,
		"total_revenue":        totalRevenue,
		"total_expenses":       totalExpenses + gatewayFees + ppnAmount,
		"realized_expenses":    realizedExpenses,
		"pending_liabilities":  pendingLiabilities,
		"net_profit":           actualNetProfit,
		"activity_chart":       activities,
		"period_label":         fmt.Sprintf("%d Hari Terakhir", chartDays), // For UI feedback
	}, nil
}

func (s *adminService) GetAllApplications() ([]models.FamilyApplication, error) {
	return s.adminRepo.GetAllApplications()
}

func (s *adminService) ApproveApplication(id string) error {
	return s.adminRepo.UpdateApplicationStatus(id, "approved")
}

func (s *adminService) RejectApplication(id string) error {
	return s.adminRepo.UpdateApplicationStatus(id, "rejected")
}

func (s *adminService) GetAllFamilies() ([]models.Family, error) {
	return s.adminRepo.GetAllFamilies()
}

func (s *adminService) GetFamiliesPaginated(offset, limit int, search, status string) ([]models.Family, int64, error) {
	return s.adminRepo.GetFamiliesPaginated(offset, limit, search, status)
}

func (s *adminService) GetFamilyStats() (map[string]int64, error) {
	return s.adminRepo.GetFamilyStats()
}

func (s *adminService) DeleteFamily(id string) error {
	return s.adminRepo.DeleteFamily(id)
}

func (s *adminService) ToggleFamilyBlock(id string) error {
	return s.adminRepo.ToggleFamilyBlock(id)
}

func (s *adminService) GetUsersPaginated(offset, limit int, search, status string) ([]UserWithFamily, int64, error) {
	users, total, err := s.adminRepo.GetUsersPaginated(offset, limit, search, status)
	if err != nil {
		return nil, 0, err
	}

	var result []UserWithFamily
	for _, u := range users {
		item := UserWithFamily{
			User:       u,
			IsVerified: u.IsVerified,
			IsBlocked:  u.IsBlocked,
		}
		
		// Find family membership
		var member models.FamilyMember
		if err := config.DB.Preload("Family").Limit(1).Find(&member, "user_id = ?", u.ID).Error; err == nil && member.ID != uuid.Nil {
			item.FamilyName = member.Family.Name
			item.Plan = member.Family.SubscriptionPlan
			item.Status = member.Family.Status
			item.TrialEndsAt = member.Family.TrialEndsAt
			
			if member.Family.Status == "trial" {
				remaining := int(time.Until(member.Family.TrialEndsAt).Hours() / 24)
				if remaining < 0 { remaining = 0 }
				item.DaysRemaining = remaining
			}
		}
		
		result = append(result, item)
	}

	// Add pending invitations if status is empty or pending
	if status == "" || status == "pending" {
		var invitations []models.FamilyInvitation
		config.DB.Order("created_at desc").Find(&invitations)
		
		for _, inv := range invitations {
			// Check if already in result by email to avoid duplicates
			exists := false
			for _, r := range result {
				if r.Email == inv.Email {
					exists = true
					break
				}
			}
			if exists { continue }

			// Find family name for invitation
			var family models.Family
			config.DB.Select("name").First(&family, "id = ?", inv.FamilyID)

			item := UserWithFamily{
				User: models.User{
					Email:     inv.Email,
					FullName:  inv.Email, // Use email as name since they haven't registered
					CreatedAt: inv.CreatedAt,
				},
				IsVerified: false,
				IsBlocked:  false,
				FamilyName: family.Name,
				Status:     "pending_invite",
			}
			result = append(result, item)
			total++ // Increment total count to reflect added invitation
		}
	}

	return result, total, nil
}

func (s *adminService) GetUserStats() (map[string]int64, error) {
	return s.adminRepo.GetUserStats()
}

func (s *adminService) UpdateUser(user *models.User) error {
	return s.adminRepo.UpdateUser(user)
}

func (s *adminService) ToggleUserBlock(id string) error {
	return s.adminRepo.ToggleUserBlock(id)
}

func (s *adminService) GetSuperAdmins() ([]models.User, error) {
	return s.adminRepo.GetSuperAdmins()
}

func (s *adminService) CreateSuperAdmin(fullName, email, password string) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return errors.New("gagal mengamankan password")
	}

	user := &models.User{
		FullName:     fullName,
		Email:        email,
		PasswordHash: string(hashedPassword),
		Role:         "super_admin",
		IsVerified:   true,
	}

	return s.adminRepo.CreateSuperAdmin(user)
}

func (s *adminService) UpdateSuperAdmin(id, fullName, email, password string) error {
	user, err := s.adminRepo.GetSuperAdminByID(id)
	if err != nil {
		return errors.New("admin tidak ditemukan")
	}

	if fullName != "" {
		user.FullName = fullName
	}
	if email != "" {
		user.Email = email
	}
	if password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			return errors.New("gagal mengamankan password")
		}
		user.PasswordHash = string(hashedPassword)
	}

	return s.adminRepo.UpdateUser(user)
}

func (s *adminService) DeleteSuperAdmin(id string) error {
	admins, err := s.adminRepo.GetSuperAdmins()
	if err != nil {
		return err
	}
	if len(admins) <= 1 {
		return errors.New("tidak bisa menghapus satu-satunya super admin")
	}
	return s.adminRepo.DeleteSuperAdmin(id)
}

func (s *adminService) CreateUserWithRole(fullName, email, password, role, familyName string) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return errors.New("gagal mengamankan password")
	}

	user := &models.User{
		FullName:     fullName,
		Email:        email,
		PasswordHash: string(hashedPassword),
		Role:         role,
		IsVerified:   true,
	}

	// If family name is provided and role is not super_admin/writer, create family too
	if familyName != "" && role != "super_admin" && role != "writer" {
		return s.adminRepo.CreateFamilyWithAdmin(familyName, user)
	}

	return s.adminRepo.CreateUserAdmin(user)
}

func (s *adminService) UpdateUserAdmin(id, fullName, email, password, role string) error {
	user, err := s.adminRepo.GetUserByID(id)
	if err != nil {
		return errors.New("pengguna tidak ditemukan")
	}

	if fullName != "" {
		user.FullName = fullName
	}
	if email != "" {
		user.Email = email
	}
	if role != "" {
		user.Role = role
	}
	if password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			return errors.New("gagal mengamankan password")
		}
		user.PasswordHash = string(hashedPassword)
	}

	return s.adminRepo.UpdateUser(user)
}

func (s *adminService) DeleteUserAdmin(id string) error {
	return s.adminRepo.DeleteUserAdmin(id)
}

func (s *adminService) GetInvitations(familyID uuid.UUID) ([]models.FamilyInvitation, error) {
	return s.memberRepo.GetInvitations(familyID)
}

func (s *adminService) GetMembers(familyID uuid.UUID) ([]repositories.MemberWithUser, error) {
	return s.memberRepo.GetMembers(familyID)
}

func (s *adminService) UpdateMemberRole(memberID uuid.UUID, familyID uuid.UUID, role string) error {
	return s.memberRepo.UpdateRole(memberID, familyID, role)
}

func (s *adminService) RemoveMember(memberID uuid.UUID, familyID uuid.UUID) error {
	var member models.FamilyMember
	if err := config.DB.First(&member, "id = ? AND family_id = ?", memberID, familyID).Error; err != nil {
		return errors.New("member not found")
	}

	tx := config.DB.Begin()
	if err := tx.Delete(&models.FamilyMember{}, "id = ? AND family_id = ?", memberID, familyID).Error; err != nil {
		tx.Rollback()
		return err
	}

	if err := tx.Unscoped().Delete(&models.User{}, "id = ?", member.UserID).Error; err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit().Error
}

func (s *adminService) InviteMember(email string, role string, familyID uuid.UUID, invitedBy uuid.UUID) (uuid.UUID, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	if familyID == uuid.Nil || invitedBy == uuid.Nil {
		return uuid.Nil, errors.New("konteks keluarga atau pengundang tidak valid")
	}

	// 1. Get Family context
	var family models.Family
	if err := config.DB.First(&family, "id = ?", familyID).Error; err != nil {
		return uuid.Nil, errors.New("keluarga tidak ditemukan")
	}

	// 2. Check Slot Limits
	var maxMembers int = 5 // Absolute fallback
	
	if family.Status == "trial" {
		// Use dynamic trial limit
		var trialLimitStr string
		err := config.DB.Table("system_settings").Select("value").Where("key = ?", "trial_max_members").Scan(&trialLimitStr).Error
		if err == nil && trialLimitStr != "" {
			fmt.Sscanf(trialLimitStr, "%d", &maxMembers)
		} else {
			// fallback if setting missing
			maxMembers = 2 
		}
	} else {
		// Use plan-based limit
		var plan models.SubscriptionPlan
		if err := config.DB.First(&plan, "name = ?", family.SubscriptionPlan).Error; err == nil {
			maxMembers = plan.MaxMembers
		} else {
			log.Printf("[WARNING] Plan '%s' not found for family %s. Using default limit 5.", family.SubscriptionPlan, family.ID)
			maxMembers = 5
		}
	}

	var memberCount int64
	config.DB.Model(&models.FamilyMember{}).Where("family_id = ?", familyID).Count(&memberCount)

	var invitationCount int64
	config.DB.Model(&models.FamilyInvitation{}).Where("family_id = ?", familyID).Count(&invitationCount)

	if int(memberCount+invitationCount) >= maxMembers {
		return uuid.Nil, fmt.Errorf("limit anggota tercapai (%d/%d). Silakan hapus undangan pending atau upgrade paket Anda", memberCount+invitationCount, maxMembers)
	}

	// 4. Existing checks
	var existingUser models.User
	if err := config.DB.First(&existingUser, "email = ?", email).Error; err == nil {
		return uuid.Nil, errors.New("email sudah terdaftar sebagai pengguna")
	}

	var existingInv models.FamilyInvitation
	if err := config.DB.First(&existingInv, "email = ?", email).Error; err == nil {
		return uuid.Nil, errors.New("undangan untuk email ini sudah dikirim sebelumnya")
	}

	// 4. Send Invitation... (Rest of existing logic below lines 265)

	invitation := &models.FamilyInvitation{
		Email:     email,
		Role:      role,
		FamilyID:  familyID,
		InvitedBy: invitedBy,
	}
	if err := s.memberRepo.CreateInvitation(invitation); err != nil {
		return uuid.Nil, errors.New("gagal membuat data undangan di database")
	}

	var inviter models.User
	config.DB.First(&inviter, "id = ?", invitedBy)

	roleDisplay := "Anggota"
	switch role {
	case "treasurer":
		roleDisplay = "Bendahara"
	case "viewer":
		roleDisplay = "Pantau Only"
	}

	go func() {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("Recovered from panic in SendInvitation: %v", r)
			}
		}()
		s.mail.SendInvitation(email, family.Name, inviter.FullName, roleDisplay, invitation.ID.String())
	}()

	return invitation.ID, nil
}

func (s *adminService) GetSettings() ([]models.SystemSetting, error) {
	return s.adminRepo.GetSettings()
}

func (s *adminService) UpdateSetting(key, value string) error {
	err := s.adminRepo.UpdateSetting(key, value)
	if err != nil {
		return err
	}

	// Propagate trial duration changes to existing trial families
	if key == "trial_duration_days" {
		var duration int
		fmt.Sscanf(value, "%d", &duration)
		if duration > 0 {
			log.Printf("[INFO] Propagating trial_duration_days (%d) to existing trial families", duration)
			// Update TrialEndsAt = CreatedAt + NewDuration for all trial families
			// We use PostgreSQL interval syntax
			err := config.DB.Exec(`
				UPDATE families 
				SET trial_ends_at = created_at + (INTERVAL '1 day' * ?)
				WHERE status = 'trial'
			`, duration).Error
			if err != nil {
				log.Printf("[ERROR] Failed to propagate trial duration: %v", err)
			}
		}
	}

	return nil
}

func (s *adminService) GetPublicSettings() (map[string]string, error) {
	settings, err := s.adminRepo.GetSettings()
	if err != nil {
		return nil, err
	}

	public := make(map[string]string)
	allowed := map[string]bool{
		"trial_duration_days":    true,
		"allow_registration":     true,
		"trial_max_members":      true,
		"website_name":           true,
		"logo_url_light":         true,
		"logo_url_dark":          true,
		"otp_expiry_duration":    true,
		"resend_otp_duration":    true,
		"contact_address":        true,
		"contact_building":       true,
		"contact_email_support":  true,
		"contact_email_admin":    true,
		"contact_phone_primary":  true,
		"contact_phone_secondary": true,
		"social_instagram_1":    true,
		"social_instagram_2":    true,
		"social_youtube":        true,
		"social_facebook":       true,
		"social_tiktok":         true,
		"social_twitter":        true,
		"whatsapp_number":       true,
		"whatsapp_link":         true,
	}

	for _, s := range settings {
		if allowed[s.Key] {
			public[s.Key] = s.Value
		}
	}
	return public, nil
}

func (s *adminService) GetAllPlans() ([]models.SubscriptionPlan, error) {
	return s.adminRepo.GetAllPlans()
}

func (s *adminService) CreatePlan(plan *models.SubscriptionPlan) error {
	return s.adminRepo.CreatePlan(plan)
}

func (s *adminService) UpdatePlan(plan *models.SubscriptionPlan) error {
	// 1. Get current plan to check for name change
	oldPlan, err := s.adminRepo.GetPlanByID(plan.ID.String())
	if err != nil {
		return err
	}

	oldName := oldPlan.Name
	newName := plan.Name

	// 2. Wrap update in transaction
	return config.DB.Transaction(func(tx *gorm.DB) error {
		if plan.ID == uuid.Nil {
			return errors.New("ID paket tidak boleh kosong untuk pembaharuan")
		}

		// Update the plan itself
		// Use Select(*) to ensure all fields are updated, or just Save if ID is confirmed
		if err := tx.Save(plan).Error; err != nil {
			return err
		}

		// 3. If name changed, propagate to families and applications
		if oldName != newName {
			log.Printf("[INFO] Plan name changed from '%s' to '%s'. Propagating...", oldName, newName)
			
			// Update Families
			if err := tx.Model(&models.Family{}).Where("subscription_plan = ?", oldName).Update("subscription_plan", newName).Error; err != nil {
				return err
			}

			// Update Applications
			if err := tx.Model(&models.FamilyApplication{}).Where("selected_plan = ?", oldName).Update("selected_plan", newName).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

func (s *adminService) DeletePlan(id string) error {
	return s.adminRepo.DeletePlan(id)
}

func (s *adminService) GetPlanByID(id string) (models.SubscriptionPlan, error) {
	plan, err := s.adminRepo.GetPlanByID(id)
	if err != nil {
		return models.SubscriptionPlan{}, err
	}
	return *plan, nil
}

func (s *adminService) GetPaymentTransactionsPaginated(offset, limit int, search, status, period string) ([]models.PaymentTransaction, int64, error) {
	return s.adminRepo.GetPaymentTransactionsPaginated(offset, limit, search, status, period)
}

func (s *adminService) ListPaymentChannels() ([]models.PaymentChannel, error) {
	return s.adminRepo.GetAllPaymentChannels()
}

func (s *adminService) SyncPaymentChannels() error {
	remoteChannels, err := s.tripay.GetPaymentChannels()
	if err != nil {
		return err
	}

	for _, rc := range remoteChannels {
		channel := &models.PaymentChannel{
			Code:       rc.Code,
			Name:       rc.Name,
			Group:      rc.Group,
			Type:       rc.Type,
			FeeFlat:    rc.FeeMerchant.Flat + rc.FeeCustomer.Flat,
			FeePercent: rc.FeeMerchant.Percent + rc.FeeCustomer.Percent, // Assuming total fee is sum
			IsActive:   rc.Active,
			IconURL:    rc.IconURL,
		}
		// Special handling for Icon URLs or other metadata if available...
		// In TriPay it might be separate or we just use code to find icon.
		
		if err := s.adminRepo.UpsertPaymentChannel(channel); err != nil {
			log.Printf("[ERROR] Failed to upsert payment channel %s: %v", rc.Code, err)
		}
	}

	return nil
}

func (s *adminService) UpdatePaymentChannel(channel *models.PaymentChannel) error {
	return s.adminRepo.UpdatePaymentChannel(channel)
}
func (s *adminService) CreatePaymentChannel(channel *models.PaymentChannel) error {
	return s.adminRepo.CreatePaymentChannel(channel)
}

func (s *adminService) DeletePaymentChannel(id string) error {
	return s.adminRepo.DeletePaymentChannel(id)
}
