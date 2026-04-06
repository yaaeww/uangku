package services

import (
	"errors"
	"fmt"
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"
	"keuangan-keluarga/internal/repositories"
	"log"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"strings"
)

type LoginResponse struct {
	Token      string       `json:"token"`
	User       *models.User `json:"user"`
	FamilyName string       `json:"family_name"`
}

type AuthService interface {
	Register(email, phoneNumber, password, fullName, familyName string, invitationID uuid.UUID) (time.Time, error)
	VerifyOTP(email, otp string) (*LoginResponse, error)
	Login(email, password string, rememberMe bool) (*LoginResponse, error)
	ForgotPassword(email string) error
	ResetPassword(token, newPassword string) error
	GetInvitationDetails(id uuid.UUID) (*models.FamilyInvitation, string, *models.User, error)
	UpdateProfile(userID uuid.UUID, fullName, phoneNumber string) (*models.User, error)
	UpdatePassword(userID uuid.UUID, currentPassword, newPassword string) error
	RequestPasswordResetOTP(email string) error
	ResetPasswordWithOTP(email, otp, newPassword string) error
	ResendOTP(email string) (time.Time, error)
	GetProfile(userID uuid.UUID) (*models.User, error)
}

type authService struct {
	repo   repositories.AuthRepository
	mail   MailService
	budget *BudgetService
}

func NewAuthService(repo repositories.AuthRepository, mail MailService, budget *BudgetService) AuthService {
	return &authService{repo: repo, mail: mail, budget: budget}
}

