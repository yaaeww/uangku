package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// PlatformExpense represents costs incurred by the platform itself (Super Admin level)
type PlatformExpense struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	Category    string    `gorm:"not null;index" json:"category"` // Operational, Salary, Infrastructure, Marketing, etc.
	Amount      float64   `gorm:"not null" json:"amount"`
	Description string    `json:"description"`
	ExpenseDate time.Time `gorm:"not null;index" json:"expense_date"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (e *PlatformExpense) BeforeCreate(tx *gorm.DB) (err error) {
	if e.ID == uuid.Nil {
		e.ID = uuid.New()
	}
	if e.ExpenseDate.IsZero() {
		e.ExpenseDate = time.Now()
	}
	return
}

// PlatformExpenseCategory represents categories for platform expenses with target percentages
type PlatformExpenseCategory struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	Name        string    `gorm:"not null;unique" json:"name"`
	Type        string    `gorm:"type:string;default:'EXPENSE';index" json:"type"` // EXPENSE, PROFIT
	Percentage  float64   `gorm:"not null" json:"percentage"` // e.g., 10.0 for 10%
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (c *PlatformExpenseCategory) BeforeCreate(tx *gorm.DB) (err error) {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return
}
