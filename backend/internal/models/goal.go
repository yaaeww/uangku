package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Goal struct {
	ID             uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	FamilyID       uuid.UUID `gorm:"type:uuid;not null;index" json:"family_id"`
	UserID         uuid.UUID `gorm:"type:uuid;index" json:"user_id"`
	Name           string    `gorm:"not null" json:"name"`
	TargetAmount   float64   `gorm:"type:decimal(15,2);not null" json:"target_amount"`
	CurrentBalance float64   `gorm:"type:decimal(15,2);default:0" json:"current_balance"`
	Status         string    `gorm:"type:varchar(50);default:'active'" json:"status"` // 'active', 'achieved', 'converted'
	Category       string    `json:"category"`
	Emoji          string    `gorm:"type:varchar(50)" json:"emoji"`
	Priority       string    `gorm:"type:varchar(20);default:medium" json:"priority"` // 'low', 'medium', 'high'
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

func (g *Goal) BeforeCreate(tx *gorm.DB) (err error) {
	if g.ID == uuid.Nil {
		g.ID = uuid.New()
	}
	if g.Status == "" {
		g.Status = "active"
	}
	return
}
