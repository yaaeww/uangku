package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Saving struct {
	ID             uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	FamilyID       uuid.UUID `gorm:"type:uuid;not null;index" json:"family_id"`
	UserID         uuid.UUID `gorm:"type:uuid;index" json:"user_id"`
	User           *User     `gorm:"foreignKey:UserID" json:"user,omitempty"`
	TargetUserID   *uuid.UUID `gorm:"type:uuid;index" json:"target_user_id"`
	TargetUser     *User      `gorm:"foreignKey:TargetUserID" json:"target_user,omitempty"`
	Name             string    `gorm:"not null" json:"name"`
	BudgetCategoryID *uuid.UUID `gorm:"type:uuid;index" json:"budget_category_id"`
	Category         string    `gorm:"type:varchar(255);default:'savings'" json:"category"` // legacy/backup field
	TargetAmount   float64   `gorm:"type:decimal(12,2);not null" json:"target_amount"`
	CurrentBalance float64   `gorm:"type:decimal(12,2);default:0" json:"current_balance"`
	Emoji          string    `gorm:"type:varchar(50)" json:"emoji"`
	DueDate        int       `gorm:"type:int;default:0" json:"due_date"`
	Month          int       `gorm:"type:int;default:0" json:"month"`
	Year           int       `gorm:"type:int;default:0" json:"year"`
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
