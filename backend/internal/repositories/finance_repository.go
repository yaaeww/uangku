package repositories

import (
	"encoding/json"
	"fmt"
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type DailyActivity struct {
	Income  float64 `json:"income"`
	Expense float64 `json:"expense"`
}

type DashboardSummary struct {
	TotalBalance      float64               `json:"total_balance"`
	TotalIncome       float64               `json:"total_income"`
	TotalExpense      float64               `json:"total_expense"`
	TrendBalance      float64               `json:"trend_balance"`
	TrendIncome       float64               `json:"trend_income"`
	TrendExpense      float64               `json:"trend_expense"`
	CategoryExpenses  map[string]float64    `json:"expense_by_category"`
	DailyActivity     map[int]DailyActivity `json:"daily_activity"`
	Family            models.Family         `json:"family"`
	TotalPortfolio    float64               `json:"total_portfolio"`
	TotalDebt         float64               `json:"total_debt"`
	TotalAsset        float64               `json:"total_asset"`
	MemberCount       int64                 `json:"member_count"`
	InvitationCount   int64                 `json:"invitation_count"`
	Plan              models.SubscriptionPlan `json:"plan"`
	TrialDuration     int                   `json:"trial_duration"`
	UserBudget        float64               `json:"user_budget"`
	TotalFamilyBudget float64               `json:"total_family_budget"`
	MemberSpent       map[string]float64    `json:"member_spent"`
	MemberBudgets     map[string]float64    `json:"member_budgets"`
}

type Recommendation struct {
	Priority string `json:"priority"`
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
	GelarUser               string           `json:"gelar_user"`
	Status                  string           `json:"status"`
	Ringkasan                string           `json:"ringkasan"`
	Insight                 []string         `json:"insight"`
	Peringatan              []string         `json:"peringatan"`
	AnalisisGoals           []string         `json:"analisis_goals"`
	AnalisisAset            []string         `json:"analisis_aset"`
	Recommendations         []string         `json:"recommendations"`
	DetailedRecommendations []Recommendation `json:"detailed_recommendations"`
	Prediksi                string           `json:"prediksi"`
	Forecast                *Forecast        `json:"forecast"`
	CoachingStyle           string           `json:"coaching_style"`
	Score                   int              `json:"score"`
	SavingsRate             float64          `json:"savings_rate"`
	ExpenseRatio            float64          `json:"expense_ratio"`
	Comparison              string           `json:"comparison"`
}

type FinanceRepository interface {
	CreateTransaction(tx *models.Transaction) error
	GetMonthlyTransactions(familyID, userID uuid.UUID, role string, month int, year int, week int, page, limit int) ([]models.Transaction, int64, float64, float64, error)
	GetTransactionsByRange(familyID, userID uuid.UUID, role string, startDate, endDate time.Time, page, limit int) ([]models.Transaction, int64, float64, float64, error)
	GetDashboardSummary(familyID, userID uuid.UUID, role string, month int, year int) (*DashboardSummary, error)
	GetByID(id uuid.UUID, familyID uuid.UUID, date time.Time) (*models.Transaction, error)
	Delete(id uuid.UUID, familyID uuid.UUID, date time.Time) error
	SyncMonthlySummary(familyID uuid.UUID, month, year int) error
	SetMonthlyBudget(familyID, userID uuid.UUID, month, year int, amount float64) error
	GetMonthlyBudget(familyID, userID uuid.UUID, month, year int) (*models.BudgetPlan, error)
	GetFamilyBudgetsForMonth(familyID uuid.UUID, month, year int) ([]models.BudgetPlan, error)
}

type financeRepository struct{}

func NewFinanceRepository() FinanceRepository {
	return &financeRepository{}
}

func (r *financeRepository) CreateTransaction(tx *models.Transaction) error {
	if err := config.EnsurePartitionForDate(config.DB, tx.Date); err != nil {
		return fmt.Errorf("failed to ensure database partition: %w", err)
	}
	if err := config.DB.Create(tx).Error; err != nil {
		return err
	}
	go r.SyncMonthlySummary(tx.FamilyID, int(tx.Date.Month()), tx.Date.Year())
	return nil
}

func (r *financeRepository) GetTransactionsByRange(familyID, userID uuid.UUID, role string, startDate, endDate time.Time, page, limit int) ([]models.Transaction, int64, float64, float64, error) {
	var transactions []models.Transaction
	var total int64
	var totalIncome, totalExpense float64

	// 1. Data Fetch Query (with Preload)
	query := config.DB.Model(&models.Transaction{}).Preload("User").Where("family_id = ? AND date >= ? AND date <= ?", familyID, startDate, endDate)
	
	// 2. Count Query (Lighter, no preload)
	countQuery := config.DB.Model(&models.Transaction{}).Where("family_id = ? AND date >= ? AND date <= ?", familyID, startDate, endDate)
	
	// 3. Aggregate Query (Sum Income/Expense)
	type result struct {
		Type string
		Sum  float64
	}
	var results []result
	summaryQuery := config.DB.Model(&models.Transaction{}).Select("LOWER(type) as type, sum(amount) as sum").Where("family_id = ? AND date >= ? AND date <= ?", familyID, startDate, endDate)

	if role != "head_of_family" && role != "treasurer" && role != "viewer" {
		query = query.Where("user_id = ?", userID)
		countQuery = countQuery.Where("user_id = ?", userID)
		summaryQuery = summaryQuery.Where("user_id = ?", userID)
	}
	
	var wg sync.WaitGroup
	var countErr, sumErr, fetchErr error

	wg.Add(3)

	go func() {
		defer wg.Done()
		countErr = countQuery.Count(&total).Error
	}()

	go func() {
		defer wg.Done()
		sumErr = summaryQuery.Group("LOWER(type)").Scan(&results).Error
	}()

	go func() {
		defer wg.Done()
		// Apply pagination only to the fetching query
		if limit > 0 {
			offset := (page - 1) * limit
			query = query.Offset(offset).Limit(limit)
		}
		fetchErr = query.Order("date DESC").Find(&transactions).Error
	}()

	wg.Wait()

	for _, res := range results {
		switch res.Type {
		case "income":
			totalIncome += res.Sum
		case "expense", "saving":
			totalExpense += res.Sum
		}
	}

	// Calculate compound error if any
	err := fetchErr
	if err == nil {
		if countErr != nil {
			err = countErr
		} else if sumErr != nil {
			err = sumErr
		}
	}

	return transactions, total, totalIncome, totalExpense, err
}

func (r *financeRepository) GetMonthlyTransactions(familyID, userID uuid.UUID, role string, month int, year int, week int, page, limit int) ([]models.Transaction, int64, float64, float64, error) {
	startDate := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.UTC)
	endDate := startDate.AddDate(0, 1, 0).Add(-time.Nanosecond)

	if week > 0 {
		switch week {
		case 1:
			endDate = time.Date(year, time.Month(month), 7, 23, 59, 59, 999999999, time.UTC)
		case 2:
			startDate = time.Date(year, time.Month(month), 8, 0, 0, 0, 0, time.UTC)
			endDate = time.Date(year, time.Month(month), 14, 23, 59, 59, 999999999, time.UTC)
		case 3:
			startDate = time.Date(year, time.Month(month), 15, 0, 0, 0, 0, time.UTC)
			endDate = time.Date(year, time.Month(month), 21, 23, 59, 59, 999999999, time.UTC)
		case 4:
			startDate = time.Date(year, time.Month(month), 22, 0, 0, 0, 0, time.UTC)
			endDate = time.Date(year, time.Month(month), 28, 23, 59, 59, 999999999, time.UTC)
		case 5:
			startDate = time.Date(year, time.Month(month), 29, 0, 0, 0, 0, time.UTC)
			// endDate remains as end of month
		}
	}

	return r.GetTransactionsByRange(familyID, userID, role, startDate, endDate, page, limit)
}

