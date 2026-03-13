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
)

type LoginResponse struct {
	Token      string       `json:"token"`
	User       *models.User `json:"user"`
	FamilyName string       `json:"family_name"`
}

type AuthService interface {
	Register(email, phoneNumber, password, fullName, familyName string, invitationID uuid.UUID) error
	VerifyOTP(email, otp string) (*LoginResponse, error)
	Login(email, password string, rememberMe bool) (*LoginResponse, error)
	ForgotPassword(email string) error
	ResetPassword(token, newPassword string) error
	GetInvitationDetails(id uuid.UUID) (*models.FamilyInvitation, string, error)
	UpdateProfile(userID uuid.UUID, fullName, phoneNumber string) error
	UpdatePassword(userID uuid.UUID, currentPassword, newPassword string) error
	RequestPasswordResetOTP(email string) error
	ResetPasswordWithOTP(email, otp, newPassword string) error
}

type authService struct {
	repo repositories.AuthRepository
	mail MailService
	budget *BudgetService
}

func NewAuthService(repo repositories.AuthRepository, mail MailService, budget *BudgetService) AuthService {
	return &authService{repo: repo, mail: mail, budget: budget}
}

func (s *authService) Register(email, phoneNumber, password, fullName, familyName string, invitationID uuid.UUID) error {
	// 1. Check if user already exists by Email or Phone
	var existingUserByEmail models.User
	var existingUserByPhone models.User
	
	config.DB.First(&existingUserByEmail, "email = ?", email)
	config.DB.First(&existingUserByPhone, "phone_number = ?", phoneNumber)
	
	// If any VERIFIED user exists with either, it's a hard conflict
	if (existingUserByEmail.ID != uuid.Nil && existingUserByEmail.IsVerified) {
		return errors.New("email sudah terdaftar. Silakan gunakan email lain atau login.")
	}
	if (existingUserByPhone.ID != uuid.Nil && existingUserByPhone.IsVerified) {
		return errors.New("nomor WhatsApp sudah terdaftar. Silakan gunakan nomor lain atau login.")
	}

	tx := config.DB.Begin()

	// If an UNVERIFIED user exists with this PHONE but a DIFFERENT EMAIL, purge it
	if existingUserByPhone.ID != uuid.Nil && !existingUserByPhone.IsVerified && existingUserByPhone.Email != email {
		log.Printf("[INFO] Purging stale unverified user with phone %s (Email: %s)", phoneNumber, existingUserByPhone.Email)
		if err := tx.Unscoped().Delete(&models.User{}, "id = ?", existingUserByPhone.ID).Error; err != nil {
			tx.Rollback()
			return err
		}
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		tx.Rollback()
		return err
	}

	// 2. Generate OTP
	otp := fmt.Sprintf("%06d", (time.Now().UnixNano()/1e6)%1000000)

	// Check for invitation
	var invitation *models.FamilyInvitation
	if invitationID != uuid.Nil {
		if err := tx.First(&invitation, "id = ?", invitationID).Error; err != nil {
			tx.Rollback()
			return errors.New("link undangan tidak valid atau sudah kadaluarsa.")
		}
	} else {
		// Try to find invitation by email in tx
		tx.First(&invitation, "email = ?", email)
	}

	// Validate Family Name if no invitation
	if (invitation == nil || invitation.ID == uuid.Nil) && familyName == "" {
		tx.Rollback()
		return errors.New("nama keluarga wajib diisi jika mendaftar tanpa undangan")
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
		user.OTPExpiresAt = time.Now().Add(15 * time.Minute)
		
		if err := tx.Save(user).Error; err != nil {
			tx.Rollback()
			return err
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
			OTPExpiresAt: time.Now().Add(15 * time.Minute),
		}

		if err := tx.Create(user).Error; err != nil {
			tx.Rollback()
			return err
		}
	}

	if invitation != nil && invitation.ID != uuid.Nil {
		// Join existing family
		var existingMember models.FamilyMember
		if err := tx.First(&existingMember, "user_id = ? AND family_id = ?", user.ID, invitation.FamilyID).Error; err != nil {
			member := &models.FamilyMember{
				UserID:   user.ID,
				FamilyID: invitation.FamilyID,
				Role:     invitation.Role,
			}
			if err := tx.Create(member).Error; err != nil {
				tx.Rollback()
				return err
			}
		}
		
		// Delete invitation
		if err := tx.Delete(invitation).Error; err != nil {
			tx.Rollback()
			return err
		}
	} else if existingUserByEmail.ID == uuid.Nil {
		// Create New Family ONLY if it's a completely new user
		family := &models.Family{
			Name: familyName,
		}
		if err := tx.Create(family).Error; err != nil {
			tx.Rollback()
			return err
		}

		// Seed default budget categories and items
		if err := s.budget.SeedDefaultBudget(family.ID); err != nil {
			tx.Rollback()
			return err
		}

		member := &models.FamilyMember{
			UserID:   user.ID,
			FamilyID: family.ID,
			Role:     "head_of_family",
		}
		if err := tx.Create(member).Error; err != nil {
			tx.Rollback()
			return err
		}
	}

	if err := tx.Commit().Error; err != nil {
		return err
	}

	// 3. Send OTP via both Email and WhatsApp (Async with recovery)
	go func() {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("Recovered from panic in SendOTP: %v", r)
			}
		}()
		s.mail.SendOTP(email, otp)
	}()

	if phoneNumber != "" {
		go func() {
			defer func() {
				if r := recover(); r != nil {
					log.Printf("Recovered from panic in SendWhatsAppOTP: %v", r)
				}
			}()
			s.mail.SendWhatsAppOTP(phoneNumber, otp)
		}()
	}

	return nil
}

