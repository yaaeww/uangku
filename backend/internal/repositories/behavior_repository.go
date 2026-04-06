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
	var durationDays float64
	
	switch period {
	case "7d":
		startDate = now.AddDate(0, 0, -7)
		durationDays = 7
	case "30d":
		startDate = now.AddDate(0, 0, -30)
		durationDays = 30
	case "1y":
		startDate = now.AddDate(-1, 0, 0)
		durationDays = 365
	default: // 90d default
		startDate = now.AddDate(0, 0, -90)
		durationDays = 90
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

	// 4. Member Profiling & Character Analysis (Deep Analysis)
	var familyMembers []models.FamilyMember
	config.DB.Preload("User").Where("family_id = ?", familyID).Find(&familyMembers)

	type memberStats struct {
		profile    MemberProfile
		debtPay    float64
		pureSpend  float64
		totalSaved float64
		txCount    int64
	}
	var statsList []memberStats
	var maxDebtPay, maxPureSpend, maxSaved float64
	var maxTxCount int64

	for _, member := range familyMembers {
		var memberIncome, memberExpense, memberSavings, memberDebtPay float64
		// Dynamic period analysis
		config.DB.Model(&models.Transaction{}).Where("family_id = ? AND user_id = ? AND date >= ? AND type = 'income'", familyID, member.UserID, startDate).Select("COALESCE(SUM(amount), 0)").Scan(&memberIncome)
		config.DB.Model(&models.Transaction{}).Where("family_id = ? AND user_id = ? AND date >= ? AND type = 'expense' AND category != 'debt_payment'", familyID, member.UserID, startDate).Select("COALESCE(SUM(amount), 0)").Scan(&memberExpense)
		config.DB.Table("transactions").
			Joins("LEFT JOIN savings ON transactions.saving_id = savings.id").
			Joins("LEFT JOIN budget_categories ON savings.budget_category_id = budget_categories.id").
			Where("transactions.family_id = ? AND transactions.user_id = ? AND transactions.date >= ? AND (transactions.type IN ('saving', 'goal_allocation') OR budget_categories.name = 'Tabungan' OR transactions.category = 'Tabungan')", familyID, member.UserID, startDate).
			Select("COALESCE(SUM(transactions.amount), 0)").Scan(&memberSavings)
		config.DB.Model(&models.Transaction{}).Where("family_id = ? AND user_id = ? AND date >= ? AND category = 'debt_payment'", familyID, member.UserID, startDate).Select("COALESCE(SUM(amount), 0)").Scan(&memberDebtPay)

		totalSaved := memberSavings
		savingRate := 0.0
		if memberIncome > 0 {
			savingRate = (totalSaved / memberIncome) * 100
		}

		// Count transaction frequency for Si Tukang Catat
		var txCount int64
		config.DB.Model(&models.Transaction{}).Where("family_id = ? AND user_id = ? AND date >= ?", familyID, member.UserID, startDate).Count(&txCount)

		stats := memberStats{
			profile: MemberProfile{
				UserID:     member.UserID,
				FullName:   member.User.FullName,
				TotalSpend: memberExpense + memberDebtPay,
				SavingRate: savingRate,
				Trait:      "Petualang Keuangan", // Default
				Description: "Masih mencari ritme keuangan yang pas. Konsistensi mencatat adalah kuncinya!",
			},
			debtPay:    memberDebtPay,
			pureSpend:  memberExpense,
			totalSaved: totalSaved,
			txCount:    txCount,
		}
		statsList = append(statsList, stats)

		if memberDebtPay > maxDebtPay { maxDebtPay = memberDebtPay }
		if memberExpense > maxPureSpend { maxPureSpend = memberExpense }
		if totalSaved > maxSaved { maxSaved = totalSaved }
		if txCount > maxTxCount { maxTxCount = txCount }
	}

	// 5. Assign Titles (Panduan Personas)
	for i := range statsList {
		s := &statsList[i]
		
		// Priority 1: High Savers
		if s.profile.SavingRate >= 20 {
			s.profile.Trait = "Si Rajin Menabung"
			s.profile.Description = "Masa depan cerah di tanganmu. Rutin mengumpulkan pundi-pundi untuk target besar keluarga!"
		} else if s.profile.SavingRate >= 10 {
			s.profile.Trait = "Si Paling Hemat"
			s.profile.Description = "Ahli efisiensi. Mampu menyisihkan dana meski banyak godaan belanja di sana-sini."
		} else if s.debtPay > 0 && (maxDebtPay == 0 || s.debtPay >= maxDebtPay*0.8) {
			// Priority 2: Debt Fighters
			s.profile.Trait = "Si Pelunas Hutang"
			s.profile.Description = "Gagah berani memberantas tunggakan. Menjaga skor kredit keluarga tetap bersih dan aman!"
		} else if (durationDays <= 7 && s.txCount >= 3) || (durationDays > 7 && durationDays <= 30 && s.txCount >= 8) || (durationDays > 30 && s.txCount >= 15) {
			// Priority 3: Diligent Recorders
			s.profile.Trait = "Si Tukang Catat"
			s.profile.Description = "Disiplin luar biasa! Setiap rupiah yang keluar masuk tidak luput dari pantauan ketatmu."
		} else if s.profile.TotalSpend > 0 && s.profile.SavingRate < 5 {
			// Priority 4: High Spenders / Needs improvement
			s.profile.Trait = "Si Laper Mata"
			s.profile.Description = "Waduh, dompet sering bocor nih! Coba cek lagi kategori 'Keinginan' minggu ini bosku."
		} else {
			// Default
			s.profile.Trait = "Petualang Keuangan"
			s.profile.Description = "Masih mencari ritme keuangan yang pas. Konsistensi mencatat adalah kunci kesuksesanmu!"
		}
		
		summary.MemberProfiles = append(summary.MemberProfiles, s.profile)
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
