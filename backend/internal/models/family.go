package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Family struct {
	ID                 uuid.UUID  `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	Name               string     `gorm:"not null" json:"name"`
	ApplicationID      *uuid.UUID `gorm:"type:uuid" json:"application_id"`
	SubscriptionPlan   string     `gorm:"default:'basic'" json:"subscription_plan"` // basic, family, premium
	Status             string     `gorm:"default:'trial'" json:"status"`            // trial, active, expired
	TrialEndsAt        time.Time  `json:"trial_ends_at"`
	SubscriptionEndsAt time.Time  `json:"subscription_ends_at"`
	CreatedAt          time.Time  `json:"created_at"`
}

type FamilyMember struct {
	ID       uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	FamilyID uuid.UUID `gorm:"type:uuid;not null;index:idx_family_user,unique" json:"family_id"`
	UserID   uuid.UUID `gorm:"type:uuid;not null;index:idx_family_user,unique" json:"user_id"`
	Role     string    `gorm:"not null" json:"role"` // admin, member
	JoinedAt time.Time `json:"joined_at"`
}

func (f *Family) BeforeCreate(tx *gorm.DB) (err error) {
	if f.ID == uuid.Nil {
		f.ID = uuid.New()
	}
	return
}