func (r *financeRepository) GetDashboardSummary(familyID, userID uuid.UUID, role string, month int, year int) (*DashboardSummary, error) {
	var summary DashboardSummary
	summary.CategoryExpenses = make(map[string]float64)
	summary.DailyActivity = make(map[int]DailyActivity)
	summary.MemberSpent = make(map[string]float64)

	startDate := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.UTC)
	endDate := startDate.AddDate(0, 1, 0)
	isMemberOnly := role != "head_of_family" && role != "treasurer" && role != "viewer"

	var mSummary models.FamilyMonthlySummary
	err := config.DB.Where("family_id = ? AND month = ? AND year = ?", familyID, month, year).First(&mSummary).Error
	if err == nil && !isMemberOnly {
		summary.TotalIncome = mSummary.TotalIncome
		summary.TotalExpense = mSummary.TotalExpense
		importJSON(mSummary.CategoryExpenses, &summary.CategoryExpenses)
		importJSON(mSummary.DailyActivity, &summary.DailyActivity)
		importJSON(mSummary.MemberSpending, &summary.MemberSpent)
		summary.TotalBalance = summary.TotalIncome - summary.TotalExpense
	} else {
		// Calculate in real-time
		r.calculateDashboardMetricsOnePass(familyID, userID, isMemberOnly, startDate, endDate, &summary)
		
		// If the summary is missing and we're not filtered for a member, trigger background sync for next time
		if err == gorm.ErrRecordNotFound && !isMemberOnly {
			go r.SyncMonthlySummary(familyID, month, year)
		}
	}

	var wg sync.WaitGroup
	wg.Add(6)

	go func() {
		defer wg.Done()
		summary.TrendBalance, summary.TrendIncome, summary.TrendExpense = r.calculateTrends(familyID, startDate)
	}()

	go func() {
		defer wg.Done()
		config.DB.Preload("Members.User").First(&summary.Family, "id = ?", familyID)
		summary.MemberCount = int64(len(summary.Family.Members))
		config.DB.First(&summary.Plan, "name = ?", summary.Family.SubscriptionPlan)
	}()

	go func() {
		defer wg.Done()
		config.DB.Model(&models.FamilyInvitation{}).Where("family_id = ?", familyID).Count(&summary.InvitationCount)
	}()

	go func() {
		defer wg.Done()
		summary.TrialDuration = r.getTrialDuration()
	}()

	go func() {
		defer wg.Done()
		r.calculateBudgets(familyID, userID, month, year, &summary)
	}()

	go func() {
		defer wg.Done()
		r.calculateNetWorth(familyID, userID, isMemberOnly, &summary)
	}()

	wg.Wait()

	return &summary, nil
}

