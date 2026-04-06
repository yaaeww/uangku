package services

import (
	"fmt"
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"
	"keuangan-keluarga/internal/repositories"
	"log"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type FinanceService interface {
	GetMonthlyTransactions(familyID, userID uuid.UUID, role string, month int, year int) ([]models.Transaction, error)
	GetTransactionsByRange(familyID, userID uuid.UUID, role string, startDate, endDate time.Time) ([]models.Transaction, error)
	GetDashboardSummary(familyID, userID uuid.UUID, role string, month int, year int) (*repositories.DashboardSummary, error)
	CreateTransaction(tx *models.Transaction) error
	CreateBulkTransactions(txs []models.Transaction) error
	DeleteTransaction(id uuid.UUID, familyID uuid.UUID, date time.Time, requestingUserID uuid.UUID, role string) error
	UpdateTransaction(id uuid.UUID, date time.Time, requestingUserID uuid.UUID, role string, updatedTx *models.Transaction) error
	GetBehaviorSummary(familyID uuid.UUID, period string) (*repositories.BehaviorSummary, error)
	JoinChallenge(familyID uuid.UUID, challenge models.FamilyChallenge) error
	UpdateFamilyBudget(familyID uuid.UUID, amount float64) error

	// Monthly Budget Plans
	SetMonthlyBudget(familyID, userID uuid.UUID, month, year int, amount float64) error
	UpdateMemberBudget(familyID, userID uuid.UUID, amount float64, targetUserID *uuid.UUID) error
	GetCoachAnalysis(familyID, userID uuid.UUID, role string, month int, year int) (*repositories.CoachAnalysis, error)
}

type financeService struct {
	repo         repositories.FinanceRepository
	walletRepo   repositories.WalletRepository
	behaviorRepo repositories.BehaviorRepository
	assetRepo    repositories.AssetRepository
	goalRepo     repositories.GoalRepository
	budgetRepo   repositories.BudgetRepository
	aiService    AIService
}

func NewFinanceService(
	repo repositories.FinanceRepository,
	walletRepo repositories.WalletRepository,
	behaviorRepo repositories.BehaviorRepository,
	assetRepo repositories.AssetRepository,
	goalRepo repositories.GoalRepository,
	budgetRepo repositories.BudgetRepository,
	aiService AIService,
) FinanceService {
	return &financeService{
		repo:         repo,
		walletRepo:   walletRepo,
		behaviorRepo: behaviorRepo,
		assetRepo:    assetRepo,
		goalRepo:     goalRepo,
		budgetRepo:   budgetRepo,
		aiService:    aiService,
	}
}

func (s *financeService) GetTransactionsByRange(familyID, userID uuid.UUID, role string, startDate, endDate time.Time) ([]models.Transaction, error) {
	return s.repo.GetTransactionsByRange(familyID, userID, role, startDate, endDate)
}

func (s *financeService) GetMonthlyTransactions(familyID, userID uuid.UUID, role string, month int, year int) ([]models.Transaction, error) {
	return s.repo.GetMonthlyTransactions(familyID, userID, role, month, year)
}

func (s *financeService) CreateBulkTransactions(txs []models.Transaction) error {
	dbTx := config.DB.Begin()
	for i := range txs {
		if err := s.createTransactionWithDB(dbTx, &txs[i]); err != nil {
			dbTx.Rollback()
			return err
		}
	}
	return dbTx.Commit().Error
}

func (s *financeService) GetDashboardSummary(familyID, userID uuid.UUID, role string, month int, year int) (*repositories.DashboardSummary, error) {
	return s.repo.GetDashboardSummary(familyID, userID, role, month, year)
}

func (s *financeService) GetBehaviorSummary(familyID uuid.UUID, period string) (*repositories.BehaviorSummary, error) {
	return s.behaviorRepo.GetBehaviorSummary(familyID, period)
}

func (s *financeService) GetCoachAnalysis(familyID, userID uuid.UUID, role string, month int, year int) (*repositories.CoachAnalysis, error) {
	// 1. Gather Basic Summary
	summary, err := s.repo.GetDashboardSummary(familyID, userID, role, month, year)
	if err != nil {
		return nil, err
	}

	categories, _ := s.budgetRepo.GetBudgetCategories(familyID, month, year)
	catInfo := ""
	for _, c := range categories {
		catInfo += fmt.Sprintf("- %s: %s\n", c.Name, c.Type)
	}

	// 3. Gather Goals
	goals, _ := s.goalRepo.GetByFamilyID(familyID)
	goalInfo := ""
	for _, g := range goals {
		if g.Status == "active" {
			progress := (g.CurrentBalance / g.TargetAmount) * 100
			prio := g.Priority
			if prio == "" { prio = "medium" }
			goalInfo += fmt.Sprintf("- %s: %.1f%% terisi (Target: Rp%.0f, Prioritas: %s)\n", g.Name, progress, g.TargetAmount, prio)
		}
	}

	// 4. Gather Assets
	assets, _ := s.assetRepo.GetByFamilyID(familyID)
	assetInfo := "Aset Likuid:\n"
	nonLiquidInfo := "Aset Non-Likuid:\n"
	for _, a := range assets {
		info := fmt.Sprintf("- %s: Rp%.0f (%s)\n", a.Name, a.Value, a.Description)
		if a.Type == "liquid" {
			assetInfo += info
		} else {
			nonLiquidInfo += info
		}
	}
	assetInfo += "\n" + nonLiquidInfo

	// 5. Gather Score & Persona - default to 30d for general analysis context
	behavior, _ := s.behaviorRepo.GetBehaviorSummary(familyID, "30d")
	score := 0
	if behavior != nil {
		score = behavior.Score
	}

	// Prepare detailed Category Breakdown for AI
	categoryDetail := ""
	for cat, total := range summary.CategoryExpenses {
		categoryDetail += fmt.Sprintf("- %s: Rp%.0f\n", cat, total)
	}

	// 6. Get User Info (for name)
	var user models.User
	config.DB.First(&user, "id = ?", userID)

	// 7. Prepare Multi-Layer Data for AI (v3.0 Elite Upgrade)
	income := summary.TotalIncome
	expense := summary.TotalExpense
	cashflow := income - expense
	// Calculate Ratios
	savingsRate := 0.0
	expenseRatio := 0.0
	if income > 0 {
		savingsRate = (cashflow / income) * 100
		expenseRatio = (expense / income) * 100
	} else if behavior != nil && behavior.SavingsRate > 0 {
		savingsRate = behavior.SavingsRate
	}

	// 1. Financial State (Global Level)
	status := "Sehat"
	if cashflow < 0 {
		status = "Defisit"
	} else if savingsRate < 10 {
		status = "Rentan"
	} else if savingsRate <= 30 {
		status = "Stabil"
	}
	anomalyLevel := "none"
	anomalyMsg := ""
	anomalyAction := ""
	
	percentageChange := 0.0
	if summary.TrendExpense > 0 {
		percentageChange = summary.TrendExpense / 100
	}

	seasonalCategories := []string{"Pendidikan", "Pajak", "Asuransi", "Liburan", "Zakat"}
	isSeasonal := false
	affectedCategories := []string{}
	for catName := range summary.CategoryExpenses {
		affectedCategories = append(affectedCategories, catName)
		for _, sCat := range seasonalCategories {
			if catName == sCat {
				isSeasonal = true
				break
			}
		}
	}

	if percentageChange > 0.3 {
		if !isSeasonal {
			anomalyLevel = "critical"
			anomalyMsg = "Pengeluaran naik drastis di luar pola musiman"
			anomalyAction = fmt.Sprintf("Review kategori: %v", affectedCategories)
		} else {
			anomalyLevel = "info"
			anomalyMsg = "Kenaikan wajar karena kebutuhan musiman"
			anomalyAction = "Pastikan sudah dianggarkan dengan benar"
		}
	}

	// 2. Behavioral Persona Framework (3D)
	// Sumbu X: Discipline
	discipline := "Flexible"
	if savingsRate > 20 {
		discipline = "Structured"
	} else if savingsRate > 10 {
		discipline = "Adaptive"
	}

	// Sumbu Y: Spending Nature
	totalKeinginan := 0.0
	catTypeMap := make(map[string]string)
	for _, c := range categories {
		catTypeMap[c.Name] = c.Type
	}
	for catName, total := range summary.CategoryExpenses {
		if catTypeMap[catName] == "keinginan" {
			totalKeinginan += total
		}
	}
	
	rasioKeinginan := 0.0
	if expense > 0 {
		rasioKeinginan = (totalKeinginan / expense) * 100
	}

	nature := "Essentialist"
	if rasioKeinginan > 40 {
		nature = "Experiential"
	} else if rasioKeinginan > 20 {
		nature = "Balanced"
	}

	// Sumbu Z: Consistency
	consistency := "Steady"
	if summary.TrendBalance > 20 || summary.TrendBalance < -20 {
		consistency = "Dynamic"
	}

	coachingStyle := "foundation"
	if discipline == "Structured" && nature == "Experiential" {
		coachingStyle = "growth"
	} else if discipline == "Flexible" && nature == "Essentialist" {
		coachingStyle = "foundation"
	} else if status == "Defisit" {
		coachingStyle = "defensive"
	}

	// 3. Recommendation Engine (Data-Driven)
	detailedRecs := []repositories.Recommendation{}
	
	// Leak Detection (Food)
	foodTotal := summary.CategoryExpenses["Makanan & Minuman"] + summary.CategoryExpenses["Food"]
	if foodTotal > expense*0.25 && savingsRate < 15 {
		detailedRecs = append(detailedRecs, repositories.Recommendation{
			Priority: "high",
			Text:     fmt.Sprintf("Konsumsi makanan & minuman mencapai Rp%.0f (%.0f%% total).", foodTotal, (foodTotal/expense)*100),
			Action:   "Batasi makan luar, potensi hemat Rp200rb+ bulan depan.",
			Impact:   "Bisa menaikkan Saving Rate sebesar 5-8%.",
		})
	}

	// Timing-based (Budget usage)
	today := time.Now()
	if today.Day() < 10 && expense > summary.TotalFamilyBudget*0.4 {
		detailedRecs = append(detailedRecs, repositories.Recommendation{
			Priority: "warning",
			Text:     "Penggunaan budget sangat cepat di awal bulan (40%+).",
			Action:   "Atur spending harian lebih ketat untuk sisa bulan ini.",
			Impact:   "Mencegah defisit di akhir bulan.",
		})
	}

	// Goal Acceleration
	for _, g := range goals {
		if g.TargetAmount > g.CurrentBalance {
			remaining := g.TargetAmount - g.CurrentBalance
			// Basic projection: if we keep current savings
			if cashflow > 0 {
				monthsToGoal := remaining / cashflow
				if monthsToGoal > 12 {
					detailedRecs = append(detailedRecs, repositories.Recommendation{
						Priority: "critical",
						Text:     fmt.Sprintf("Target '%s' butuh %.0f bulan lagi dengan tempo sekarang.", g.Name, monthsToGoal),
						Action:   "Tingkatkan surplus bulanan untuk akselerasi.",
						Impact:   "Mempercepat pencapaian goal sebesar 3-5 bulan.",
					})
				}
			}
		}
	}

	// 4. Predictive Analytics (Simple Moving Average)
	// We use trend to project
	projectedSpending := expense * (1 + (summary.TrendExpense / 100))
	forecastAlert := ""
	if projectedSpending > income && income > 0 {
		forecastAlert = "Peringatan: Tren pengeluaran naik, bulan depan berisiko defisit."
	}

	// Prepare AI Data
	aiData := map[string]interface{}{
		"nama_user":            user.FullName,
		"status_global":       status,
		"discipline":          discipline,
		"nature":              nature,
		"consistency":         consistency,
		"coaching_style":      coachingStyle,
		"savings_rate":       fmt.Sprintf("%.1f", savingsRate),
		"rasio_keinginan":     fmt.Sprintf("%.1f", rasioKeinginan),
		"growth":              fmt.Sprintf("%.1f", summary.TrendBalance),
		"anomaly_level":       anomalyLevel,
		"anomaly_msg":         anomalyMsg,
		"anomaly_action":      anomalyAction,
		"is_anomaly":          anomalyLevel == "critical",
		"kategori":            categoryDetail,
		"goals":               goalInfo,
		"aset":                assetInfo,
	}

	analysis, err := s.aiService.AnalyzeFinance(aiData)
	if err != nil {
		analysis = &repositories.CoachAnalysis{Ringkasan: "Analisis cerdas sedang diproses."}
	}

	// Populate final analysis
	analysis.GelarUser = fmt.Sprintf("%s %s - %s", discipline, nature, consistency)
	analysis.Status = status
	analysis.DetailedRecommendations = detailedRecs
	analysis.CoachingStyle = coachingStyle
	analysis.Score = score
	analysis.SavingsRate = savingsRate
	analysis.ExpenseRatio = expenseRatio
	
	compMsg := "Pengeluaran stabil"
	if summary.TrendExpense > 0 {
		compMsg = fmt.Sprintf("Naik %.0f%% dari bln lalu", summary.TrendExpense)
	} else if summary.TrendExpense < 0 {
		compMsg = fmt.Sprintf("Turun %.0f%% dari bln lalu", -summary.TrendExpense)
	}
	analysis.Comparison = compMsg

	analysis.Forecast = &repositories.Forecast{
		PredictedSpending: projectedSpending,
		Confidence:        "Medium",
		Alert:             forecastAlert,
	}

	return analysis, nil
}

func (s *financeService) JoinChallenge(familyID uuid.UUID, challenge models.FamilyChallenge) error {
	return s.behaviorRepo.JoinChallenge(familyID, challenge)
}

func (s *financeService) CreateTransaction(tx *models.Transaction) error {
	dbTx := config.DB.Begin()
	if err := s.createTransactionWithDB(dbTx, tx); err != nil {
		dbTx.Rollback()
		return err
	}
	return dbTx.Commit().Error
}

func (s *financeService) DeleteTransaction(id uuid.UUID, familyID uuid.UUID, date time.Time, requestingUserID uuid.UUID, role string) error {
	dbTx := config.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			dbTx.Rollback()
		}
	}()

	// 1. Fetch transaction with pruning hint
	tx, err := s.repo.GetByID(id, familyID, date)
	if err != nil {
		dbTx.Rollback()
		return err
	}

	// Ownership check: ONLY the original creator (tx.UserID) can delete
	if tx.UserID != requestingUserID && tx.UserID != uuid.Nil {
		dbTx.Rollback()
		return fmt.Errorf("anda tidak memiliki izin untuk menghapus transaksi ini. Hanya pembuat transaksi yang diperbolehkan.")
	}

	// Safety check
	if tx.FamilyID != familyID {
		dbTx.Rollback()
		return fmt.Errorf("transaction not found")
	}

	// 2. Revert balance impact
	if err := s.revertTransactionWithDB(dbTx, tx); err != nil {
		dbTx.Rollback()
		return err
	}

	// 3. Delete record using ID and Date (partition key)
	if err := s.repo.Delete(id, familyID, tx.Date); err != nil {
		dbTx.Rollback()
		return err
	}

	return dbTx.Commit().Error
}
func (s *financeService) DeleteSaving(id uuid.UUID) error {
	dbTx := config.DB.Begin()

	// 1. Dissociate transactions linked to this saving
	if err := dbTx.Model(&models.Transaction{}).Where("saving_id = ?", id).Update("saving_id", nil).Error; err != nil {
		dbTx.Rollback()
		return err
	}

	// 2. Delete the saving record
	if err := dbTx.Delete(&models.Saving{}, "id = ?", id).Error; err != nil {
		dbTx.Rollback()
		return err
	}

	return dbTx.Commit().Error
}