func (s *authService) Register(email, phoneNumber, password, fullName, familyName string, invitationID uuid.UUID) (time.Time, error) {
	// Normalize email to lowercase
	email = strings.ToLower(strings.TrimSpace(email))
	// 1. Check if user already exists by Email or Phone
	var existingUserByEmail models.User
	var existingUserByPhone models.User

	config.DB.First(&existingUserByEmail, "email = ?", email)
	config.DB.First(&existingUserByPhone, "phone_number = ?", phoneNumber)

	// If any VERIFIED user exists with either, it's a hard conflict
	if existingUserByEmail.ID != uuid.Nil && existingUserByEmail.IsVerified {
		return time.Time{}, errors.New("email sudah terdaftar. Silakan gunakan email lain atau login.")
	}
	if existingUserByPhone.ID != uuid.Nil && existingUserByPhone.IsVerified {
		return time.Time{}, errors.New("nomor WhatsApp sudah terdaftar. Silakan gunakan nomor lain atau login.")
	}

	tx := config.DB.Begin()

	// If an UNVERIFIED user exists with this PHONE but a DIFFERENT EMAIL, purge it
	if existingUserByPhone.ID != uuid.Nil && !existingUserByPhone.IsVerified && existingUserByPhone.Email != email {
		log.Printf("[INFO] Purging stale unverified user with phone %s (Email: %s)", phoneNumber, existingUserByPhone.Email)
		if err := tx.Unscoped().Delete(&models.User{}, "id = ?", existingUserByPhone.ID).Error; err != nil {
			tx.Rollback()
			return time.Time{}, err
		}
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		tx.Rollback()
		return time.Time{}, err
	}

	// 2. Generate OTP and fetch expiry
	otp := fmt.Sprintf("%06d", (time.Now().UnixNano()/1e6)%1000000)
	expiryMinutes := 15
	var expSetting string
	config.DB.Table("system_settings").Select("value").Where("key = ?", "otp_expiry_duration").Scan(&expSetting)
	if expSetting != "" {
		fmt.Sscanf(expSetting, "%d", &expiryMinutes)
	}
	expiryAt := time.Now().Add(time.Duration(expiryMinutes) * time.Minute)

	// Check for invitation
	var invitation *models.FamilyInvitation
	if invitationID != uuid.Nil {
		if err := tx.First(&invitation, "id = ?", invitationID).Error; err != nil {
			tx.Rollback()
			return time.Time{}, errors.New("link undangan tidak valid atau sudah kadaluarsa.")
		}
	} else {
		// Try to find invitation by email in tx
		tx.First(&invitation, "email = ?", email)
	}

	// Validate Family Name if no invitation
	if (invitation == nil || invitation.ID == uuid.Nil) && familyName == "" {
		tx.Rollback()
		return time.Time{}, errors.New("nama keluarga wajib diisi jika mendaftar tanpa undangan")
	}

	role := "family_admin"
	if invitation != nil && invitation.ID != uuid.Nil {
		role = "family_member"
	}

	var user *models.User
	if existingUserByEmail.ID != uuid.Nil {
		// UPDATE existing unverified user (found by email)
		user = &existingUserByEmail
		user.PhoneNumber = phoneNumber
		user.PasswordHash = string(hashedPassword)
		user.FullName = fullName
		user.Role = role
		user.VerifyOTP = otp
		user.OTPExpiresAt = expiryAt

		if err := tx.Save(user).Error; err != nil {
			tx.Rollback()
			return time.Time{}, err
		}
	} else {
		// CREATE new user
		user = &models.User{
			Email:        email,
			PhoneNumber:  phoneNumber,
			PasswordHash: string(hashedPassword),
			FullName:     fullName,
			Role:         role,
			IsVerified:   false,
			VerifyOTP:    otp,
			OTPExpiresAt: expiryAt,
		}

		if err := tx.Create(user).Error; err != nil {
			tx.Rollback()
			return time.Time{}, err
		}
	}

	// 3. Send OTP via both Email and WhatsApp (Async with recovery)
	go func() {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("Recovered from panic in SendOTP: %v", r)
			}
		}()
		s.mail.SendOTP(email, otp, expiryMinutes)
	}()

	if phoneNumber != "" {
		go func() {
			defer func() {
				if r := recover(); r != nil {
					log.Printf("Recovered from panic in SendWhatsAppOTP: %v", r)
				}
			}()
			s.mail.SendWhatsAppOTP(phoneNumber, otp, expiryMinutes)
		}()
	}

	if invitation != nil && invitation.ID != uuid.Nil {
		// Join existing family
		var existingMember models.FamilyMember
		err := tx.First(&existingMember, "user_id = ? AND family_id = ?", user.ID, invitation.FamilyID).Error
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			tx.Rollback()
			return time.Time{}, err
		}

		if errors.Is(err, gorm.ErrRecordNotFound) {
			member := &models.FamilyMember{
				UserID:   user.ID,
				FamilyID: invitation.FamilyID,
				Role:     invitation.Role,
			}
			if err := tx.Create(member).Error; err != nil {
				tx.Rollback()
				return time.Time{}, err
			}
		}

		// NOTE: Do NOT delete invitation here. It will be deleted after OTP verification
		// so the user can re-register if OTP expires.
	} else if existingUserByEmail.ID == uuid.Nil {
		// Create New Family ONLY if it's a completely new user
		family := &models.Family{
			Name: familyName,
		}
		if err := tx.Create(family).Error; err != nil {
			tx.Rollback()
			return time.Time{}, err
		}

		member := &models.FamilyMember{
			UserID:   user.ID,
			FamilyID: family.ID,
			Role:     "head_of_family",
		}
		if err := tx.Create(member).Error; err != nil {
			tx.Rollback()
			return time.Time{}, err
		}

		// Seed default budget categories and items AFTER member exists
		if err := s.budget.SeedDefaultBudget(tx, family.ID, user.ID, int(time.Now().Month()), time.Now().Year()); err != nil {
			tx.Rollback()
			return time.Time{}, err
		}
	}

	if err := tx.Commit().Error; err != nil {
		return time.Time{}, err
	}

	// 3. Send OTP moved inside transactional logic or refactored to use correct expiry
	// Actually already moved inside the if blocks above to use local expiryMinutes

	return user.OTPExpiresAt, nil
}

func (s *authService) VerifyOTP(email, otp string) (*LoginResponse, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	user, err := s.repo.FindByEmail(email)
	if err != nil {
		return nil, errors.New("user not found")
	}


	if user.IsVerified {
		return nil, errors.New("user already verified")
	}

	if user.VerifyOTP != otp {
		return nil, errors.New("invalid OTP")
	}

	if time.Now().After(user.OTPExpiresAt) {
		return nil, errors.New("OTP expired")
	}

	user.IsVerified = true
	user.VerifyOTP = ""
	if err := s.repo.UpdateUser(user); err != nil {
		return nil, err
	}

	// Clean up any invitation for this email now that user is verified
	config.DB.Where("email = ?", email).Delete(&models.FamilyInvitation{})

	// Also Log them in immediately after verification
	return s.loginWithoutPassword(user)
}