func (r *financeRepository) calculateDashboardMetricsOnePass(familyID, userID uuid.UUID, isMemberOnly bool, start, end time.Time, s *DashboardSummary) {
	type AggResult struct {
		Type     string
		UserID   string
		Category string
		Day      int
		Total    float64
	}
	var results []AggResult

	query := config.DB.Table("transactions").
		Select(`
			type,
			user_id,
			category,
			CAST(EXTRACT(DAY FROM date) AS INTEGER) as day,
			SUM(amount) as total
		`).
		Where("family_id = ? AND date >= ? AND date < ?", familyID, start, end)

	if isMemberOnly {
		query = query.Where("user_id = ?", userID)
	}

	query.Group("type, user_id, category, day").Scan(&results)

	for _, res := range results {
		// 1. Totals
		if res.Type == "income" {
			s.TotalIncome += res.Total
		} else {
			s.TotalExpense += res.Total
		}

		// 2. Daily Activity
		act := s.DailyActivity[res.Day]
		if res.Type == "income" {
			act.Income += res.Total
		} else {
			act.Expense += res.Total
		}
		s.DailyActivity[res.Day] = act

		// 3. Member Spending (Non-Income)
		if res.Type != "income" && res.UserID != "" {
			s.MemberSpent[res.UserID] += res.Total
		}

		// 4. Category Breakdown (Non-Income, TOP 5 handled in UI usually, but let's aggregate all)
		if res.Type != "income" {
			name := res.Category
			if name == "" {
				name = "Lainnya"
			}
			s.CategoryExpenses[name] += res.Total
		}
	}
	s.TotalBalance = s.TotalIncome - s.TotalExpense
}