func (s *financeService) UpdateTransaction(id uuid.UUID, date time.Time, requestingUserID uuid.UUID, role string, updatedTx *models.Transaction) error {
	dbTx := config.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			dbTx.Rollback()
		}
	}()

	// 1. Fetch old transaction with pruning hint
	oldTx, err := s.repo.GetByID(id, updatedTx.FamilyID, date)
	if err != nil {
		log.Printf("[ERROR] Failed to fetch old transaction %s: %v", id, err)
		dbTx.Rollback()
		return err
	}

	// Ownership check: ONLY the original creator (oldTx.UserID) can edit
	if oldTx.UserID != requestingUserID && oldTx.UserID != uuid.Nil {
		dbTx.Rollback()
		return fmt.Errorf("anda tidak memiliki izin untuk mengubah transaksi ini. Hanya pembuat transaksi yang diperbolehkan.")
	}

	// Safety check
	if oldTx.FamilyID != updatedTx.FamilyID {
		log.Printf("[ERROR] Family ID mismatch: old=%s, new=%s", oldTx.FamilyID, updatedTx.FamilyID)
		dbTx.Rollback()
		return fmt.Errorf("transaction not found")
	}

	// 2. Revert old impact
	if err := s.revertTransactionWithDB(dbTx, oldTx); err != nil {
		log.Printf("[ERROR] Failed to revert old impact: %v", err)
		dbTx.Rollback()
		return err
	}

	// 3. Apply new impact
	if err := s.applyTransactionImpactWithDB(dbTx, updatedTx); err != nil {
		log.Printf("[ERROR] Failed to apply new impact: %v", err)
		dbTx.Rollback()
		return err
	}

	// 4. Update transaction record
	// For partitioned tables, delete then create.
	// We use ID and FamilyID. Date is used for partition pruning but we must be careful with precision.
	// Postgres will find it by ID across all partitions if needed.
	
	if err := dbTx.Model(&models.Transaction{}).
		Where("id = ? AND family_id = ?", id, oldTx.FamilyID).
		Delete(&models.Transaction{}).Error; err != nil {
		log.Printf("[ERROR] Failed to delete old record: %v", err)
		dbTx.Rollback()
		return err
	}

	updatedTx.ID = id
	if updatedTx.CreatedAt.IsZero() {
		updatedTx.CreatedAt = oldTx.CreatedAt
	}
	
	if err := dbTx.Create(updatedTx).Error; err != nil {
		log.Printf("[ERROR] Failed to create new record: %v", err)
		dbTx.Rollback()
		return err
	}

	return dbTx.Commit().Error
}

