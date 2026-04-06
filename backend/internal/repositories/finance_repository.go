package repositories

import (
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"
	"time"
	"fmt"
	"strings"

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
	CategoryExpenses map[string]float64    `json:"expense_by_category"`
	DailyActivity    map[int]DailyActivity `json:"daily_activity"`
	Family           models.Family         `json:"family"`
	TotalPortfolio   float64               `json:"total_portfolio"`
	TotalDebt        float64               `json:"total_debt"`
	TotalAsset       float64               `json:"total_asset"`
	MemberCount      int64                 `json:"member_count"`
	InvitationCount  int64                 `json:"invitation_count"`
	Plan             models.SubscriptionPlan `json:"plan"`
	TrialDuration    int                   `json:"trial_duration"`
	UserBudget       float64               `json:"user_budget"`
	TotalFamilyBudget float64              `json:"total_family_budget"`
	MemberSpent      map[string]float64 `json:"member_spent"`
	MemberBudgets    map[string]float64 `json:"member_budgets"`
}

type Recommendation struct {
	Priority string `json:"priority"` // high, warning, critical, info
	Text     string `json:"text"`
	Action   string `json:"action"`
	Impact   string `json:"impact"`
}

type Forecast struct {
	PredictedSpending float64 `json:"predicted_spending"`
	Confidence        string  `json:"confidence"`
	Alert             string  `json:"alert"`
}

type CoachAnalysis struct {
	GelarUser       string   `json:"gelar_user"`
	Status          string   `json:"status"` // Sehat, Waspada, Buruk, Defisit, Rentan
	Ringkasan       string   `json:"ringkasan"`
	Insight         []string `json:"insight"`
	Peringatan      []string `json:"peringatan"`
	AnalisisGoals   []string `json:"analisis_goals"`
	AnalisisAset    []string `json:"analisis_aset"`
	Recommendations []string `json:"recommendations"` // Legacy fallback
	DetailedRecommendations []Recommendation `json:"detailed_recommendations"`
	Prediksi        string   `json:"prediksi"` // Legacy fallback
	Forecast        *Forecast `json:"forecast"`
	CoachingStyle   string    `json:"coaching_style"` // growth, foundation, defensive
	Score           int      `json:"score"`
	SavingsRate     float64  `json:"savings_rate"`
	ExpenseRatio    float64  `json:"expense_ratio"`
	Comparison     string   `json:"comparison"`
}

type FinanceRepository interface {
	CreateTransaction(tx *models.Transaction) error
	GetMonthlyTransactions(familyID, userID uuid.UUID, role string, month int, year int) ([]models.Transaction, error)
	GetTransactionsByRange(familyID, userID uuid.UUID, role string, startDate, endDate time.Time) ([]models.Transaction, error)
	GetDashboardSummary(familyID, userID uuid.UUID, role string, month int, year int) (*DashboardSummary, error)
	GetByID(id uuid.UUID, familyID uuid.UUID, date time.Time) (*models.Transaction, error)
	Delete(id uuid.UUID, familyID uuid.UUID, date time.Time) error
	
	// Monthly Budget Plans
	SetMonthlyBudget(familyID, userID uuid.UUID, month, year int, amount float64) error
	GetMonthlyBudget(familyID, userID uuid.UUID, month, year int) (*models.BudgetPlan, error)
	GetFamilyBudgetsForMonth(familyID uuid.UUID, month, year int) ([]models.BudgetPlan, error)
}

type financeRepository struct{}

func NewFinanceRepository() FinanceRepository {
	return &financeRepository{}
}

func (r *financeRepository) CreateTransaction(tx *models.Transaction) error {
	// 1. Ensure partition exists for this transaction's date (past or future)
	if err := config.EnsurePartitionForDate(config.DB, tx.Date); err != nil {
		return fmt.Errorf("failed to ensure database partition: %w", err)
	}

	// 2. GORM handles the insert.
	// The DB partitioning ensures it goes to the right child table based on tx.Date
	return config.DB.Create(tx).Error
}

func (r *financeRepository) GetTransactionsByRange(familyID, userID uuid.UUID, role string, startDate, endDate time.Time) ([]models.Transaction, error) {
	var transactions []models.Transaction

	query := config.DB.Preload("User").Where("family_id = ? AND date >= ? AND date <= ?", familyID, startDate, endDate)
	
	// Hierarchical Filter: Head, Treasurer, and Viewer can see all
	if role != "head_of_family" && role != "treasurer" && role != "viewer" {
		query = query.Where("user_id = ?", userID)
	}

	err := query.Order("date DESC").Find(&transactions).Error

	return transactions, err
}

func (r *financeRepository) GetMonthlyTransactions(familyID, userID uuid.UUID, role string, month int, year int) ([]models.Transaction, error) {
	startDate := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.UTC)
	endDate := startDate.AddDate(0, 1, 0).Add(-time.Nanosecond) // End of month

	return r.GetTransactionsByRange(familyID, userID, role, startDate, endDate)
}