func (r *financeRepository) calculateTotals(familyID, userID uuid.UUID, isMemberOnly bool, start, end time.Time, s *DashboardSummary) {
	// Deprecated in favor of OnePass but kept for compatibility if needed elsewhere
	r.calculateDashboardMetricsOnePass(familyID, userID, isMemberOnly, start, end, s)
}

func (r *financeRepository) calculateTrends(uuid.UUID, time.Time) (float64, float64, float64) {
	return 0, 0, 0
}

func (r *financeRepository) calculateCategoryBreakdown(familyID, userID uuid.UUID, isMemberOnly bool, start, end time.Time, s *DashboardSummary) {
	var catResults []struct { Category string; Total float64 }
	catQuery := `SELECT COALESCE(s.name, t.category, 'Lainnya') as category, SUM(t.amount) as total FROM transactions t LEFT JOIN savings s ON t.saving_id = s.id WHERE t.family_id = ? AND t.date >= ? AND t.date < ? AND t.type != 'income'`
	if isMemberOnly { catQuery += " AND t.user_id = '" + userID.String() + "'" }
	catQuery += " GROUP BY 1 ORDER BY total DESC LIMIT 5"
	config.DB.Raw(catQuery, familyID, start, end).Scan(&catResults)
	for _, res := range catResults {
		name := res.Category
		if name == "" { name = "Lainnya" }
		s.CategoryExpenses[name] = res.Total
	}
}

func (r *financeRepository) calculateDailyActivity(familyID, userID uuid.UUID, isMemberOnly bool, start, end time.Time, s *DashboardSummary) {
	var dailyResults []struct { Day int; Type string; Total float64 }
	q := config.DB.Model(&models.Transaction{}).Select("CAST(EXTRACT(DAY FROM date) AS INTEGER) as day, type, sum(amount) as total").Where("family_id = ? AND date >= ? AND date < ?", familyID, start, end)
	if isMemberOnly { q = q.Where("user_id = ?", userID) }
	q.Group("day, type").Scan(&dailyResults)
	for _, res := range dailyResults {
		act := s.DailyActivity[res.Day]
		if res.Type == "income" { act.Income = res.Total } else { act.Expense = res.Total }
		s.DailyActivity[res.Day] = act
	}
}

func (r *financeRepository) calculateMemberSpending(familyID uuid.UUID, start, end time.Time, s *DashboardSummary) {
	var memberResults []struct { UserID string; Total float64 }
	config.DB.Table("transactions").Select("user_id, sum(amount) as total").Where("family_id = ? AND date >= ? AND date < ? AND type IN ('expense', 'saving', 'goal_allocation')", familyID, start, end).Group("user_id").Scan(&memberResults)
	for _, res := range memberResults {
		if res.UserID != "" { s.MemberSpent[res.UserID] = res.Total }
	}
}

func (r *financeRepository) getTrialDuration() int {
	var durationStr string
	if err := config.DB.Table("system_settings").Select("value").Where("key = ?", "trial_duration_days").Scan(&durationStr).Error; err == nil && durationStr != "" {
		var d int; fmt.Sscanf(durationStr, "%d", &d); return d
	}
	return 7
}

func (r *financeRepository) calculateBudgets(familyID, userID uuid.UUID, month, year int, s *DashboardSummary) {
	var budgetPlans []models.BudgetPlan
	config.DB.Where("family_id = ? AND month = ? AND year = ?", familyID, month, year).Find(&budgetPlans)
	planMap := make(map[uuid.UUID]float64); for _, p := range budgetPlans { planMap[p.UserID] = p.Amount }
	s.MemberBudgets = make(map[string]float64)
	for _, m := range s.Family.Members {
		budget := m.MonthlyBudget
		if pAmount, ok := planMap[m.UserID]; ok { budget = pAmount }
		s.MemberBudgets[strings.ToLower(m.UserID.String())] = budget
		if m.UserID == userID { s.UserBudget = budget }
		s.TotalFamilyBudget += budget
	}
}

