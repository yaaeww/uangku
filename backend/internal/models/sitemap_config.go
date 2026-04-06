package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SitemapConfig struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Path       string    `gorm:"uniqueIndex;not null" json:"path"`
	IsPrivate  bool      `gorm:"default:false" json:"is_private"`
	AllowBots  bool      `gorm:"default:true" json:"allow_bots"`
	Priority   float64   `gorm:"default:0.5" json:"priority"`
	ChangeFreq string    `gorm:"default:weekly" json:"change_freq"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

func (s *SitemapConfig) BeforeCreate(tx *gorm.DB) (err error) {
	s.ID = uuid.New()
	return
}
