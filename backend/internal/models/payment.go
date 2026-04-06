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
	Fee           float64   `json:"fee"`            // Total Fee
	FeeMerchant   float64   `json:"fee_merchant"`   // Fee borne by us
	FeeCustomer   float64   `json:"fee_customer"`   // Fee borne by buyer
	TotalAmount   float64   `json:"total_amount"`
	Status        string    `gorm:"default:'UNPAID'" json:"status"` // UNPAID, PAID, EXPIRED, FAILED
	PaymentMethod string    `json:"payment_method"`
	PaymentName   string    `json:"payment_name"`
	PayCode       string    `json:"pay_code"`
	QRCodeURL     string    `json:"qr_code_url"`
	AccountName   string    `json:"account_name"`
	AccountNumber string    `json:"account_number"`
	CheckoutURL   string    `json:"checkout_url"`
	Instructions  string    `gorm:"type:text" json:"instructions"` // JSON string of instructions
	ProofURL      string    `json:"proof_url"`     // User uploaded transfer proof
	AdminNotes    string    `json:"admin_notes"`    // Reason for rejection etc.
	ExpiredAt     time.Time `json:"expired_at"`
	PaidAt        *time.Time `json:"paid_at"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`

	Family Family `gorm:"foreignKey:FamilyID" json:"family"`
}

func (p *PaymentTransaction) BeforeCreate(tx *gorm.DB) (err error) {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return
}

type PaymentChannel struct {
	ID                uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	Code              string    `gorm:"uniqueIndex;not null" json:"code"`
	Name              string    `json:"name"`
	Group             string    `json:"group"`
	Type              string    `json:"type"` // direct, checkout
	FeeFlat           float64   `json:"fee_flat"`
	FeePercent        float64   `json:"fee_percent"`
	IsActive          bool      `gorm:"default:true" json:"is_active"`
	FeeBorneBy        string    `gorm:"default:'customer'" json:"fee_borne_by"` // merchant, customer
	CustomFeeMerchant float64   `gorm:"default:0" json:"custom_fee_merchant"`   // platform admin fee
	IconURL           string    `json:"icon_url"`
	
	// Manual Payment Fields
	IsManual          bool      `gorm:"default:false" json:"is_manual"`
	AccountName       string    `json:"account_name"`
	AccountNumber     string    `json:"account_number"`
	Description       string    `gorm:"type:text" json:"description"`
	
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

func (c *PaymentChannel) BeforeCreate(tx *gorm.DB) (err error) {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return
}
