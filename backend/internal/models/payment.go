package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PaymentTransaction struct {
	ID            uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	Reference     string    `gorm:"index;unique" json:"reference"`   // TriPay Reference
	MerchantRef   string    `gorm:"index;unique" json:"merchant_ref"` // Our Local Reference
	FamilyID      uuid.UUID `gorm:"type:uuid;not null" json:"family_id"`
	PlanID        uuid.UUID `gorm:"type:uuid" json:"plan_id"`
	PlanName      string    `json:"plan_name"`
	Amount        float64   `json:"amount"`
	Fee           float64   `json:"fee"`
	TotalAmount   float64   `json:"total_amount"`
	Status        string    `gorm:"default:'UNPAID'" json:"status"` // UNPAID, PAID, EXPIRED, FAILED
	PaymentMethod string    `json:"payment_method"`
	PaymentName   string    `json:"payment_name"`
	PayCode       string    `json:"pay_code"`
	QRCodeURL     string    `json:"qr_code_url"`
	CheckoutURL   string    `json:"checkout_url"`
	Instructions  string    `gorm:"type:text" json:"instructions"` // JSON string of instructions
	ExpiredAt     time.Time `json:"expired_at"`
	PaidAt        *time.Time `json:"paid_at"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`

	Family Family `gorm:"foreignKey:FamilyID" json:"-"`
}

func (p *PaymentTransaction) BeforeCreate(tx *gorm.DB) (err error) {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return
}