func (r *financeRepository) GetDashboardSummary(familyID, userID uuid.UUID, role string, month int, year int) (*DashboardSummary, error) {
	var summary DashboardSummary
	summary.CategoryExpenses = make(map[string]float64)

	startDate := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.UTC)
	endDate := startDate.AddDate(0, 1, 0)

	// Filter helper: Admin (head_of_family/treasurer) & Viewer sees all
	isMemberOnly := role != "head_of_family" && role != "treasurer" && role != "viewer"

	// 1. Calculate Income & Expense for current month
	type Result struct {
		Type  string
		Total float64
	}
	var results []Result
	query := config.DB.Model(&models.Transaction{}).
		Select("type, sum(amount) as total").
		Where("family_id = ? AND date >= ? AND date < ?", familyID, startDate, endDate)
	
	if isMemberOnly {
		query = query.Where("user_id = ?", userID)
	}
	
	query.Group("type").Scan(&results)

	for _, res := range results {
		if res.Type == "income" {
			summary.TotalIncome += res.Total
		} else {
			summary.TotalExpense += res.Total
		}
	}

	summary.TotalBalance = summary.TotalIncome - summary.TotalExpense

	// 2. Trend (combined: compare with previous month's balance)
	prevStart := startDate.AddDate(0, -1, 0)
	prevEnd := startDate
	var prevResults []Result
	
	config.DB.Model(&models.Transaction{}).
		Select("type, COALESCE(sum(amount), 0) as total").
		Where("family_id = ? AND date >= ? AND date < ?", familyID, prevStart, prevEnd).
		Group("type").
		Scan(&prevResults)

	var prevIncome, prevExpense float64
	for _, res := range prevResults {
		switch res.Type {
		case "income":
			prevIncome = res.Total
		case "expense":
			prevExpense = res.Total
		}
	}

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
	
	catQuery := `
		SELECT COALESCE(s.name, t.category, 'Lainnya') as category, SUM(t.amount) as total
		FROM transactions t
		LEFT JOIN savings s ON t.saving_id = s.id
		WHERE t.family_id = ? AND t.date >= ? AND t.date < ? AND t.type != 'income'
	`
	if isMemberOnly {
		catQuery += " AND t.user_id = '" + userID.String() + "'"
	}
	catQuery += " GROUP BY 1 ORDER BY total DESC LIMIT 5"
	
	config.DB.Raw(catQuery, familyID, startDate, endDate).Scan(&catResults)

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
	qDaily := config.DB.Model(&models.Transaction{}).
		Select("CAST(EXTRACT(DAY FROM date) AS INTEGER) as day, type, sum(amount) as total").
		Where("family_id = ? AND date >= ? AND date < ?", familyID, startDate, endDate)
	
	if isMemberOnly {
		qDaily = qDaily.Where("user_id = ?", userID)
	}
	
	qDaily.Group("day, type").Scan(&dailyResults)

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

	// 5. Family Info & Counts (These are family-wide)
	config.DB.Preload("Members.User").First(&summary.Family, "id = ?", familyID)
	summary.MemberCount = int64(len(summary.Family.Members))
	config.DB.Model(&models.FamilyInvitation{}).Where("family_id = ?", familyID).Count(&summary.InvitationCount)

	// 5.5 Fetch Plan Details
	config.DB.First(&summary.Plan, "name = ?", summary.Family.SubscriptionPlan)

	// 6. Current Trial Duration Setting
	var durationStr string
	summary.TrialDuration = 7 // Default fallback
	if err := config.DB.Table("system_settings").Select("value").Where("key = ?", "trial_duration_days").Scan(&durationStr).Error; err == nil && durationStr != "" {
		var d int
		if _, err := fmt.Sscanf(durationStr, "%d", &d); err == nil {
			summary.TrialDuration = d
		}
	}

	// 6.5 Calculate spending per member for the month
	summary.MemberSpent = make(map[string]float64)
	var memberResults []struct {
		UserID string  `gorm:"column:user_id"`
		Total  float64 `gorm:"column:total"`
	}
	config.DB.Table("transactions").
		Select("user_id, sum(amount) as total").
		Where("family_id = ? AND date >= ? AND date < ? AND type IN ('expense', 'saving', 'goal_allocation')", familyID, startDate, endDate).
		Group("user_id").
		Scan(&memberResults)

	for _, res := range memberResults {
		if res.UserID != "" {
			summary.MemberSpent[res.UserID] = res.Total
		}
	}

	// 7. Per-User Budget & RBAC logic
	// Strategy: Use BudgetPlan for the specific month/year. Fallback to default MonthlyBudget from FamilyMember if not set.
	
	// Fetch all budget plans for this family in this month
	var budgetPlans []models.BudgetPlan
	config.DB.Where("family_id = ? AND month = ? AND year = ?", familyID, month, year).Find(&budgetPlans)
	
	planMap := make(map[uuid.UUID]float64)
	for _, p := range budgetPlans {
		planMap[p.UserID] = p.Amount
	}

	var totalFamilyBudget float64
	for _, m := range summary.Family.Members {
		budget := m.MonthlyBudget // Default
		if planAmount, ok := planMap[m.UserID]; ok {
			budget = planAmount
		}
		
		totalFamilyBudget += budget
		if m.UserID == userID {
			summary.UserBudget = budget
		}
	}
	summary.TotalFamilyBudget = totalFamilyBudget
	
	summary.MemberBudgets = make(map[string]float64)
	for _, m := range summary.Family.Members {
		budget := m.MonthlyBudget
		if planAmount, ok := planMap[m.UserID]; ok {
			budget = planAmount
		}
		summary.MemberBudgets[strings.ToLower(m.UserID.String())] = budget
	}

	// 8. Net Worth Aggregates (Wallets + Assets - Debts)
	// These only show for the specific user unless they are privileged
	var wallets []models.Wallet
	walletQuery := config.DB.Where("family_id = ?", familyID)
	if isMemberOnly {
		walletQuery = walletQuery.Where("user_id = ?", userID)
	}
	walletQuery.Find(&wallets)
	for _, w := range wallets {
		summary.TotalPortfolio += w.Balance
	}

	var assets []models.Asset
	assetQuery := config.DB.Where("family_id = ?", familyID)
	if isMemberOnly {
		assetQuery = assetQuery.Where("user_id = ?", userID)
	}
	assetQuery.Find(&assets)
	for _, a := range assets {
		summary.TotalAsset += a.Value
	}

	var debts []models.Debt
	debtQuery := config.DB.Where("family_id = ?", familyID)
	// Note: Debts are currently family-wide objects but let's filter if they are owned
	// For now, if member only, we only show debts they created themselves or assigned to them
	if isMemberOnly {
		debtQuery = debtQuery.Where("created_by = ?", userID)
	}
	debtQuery.Find(&debts)
	for _, d := range debts {
		summary.TotalDebt += d.RemainingAmount
	}

	return &summary, nil
}

