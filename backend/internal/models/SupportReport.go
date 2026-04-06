package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SupportReport struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	FamilyID  uuid.UUID `gorm:"type:uuid" json:"family_id"`
	Subject   string    `gorm:"type:string;not null" json:"subject"`
	Message   string    `gorm:"type:text;not null" json:"message"`
	Status    string    `gorm:"type:string;default:'OPEN'" json:"status"` // OPEN, RESOLVED
	AdminReply string   `gorm:"type:text" json:"admin_reply"`
	RepliedAt *time.Time `json:"replied_at"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	User   User   `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Family Family `gorm:"foreignKey:FamilyID" json:"family,omitempty"`
}

func (s *SupportReport) BeforeCreate(tx *gorm.DB) (err error) {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return
}
