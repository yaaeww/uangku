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
}

type BehaviorRepository interface {
	GetBehaviorSummary(familyID uuid.UUID) (*BehaviorSummary, error)
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

func (r *behaviorRepository) GetBehaviorSummary(familyID uuid.UUID) (*BehaviorSummary, error) {
	summary := &BehaviorSummary{
		Score:            75, // Base score
		Insights:         []BehavioralInsight{},
		ActiveChallenges: []models.FamilyChallenge{},
		MemberProfiles:   []MemberProfile{},
	}

	now := time.Now()
	thisMonthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
	prevMonthStart := thisMonthStart.AddDate(0, -1, 0)

	// --- 0. Fetch Active Challenges & Track Progress ---
	var activeChallenges []models.FamilyChallenge
	config.DB.Where("family_id = ? AND status = ?", familyID, "active").Find(&activeChallenges)
	
	for i := range activeChallenges {
		ch := &activeChallenges[i]
		// Auto-fail if expired (simplified: auto-complete)
		if ch.EndDate != nil && ch.EndDate.Before(now) {
			ch.Status = "completed"
			config.DB.Save(ch)
			continue
		}

		// Dynamic Progress Calculation
		switch ch.Type {
		case "no_spend_day":
			// Check if they actually spent anything on the target day
			var dow int
			// Metadata stores {"dow": 0}
			fmt.Sscanf(ch.Metadata, `{"dow": %d}`, &dow)
			
			var spendOnDay float64
			config.DB.Model(&models.Transaction{}).
				Where("family_id = ? AND date >= ? AND date <= ? AND type = 'expense' AND EXTRACT(DOW FROM date) = ?", familyID, ch.StartDate, now, dow).
				Select("COALESCE(SUM(amount), 0)").Scan(&spendOnDay)
			
			if spendOnDay > 0 {
				ch.Points = 0 // Failed/Interrupted progress
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

		if ch.Points > 100 {
			ch.Points = 100
		}
		summary.ActiveChallenges = append(summary.ActiveChallenges, *ch)
	}

	// 1. Calculate Savings Rate
	var totalIncome, totalSavings float64
	config.DB.Model(&models.Transaction{}).
		Where("family_id = ? AND date >= ? AND type = 'income'", familyID, thisMonthStart).
		Select("COALESCE(SUM(amount), 0)").Scan(&totalIncome)

	config.DB.Model(&models.Transaction{}).
		Where("family_id = ? AND date >= ? AND (type = 'saving' OR category = 'Tabungan')", familyID, thisMonthStart).
		Select("COALESCE(SUM(amount), 0)").Scan(&totalSavings)

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

	// 2. Detect Weekend Spikes (Behavioral Pattern)
	var weekendSpend, weekdaySpend float64
	var weekendCount, weekdayCount int64
	
	config.DB.Model(&models.Transaction{}).
		Where("family_id = ? AND date >= ? AND type = 'expense' AND EXTRACT(DOW FROM date) IN (0,6)", familyID, thisMonthStart).
		Select("COALESCE(SUM(amount), 0)").Scan(&weekendSpend)
	config.DB.Model(&models.Transaction{}).
		Where("family_id = ? AND date >= ? AND type = 'expense' AND EXTRACT(DOW FROM date) IN (0,6)", familyID, thisMonthStart).
		Count(&weekendCount)
	
	config.DB.Model(&models.Transaction{}).
		Where("family_id = ? AND date >= ? AND type = 'expense' AND EXTRACT(DOW FROM date) NOT IN (0,6)", familyID, thisMonthStart).
		Select("COALESCE(SUM(amount), 0)").Scan(&weekdaySpend)
	config.DB.Model(&models.Transaction{}).
		Where("family_id = ? AND date >= ? AND type = 'expense' AND EXTRACT(DOW FROM date) NOT IN (0,6)", familyID, thisMonthStart).
		Count(&weekdayCount)

	if weekendCount > 0 && weekdayCount > 0 && weekendSpend > weekdaySpend*1.5 {
		summary.Insights = append(summary.Insights, BehavioralInsight{
			Type:        "info",
			Title:       "Weekend Warrior Detected",
			Description: "Pengeluaran akhir pekanmu 50% lebih tinggi dari hari kerja.",
			Action:      "Waspadai impulse buying saat jalan-jalan di mall.",
		})
		summary.Score -= 5
	}

	// 3. Lifestyle Inflation (Comparison with prev month discretionary spend)
	var thisMonthDiscretionary, prevMonthDiscretionary float64
	// Discretionary usually means 'Keinginan' or specific categories
	config.DB.Model(&models.Transaction{}).
		Where("family_id = ? AND date >= ? AND category IN ('Jajan', 'Healing', 'Gofood / Shopee Food')", familyID, thisMonthStart).
		Select("COALESCE(SUM(amount), 0)").Scan(&thisMonthDiscretionary)
	
	config.DB.Model(&models.Transaction{}).
		Where("family_id = ? AND date >= ? AND date < ? AND category IN ('Jajan', 'Healing', 'Gofood / Shopee Food')", familyID, prevMonthStart, thisMonthStart).
		Select("COALESCE(SUM(amount), 0)").Scan(&prevMonthDiscretionary)

	if prevMonthDiscretionary > 0 {
		summary.LifestyleInflation = ((thisMonthDiscretionary - prevMonthDiscretionary) / prevMonthDiscretionary) * 100
		if summary.LifestyleInflation > 20 {
			summary.Insights = append(summary.Insights, BehavioralInsight{
				Type:        "warning",
				Title:       "Lifestyle Inflation!",
				Description: "Jajan & Hiburanmu naik drastis dibanding bulan lalu.",
				Action:      "Refleksi: Apakah ini kebutuhan atau sekedar lapar mata?",
			})
			summary.Score -= 15
		}
	} else if totalIncome > 0 && (totalIncome-totalSavings) > 0 {
		summary.Insights = append(summary.Insights, BehavioralInsight{
			Type:        "info",
			Title:       "Bulan Pertama?",
			Description: "Sistem belum punya data perbandingan dari bulan lalu.",
			Action:      "Teruskan mencatat biar AI makin pintar!",
		})
	}

	// 3.5. Daily Average & Budget Utilization
	var totalExpense float64
	config.DB.Model(&models.Transaction{}).
		Where("family_id = ? AND date >= ? AND type = 'expense'", familyID, thisMonthStart).
		Select("COALESCE(SUM(amount), 0)").Scan(&totalExpense)

	if totalExpense > 0 {
		daysPassed := int(now.Sub(thisMonthStart).Hours()/24) + 1
		avgDaily := totalExpense / float64(daysPassed)
		
		summary.Insights = append(summary.Insights, BehavioralInsight{
			Type:        "info",
			Title:       "Rata-rata Harian",
			Description: fmt.Sprintf("Sejauh ini kamu rata-rata mengeluarkan Rp%.0f per hari di bulan ini.", avgDaily),
			Action:      "Gunakan angka ini sebagai patokan jajan harian.",
		})

		// Budget Utilization
		var family models.Family
		if err := config.DB.First(&family, "id = ?", familyID).Error; err == nil && family.MonthlyBudget > 0 {
			utilization := (totalExpense / family.MonthlyBudget) * 100
			if utilization > 90 {
				summary.Insights = append(summary.Insights, BehavioralInsight{
					Type:        "warning",
					Title:       "Budget Hampir Habis!",
					Description: fmt.Sprintf("Kamu sudah menggunakan %.1f%% dari anggaran bulanan.", utilization),
					Action:      "Prioritaskan pengeluaran hanya untuk kebutuhan pokok saja.",
				})
				summary.Score -= 10
			} else if utilization > 50 && daysPassed < 15 {
				summary.Insights = append(summary.Insights, BehavioralInsight{
					Type:        "warning",
					Title:       "Burn Rate Cepat",
					Description: fmt.Sprintf("Sudah pakai %.1f%% budget padahal belum pertengahan bulan.", utilization),
					Action:      "Rem sedikit pengeluaran impulsif di minggu ini.",
				})
				summary.Score -= 5
			}
		}
	}

	// Default Insight for empty state
	if len(summary.Insights) == 0 {
		if totalIncome == 0 {
			summary.Insights = append(summary.Insights, BehavioralInsight{
				Type:        "info",
				Title:       "Mulai Catat Transaksi",
				Description: "AI Coach butuh data transaksi bulan ini buat kasih saran psikologi.",
				Action:      "Scan struk belanjamu sekarang!",
			})
		} else {
			summary.Insights = append(summary.Insights, BehavioralInsight{
				Type:        "success",
				Title:       "Keuangan Stabil",
				Description: "Sejauh ini pola pengeluaranmu terlihat sangat terkendali.",
				Action:      "Coba tantangan baru buat ningkatin tabungan.",
			})
		}
	}

	// 5. Member Profiling & Character Analysis
	var familyMembers []models.FamilyMember
	config.DB.Preload("User").Where("family_id = ?", familyID).Find(&familyMembers)

	for _, member := range familyMembers {
		var memberIncome, memberExpense, memberSavings float64
		config.DB.Model(&models.Transaction{}).
			Where("family_id = ? AND user_id = ? AND date >= ? AND type = 'income'", familyID, member.UserID, thisMonthStart).
			Select("COALESCE(SUM(amount), 0)").Scan(&memberIncome)
		config.DB.Model(&models.Transaction{}).
			Where("family_id = ? AND user_id = ? AND date >= ? AND type = 'expense'", familyID, member.UserID, thisMonthStart).
			Select("COALESCE(SUM(amount), 0)").Scan(&memberExpense)
		config.DB.Model(&models.Transaction{}).
			Where("family_id = ? AND user_id = ? AND date >= ? AND (type = 'saving' OR category = 'Tabungan')", familyID, member.UserID, thisMonthStart).
			Select("COALESCE(SUM(amount), 0)").Scan(&memberSavings)

		var memberDisc float64
		config.DB.Model(&models.Transaction{}).
			Where("family_id = ? AND user_id = ? AND date >= ? AND category IN ('Jajan', 'Healing', 'Gofood / Shopee Food')", familyID, member.UserID, thisMonthStart).
			Select("COALESCE(SUM(amount), 0)").Scan(&memberDisc)

		var scanCount int64
		config.DB.Model(&models.Transaction{}).
			Where("family_id = ? AND user_id = ? AND date >= ? AND category = 'AI_SCAN'", familyID, member.UserID, thisMonthStart).
			Count(&scanCount)

		profile := MemberProfile{
			UserID:    member.UserID,
			FullName:  member.User.FullName,
			TotalSpend: memberExpense,
		}

		if memberIncome > 0 {
			profile.SavingRate = (memberSavings / memberIncome) * 100
		}

		// Trait Detection Logic
		if profile.SavingRate > 30 {
			profile.Trait = "Siluman Tabungan"
			profile.Description = "Ahli alokasi dana. Uang gajian langsung diamankan di tabungan."
		} else if memberDisc > memberExpense*0.4 && memberExpense > 100000 {
			profile.Trait = "Si Laper Mata"
			profile.Description = "Hobi check-out & jajan tipis-tipis tapi sering. Waspada bocor halus!"
		} else if scanCount > 10 {
			profile.Trait = "Si Tukang Catat"
			profile.Description = "Sangat disiplin mencatat setiap rupiah. AI Scanner adalah sahabatnya."
		} else if memberExpense < 500000 && memberExpense > 0 {
			profile.Trait = "Si Paling Hemat"
			profile.Description = "Pengeluaran sangat terkontrol. Contoh teladan ekonomi keluarga."
		} else {
			profile.Trait = "Petualang Keuangan"
			profile.Description = "Sedang mencari pola keuangan yang paling cocok. Semangat!"
		}

		summary.MemberProfiles = append(summary.MemberProfiles, profile)
	}

	// 6. Dynamic Challenge Suggestion (Only if no active challenge of same type)
	findActive := func(t string) bool {
		for _, ac := range activeChallenges { if ac.Type == t { return true } }
		return false
	}

	if !findActive("no_spend_day") {
		type DaySpend struct {
			DOW   int
			Total float64
		}
		var highest DaySpend
		err := config.DB.Table("transactions").
			Select("CAST(EXTRACT(DOW FROM date) AS INTEGER) as dow, sum(amount) as total").
			Where("family_id = ? AND date >= ? AND type = 'expense'", familyID, thisMonthStart).
			Group("dow").
			Order("total DESC").
			Limit(1).
			Scan(&highest).Error

		if err == nil && highest.Total > 0 {
			daysMap := map[int]string{0: "Minggu", 1: "Senin", 2: "Selasa", 3: "Rabu", 4: "Kamis", 5: "Jumat", 6: "Sabtu"}
			dayName := daysMap[highest.DOW]
			
			summary.Challenge = &models.FamilyChallenge{
				Type:        "no_spend_day",
				Title:       "No-Spend " + dayName,
				Description: "Hari " + dayName + " adalah pengeluaran terbanyakmu. Sanggupkah bosku tidak jajan sama sekali di hari " + dayName + " depan?",
				Points:      100,
				Metadata:    fmt.Sprintf(`{"dow": %d}`, highest.DOW),
			}
		} else {
			// Fallback to other challenge if no expense data found
			if !findActive("scanner_ninja") {
				summary.Challenge = &models.FamilyChallenge{
					Type:        "scanner_ninja",
					Title:       "Scanner Ninja",
					Description: "Gunakan AI Scanner untuk 5 transaksi beruntun agar pencatatan makin akurat dan cepat!",
					Points:      150,
				}
			} else if !findActive("keluarga_kompak") {
				summary.Challenge = &models.FamilyChallenge{
					Type:        "keluarga_kompak",
					Title:       "Keluarga Kompak",
					Description: "Ajak anggota keluarga lain buat catat minimal 1 transaksi minggu ini.",
					Points:      200,
				}
			}
		}
	} else if !findActive("scanner_ninja") {
		summary.Challenge = &models.FamilyChallenge{
			Type:        "scanner_ninja",
			Title:       "Scanner Ninja",
			Description: "Gunakan AI Scanner untuk 5 transaksi beruntun agar pencatatan makin akurat dan cepat!",
			Points:      150,
		}
	} else if !findActive("keluarga_kompak") {
		summary.Challenge = &models.FamilyChallenge{
			Type:        "keluarga_kompak",
			Title:       "Keluarga Kompak",
			Description: "Ajak anggota keluarga lain buat catat minimal 1 transaksi minggu ini.",
			Points:      200,
		}
	}

	// Clamp score
	if summary.Score > 100 { summary.Score = 100 }
	if summary.Score < 0 { summary.Score = 0 }

	return summary, nil
}
