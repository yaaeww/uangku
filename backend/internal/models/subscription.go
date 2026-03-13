package models

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SubscriptionPlan struct {
	ID           uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	Name         string    `gorm:"not null" json:"name"`
	Price        float64   `gorm:"not null" json:"price"`
	MaxMembers   int       `gorm:"not null;default:5" json:"max_members"`
	DurationDays int       `gorm:"not null;default:30" json:"duration_days"`
	Description  string    `json:"description"`
	Features     string    `gorm:"type:text" json:"features"` // Use semicolon separated or JSON string
}

func (s *SubscriptionPlan) BeforeCreate(tx *gorm.DB) (err error) {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return
}

func (SubscriptionPlan) TableName() string {
	return "sub_plans"
}
