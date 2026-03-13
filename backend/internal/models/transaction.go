package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Transaction struct {
	ID          uuid.UUID  `gorm:"type:uuid;primary_key" json:"id"`
	FamilyID    uuid.UUID  `gorm:"type:uuid;not null;primary_key;index:idx_tx_family_date" json:"family_id"`
	UserID      uuid.UUID  `gorm:"type:uuid;not null;index:idx_tx_family_user" json:"user_id"`
	WalletID    uuid.UUID  `gorm:"type:uuid;not null;index" json:"wallet_id"`
	ToWalletID  *uuid.UUID `gorm:"type:uuid;index" json:"to_wallet_id,omitempty"` // For internal transfers
	SavingID    *uuid.UUID `gorm:"type:uuid;index" json:"saving_id,omitempty"`    // Link to Savings/Goals
	Type        string     `gorm:"not null" json:"type"`                          // income, expense, transfer, saving
	Amount      float64    `gorm:"type:decimal(12,2);not null" json:"amount"`
	Fee         float64    `gorm:"type:decimal(12,2);default:0" json:"fee"`
	Category    string     `json:"category"`
	Date        time.Time  `gorm:"not null;primary_key;index:idx_tx_family_date" json:"date"`
	Description string     `json:"description"`
	CreatedAt   time.Time  `json:"created_at"`
}

// TableName overrides the table name to ensure it's correct for partitioning logic
func (Transaction) TableName() string {
	return "transactions"
}

func (tx *Transaction) BeforeCreate(db *gorm.DB) (err error) {
	if tx.ID == uuid.Nil {
		tx.ID = uuid.New()
	}
	if tx.CreatedAt.IsZero() {
		tx.CreatedAt = time.Now()
	}
	if tx.Date.IsZero() {
		tx.Date = time.Now()
	}
	return
}
