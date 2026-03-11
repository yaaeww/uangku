package repositories

import (
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"
	"time"

	"github.com/google/uuid"
)

type DashboardSummary struct {
	TotalBalance     float64            `json:"total_balance"`
	TotalIncome      float64            `json:"total_income"`
	TotalExpense     float64            `json:"total_expense"`
	TrendBalance     float64            `json:"trend_balance"`
	CategoryExpenses map[string]float64 `json:"category_expenses"`
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
