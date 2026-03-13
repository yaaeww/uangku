package repositories

import (
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"

	"github.com/google/uuid"
)

type AuthRepository interface {
	CreateUser(user *models.User) error
	FindByEmail(email string) (*models.User, error)
	FindByID(id uuid.UUID) (*models.User, error)
	FindFamilyByUserID(userID uuid.UUID) (uuid.UUID, error)
	FindByResetToken(token string) (*models.User, error)
	FindFamilyByID(id uuid.UUID) (*models.Family, error)
	UpdateUser(user *models.User) error
	CreateFamily(family *models.Family) error
	CreateMember(member *models.FamilyMember) error
	FindInvitationByEmail(email string) (*models.FamilyInvitation, error)
	DeleteInvitation(id uuid.UUID) error
}

type authRepository struct{}

func NewAuthRepository() AuthRepository {
	return &authRepository{}
}

func (r *authRepository) CreateUser(user *models.User) error {
	return config.DB.Create(user).Error
}

func (r *authRepository) FindByEmail(email string) (*models.User, error) {
	var user models.User
	err := config.DB.Where("email = ?", email).First(&user).Error
	return &user, err
}

func (r *authRepository) FindByID(id uuid.UUID) (*models.User, error) {
	var user models.User
	err := config.DB.Where("id = ?", id).First(&user).Error
	return &user, err
}

func (r *authRepository) FindFamilyByUserID(userID uuid.UUID) (uuid.UUID, error) {
	var membership models.FamilyMember
	err := config.DB.Where("user_id = ?", userID).First(&membership).Error
	if err != nil {
		return uuid.Nil, err
	}
	return membership.FamilyID, nil
}

func (r *authRepository) FindByResetToken(token string) (*models.User, error) {
	var user models.User
	err := config.DB.Where("reset_token = ?", token).First(&user).Error
	return &user, err
}

func (r *authRepository) FindFamilyByID(id uuid.UUID) (*models.Family, error) {
	var family models.Family
	err := config.DB.Where("id = ?", id).First(&family).Error
	return &family, err
}

func (r *authRepository) UpdateUser(user *models.User) error {
	return config.DB.Save(user).Error
}

func (r *authRepository) CreateFamily(family *models.Family) error {
	return config.DB.Create(family).Error
}

func (r *authRepository) CreateMember(member *models.FamilyMember) error {
	return config.DB.Create(member).Error
}

func (r *authRepository) FindInvitationByEmail(email string) (*models.FamilyInvitation, error) {
	var invitation models.FamilyInvitation
	err := config.DB.Where("email = ?", email).First(&invitation).Error
	return &invitation, err
}

func (r *authRepository) DeleteInvitation(id uuid.UUID) error {
	return config.DB.Delete(&models.FamilyInvitation{}, "id = ?", id).Error
}