// Internal version of Login without password check for VerifyOTP
func (s *authService) loginWithoutPassword(user *models.User) (*LoginResponse, error) {
	// Block access if user is blocked
	if user.IsBlocked {
		return nil, errors.New("akun Anda telah diblokir oleh administrator")
	}

	// Fetch family info
	var familyName string
	var familyRole string
	var familyID uuid.UUID = uuid.Nil
	var familyMember models.FamilyMember
	err := config.DB.Where("user_id = ?", user.ID).First(&familyMember).Error
	if err == nil {
		familyID = familyMember.FamilyID
		familyRole = familyMember.Role
		family, errFam := s.repo.FindFamilyByID(familyID)
		if errFam == nil && family != nil {
			// CRITICAL: Prevent access if the family is deactivated by admin
			if family.IsBlocked {
				return nil, errors.New("layanan untuk keluarga Anda telah dinonaktifkan oleh administrator")
			}
			familyName = family.Name
		}
	} else {
		familyID = uuid.Nil
	}

	// Set expiration (always remember after verify for best UX)
	expiry := time.Hour * 24 * 30

	// Generate JWT
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":   user.ID.String(),
		"role":      user.Role,
		"family_id": familyID.String(),
		"family_role": familyRole,
		"exp":       time.Now().Add(expiry).Unix(),
	})

	tokenString, err := token.SignedString([]byte(config.AppConfig.JWTSecret))
	if err != nil {
		return nil, err
	}

	return &LoginResponse{
		Token:      tokenString,
		User:       user,
		FamilyName: familyName,
	}, nil
}

func (s *authService) Login(email, password string, rememberMe bool) (*LoginResponse, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	user, err := s.repo.FindByEmail(email)
	if err != nil {
		return nil, errors.New("user_not_found")
	}

	if !user.IsVerified {
		return nil, errors.New("account not verified")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, errors.New("incorrect_password")
	}

	// Block access if user is blocked
	if user.IsBlocked {
		return nil, errors.New("akun Anda telah diblokir oleh administrator")
	}

	// Fetch family info
	var familyName string
	var familyRole string
	var familyID uuid.UUID = uuid.Nil
	var familyMember models.FamilyMember
	err = config.DB.Where("user_id = ?", user.ID).First(&familyMember).Error
	if err == nil {
		familyID = familyMember.FamilyID
		familyRole = familyMember.Role
		family, errFam := s.repo.FindFamilyByID(familyID)
		if errFam == nil && family != nil {
			// CRITICAL: Prevent access if the family is deactivated by admin
			if family.IsBlocked {
				return nil, errors.New("layanan untuk keluarga Anda telah dinonaktifkan oleh administrator")
			}
			familyName = family.Name
		}
	} else {
		familyID = uuid.Nil
	}

	// Set expiration
	expiry := time.Hour * 24
	if rememberMe {
		expiry = time.Hour * 24 * 30
	}

	// Generate JWT
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":     user.ID.String(),
		"role":        user.Role,
		"family_id":   familyID.String(),
		"family_role": familyRole,
		"exp":         time.Now().Add(expiry).Unix(),
	})

	tokenString, err := token.SignedString([]byte(config.AppConfig.JWTSecret))
	if err != nil {
		return nil, err
	}

	return &LoginResponse{
		Token:      tokenString,
		User:       user,
		FamilyName: familyName,
	}, nil
}

func (s *authService) ForgotPassword(email string) error {
	email = strings.ToLower(strings.TrimSpace(email))
	user, err := s.repo.FindByEmail(email)
	if err != nil {
		return nil // Don't reveal if user exists
	}

	token := uuid.New().String()
	user.ResetToken = token
	user.ResetExpires = time.Now().Add(1 * time.Hour)

	if err := s.repo.UpdateUser(user); err != nil {
		return err
	}

	go s.mail.SendResetToken(email, token)
	return nil
}

func (s *authService) ResetPassword(token, newPassword string) error {
	user, err := s.repo.FindByResetToken(token)
	if err != nil {
		return errors.New("invalid or expired token")
	}

	if time.Now().After(user.ResetExpires) {
		return errors.New("token expired")
	}

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	user.PasswordHash = string(hashedPassword)
	user.ResetToken = ""

	return s.repo.UpdateUser(user)
}
func (s *authService) GetInvitationDetails(id uuid.UUID) (*models.FamilyInvitation, string, *models.User, error) {
	var invitation models.FamilyInvitation
	if err := config.DB.First(&invitation, "id = ?", id).Error; err != nil {
		return nil, "", nil, errors.New("invitation not found")
	}

	var family models.Family
	if err := config.DB.First(&family, "id = ?", invitation.FamilyID).Error; err != nil {
		return nil, "", nil, errors.New("family not found")
	}

	var user models.User
	config.DB.First(&user, "email = ?", invitation.Email)

	return &invitation, family.Name, &user, nil
}

func (s *authService) UpdateProfile(userID uuid.UUID, fullName, phoneNumber string) (*models.User, error) {
	user, err := s.repo.FindByID(userID)
	if err != nil {
		return nil, err
	}

	if fullName != "" {
		user.FullName = fullName
	}
	if phoneNumber != "" {
		user.PhoneNumber = phoneNumber
	}

	if err := s.repo.UpdateUser(user); err != nil {
		return nil, err
	}

	return user, nil
}

