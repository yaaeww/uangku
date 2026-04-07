package models

import (
	"time"

	"github.com/google/uuid"
)

type FamilyMonthlySummary struct {
	FamilyID         uuid.UUID `gorm:"type:uuid;primary_key;index" json:"family_id"`
	Month            int       `gorm:"primary_key" json:"month"`
	Year             int       `gorm:"primary_key" json:"year"`
	TotalIncome      float64   `gorm:"type:decimal(15,2);default:0" json:"total_income"`
	TotalExpense     float64   `gorm:"type:decimal(15,2);default:0" json:"total_expense"`
	CategoryExpenses string    `gorm:"type:text" json:"category_expenses"` // JSON encoded map[string]float64
	DailyActivity    string    `gorm:"type:text" json:"daily_activity"`    // JSON encoded map[int]DailyActivity
	MemberSpending   string    `gorm:"type:text" json:"member_spending"`   // JSON encoded map[string]float64
	LastUpdatedAt    time.Time `json:"last_updated_at"`
}

func (FamilyMonthlySummary) TableName() string {
	return "family_monthly_summaries"
}
