package repositories

import (
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"
	"time"
	"fmt"

	"github.com/google/uuid"
)

type DailyActivity struct {
	Income  float64 `json:"income"`
	Expense float64 `json:"expense"`
}

type DashboardSummary struct {
	TotalBalance     float64               `json:"total_balance"`
	TotalIncome      float64               `json:"total_income"`
	TotalExpense     float64               `json:"total_expense"`
	TrendBalance     float64               `json:"trend_balance"`
	TrendIncome      float64               `json:"trend_income"`
	TrendExpense     float64               `json:"trend_expense"`
	CategoryExpenses map[string]float64    `json:"category_expenses"`
	DailyActivity    map[int]DailyActivity `json:"daily_activity"`
	Family           models.Family         `json:"family"`
	MemberCount      int64                 `json:"member_count"`
	InvitationCount  int64                 `json:"invitation_count"`
	TrialDuration    int                   `json:"trial_duration"`
}

type FinanceRepository interface {
	CreateTransaction(tx *models.Transaction) error
	GetMonthlyTransactions(familyID uuid.UUID, month int, year int) ([]models.Transaction, error)
	GetDashboardSummary(familyID uuid.UUID, month int, year int) (*DashboardSummary, error)
	GetByID(id uuid.UUID) (*models.Transaction, error)
	Delete(id uuid.UUID, familyID uuid.UUID) error
}

type financeRepository struct{}

func NewFinanceRepository() FinanceRepository {
	return &financeRepository{}
}

func (r *financeRepository) CreateTransaction(tx *models.Transaction) error {
	// GORM handles the insert.
	// The DB partitioning ensures it goes to the right child table based on tx.Date
	return config.DB.Create(tx).Error
}

func (r *financeRepository) GetMonthlyTransactions(familyID uuid.UUID, month int, year int) ([]models.Transaction, error) {
	var transactions []models.Transaction

	startDate := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.UTC)
	endDate := startDate.AddDate(0, 1, 0)

	err := config.DB.Where("family_id = ? AND date >= ? AND date < ?", familyID, startDate, endDate).
		Order("date DESC").
		Limit(10). // Only show recent for dashboard
		Find(&transactions).Error

	return transactions, err
}

func (r *financeRepository) GetDashboardSummary(familyID uuid.UUID, month int, year int) (*DashboardSummary, error) {
	var summary DashboardSummary
	summary.CategoryExpenses = make(map[string]float64)

	startDate := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.UTC)
	endDate := startDate.AddDate(0, 1, 0)

	// 1. Calculate Income & Expense for current month
	type Result struct {
		Type  string
		Total float64
	}
	var results []Result
	config.DB.Model(&models.Transaction{}).
		Select("type, sum(amount) as total").
		Where("family_id = ? AND date >= ? AND date < ?", familyID, startDate, endDate).
		Group("type").
		Scan(&results)

	for _, res := range results {
		if res.Type == "income" {
			summary.TotalIncome = res.Total
		} else {
			summary.TotalExpense = res.Total
		}
	}

	summary.TotalBalance = summary.TotalIncome - summary.TotalExpense

	// 2. Trend (simplified: compare with previous month's balance)
	prevStart := startDate.AddDate(0, -1, 0)
	prevEnd := startDate
	var prevIncome, prevExpense float64
	config.DB.Model(&models.Transaction{}).
		Select("COALESCE(sum(amount), 0)").
		Where("family_id = ? AND date >= ? AND date < ? AND type = 'income'", familyID, prevStart, prevEnd).
		Scan(&prevIncome)
	config.DB.Model(&models.Transaction{}).
		Select("COALESCE(sum(amount), 0)").
		Where("family_id = ? AND date >= ? AND date < ? AND type = 'expense'", familyID, prevStart, prevEnd).
		Scan(&prevExpense)

	prevBalance := prevIncome - prevExpense
	if prevBalance != 0 {
		summary.TrendBalance = ((summary.TotalBalance - prevBalance) / prevBalance) * 100
	}
	if prevIncome != 0 {
		summary.TrendIncome = ((summary.TotalIncome - prevIncome) / prevIncome) * 100
	}
	if prevExpense != 0 {
		summary.TrendExpense = ((summary.TotalExpense - prevExpense) / prevExpense) * 100
	}

	// 3. Category Breakdown
	type CatResult struct {
		Category string
		Total    float64
	}
	var catResults []CatResult
	config.DB.Model(&models.Transaction{}).
		Select("category, sum(amount) as total").
		Where("family_id = ? AND date >= ? AND date < ? AND type = 'expense'", familyID, startDate, endDate).
		Group("category").
		Order("total DESC").
		Limit(5).
		Scan(&catResults)

	for _, res := range catResults {
		catName := res.Category
		if catName == "" {
			catName = "Lainnya"
		}
		summary.CategoryExpenses[catName] = res.Total
	}

	// 4. Daily aggregates
	summary.DailyActivity = make(map[int]DailyActivity)
	var dailyResults []struct {
		Day   int
		Type  string
		Total float64
	}
	config.DB.Model(&models.Transaction{}).
		Select("CAST(EXTRACT(DAY FROM date) AS INTEGER) as day, type, sum(amount) as total").
		Where("family_id = ? AND date >= ? AND date < ?", familyID, startDate, endDate).
		Group("day, type").
		Scan(&dailyResults)

	for _, res := range dailyResults {
		day := res.Day
		activity := summary.DailyActivity[day]
		if res.Type == "income" {
			activity.Income = res.Total
		} else {
			activity.Expense = res.Total
		}
		summary.DailyActivity[day] = activity
	}

	// 5. Family Info & Counts
	config.DB.Preload("Members.User").First(&summary.Family, "id = ?", familyID)
	config.DB.Model(&models.FamilyMember{}).Where("family_id = ?", familyID).Count(&summary.MemberCount)
	config.DB.Model(&models.FamilyInvitation{}).Where("family_id = ?", familyID).Count(&summary.InvitationCount)

	// 6. Current Trial Duration Setting
	var durationStr string
	summary.TrialDuration = 7 // Default fallback
	if err := config.DB.Table("system_settings").Select("value").Where("key = ?", "trial_duration_days").Scan(&durationStr).Error; err == nil && durationStr != "" {
		var d int
		if _, err := fmt.Sscanf(durationStr, "%d", &d); err == nil {
			summary.TrialDuration = d
		}
	}

	return &summary, nil
}

func (r *financeRepository) GetByID(id uuid.UUID) (*models.Transaction, error) {
	var tx models.Transaction
	err := config.DB.First(&tx, "id = ?", id).Error
	return &tx, err
}

func (r *financeRepository) Delete(id uuid.UUID, familyID uuid.UUID) error {
	return config.DB.Delete(&models.Transaction{}, "id = ? AND family_id = ?", id, familyID).Error
}