func (s *authService) UpdatePassword(userID uuid.UUID, currentPassword, newPassword string) error {
	user, err := s.repo.FindByID(userID)
	if err != nil {
		return err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(currentPassword)); err != nil {
		return errors.New("password saat ini tidak valid")
	}

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	user.PasswordHash = string(hashedPassword)

	return s.repo.UpdateUser(user)
}

func (s *authService) RequestPasswordResetOTP(email string) error {
	email = strings.ToLower(strings.TrimSpace(email))
	user, err := s.repo.FindByEmail(email)
	if err != nil {
		return nil // Don't reveal
	}

	otp := fmt.Sprintf("%06d", (time.Now().UnixNano()/1e6)%1000000)
	user.VerifyOTP = otp
	
	// Fetch expiry from settings
	expiryMinutes := 15
	var expSetting string
	config.DB.Table("system_settings").Select("value").Where("key = ?", "otp_expiry_duration").Scan(&expSetting)
	if expSetting != "" {
		fmt.Sscanf(expSetting, "%d", &expiryMinutes)
	}
	user.OTPExpiresAt = time.Now().Add(time.Duration(expiryMinutes) * time.Minute)

	if err := s.repo.UpdateUser(user); err != nil {
		return err
	}

	// Send OTP via Email and WhatsApp
	go s.mail.SendOTP(email, otp, expiryMinutes)
	if user.PhoneNumber != "" {
		go s.mail.SendWhatsAppOTP(user.PhoneNumber, otp, expiryMinutes)
	}

	return nil
}

func (s *authService) ResetPasswordWithOTP(email, otp, newPassword string) error {
	email = strings.ToLower(strings.TrimSpace(email))
	user, err := s.repo.FindByEmail(email)
	if err != nil {
		return errors.New("user tidak ditemukan")
	}

	if user.VerifyOTP != otp {
		return errors.New("kode OTP tidak valid")
	}

	if time.Now().After(user.OTPExpiresAt) {
		return errors.New("kode OTP sudah kadaluarsa")
	}

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	user.PasswordHash = string(hashedPassword)
	user.VerifyOTP = ""

	return s.repo.UpdateUser(user)
}

func (s *authService) ResendOTP(email string) (time.Time, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	user, err := s.repo.FindByEmail(email)
	if err != nil {
		return time.Time{}, errors.New("user tidak ditemukan")
	}

	if user.IsVerified {
		return time.Time{}, errors.New("akun sudah terverifikasi")
	}

	// Fetch resend cooldown from settings
	resendSeconds := 60
	var resSetting string
	config.DB.Table("system_settings").Select("value").Where("key = ?", "resend_otp_duration").Scan(&resSetting)
	if resSetting != "" {
		fmt.Sscanf(resSetting, "%d", &resendSeconds)
	}

	// Check cooldown (using CreatedAt or a separate field? 
	// Let's use UpdatedAt as a proxy for 'Last Sent')
	if time.Since(user.UpdatedAt) < time.Duration(resendSeconds)*time.Second {
		remaining := time.Duration(resendSeconds)*time.Second - time.Since(user.UpdatedAt)
		return time.Time{}, fmt.Errorf("tunggu %d detik lagi sebelum kirim ulang", int(remaining.Seconds()))
	}

	// Generate new OTP
	otp := fmt.Sprintf("%06d", (time.Now().UnixNano()/1e6)%1000000)
	user.VerifyOTP = otp
	
	// Fetch expiry from settings
	expiryMinutes := 15
	var expSetting string
	config.DB.Table("system_settings").Select("value").Where("key = ?", "otp_expiry_duration").Scan(&expSetting)
	if expSetting != "" {
		fmt.Sscanf(expSetting, "%d", &expiryMinutes)
	}
	user.OTPExpiresAt = time.Now().Add(time.Duration(expiryMinutes) * time.Minute)

	if err := s.repo.UpdateUser(user); err != nil {
		return time.Time{}, err
	}

	// Send OTP via Email and WhatsApp
	go func() {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("Recovered from panic in SendOTP: %v", r)
			}
		}()
		s.mail.SendOTP(email, otp, expiryMinutes)
	}()

	if user.PhoneNumber != "" {
		go func() {
			defer func() {
				if r := recover(); r != nil {
					log.Printf("Recovered from panic in SendWhatsAppOTP: %v", r)
				}
			}()
			s.mail.SendWhatsAppOTP(user.PhoneNumber, otp, expiryMinutes)
		}()
	}

	return user.OTPExpiresAt, nil
}
func (s *authService) GetProfile(userID uuid.UUID) (*models.User, error) {
	return s.repo.FindByID(userID)
}
