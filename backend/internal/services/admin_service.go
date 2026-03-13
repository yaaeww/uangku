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
)

type UserWithFamily struct {
	models.User
	FamilyName     string    `json:"family_name"`
	Plan           string    `json:"plan"`
	Status         string    `json:"status"`
	TrialEndsAt    time.Time `json:"trial_ends_at"`
	DaysRemaining  int       `json:"days_remaining"`
}

type AdminService interface {
	// Super Admin Methods
	GetDashboardStats() (map[string]interface{}, error)
	GetAllApplications() ([]models.FamilyApplication, error)
	ApproveApplication(id string) error
	RejectApplication(id string) error
	GetAllFamilies() ([]models.Family, error)
	DeleteFamily(id string) error

	// User Management Methods
	GetUsersPaginated(offset, limit int, search, status string) ([]UserWithFamily, int64, error)
	UpdateUser(user *models.User) error
	ToggleUserBlock(id string) error

	// Family Admin Methods
	GetMembers(familyID uuid.UUID) ([]repositories.MemberWithUser, error)
	UpdateMemberRole(memberID uuid.UUID, familyID uuid.UUID, role string) error
	RemoveMember(memberID uuid.UUID, familyID uuid.UUID) error
	InviteMember(email string, role string, familyID uuid.UUID, invitedBy uuid.UUID) (uuid.UUID, error)

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
}

type adminService struct {
	adminRepo  repositories.AdminRepository
	memberRepo repositories.MemberRepository
	mail       MailService
}

func NewAdminService(adminRepo repositories.AdminRepository, memberRepo repositories.MemberRepository, mail MailService) AdminService {
	return &adminService{
		adminRepo:  adminRepo,
		memberRepo: memberRepo,
		mail:       mail,
	}
}

func (s *adminService) GetDashboardStats() (map[string]interface{}, error) {
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

	return map[string]interface{}{
		"total_users":           totalUsers,
		"blocked_users":         blockedUsers,
		"total_families":        totalFamilies,
		"trial_families":        trialFamilies,
		"active_families":       activeFamilies,
		"pending_applications":  pendingApps,
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

func (s *adminService) DeleteFamily(id string) error {
	return s.adminRepo.DeleteFamily(id)
}

func (s *adminService) GetUsersPaginated(offset, limit int, search, status string) ([]UserWithFamily, int64, error) {
	users, total, err := s.adminRepo.GetUsersPaginated(offset, limit, search, status)
	if err != nil {
		return nil, 0, err
	}

	var result []UserWithFamily
	for _, u := range users {
		item := UserWithFamily{User: u}
		
		// Find family membership
		var member models.FamilyMember
		if err := config.DB.Preload("Family").First(&member, "user_id = ?", u.ID).Error; err == nil {
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

	return result, total, nil
}

func (s *adminService) UpdateUser(user *models.User) error {
	return s.adminRepo.UpdateUser(user)
}

func (s *adminService) ToggleUserBlock(id string) error {
	return s.adminRepo.ToggleUserBlock(id)
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
	if familyID == uuid.Nil || invitedBy == uuid.Nil {
		return uuid.Nil, errors.New("konteks keluarga atau pengundang tidak valid")
	}

	var existingUser models.User
	if err := config.DB.First(&existingUser, "email = ?", email).Error; err == nil {
		return uuid.Nil, errors.New("email sudah terdaftar sebagai pengguna")
	}

	var existingInv models.FamilyInvitation
	if err := config.DB.First(&existingInv, "email = ?", email).Error; err == nil {
		return uuid.Nil, errors.New("undangan untuk email ini sudah dikirim sebelumnya")
	}

	invitation := &models.FamilyInvitation{
		Email:     email,
		Role:      role,
		FamilyID:  familyID,
		InvitedBy: invitedBy,
	}
	if err := s.memberRepo.CreateInvitation(invitation); err != nil {
		return uuid.Nil, errors.New("gagal membuat data undangan di database")
	}

	var family models.Family
	var inviter models.User
	config.DB.First(&family, "id = ?", familyID)
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
		s.mail.SendInvitation(email, family.Name, inviter.FullName, roleDisplay)
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
		"trial_duration_days": true,
		"allow_registration":  true,
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
