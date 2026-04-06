package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Wallet struct {
	ID            uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	FamilyID      uuid.UUID `gorm:"type:uuid;not null;index" json:"family_id"`
	UserID        uuid.UUID `gorm:"type:uuid;not null;default:'00000000-0000-0000-0000-000000000000';index" json:"user_id"`
	Name          string    `gorm:"not null" json:"name"`
	WalletType    string    `json:"wallet_type"`    // e.g., Bank, E-Wallet, etc.
	AccountNumber string    `json:"account_number"` // Optional
	Balance       float64   `gorm:"type:decimal(12,2);default:0" json:"balance"`
	CreatedAt     time.Time `json:"created_at"`
	User          User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

func (w *Wallet) BeforeCreate(tx *gorm.DB) (err error) {
	if w.ID == uuid.Nil {
		w.ID = uuid.New()
	}
	return
}
