package services

import (
	"errors"
	"fmt"
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"
	"keuangan-keluarga/internal/repositories"
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
	Register(email, password, fullName, familyName string) error
	VerifyOTP(email, otp string) error
	Login(email, password string, rememberMe bool) (*LoginResponse, error)
	ForgotPassword(email string) error
	ResetPassword(token, newPassword string) error
}

type authService struct {
	repo repositories.AuthRepository
	mail MailService
}

func NewAuthService(repo repositories.AuthRepository, mail MailService) AuthService {
	return &authService{repo: repo, mail: mail}
}

func (s *authService) Register(email, password, fullName, familyName string) error {
	// 1. Check if user already exists
	existingUser, _ := s.repo.FindByEmail(email)
	if existingUser.ID != uuid.Nil {
		return errors.New("email already registered")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	// 2. Generate OTP
	otp := fmt.Sprintf("%06d", (time.Now().UnixNano()/1e6)%1000000)

	tx := config.DB.Begin()

	user := &models.User{
		Email:        email,
		PasswordHash: string(hashedPassword),
		FullName:     fullName,
		Role:         "family_admin",
		IsVerified:   false,
		VerifyOTP:    otp,
		OTPExpiresAt: time.Now().Add(15 * time.Minute),
	}

	if err := tx.Create(user).Error; err != nil {
		tx.Rollback()
		return err
	}

	// Create Family
	family := &models.Family{
		Name: familyName,
	}
	if err := tx.Create(family).Error; err != nil {
		tx.Rollback()
		return err
	}

	// Create Membership
	member := &models.FamilyMember{
		UserID:   user.ID,
		FamilyID: family.ID,
		Role:     "admin",
	}
	if err := tx.Create(member).Error; err != nil {
		tx.Rollback()
		return err
	}

	if err := tx.Commit().Error; err != nil {
		return err
	}

	// 3. Send OTP
	go s.mail.SendOTP(email, otp)

	return nil
}

func (s *authService) VerifyOTP(email, otp string) error {
	user, err := s.repo.FindByEmail(email)
	if err != nil {
		return errors.New("user not found")
	}

	if user.IsVerified {
		return errors.New("user already verified")
	}

	if user.VerifyOTP != otp {
		return errors.New("invalid OTP")
	}

	if time.Now().After(user.OTPExpiresAt) {
		return errors.New("OTP expired")
	}

	user.IsVerified = true
	user.VerifyOTP = ""
	return s.repo.UpdateUser(user)
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
	familyID, _ := s.repo.FindFamilyByUserID(user.ID)
	family, _ := s.repo.FindFamilyByID(familyID)

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
		FamilyName: family.Name,
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
