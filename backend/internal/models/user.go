package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID           uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	Email        string    `gorm:"uniqueIndex;not null" json:"email"`
	PasswordHash string    `gorm:"not null" json:"-"`
	FullName     string    `gorm:"not null" json:"full_name"`
	Role         string    `gorm:"not null" json:"role"` // super_admin, family_admin, family_member
	IsVerified   bool      `gorm:"default:false" json:"is_verified"`
	VerifyOTP    string    `json:"-"`
	OTPExpiresAt time.Time `json:"-"`
	ResetToken   string    `gorm:"index" json:"-"`
	ResetExpires time.Time `json:"-"`
	CreatedAt    time.Time `json:"created_at"`
}

func (u *User) BeforeCreate(tx *gorm.DB) (err error) {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return
}
