package repositories

import (
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"
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
	Score              int                 `json:"score"`
	Insights           []BehavioralInsight `json:"insights"`
	Challenge          BehavioralChallenge `json:"challenge"`
	LifestyleInflation float64             `json:"lifestyle_inflation"`
	SavingsRate        float64             `json:"savings_rate"`
}

type BehaviorRepository interface {
	GetBehaviorSummary(familyID uuid.UUID) (*BehaviorSummary, error)
}

type behaviorRepository struct{}

func NewBehaviorRepository() BehaviorRepository {
	return &behaviorRepository{}
}

func (r *behaviorRepository) GetBehaviorSummary(familyID uuid.UUID) (*BehaviorSummary, error) {
	summary := &BehaviorSummary{
		Score:    75, // Base score
		Insights: []BehavioralInsight{},
	}

	now := time.Now()
	thisMonthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
	prevMonthStart := thisMonthStart.AddDate(0, -1, 0)

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
	}

	// 4. Dynamic Challenge (Based on highest spending day)
	type DaySpend struct {
		DOW   int
		Total float64
	}
	var highest DaySpend
	config.DB.Model(&models.Transaction{}).
		Select("CAST(EXTRACT(DOW FROM date) AS INTEGER) as dow, sum(amount) as total").
		Where("family_id = ? AND date >= ? AND type = 'expense'", familyID, thisMonthStart).
		Group("dow").
		Order("total DESC").
		Limit(1).
		Scan(&highest)

	daysMap := map[int]string{0: "Minggu", 1: "Senin", 2: "Selasa", 3: "Rabu", 4: "Kamis", 5: "Jumat", 6: "Sabtu"}
	dayName := daysMap[highest.DOW]
	if dayName == "" {
		dayName = "Sabtu" // Fallback
	}

	summary.Challenge = BehavioralChallenge{
		Title:       "No-Spend " + dayName,
		Description: "Berdasarkan pola kamu, hari " + dayName + " adalah pengeluaran terbanyak. Coba tantang diri sendiri untuk tidak belanja di hari " + dayName + " ini.",
	}

	// Clamp score
	if summary.Score > 100 { summary.Score = 100 }
	if summary.Score < 0 { summary.Score = 0 }

	return summary, nil
}
