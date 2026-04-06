package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type BudgetPlan struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	FamilyID  uuid.UUID `gorm:"type:uuid;not null;index:idx_budget_family_user_date" json:"family_id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index:idx_budget_family_user_date" json:"user_id"`
	Year      int       `gorm:"not null;index:idx_budget_family_user_date" json:"year"`
	Month     int       `gorm:"not null;index:idx_budget_family_user_date" json:"month"`
	Amount    float64   `gorm:"type:decimal(12,2);not null" json:"amount"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (bp *BudgetPlan) BeforeCreate(tx *gorm.DB) (err error) {
	if bp.ID == uuid.Nil {
		bp.ID = uuid.New()
	}
	return
}
