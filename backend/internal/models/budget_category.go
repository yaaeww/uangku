package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type BudgetCategory struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	FamilyID    uuid.UUID `gorm:"type:uuid;not null;index" json:"family_id"`
	Name        string    `gorm:"not null" json:"name"`
	Percentage  int       `gorm:"not null" json:"percentage"`
	Description string    `json:"description"`
	Icon        string    `json:"icon"` // lucide icon name
	Color       string    `json:"color"` // tailwind text color class
	BgColor     string    `json:"bg_color"` // tailwind bg color class
	Order       int       `gorm:"default:0" json:"order"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	Items []Saving `gorm:"foreignKey:BudgetCategoryID" json:"items"`
}

func (bc *BudgetCategory) BeforeCreate(tx *gorm.DB) (err error) {
	if bc.ID == uuid.Nil {
		bc.ID = uuid.New()
	}
	return
}
