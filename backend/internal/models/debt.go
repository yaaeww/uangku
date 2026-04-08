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
	RemainingAmount          float64   `gorm:"type:decimal(12,2);not null" json:"remaining_amount"`
	DueDate                  time.Time `json:"due_date"`
	InstallmentIntervalMonths int       `gorm:"default:0" json:"installment_interval_months"`
	InstallmentAmount        float64   `gorm:"type:decimal(12,2);default:0" json:"installment_amount"`
	PenaltyAmount            float64   `gorm:"type:decimal(12,2);default:0" json:"penalty_amount"`
	NextInstallmentDueDate   time.Time `json:"next_installment_due_date"`
	LastPenaltyAppliedAt     time.Time `json:"last_penalty_applied_at"`
	LastReminderSentAt       time.Time `json:"last_reminder_sent_at"`
	Status                   string    `gorm:"type:varchar(20);not null;default:'active'" json:"status"`
	StartDate                time.Time `json:"start_date"`
	PaymentDay               int       `gorm:"default:0" json:"payment_day"`
	CreatedBy                uuid.UUID `gorm:"type:uuid" json:"created_by"`
	CurrentCyclePaid        float64   `gorm:"type:decimal(12,2);not null;default:0" json:"current_cycle_paid"`
	PaidThisMonth            float64   `gorm:"-" json:"paid_this_month"`
	CreatedAt                time.Time `json:"created_at"`
	Penalties                []DebtPenalty `gorm:"foreignKey:DebtID" json:"penalties,omitempty"`
}

type DebtPenalty struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	DebtID      uuid.UUID `gorm:"type:uuid;not null;index" json:"debt_id"`
	Amount      float64   `gorm:"type:decimal(12,2);not null" json:"amount"`
	Date        time.Time `gorm:"type:date;not null" json:"date"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
}

type DebtPayment struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	DebtID      uuid.UUID `gorm:"type:uuid;not null;index" json:"debt_id"`
	WalletID    uuid.UUID `gorm:"type:uuid;not null" json:"wallet_id"`
	UserID      uuid.UUID `gorm:"type:uuid" json:"user_id"`
	User        *User     `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Amount      float64   `gorm:"type:decimal(12,2);not null" json:"amount"`
	Date        time.Time `gorm:"type:date;not null" json:"date"`
	Description string    `json:"description"`
	IsLate      bool      `gorm:"default:false" json:"is_late"`
	TransactionID *uuid.UUID `gorm:"type:uuid;index" json:"transaction_id,omitempty"`
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

func (dp *DebtPenalty) BeforeCreate(tx *gorm.DB) (err error) {
	if dp.ID == uuid.Nil {
		dp.ID = uuid.New()
	}
	return
}
