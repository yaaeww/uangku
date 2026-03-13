package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SystemSetting struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	Key       string    `gorm:"uniqueIndex;not null" json:"key"`
	Value     string    `gorm:"not null" json:"value"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (s *SystemSetting) BeforeCreate(tx *gorm.DB) (err error) {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return
}
