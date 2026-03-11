package models

import (
	"time"

	"github.com/google/uuid"
)

type FamilyApplication struct {
	ID              uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	FamilyName      string    `gorm:"not null" json:"family_name"`
	HeadOfFamily    string    `gorm:"not null" json:"head_of_family"`
	Email           string    `gorm:"uniqueIndex;not null" json:"email"`
	NumberOfMembers int       `gorm:"not null" json:"number_of_members"`
	SelectedPlan    string    `gorm:"not null;default:'basic'" json:"selected_plan"` // basic, family, premium
	ReasonToJoin    string    `json:"reason_to_join"`
	Status          string    `gorm:"default:'pending'" json:"status"` // pending, approved, rejected
	ApplicantID     uuid.UUID `gorm:"type:uuid" json:"applicant_id"`
	CreatedAt       time.Time `json:"created_at"`
}
