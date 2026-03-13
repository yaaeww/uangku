package models

import (
	"time"

	"github.com/google/uuid"
)

type FamilyChallenge struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	FamilyID    uuid.UUID `gorm:"type:uuid;index;not null" json:"family_id"`
	Type        string    `gorm:"type:varchar(100);not null" json:"type"` // e.g., 'no_spend_day'
	Title       string    `gorm:"type:varchar(255);not null" json:"title"`
	Description string    `gorm:"type:text" json:"description"`
	Status      string    `gorm:"type:varchar(50);default:'suggested'" json:"status"` // suggested, active, completed, failed
	Points      int       `gorm:"default:0" json:"points"`
	Metadata    string    `gorm:"type:text" json:"metadata"` // JSON string for specific targets (e.g., {"dow": 2})
	StartDate   *time.Time `json:"start_date"`
	EndDate     *time.Time `json:"end_date"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`

	Family Family `gorm:"foreignKey:FamilyID" json:"-"`
}
