package models

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Family struct {
	ID                 uuid.UUID  `gorm:"type:uuid;primary_key" json:"id"`
	Name               string     `gorm:"not null" json:"name"`
	PhotoURL           string     `json:"photo_url"`
	ApplicationID      *uuid.UUID `gorm:"type:uuid" json:"application_id"`
	SubscriptionPlan   string     `gorm:"default:'Standard'" json:"subscription_plan"` // Standard, Family, Premium
	Status             string     `gorm:"default:'trial'" json:"status"`            // trial, active, expired
	TrialEndsAt        time.Time  `json:"trial_ends_at"`
	SubscriptionEndsAt time.Time  `json:"subscription_ends_at"`
	CreatedAt          time.Time  `json:"created_at"`
	Members            []FamilyMember `gorm:"foreignKey:FamilyID" json:"members"`
}

type FamilyMember struct {
	ID       uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	FamilyID uuid.UUID `gorm:"type:uuid;not null;index:idx_family_user,unique" json:"family_id"`
	UserID   uuid.UUID `gorm:"type:uuid;not null;index:idx_family_user,unique" json:"user_id"`
	Role     string    `gorm:"not null" json:"role"` // treasurer, member, viewer
	JoinedAt time.Time `json:"joined_at"`
	User     User      `gorm:"foreignKey:UserID" json:"user"`
	Family   Family    `gorm:"foreignKey:FamilyID" json:"family"`
}

func (fm *FamilyMember) BeforeCreate(tx *gorm.DB) (err error) {
	if fm.ID == uuid.Nil {
		fm.ID = uuid.New()
	}
	if fm.JoinedAt.IsZero() {
		fm.JoinedAt = time.Now()
	}
	return
}

func (f *Family) BeforeCreate(tx *gorm.DB) (err error) {
	if f.ID == uuid.Nil {
		f.ID = uuid.New()
	}

	// Default Trial Logic
	if f.TrialEndsAt.IsZero() {
		var durationStr string
		var duration int = 7 // Default 7 days
		
		// Attempt to fetch from system_settings
		err := tx.Table("system_settings").Select("value").Where("key = ?", "trial_duration_days").Scan(&durationStr).Error
		if err == nil && durationStr != "" {
			var d int
			if _, err := fmt.Sscanf(durationStr, "%d", &d); err == nil {
				duration = d
			}
		}
		
		f.TrialEndsAt = time.Now().AddDate(0, 0, duration)
	}

	if f.Status == "" {
		f.Status = "trial"
	}

	return
}

type FamilyInvitation struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	FamilyID  uuid.UUID `gorm:"type:uuid;not null" json:"family_id"`
	Email     string    `gorm:"not null;index" json:"email"`
	Role      string    `gorm:"not null;default:'member'" json:"role"`
	InvitedBy uuid.UUID `gorm:"type:uuid;not null" json:"invited_by"`
	CreatedAt time.Time `json:"created_at"`
}

func (i *FamilyInvitation) BeforeCreate(tx *gorm.DB) (err error) {
	if i.ID == uuid.Nil {
		i.ID = uuid.New()
	}
	return
}