func (r *financeRepository) calculateNetWorth(familyID, userID uuid.UUID, isMemberOnly bool, s *DashboardSummary) {
	var wallets []models.Wallet
	wQ := config.DB.Where("family_id = ?", familyID)
	if isMemberOnly { wQ = wQ.Where("user_id = ?", userID) }
	wQ.Find(&wallets); for _, w := range wallets { s.TotalPortfolio += w.Balance }
}

func (r *financeRepository) SyncMonthlySummary(familyID uuid.UUID, month, year int) error {
	startDate := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.UTC)
	endDate := startDate.AddDate(0, 1, 0)
	var summary DashboardSummary
	summary.CategoryExpenses = make(map[string]float64)
	summary.DailyActivity = make(map[int]DailyActivity)
	summary.MemberSpent = make(map[string]float64)

	r.calculateDashboardMetricsOnePass(familyID, uuid.Nil, false, startDate, endDate, &summary)

	mSummary := models.FamilyMonthlySummary{
		FamilyID: familyID, Month: month, Year: year,
		TotalIncome: summary.TotalIncome, TotalExpense: summary.TotalExpense,
		CategoryExpenses: exportJSON(summary.CategoryExpenses),
		DailyActivity: exportJSON(summary.DailyActivity),
		MemberSpending: exportJSON(summary.MemberSpent),
		LastUpdatedAt: time.Now(),
	}
	return config.DB.Save(&mSummary).Error
}

func (r *financeRepository) GetByID(id uuid.UUID, familyID uuid.UUID, date time.Time) (*models.Transaction, error) {
	var tx models.Transaction
	query := config.DB.Preload("User").Where("id = ? AND family_id = ?", id, familyID)
	if !date.IsZero() {
		start := time.Date(date.Year(), date.Month(), 1, 0, 0, 0, 0, time.UTC)
		query = query.Where("date >= ? AND date < ?", start, start.AddDate(0, 1, 0))
	}
	return &tx, query.First(&tx).Error
}

func (r *financeRepository) Delete(id uuid.UUID, familyID uuid.UUID, date time.Time) error {
	var err error
	if date.IsZero() {
		err = config.DB.Delete(&models.Transaction{}, "id = ? AND family_id = ?", id, familyID).Error
	} else {
		start := time.Date(date.Year(), date.Month(), 1, 0, 0, 0, 0, time.UTC)
		err = config.DB.Delete(&models.Transaction{}, "id = ? AND family_id = ? AND date >= ? AND date < ?", id, familyID, start, start.AddDate(0, 1, 0)).Error
	}
	if err == nil && !date.IsZero() { go r.SyncMonthlySummary(familyID, int(date.Month()), date.Year()) }
	return err
}

func (r *financeRepository) SetMonthlyBudget(familyID, userID uuid.UUID, month, year int, amount float64) error {
	var plan models.BudgetPlan
	err := config.DB.Where("family_id = ? AND user_id = ? AND month = ? AND year = ?", familyID, userID, month, year).First(&plan).Error
	if err == nil { return config.DB.Model(&plan).Update("amount", amount).Error }
	return config.DB.Create(&models.BudgetPlan{FamilyID: familyID, UserID: userID, Month: month, Year: year, Amount: amount}).Error
}

func (r *financeRepository) GetMonthlyBudget(familyID, userID uuid.UUID, month, year int) (*models.BudgetPlan, error) {
	var plan models.BudgetPlan
	err := config.DB.Where("family_id = ? AND user_id = ? AND month = ? AND year = ?", familyID, userID, month, year).First(&plan).Error
	return &plan, err
}

func (r *financeRepository) GetFamilyBudgetsForMonth(familyID uuid.UUID, month, year int) ([]models.BudgetPlan, error) {
	var plans []models.BudgetPlan
	return plans, config.DB.Where("family_id = ? AND month = ? AND year = ?", familyID, month, year).Find(&plans).Error
}

func exportJSON(v any) string { b, _ := json.Marshal(v); return string(b) }
func importJSON(data string, v any) { if data != "" { json.Unmarshal([]byte(data), v) } }
