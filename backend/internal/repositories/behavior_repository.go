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

type BehavioralChallenge struct {
	Title       string `json:"title"`
	Description string `json:"description"`
}

type BehaviorSummary struct {
	Score              int                     `json:"score"`
	Insights           []BehavioralInsight     `json:"insights"`
	Challenge          *models.FamilyChallenge `json:"challenge"` // Suggested challenge
	ActiveChallenges   []models.FamilyChallenge `json:"active_challenges"`
	LifestyleInflation float64                 `json:"lifestyle_inflation"`
	SavingsRate        float64                 `json:"savings_rate"`
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
			duration := ch.EndDate.Sub(*ch.StartDate).Hours() / 24
			elapsed := now.Sub(*ch.StartDate).Hours() / 24
			if duration > 0 {
				ch.Points = int((elapsed / duration) * 100)
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
	config.DB.Model(&models.Transaction{}).
		Where("family_id = ? AND date >= ? AND type = 'expense' AND EXTRACT(DOW FROM date) IN (0,6)", familyID, thisMonthStart).
		Select("COALESCE(SUM(amount), 0)").Scan(&weekendSpend)
	
	config.DB.Model(&models.Transaction{}).
		Where("family_id = ? AND date >= ? AND type = 'expense' AND EXTRACT(DOW FROM date) NOT IN (0,6)", familyID, thisMonthStart).
		Select("COALESCE(SUM(amount), 0)").Scan(&weekdaySpend)

	if weekendSpend > weekdaySpend*1.5 && weekdaySpend > 0 {
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
	} else if totalIncome > 0 {
		summary.Insights = append(summary.Insights, BehavioralInsight{
			Type:        "info",
			Title:       "Bulan Pertama?",
			Description: "Sistem belum punya data perbandingan dari bulan lalu.",
			Action:      "Teruskan mencatat biar AI makin pintar!",
		})
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

	// 4. Dynamic Challenge Suggestion (Only if no active challenge of same type)
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
		config.DB.Table("transactions").
			Select("CAST(EXTRACT(DOW FROM date) AS INTEGER) as dow, sum(amount) as total").
			Where("family_id = ? AND date >= ? AND type = 'expense'", familyID, thisMonthStart).
			Group("dow").
			Order("total DESC").
			Limit(1).
			Scan(&highest)

		daysMap := map[int]string{0: "Minggu", 1: "Senin", 2: "Selasa", 3: "Rabu", 4: "Kamis", 5: "Jumat", 6: "Sabtu"}
		dayName := daysMap[highest.DOW]
		if dayName == "" { dayName = "Sabtu" }

		summary.Challenge = &models.FamilyChallenge{
			Type:        "no_spend_day",
			Title:       "No-Spend " + dayName,
			Description: "Hari " + dayName + " adalah pengeluaran terbanyakmu. Sanggupkah bosku tidak jajan sama sekali di hari " + dayName + " depan?",
			Points:      100,
			Metadata:    fmt.Sprintf(`{"dow": %d}`, highest.DOW),
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
