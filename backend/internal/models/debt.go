package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Debt struct {
	ID              uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	FamilyID        uuid.UUID `gorm:"type:uuid;not null;index" json:"family_id"`
	Name            string    `gorm:"not null" json:"name"`
	TotalAmount     float64   `gorm:"type:decimal(12,2);not null" json:"total_amount"`
	RemainingAmount float64   `gorm:"type:decimal(12,2);not null" json:"remaining_amount"`
	DueDate         time.Time `json:"due_date"`
	CreatedAt       time.Time `json:"created_at"`
}

type DebtPayment struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	DebtID      uuid.UUID `gorm:"type:uuid;not null;index" json:"debt_id"`
	Amount      float64   `gorm:"type:decimal(12,2);not null" json:"amount"`
	Date        time.Time `gorm:"type:date;not null" json:"date"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
}

func (d *Debt) BeforeCreate(tx *gorm.DB) (err error) {
	if d.ID == uuid.Nil {
		d.ID = uuid.New()
	}
	return
}

func (dp *DebtPayment) BeforeCreate(tx *gorm.DB) (err error) {
	if dp.ID == uuid.Nil {
		dp.ID = uuid.New()
	}
	return
}
