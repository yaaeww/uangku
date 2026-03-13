package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID           uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	Email        string    `gorm:"uniqueIndex;not null" json:"email"`
	PhoneNumber  string    `gorm:"uniqueIndex" json:"phone_number"` // Added for WhatsApp OTP
	PasswordHash string    `gorm:"not null" json:"-"`
	FullName     string    `gorm:"not null" json:"full_name"`
	Role         string    `gorm:"not null" json:"role"` // super_admin, family_admin, family_member
	IsVerified   bool      `gorm:"default:false" json:"is_verified"`
	VerifyOTP    string    `json:"-"`
	OTPExpiresAt time.Time `json:"-"`
	ResetToken   string    `gorm:"index" json:"-"`
	ResetExpires time.Time `json:"-"`
	IsBlocked    bool      `gorm:"default:false" json:"is_blocked"`
	CreatedAt    time.Time `json:"created_at"`

	FamilyMember *FamilyMember `gorm:"foreignKey:UserID" json:"family_member"`
}

func (u *User) BeforeCreate(tx *gorm.DB) (err error) {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return
}
