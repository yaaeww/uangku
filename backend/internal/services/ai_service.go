package services

import (
	"fmt"
	"keuangan-keluarga/internal/repositories"
	"strconv"
)

type AIService interface {
	AnalyzeFinance(data map[string]interface{}) (*repositories.CoachAnalysis, error)
}

type aiService struct {
	client interface{} // Removed openai client placeholder
}

func NewAIService() AIService {
	return &aiService{client: nil}
}

func (s *aiService) AnalyzeFinance(data map[string]interface{}) (*repositories.CoachAnalysis, error) {
	// Rule-Based Hyper-Intelligent Engine (v4.0)
	
	// Extract basic info
	name := data["nama_user"].(string)
	statusStr := data["status_global"].(string)
	discipline := data["discipline"].(string)
	nature := data["nature"].(string)
	consistency := data["consistency"].(string)
	coachingStyle := data["coaching_style"].(string)
	
	// Ratios
	valSR, _ := data["savings_rate"].(string)
	savingsRate, _ := strconv.ParseFloat(valSR, 64)
	
	valDR, _ := data["rasio_keinginan"].(string)
	desireRatio, _ := strconv.ParseFloat(valDR, 64)
	
	// Anomaly
	anomalyLevel := data["anomaly_level"].(string)
	anomalyMsg := data["anomaly_msg"].(string)

	// 1. Build Narrative Overview (Ringkasan)
	// Tone based on Coaching Style
	var ringkasan string
	switch coachingStyle {
	case "growth":
		ringkasan = fmt.Sprintf("Halo %s! Sebagai seorang **%s %s**, kamu memiliki fondasi yang sangat kuat.", name, discipline, nature)
	case "foundation":
		ringkasan = fmt.Sprintf("Halo %s! Saat ini kamu di fase **%s %s**. Fokus utama kita adalah memperkuat kebiasaan dasar.", name, discipline, nature)
	case "defensive":
		ringkasan = fmt.Sprintf("Halo %s! Kondisi saat ini memerlukan pendekatan **defensif**. Kita harus melindungi arus kas dari defisit.", name)
	default:
		ringkasan = fmt.Sprintf("Halo %s! Analisis profil **%s %s - %s** menunjukkan kondisi yang %s.", name, discipline, nature, consistency, statusStr)
	}

	switch anomalyLevel {
	case "critical":
		ringkasan += fmt.Sprintf(" ⚠️ **Perhatian:** %s.", anomalyMsg)
	case "info":
		ringkasan += fmt.Sprintf(" ℹ️ %s.", anomalyMsg)
	}

	// 2. Insights
	insights := []string{
		fmt.Sprintf("Disiplin keuanganmu masuk kategori **%s** (Saving Rate: %.1f%%).", discipline, savingsRate),
		fmt.Sprintf("Karakter pengeluaranmu cenderung **%s** (Desire Ratio: %.1f%%).", nature, desireRatio),
		fmt.Sprintf("Konsistensi saldo terpantau **%s** bulan ini.", consistency),
	}

	peringatan := []string{}
	if anomalyLevel == "critical" {
		peringatan = append(peringatan, anomalyMsg)
	}
	if statusStr == "Defisit" {
		peringatan = append(peringatan, "Arus kas negatif terdeteksi. Segera tinjau pengeluaran variabel.")
	}

	return &repositories.CoachAnalysis{
		Ringkasan: ringkasan,
		Insight:   insights,
		Peringatan: peringatan,
		AnalisisGoals: []string{"Menganalisis akselerasi target berdasarkan surplus saat ini."},
		AnalisisAset:  []string{"Evaluasi komposisi aset likuid vs aset tetap sedang berjalan."},
	}, nil
}
