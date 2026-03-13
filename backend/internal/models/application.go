package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type FamilyApplication struct {
	ID              uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	FamilyName      string    `gorm:"not null" json:"family_name"`
	HeadOfFamily    string    `gorm:"not null" json:"head_of_family"`
	Email           string    `gorm:"uniqueIndex;not null" json:"email"`
	NumberOfMembers int       `gorm:"not null" json:"number_of_members"`
	SelectedPlan    string    `gorm:"not null;default:'Standard'" json:"selected_plan"` // Standard, Family, Premium
	ReasonToJoin    string    `json:"reason_to_join"`
	Status          string    `gorm:"default:'pending'" json:"status"` // pending, approved, rejected
	ApplicantID     uuid.UUID `gorm:"type:uuid" json:"applicant_id"`
	CreatedAt       time.Time `json:"created_at"`
}

func (a *FamilyApplication) BeforeCreate(tx *gorm.DB) (err error) {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return
}