func (s *authService) VerifyOTP(email, otp string) (*LoginResponse, error) {
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

	// Also Log them in immediately after verification
	return s.loginWithoutPassword(user)
}

// Internal version of Login without password check for VerifyOTP
func (s *authService) loginWithoutPassword(user *models.User) (*LoginResponse, error) {
	// Fetch family info
	var familyName string
	familyID, err := s.repo.FindFamilyByUserID(user.ID)
	if err == nil && familyID != uuid.Nil {
		family, errFam := s.repo.FindFamilyByID(familyID)
		if errFam == nil && family != nil {
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
	user, err := s.repo.FindByEmail(email)
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	if !user.IsVerified {
		return nil, errors.New("account not verified")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, errors.New("invalid credentials")
	}

	// Fetch family info
	var familyName string
	familyID, err := s.repo.FindFamilyByUserID(user.ID)
	if err == nil && familyID != uuid.Nil {
		family, errFam := s.repo.FindFamilyByID(familyID)
		if errFam == nil && family != nil {
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
		"user_id":   user.ID.String(),
		"role":      user.Role,
		"family_id": familyID.String(),
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

func (s *authService) ForgotPassword(email string) error {
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
func (s *authService) GetInvitationDetails(id uuid.UUID) (*models.FamilyInvitation, string, error) {
	var invitation models.FamilyInvitation
	if err := config.DB.First(&invitation, "id = ?", id).Error; err != nil {
		return nil, "", errors.New("invitation not found")
	}

	var family models.Family
	if err := config.DB.First(&family, "id = ?", invitation.FamilyID).Error; err != nil {
		return nil, "", errors.New("family not found")
	}

	return &invitation, family.Name, nil
}

func (s *authService) UpdateProfile(userID uuid.UUID, fullName, phoneNumber string) error {
	user, err := s.repo.FindByID(userID)
	if err != nil {
		return err
	}

	user.FullName = fullName
	user.PhoneNumber = phoneNumber

	return s.repo.UpdateUser(user)
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
	user, err := s.repo.FindByEmail(email)
	if err != nil {
		return nil // Don't reveal
	}

	otp := fmt.Sprintf("%06d", (time.Now().UnixNano()/1e6)%1000000)
	user.VerifyOTP = otp
	user.OTPExpiresAt = time.Now().Add(15 * time.Minute)

	if err := s.repo.UpdateUser(user); err != nil {
		return err
	}

	// Send OTP via Email and WhatsApp
	go s.mail.SendOTP(email, otp)
	if user.PhoneNumber != "" {
		go s.mail.SendWhatsAppOTP(user.PhoneNumber, otp)
	}

	return nil
}

func (s *authService) ResetPasswordWithOTP(email, otp, newPassword string) error {
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
