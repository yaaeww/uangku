package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Debt struct {
	ID              uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	FamilyID        uuid.UUID `gorm:"type:uuid;not null;index" json:"family_id"`
	Name            string    `gorm:"not null" json:"name"`
	Description     string    `json:"description"`
	TotalAmount     float64   `gorm:"type:decimal(12,2);not null" json:"total_amount"`
	PaidAmount      float64   `gorm:"type:decimal(12,2);not null;default:0" json:"paid_amount"`
	RemainingAmount float64   `gorm:"type:decimal(12,2);not null" json:"remaining_amount"`
	DueDate         time.Time `json:"due_date"`
	Status          string    `gorm:"type:varchar(20);not null;default:'active'" json:"status"`
	CreatedAt       time.Time `json:"created_at"`
}

type DebtPayment struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	DebtID      uuid.UUID `gorm:"type:uuid;not null;index" json:"debt_id"`
	WalletID    uuid.UUID `gorm:"type:uuid;not null" json:"wallet_id"`
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
