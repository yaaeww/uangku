package models

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type BlogCategory struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	Name        string    `gorm:"not null;unique" json:"name"`
	Slug        string    `gorm:"not null;unique" json:"slug"`
	Description string    `json:"description"`
}

func (c *BlogCategory) BeforeCreate(tx *gorm.DB) (err error) {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return
}