func (s *financeService) revertTransactionWithDB(dbTx *gorm.DB, tx *models.Transaction) error {
	switch tx.Type {
	case "income":
		var wallet models.Wallet
		// Critical: Locking for atomic update
		if err := dbTx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&wallet, "id = ?", tx.WalletID).Error; err != nil {
			return err
		}
		if wallet.Balance < tx.Amount {
			return fmt.Errorf("gagal menghapus: saldo %s tidak cukup untuk ditarik kembali", wallet.Name)
		}
		wallet.Balance -= tx.Amount
		return dbTx.Save(&wallet).Error

	case "expense":
		var wallet models.Wallet
		// Critical: Locking for atomic update
		if err := dbTx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&wallet, "id = ?", tx.WalletID).Error; err != nil {
			return err
		}
		wallet.Balance += tx.Amount
		if err := dbTx.Save(&wallet).Error; err != nil {
			return err
		}

		if tx.SavingID != nil && *tx.SavingID != uuid.Nil {
			var saving models.Saving
			// Critical: Locking for atomic update
			if err := dbTx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&saving, "id = ?", *tx.SavingID).Error; err == nil {
				saving.CurrentBalance += tx.Amount
				if err := dbTx.Save(&saving).Error; err != nil {
					return err
				}
			}
		}
		return nil

	case "transfer":
		var fromWallet, toWallet models.Wallet
		// Critical: Locking for atomic update
		if err := dbTx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&fromWallet, "id = ?", tx.WalletID).Error; err != nil {
			return err
		}
		if tx.ToWalletID != nil {
			// Critical: Locking for atomic update
			if err := dbTx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&toWallet, "id = ?", *tx.ToWalletID).Error; err != nil {
				return err
			}
			if toWallet.Balance < tx.Amount {
				return fmt.Errorf("gagal menghapus: saldo %s tidak cukup untuk dikembalikan", toWallet.Name)
			}
			toWallet.Balance -= tx.Amount
			if err := dbTx.Save(&toWallet).Error; err != nil {
				return err
			}
		}
		fromWallet.Balance += (tx.Amount + tx.Fee)
		return dbTx.Save(&fromWallet).Error

	case "saving":
		var wallet models.Wallet
		var saving models.Saving
		// Critical: Locking for atomic update
		if err := dbTx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&wallet, "id = ?", tx.WalletID).Error; err != nil {
			return err
		}
		if tx.SavingID != nil {
			// Critical: Locking for atomic update
			if err := dbTx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&saving, "id = ?", *tx.SavingID).Error; err != nil {
				return err
			}
			if saving.CurrentBalance < tx.Amount {
				return fmt.Errorf("gagal menghapus: saldo alokasi %s tidak cukup", saving.Name)
			}
			saving.CurrentBalance -= tx.Amount
			if err := dbTx.Save(&saving).Error; err != nil {
				return err
			}
		}
		wallet.Balance += tx.Amount
		return dbTx.Save(&wallet).Error
	case "goal_allocation":
		var wallet models.Wallet
		var goal models.Goal
		if err := dbTx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&wallet, "id = ?", tx.WalletID).Error; err != nil {
			return err
		}
		if tx.GoalID != nil {
			if err := dbTx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&goal, "id = ?", *tx.GoalID).Error; err != nil {
				return err
			}
			if goal.CurrentBalance < tx.Amount {
				return fmt.Errorf("gagal menghapus: saldo alokasi goal %s tidak cukup", goal.Name)
			}
			goal.CurrentBalance -= tx.Amount
			if err := dbTx.Save(&goal).Error; err != nil {
				return err
			}
		}
		wallet.Balance += tx.Amount
		return dbTx.Save(&wallet).Error
	}
	return nil
}

