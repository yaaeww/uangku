package repositories

import (
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type BehavioralInsight struct {
	Type        string `json:"type"` // warning, success, info
	Title       string `json:"title"`
	Description string `json:"description"`
	Action      string `json:"action"`
}

type MemberProfile struct {
	UserID    uuid.UUID `json:"user_id"`
	FullName  string    `json:"full_name"`
	Trait     string    `json:"trait"` // Siluman Tabungan, Si Laper Mata, Si Paling Hemat, Si Tukang Catat
	Description string   `json:"description"`
	TotalSpend float64   `json:"total_spend"`
	SavingRate float64   `json:"saving_rate"`
}

type BehaviorSummary struct {
	Score              int                     `json:"score"`
	Insights           []BehavioralInsight     `json:"insights"`
	Challenge          *models.FamilyChallenge `json:"challenge"` // Suggested challenge
	ActiveChallenges   []models.FamilyChallenge `json:"active_challenges"`
	LifestyleInflation float64                 `json:"lifestyle_inflation"`
	SavingsRate        float64                 `json:"savings_rate"`
	MemberProfiles     []MemberProfile         `json:"member_profiles"`
	MostExpensiveDay   string                  `json:"most_expensive_day"`
	BorosDayReason     string                  `json:"boros_day_reason"`
	NetWorthGrowth     float64                 `json:"net_worth_growth"`
	IsDataSufficient   bool                    `json:"is_data_sufficient"`
}

type BehaviorRepository interface {
	GetBehaviorSummary(familyID uuid.UUID, period string) (*BehaviorSummary, error)
	JoinChallenge(familyID uuid.UUID, challenge models.FamilyChallenge) error
}

type behaviorRepository struct{}

func NewBehaviorRepository() BehaviorRepository {
	return &behaviorRepository{}
}

func (r *behaviorRepository) JoinChallenge(familyID uuid.UUID, challenge models.FamilyChallenge) error {
	challenge.ID = uuid.New()
	challenge.FamilyID = familyID
	challenge.Status = "active"
	now := time.Now()
	challenge.StartDate = &now
	
	// Default 7 days duration
	end := now.AddDate(0, 0, 7)
	challenge.EndDate = &end
	
	return config.DB.Create(&challenge).Error
}

func (r *behaviorRepository) GetBehaviorSummary(familyID uuid.UUID, period string) (*BehaviorSummary, error) {
	summary := &BehaviorSummary{
		Score:            0, 
		Insights:         []BehavioralInsight{},
		ActiveChallenges: []models.FamilyChallenge{},
		MemberProfiles:   []MemberProfile{},
		IsDataSufficient: false,
	}

	now := time.Now()
	thisMonthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
	
	var startDate time.Time
	
	switch period {
	case "7d":
		startDate = now.AddDate(0, 0, -7)
	case "30d":
		startDate = now.AddDate(0, 0, -30)
	case "1y":
		startDate = now.AddDate(-1, 0, 0)
	default: // 90d default
		startDate = now.AddDate(0, 0, -90)
	}

	// --- 0. Fetch Active Challenges & Track Progress ---
	var activeChallenges []models.FamilyChallenge
	config.DB.Where("family_id = ? AND status = ?", familyID, "active").Find(&activeChallenges)
	
	for i := range activeChallenges {
		ch := &activeChallenges[i]
		if ch.EndDate != nil && ch.EndDate.Before(now) {
			ch.Status = "completed"
			config.DB.Save(ch)
			continue
		}

		switch ch.Type {
		case "no_spend_day":
			var dow int
			fmt.Sscanf(ch.Metadata, `{"dow": %d}`, &dow)
			
			var spendOnDay float64
			config.DB.Model(&models.Transaction{}).
				Where("family_id = ? AND date >= ? AND date <= ? AND type = 'expense' AND EXTRACT(DOW FROM date) = ?", familyID, ch.StartDate, now, dow).
				Select("COALESCE(SUM(amount), 0)").Scan(&spendOnDay)
			
			if spendOnDay > 0 {
				ch.Points = 0 
				ch.Description += " (Wah bocor! Ada pengeluaran di hari ini)"
			} else {
				duration := ch.EndDate.Sub(*ch.StartDate).Hours() / 24
				elapsed := now.Sub(*ch.StartDate).Hours() / 24
				if duration > 0 {
					ch.Points = int((elapsed / duration) * 100)
				}
			}
		case "scanner_ninja":
			var scanCount int64
			config.DB.Model(&models.Transaction{}).
				Where("family_id = ? AND category = ? AND date >= ?", familyID, "AI_SCAN", ch.StartDate).
				Count(&scanCount)
			ch.Points = int(float64(scanCount) / 10.0 * 100)
		case "keluarga_kompak":
			var memberCount int64
			config.DB.Model(&models.Transaction{}).
				Select("DISTINCT user_id").
				Where("family_id = ? AND date >= ?", familyID, ch.StartDate).
				Count(&memberCount)
			ch.Points = int(float64(memberCount) / 3.0 * 100)
		}

		if ch.Points > 100 { ch.Points = 100 }
		summary.ActiveChallenges = append(summary.ActiveChallenges, *ch)
	}

	// 1. Calculate Savings Rate (This Month)
	var totalIncome, totalSavings float64
	config.DB.Model(&models.Transaction{}).
		Where("family_id = ? AND date >= ? AND type = 'income'", familyID, thisMonthStart).
		Select("COALESCE(SUM(amount), 0)").Scan(&totalIncome)

	config.DB.Table("transactions").
		Joins("LEFT JOIN savings ON transactions.saving_id = savings.id").
		Joins("LEFT JOIN budget_categories ON savings.budget_category_id = budget_categories.id").
		Where("transactions.family_id = ? AND transactions.date >= ? AND (transactions.type IN ('saving', 'goal_allocation') OR budget_categories.name = 'Tabungan' OR transactions.category = 'Tabungan')", familyID, thisMonthStart).
		Select("COALESCE(SUM(transactions.amount), 0)").Scan(&totalSavings)

	if totalIncome > 0 || totalSavings > 0 {
		summary.IsDataSufficient = true
		summary.Score = 75 // Start from base if there is activity
	}

	if totalIncome > 0 {
		summary.SavingsRate = (totalSavings / totalIncome) * 100
		if summary.SavingsRate >= 20 {
			summary.Insights = append(summary.Insights, BehavioralInsight{
				Type:        "success",
				Title:       "Prajurit Tabungan",
				Description: "Kamu sudah menabung di atas 20% pendapatan bulan ini. Pertahankan!",
				Action:      "Teruskan alokasi otomatis kamu.",
			})
			summary.Score += 10
		} else if summary.SavingsRate < 10 {
			summary.Insights = append(summary.Insights, BehavioralInsight{
				Type:        "warning",
				Title:       "Tabungan Tipis",
				Description: "Tabunganmu masih di bawah 10% pendapatan.",
				Action:      "Coba kurangi kategori 'Keinginan' minggu depan.",
			})
			summary.Score -= 10
		}
	}

	// 2. Accurate Boros Day Analysis (3 Months History)
	type DaySpend struct {
		DOW   int
		Total float64
	}
	var highest DaySpend
	config.DB.Table("transactions").
		Select("CAST(EXTRACT(DOW FROM date) AS INTEGER) as dow, sum(amount) as total").
		Where("family_id = ? AND date >= ? AND type = 'expense'", familyID, startDate).
		Group("dow").
		Order("total DESC").
		Limit(1).
		Scan(&highest)

	daysMap := map[int]string{0: "Minggu", 1: "Senin", 2: "Selasa", 3: "Rabu", 4: "Kamis", 5: "Jumat", 6: "Sabtu"}
	if highest.Total > 0 {
		summary.MostExpensiveDay = daysMap[highest.DOW]
		
		// Find reasons (popular category on that day)
		var topCategory struct {
			Category string
		}
		config.DB.Table("transactions").
			Select("category").
			Where("family_id = ? AND date >= ? AND type = 'expense' AND EXTRACT(DOW FROM date) = ?", familyID, startDate, highest.DOW).
			Group("category").
			Order("sum(amount) DESC").
			Limit(1).
			Scan(&topCategory)
		
		if topCategory.Category != "" {
			summary.BorosDayReason = fmt.Sprintf("Kategori '%s' paling mendominasi di hari ini.", topCategory.Category)
			summary.Insights = append(summary.Insights, BehavioralInsight{
				Type:        "info",
				Title:       "Misteri Hari " + summary.MostExpensiveDay,
				Description: fmt.Sprintf("Data analisis menunjukkan pengeluaran terbesarmu ada di Hari %s, dipicu oleh %s.", summary.MostExpensiveDay, topCategory.Category),
				Action:      "Coba batasi budget khusus kategori tersebut di hari " + summary.MostExpensiveDay + ".",
			})
		}
	}

	// 3. Net Worth & Growth (Assets + Wallets - Debts)
	var assetVal, walletVal, debtVal float64
	config.DB.Model(&models.Asset{}).Where("family_id = ?", familyID).Select("COALESCE(SUM(value), 0)").Scan(&assetVal)
	config.DB.Model(&models.Wallet{}).Where("family_id = ?", familyID).Select("COALESCE(SUM(balance), 0)").Scan(&walletVal)
	config.DB.Model(&models.Debt{}).Where("family_id = ?", familyID).Select("COALESCE(SUM(remaining_amount), 0)").Scan(&debtVal)
	
	netWorth := assetVal + walletVal - debtVal
	
	if netWorth > 0 {
		if debtVal > (assetVal+walletVal) * 0.5 {
			summary.Insights = append(summary.Insights, BehavioralInsight{
				Type:        "warning",
				Title:       "Rasio Hutang Tinggi",
				Description: "Hutangmu sudah melebihi 50% aset lancar. Ini sinyal merah!",
				Action:      "Gunakan bonus atau dana nganggur buat pelunasan hutang.",
			})
			summary.Score -= 20
		}
	}

	// 4. Member Profiling & Character Analysis (Deep Analysis - BATCH OPTIMIZED)
	var familyMembers []models.FamilyMember
	config.DB.Preload("User").Where("family_id = ?", familyID).Find(&familyMembers)

	type memberStatsResult struct {
		UserID      uuid.UUID
		Income      float64
		Expense     float64
		DebtPay     float64
		Savings     float64
		TxCount     int64
	}
	var rawStats []memberStatsResult

	// Consolidated query for all member aggregated stats in one go
	// This uses the new performance index (family_id, type, date) effectively
	config.DB.Table("transactions").
		Select(`
			user_id,
			SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
			SUM(CASE WHEN type = 'expense' AND (category IS NULL OR (category != 'debt_payment' AND category != 'Tabungan')) THEN amount ELSE 0 END) as expense,
			SUM(CASE WHEN category = 'debt_payment' THEN amount ELSE 0 END) as debt_pay,
			SUM(CASE WHEN type IN ('saving', 'goal_allocation') OR category = 'Tabungan' THEN amount ELSE 0 END) as savings,
			COUNT(*) as tx_count
		`).
		Where("family_id = ? AND date >= ?", familyID, startDate).
		Group("user_id").
		Scan(&rawStats)

	statsMap := make(map[uuid.UUID]memberStatsResult)
	for _, s := range rawStats {
		statsMap[s.UserID] = s
	}

	for _, member := range familyMembers {
		s := statsMap[member.UserID]
		
		totalSaved := s.Savings
		savingRate := 0.0
		if s.Income > 0 {
			savingRate = (totalSaved / s.Income) * 100
		}

		profile := MemberProfile{
			UserID:     member.UserID,
			FullName:   member.User.FullName,
			TotalSpend: s.Expense + s.DebtPay,
			SavingRate: savingRate,
			Trait:      "Petualang Keuangan", // Default
			Description: "Masih mencari ritme keuangan yang pas. Konsistensi mencatat adalah kuncinya!",
		}

		// Analysis priority
		if profile.SavingRate >= 20 {
			profile.Trait = "Si Rajin Menabung"
			profile.Description = "Masa depan cerah di tanganmu. Rutin mengumpulkan pundi-pundi untuk target besar keluarga!"
		} else if profile.SavingRate >= 10 {
			profile.Trait = "Si Paling Hemat"
			profile.Description = "Ahli efisiensi. Mampu menyisihkan dana meski banyak godaan belanja di sana-sini."
		} else if s.DebtPay > 0 {
			profile.Trait = "Si Pelunas Hutang"
			profile.Description = "Gagah berani memberantas tunggakan. Menjaga skor kredit keluarga tetap bersih dan aman!"
		} else if s.TxCount >= 5 {
			profile.Trait = "Si Tukang Catat"
			profile.Description = "Disiplin luar biasa! Setiap rupiah yang keluar masuk tidak luput dari pantauan ketatmu."
		} else if profile.TotalSpend > 0 && profile.SavingRate < 5 {
			profile.Trait = "Si Laper Mata"
			profile.Description = "Waduh, dompet sering bocor nih! Coba cek lagi kategori 'Keinginan' minggu ini bosku."
		}
		
		summary.MemberProfiles = append(summary.MemberProfiles, profile)
	}


	// 5. Dynamic Challenge Suggestion
	if summary.MostExpensiveDay != "" && summary.Challenge == nil {
		summary.Challenge = &models.FamilyChallenge{
			Type:        "no_spend_day",
			Title:       "Misi: No-Spend " + summary.MostExpensiveDay,
			Description: "Kami mendeteksi Hari " + summary.MostExpensiveDay + " adalah waktu 'bocor' terbesarmu. Sanggupkah bosku nol rupiah di hari itu?",
			Points:      150,
			Metadata:    fmt.Sprintf(`{"dow": %d}`, highest.DOW),
		}
	}

	// 6. Last Safety Check for Data Sufficiency
	if !summary.IsDataSufficient {
		var txCount int64
		config.DB.Model(&models.Transaction{}).Where("family_id = ?", familyID).Count(&txCount)
		if txCount > 0 || assetVal > 0 || walletVal > 0 {
			summary.IsDataSufficient = true
			if summary.Score == 0 { summary.Score = 75 }
		}
	}

	if !summary.IsDataSufficient {
		summary.Score = 0
		summary.Insights = append(summary.Insights, BehavioralInsight{
			Type:        "info",
			Title:       "Selamat Datang di Panduan Cerdas!",
			Description: "Kami belum memiliki data yang cukup untuk menganalisis perilaku keuangan keluargamu.",
			Action:      "Mulai catat transaksi atau tambah dompet pertamamu.",
		})
	}

	// Clamp score
	if summary.Score > 100 { summary.Score = 100 }
	if summary.Score < 0 { summary.Score = 0 }

	return summary, nil
}
