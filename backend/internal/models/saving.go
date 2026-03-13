package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Saving struct {
	ID             uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	FamilyID       uuid.UUID `gorm:"type:uuid;not null;index" json:"family_id"`
	Name           string    `gorm:"not null" json:"name"`
	Category       string    `gorm:"type:varchar(255);default:'savings'" json:"category"` // needs, wants, savings, emergency
	TargetAmount   float64   `gorm:"type:decimal(12,2);not null" json:"target_amount"`
	CurrentBalance float64   `gorm:"type:decimal(12,2);default:0" json:"current_balance"`
	Emoji          string    `gorm:"type:varchar(50)" json:"emoji"`
	DueDate        int       `gorm:"type:int;default:0" json:"due_date"`
	CreatedAt      time.Time `json:"created_at"`
}

func (s *Saving) BeforeCreate(tx *gorm.DB) (err error) {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	if s.Category == "" {
		s.Category = "savings"
	}
	return
}