// Rename the internal create logic to be generic "apply impact"
func (s *financeService) applyTransactionImpactWithDB(dbTx *gorm.DB, tx *models.Transaction) error {
	if tx.Amount <= 0 {
		return fmt.Errorf("nominal transaksi tidak boleh nol atau negatif")
	}

	switch tx.Type {
	case "income":
		var wallet models.Wallet
		// Critical: Locking for atomic update
		if err := dbTx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&wallet, "id = ?", tx.WalletID).Error; err != nil {
			return err
		}
		wallet.Balance += tx.Amount
		return dbTx.Save(&wallet).Error

	case "expense":
		var wallet models.Wallet
		// Critical: Locking for atomic update
		if err := dbTx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&wallet, "id = ?", tx.WalletID).Error; err != nil {
			return err
		}
		if wallet.Balance < tx.Amount {
			return fmt.Errorf("insufficient balance in %s", wallet.Name)
		}
		wallet.Balance -= tx.Amount
		if err := dbTx.Save(&wallet).Error; err != nil {
			return err
		}

		if tx.SavingID != nil && *tx.SavingID != uuid.Nil {
			var saving models.Saving
			// Critical: Locking for atomic update
			if err := dbTx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&saving, "id = ?", *tx.SavingID).Error; err == nil {
				// We allow negative balance (over-budget/over-allocation)
				saving.CurrentBalance -= tx.Amount
				if err := dbTx.Save(&saving).Error; err != nil {
					return err
				}
			}
		}

		return nil

	case "transfer":
		var fromWallet models.Wallet
		// Critical: Locking for atomic update
		if err := dbTx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&fromWallet, "id = ?", tx.WalletID).Error; err != nil {
			return err
		}
		if tx.ToWalletID == nil {
			return fmt.Errorf("destination wallet is required for transfer")
		}
		var toWallet models.Wallet
		// Critical: Locking for atomic update
		if err := dbTx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&toWallet, "id = ?", *tx.ToWalletID).Error; err != nil {
			return err
		}

		totalDeduction := tx.Amount + tx.Fee
		if fromWallet.Balance < totalDeduction {
			return fmt.Errorf("insufficient balance in %s for transfer", fromWallet.Name)
		}

		fromWallet.Balance -= totalDeduction
		toWallet.Balance += tx.Amount

		if err := dbTx.Save(&fromWallet).Error; err != nil {
			return err
		}
		return dbTx.Save(&toWallet).Error

	case "saving":
		if tx.SavingID == nil {
			return fmt.Errorf("saving ID is required")
		}
		var wallet models.Wallet
		// Critical: Locking for atomic update
		if err := dbTx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&wallet, "id = ?", tx.WalletID).Error; err != nil {
			return err
		}
		var saving models.Saving
		// Critical: Locking for atomic update
		if err := dbTx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&saving, "id = ?", tx.SavingID).Error; err != nil {
			return err
		}
		if wallet.Balance < tx.Amount {
			return fmt.Errorf("insufficient balance")
		}
		wallet.Balance -= tx.Amount
		saving.CurrentBalance += tx.Amount
		if err := dbTx.Save(&wallet).Error; err != nil {
			return err
		}
		return dbTx.Save(&saving).Error
	case "goal_allocation":
		if tx.GoalID == nil {
			return fmt.Errorf("goal ID is required")
		}
		var wallet models.Wallet
		if err := dbTx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&wallet, "id = ?", tx.WalletID).Error; err != nil {
			return err
		}
		var goal models.Goal
		if err := dbTx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&goal, "id = ?", tx.GoalID).Error; err != nil {
			return err
		}
		if wallet.Balance < tx.Amount {
			return fmt.Errorf("saldo dompet tidak cukup")
		}
		wallet.Balance -= tx.Amount
		if goal.CurrentBalance+tx.Amount > goal.TargetAmount {
			return fmt.Errorf("nominal melebihi sisa target goal (Sisa: Rp %.0f)", goal.TargetAmount-goal.CurrentBalance)
		}
		goal.CurrentBalance += tx.Amount
		if err := dbTx.Save(&wallet).Error; err != nil {
			return err
		}
		return dbTx.Save(&goal).Error
	}
	return fmt.Errorf("invalid type")
}

