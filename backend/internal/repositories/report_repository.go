package repositories

import (
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"
	"time"
)

type ReportRepository interface {
	GetRevenueByPeriod(start, end time.Time) (float64, error)
	GetExpensesByPeriod(start, end time.Time) (float64, error)
	GetExpensesByCategory(start, end time.Time) (map[string]float64, error)
	GetTotalFeesByPeriod(start, end time.Time) (float64, error)
	CreateExpense(expense *models.PlatformExpense) error
	UpdateExpense(expense *models.PlatformExpense) error
	DeleteExpense(id string) error
	ListExpensesByPeriod(start, end time.Time) ([]models.PlatformExpense, error)
	ListRevenueByPeriod(start, end time.Time) ([]models.PaymentTransaction, error)

	// Category Management
	GetAllCategories() ([]models.PlatformExpenseCategory, error)
	CreateCategory(cat *models.PlatformExpenseCategory) error
	UpdateCategory(cat *models.PlatformExpenseCategory) error
	DeleteCategory(id string) error

	// Budget Transfers
	GetBudgetTransfersByPeriod(start, end time.Time) ([]models.PlatformBudgetTransfer, error)
	CreateBudgetTransfer(transfer *models.PlatformBudgetTransfer) error
	UpdateBudgetTransfer(transfer *models.PlatformBudgetTransfer) error
	DeleteBudgetTransfer(id string) error
}

type reportRepository struct{}

func NewReportRepository() ReportRepository {
	return &reportRepository{}
}

func (r *reportRepository) GetRevenueByPeriod(start, end time.Time) (float64, error) {
	var total float64
	err := config.DB.Model(&models.PaymentTransaction{}).
		Where("status = ? AND created_at BETWEEN ? AND ?", "PAID", start, end).
		Select("COALESCE(SUM(total_amount), 0)").
		Scan(&total).Error
	return total, err
}

func (r *reportRepository) GetExpensesByPeriod(start, end time.Time) (float64, error) {
	var total float64
	err := config.DB.Model(&models.PlatformExpense{}).
		Where("expense_date BETWEEN ? AND ?", start, end).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&total).Error
	return total, err
}

func (r *reportRepository) GetExpensesByCategory(start, end time.Time) (map[string]float64, error) {
	type Result struct {
		Category string
		Total    float64
	}
	var results []Result
	err := config.DB.Model(&models.PlatformExpense{}).
		Where("expense_date BETWEEN ? AND ?", start, end).
		Select("category, SUM(amount) as total").
		Group("category").
		Scan(&results).Error
	
	if err != nil {
		return nil, err
	}

	m := make(map[string]float64)
	for _, res := range results {
		m[res.Category] = res.Total
	}
	return m, nil
}

func (r *reportRepository) GetTotalFeesByPeriod(start, end time.Time) (float64, error) {
	var total float64
	err := config.DB.Model(&models.PaymentTransaction{}).
		Where("status = ? AND created_at BETWEEN ? AND ?", "PAID", start, end).
		Select("COALESCE(SUM(fee), 0)").
		Scan(&total).Error
	return total, err
}

func (r *reportRepository) CreateExpense(expense *models.PlatformExpense) error {
	return config.DB.Create(expense).Error
}

func (r *reportRepository) UpdateExpense(expense *models.PlatformExpense) error {
	return config.DB.Save(expense).Error
}

func (r *reportRepository) DeleteExpense(id string) error {
	return config.DB.Delete(&models.PlatformExpense{}, "id = ?", id).Error
}

func (r *reportRepository) ListExpensesByPeriod(start, end time.Time) ([]models.PlatformExpense, error) {
	var expenses []models.PlatformExpense
	err := config.DB.Where("expense_date BETWEEN ? AND ?", start, end).
		Order("expense_date DESC").
		Find(&expenses).Error
	return expenses, err
}

func (r *reportRepository) ListRevenueByPeriod(start, end time.Time) ([]models.PaymentTransaction, error) {
	var txs []models.PaymentTransaction
	err := config.DB.Preload("Family").Where("status = ? AND created_at BETWEEN ? AND ?", "PAID", start, end).
		Order("created_at DESC").
		Find(&txs).Error
	return txs, err
}

func (r *reportRepository) GetAllCategories() ([]models.PlatformExpenseCategory, error) {
	var cats []models.PlatformExpenseCategory
	err := config.DB.Order("name ASC").Find(&cats).Error
	return cats, err
}

func (r *reportRepository) CreateCategory(cat *models.PlatformExpenseCategory) error {
	return config.DB.Create(cat).Error
}

func (r *reportRepository) UpdateCategory(cat *models.PlatformExpenseCategory) error {
	return config.DB.Save(cat).Error
}

func (r *reportRepository) DeleteCategory(id string) error {
	return config.DB.Delete(&models.PlatformExpenseCategory{}, "id = ?", id).Error
}

func (r *reportRepository) GetBudgetTransfersByPeriod(start, end time.Time) ([]models.PlatformBudgetTransfer, error) {
	var transfers []models.PlatformBudgetTransfer
	err := config.DB.Where("transfer_date BETWEEN ? AND ?", start, end).
		Order("transfer_date DESC").
		Find(&transfers).Error
	return transfers, err
}

func (r *reportRepository) CreateBudgetTransfer(transfer *models.PlatformBudgetTransfer) error {
	return config.DB.Create(transfer).Error
}
func (r *reportRepository) UpdateBudgetTransfer(transfer *models.PlatformBudgetTransfer) error {
	return config.DB.Save(transfer).Error
}
func (r *reportRepository) DeleteBudgetTransfer(id string) error {
	return config.DB.Delete(&models.PlatformBudgetTransfer{}, "id = ?", id).Error
}
