package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Asset struct {
	ID           uuid.UUID  `gorm:"type:uuid;primary_key" json:"id"`
	FamilyID     uuid.UUID  `gorm:"type:uuid;not null;index" json:"family_id"`
	UserID       uuid.UUID  `gorm:"type:uuid;index" json:"user_id"`
	User         User       `gorm:"foreignKey:UserID" json:"user"`
	Name         string     `gorm:"not null" json:"name"`
	Type         string     `gorm:"type:varchar(50);not null" json:"type"` // 'liquid', 'fixed'
	Value        float64    `gorm:"type:decimal(15,2);not null" json:"value"`
	Description  string     `json:"description"`
	AcquiredDate time.Time  `json:"acquired_date"`
	GoalID       *uuid.UUID `gorm:"type:uuid;index" json:"goal_id"` // Optional link to Goal
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

func (a *Asset) BeforeCreate(tx *gorm.DB) (err error) {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return
}