func (s *financeService) createTransactionWithDB(dbTx *gorm.DB, tx *models.Transaction) error {
	if err := s.applyTransactionImpactWithDB(dbTx, tx); err != nil {
		return err
	}
	return dbTx.Create(tx).Error
}

func (s *financeService) UpdateFamilyBudget(familyID uuid.UUID, amount float64) error {
	return config.DB.Model(&models.Family{}).Where("id = ?", familyID).Update("monthly_budget", amount).Error
}

func (s *financeService) SetMonthlyBudget(familyID, userID uuid.UUID, month, year int, amount float64) error {
	return s.repo.SetMonthlyBudget(familyID, userID, month, year, amount)
}

func (s *financeService) UpdateMemberBudget(familyID, userID uuid.UUID, amount float64, targetUserID *uuid.UUID) error {
	// If it's a specific month (currently we don't pass month/year here, 
	// but the controller can call SetMonthlyBudget instead if context is provided).
	// This existing method is for the default monthly budget in FamilyMember table.
	
	idToUpdate := userID
	if targetUserID != nil {
		idToUpdate = *targetUserID
	}
	
	return config.DB.Model(&models.FamilyMember{}).
		Where("family_id = ? AND user_id = ?", familyID, idToUpdate).
		Update("monthly_budget", amount).Error
}
