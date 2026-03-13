package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type BlogPost struct {
	ID              uuid.UUID    `gorm:"type:uuid;primary_key" json:"id"`
	Title           string       `gorm:"not null" json:"title"`
	Slug            string       `gorm:"uniqueIndex;not null" json:"slug"`
	Content         string       `gorm:"type:text;not null" json:"content"`
	AuthorID        uuid.UUID    `gorm:"type:uuid;not null" json:"author_id"`
	CategoryID      *uuid.UUID   `gorm:"type:uuid" json:"category_id"`
	Status          string       `gorm:"not null;default:'draft'" json:"status"` // draft, published, scheduled
	FeaturedImage   string       `json:"featured_image"`
	MetaDescription string       `gorm:"size:160" json:"meta_description"`
	Keywords        string       `json:"keywords"`
	ViewsCount      int          `gorm:"default:0" json:"views_count"`
	SeoScore        int          `gorm:"default:0" json:"seo_score"`
	CreatedAt       time.Time    `json:"created_at"`
	UpdatedAt       time.Time    `json:"updated_at"`

	Author   User          `gorm:"foreignKey:AuthorID" json:"author,omitempty"`
	Category *BlogCategory `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
}

func (b *BlogPost) BeforeCreate(tx *gorm.DB) (err error) {
	if b.ID == uuid.Nil {
		b.ID = uuid.New()
	}
	return
}
