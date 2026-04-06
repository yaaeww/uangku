package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// PlatformBudgetTransfer represents a temporary shift of target budget from one category to another within a specific period.
type PlatformBudgetTransfer struct {
	ID           uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	FromCategory string    `gorm:"not null;index" json:"from_category"`
	ToCategory   string    `gorm:"not null;index" json:"to_category"`
	Amount       float64   `gorm:"not null" json:"amount"`
	Type         string    `gorm:"not null;default:'TAKEN'" json:"type"` // TAKEN or RETURN
	Reason       string    `json:"reason"`
	TransferDate time.Time `gorm:"not null;index" json:"transfer_date"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (t *PlatformBudgetTransfer) BeforeCreate(tx *gorm.DB) (err error) {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	if t.TransferDate.IsZero() {
		t.TransferDate = time.Now()
	}
	return
}
