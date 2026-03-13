package repositories

import (
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"

	"github.com/google/uuid"
)

type MemberWithUser struct {
	models.FamilyMember
	FullName string `json:"full_name"`
	Email    string `json:"email"`
}

type MemberRepository interface {
	GetMembers(familyID uuid.UUID) ([]MemberWithUser, error)
	UpdateRole(memberID uuid.UUID, familyID uuid.UUID, role string) error
	RemoveMember(memberID uuid.UUID, familyID uuid.UUID) error
	CreateInvitation(invitation *models.FamilyInvitation) error
	DeleteInvitation(id uuid.UUID) error
}

type memberRepository struct{}

func NewMemberRepository() MemberRepository {
	return &memberRepository{}
}

func (r *memberRepository) GetMembers(familyID uuid.UUID) ([]MemberWithUser, error) {
	var results []MemberWithUser
	err := config.DB.Table("family_members").
		Select("family_members.*, users.full_name, users.email").
		Joins("JOIN users ON users.id = family_members.user_id").
		Where("family_members.family_id = ? AND users.is_verified = ?", familyID, true).
		Scan(&results).Error
	return results, err
}

func (r *memberRepository) UpdateRole(memberID uuid.UUID, familyID uuid.UUID, role string) error {
	return config.DB.Model(&models.FamilyMember{}).
		Where("id = ? AND family_id = ?", memberID, familyID).
		Update("role", role).Error
}

func (r *memberRepository) RemoveMember(memberID uuid.UUID, familyID uuid.UUID) error {
	return config.DB.Delete(&models.FamilyMember{}, "id = ? AND family_id = ?", memberID, familyID).Error
}

func (r *memberRepository) CreateInvitation(invitation *models.FamilyInvitation) error {
	return config.DB.Create(invitation).Error
}

func (r *memberRepository) DeleteInvitation(id uuid.UUID) error {
	return config.DB.Delete(&models.FamilyInvitation{}, "id = ?", id).Error
}