func (r *financeRepository) GetByID(id uuid.UUID, familyID uuid.UUID, date time.Time) (*models.Transaction, error) {
	var tx models.Transaction
	query := config.DB.Preload("User").Where("id = ? AND family_id = ?", id, familyID)
	
	// Critical: Including Date (partition key) allows Postgres to prune partitions.
	// We use a month-wide range to be robust against timezone shifts while still pruning correctly.
	if !date.IsZero() {
		startOfMonth := time.Date(date.Year(), date.Month(), 1, 0, 0, 0, 0, time.UTC)
		endOfMonth := startOfMonth.AddDate(0, 1, 0)
		query = query.Where("date >= ? AND date < ?", startOfMonth, endOfMonth)
	}

	err := query.First(&tx).Error
	return &tx, err
}

func (r *financeRepository) Delete(id uuid.UUID, familyID uuid.UUID, date time.Time) error {
	if date.IsZero() {
		return config.DB.Delete(&models.Transaction{}, "id = ? AND family_id = ?", id, familyID).Error
	}
	startOfMonth := time.Date(date.Year(), date.Month(), 1, 0, 0, 0, 0, time.UTC)
	endOfMonth := startOfMonth.AddDate(0, 1, 0)
	return config.DB.Delete(&models.Transaction{}, "id = ? AND family_id = ? AND date >= ? AND date < ?", id, familyID, startOfMonth, endOfMonth).Error
}

func (r *financeRepository) SetMonthlyBudget(familyID, userID uuid.UUID, month, year int, amount float64) error {
	var plan models.BudgetPlan
	err := config.DB.Where("family_id = ? AND user_id = ? AND month = ? AND year = ?", familyID, userID, month, year).First(&plan).Error
	
	if err == nil {
		// Update existing
		return config.DB.Model(&plan).Update("amount", amount).Error
	}
	
	// Create new
	plan = models.BudgetPlan{
		FamilyID: familyID,
		UserID:   userID,
		Month:    month,
		Year:     year,
		Amount:   amount,
	}
	return config.DB.Create(&plan).Error
}

func (r *financeRepository) GetMonthlyBudget(familyID, userID uuid.UUID, month, year int) (*models.BudgetPlan, error) {
	var plan models.BudgetPlan
	err := config.DB.Where("family_id = ? AND user_id = ? AND month = ? AND year = ?", familyID, userID, month, year).First(&plan).Error
	if err != nil {
		return nil, err
	}
	return &plan, nil
}

func (r *financeRepository) GetFamilyBudgetsForMonth(familyID uuid.UUID, month, year int) ([]models.BudgetPlan, error) {
	var plans []models.BudgetPlan
	err := config.DB.Where("family_id = ? AND month = ? AND year = ?", familyID, month, year).Find(&plans).Error
	return plans, err
}

