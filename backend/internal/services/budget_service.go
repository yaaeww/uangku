package services

import (
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type BudgetService struct{}

func NewBudgetService() *BudgetService {
	return &BudgetService{}
}

func (s *BudgetService) SeedDefaultBudget(db *gorm.DB, familyID uuid.UUID, userID uuid.UUID, month int, year int) error {
	if db == nil {
		db = config.DB
	}

	// 0. Get Base Budget (check monthly plan first)
	var plan models.BudgetPlan
	baseBudget := 0.0
	if err := db.First(&plan, "family_id = ? AND user_id = ? AND month = ? AND year = ?", familyID, userID, month, year).Error; err == nil {
		baseBudget = plan.Amount
	} else {
		var member models.FamilyMember
		if err := db.First(&member, "family_id = ? AND user_id = ?", familyID, userID).Error; err == nil {
			baseBudget = member.MonthlyBudget
		}
	}
	
	if baseBudget <= 0 {
		baseBudget = 5000000 // Default fallback 5jt
	}

	// 1. Define Categories — Indonesia-First v2.0
	// Prinsip: Kontekstual keluarga Indonesia, realistis, inklusif
	// Total: 100% (30+15+10+10+8+10+5+7+5)
	type catDef struct {
		Name    string
		Icon    string
		Color   string
		BgColor string
		Type    string
		Percent int
		Items   []struct {
			Name  string
			Emoji string
		}
	}

	categories := []catDef{
		{
			// Rata-rata keluarga Indonesia menghabiskan 35-40% untuk makanan
			Name: "Makanan & Dapur", Icon: "Coffee", Color: "text-orange-500", BgColor: "bg-orange-50", Type: "kebutuhan", Percent: 30,
			Items: []struct{ Name, Emoji string }{
				{"Belanja kebutuhan dapur", "🛒"}, {"Makan harian", "🍲"}, {"Jajan & ngopi", "☕"}, {"Delivery makanan", "🛵"},
			},
		},
		{
			// Tagihan-tagihan wajib rumah tangga
			Name: "Tagihan Rumah", Icon: "ShieldCheck", Color: "text-purple-500", BgColor: "bg-purple-50", Type: "kebutuhan", Percent: 15,
			Items: []struct{ Name, Emoji string }{
				{"Listrik", "⚡"}, {"Air (PDAM)", "💧"}, {"Internet & TV kabel", "🌐"}, {"Pulsa & paket data", "📱"},
			},
		},
		{
			Name: "Transport", Icon: "Wallet", Color: "text-blue-500", BgColor: "bg-blue-50", Type: "kebutuhan", Percent: 10,
			Items: []struct{ Name, Emoji string }{
				{"Bensin", "⛽"}, {"Ojol & transportasi online", "🏍️"}, {"Parkir & tol", "🅿️"}, {"Servis kendaraan", "🔧"},
			},
		},
		{
			Name: "Kesehatan", Icon: "ShieldCheck", Color: "text-red-500", BgColor: "bg-red-50", Type: "kebutuhan", Percent: 10,
			Items: []struct{ Name, Emoji string }{
				{"Obat & apotek", "💊"}, {"Klinik & dokter", "🏥"}, {"BPJS Kesehatan", "🛡️"},
			},
		},
		{
			Name: "Pendidikan", Icon: "Coins", Color: "text-indigo-500", BgColor: "bg-indigo-50", Type: "kebutuhan", Percent: 8,
			Items: []struct{ Name, Emoji string }{
				{"SPP & biaya sekolah", "🎒"}, {"Buku & alat tulis", "📚"}, {"Kursus & les privat", "🎓"},
			},
		},
		{
			// Dana darurat: target 3-6x pengeluaran bulanan — prioritas utama
			Name: "Dana Darurat", Icon: "ShieldCheck", Color: "text-cyan-500", BgColor: "bg-cyan-50", Type: "kebutuhan", Percent: 10,
			Items: []struct{ Name, Emoji string }{
				{"Tabungan darurat bulanan", "🛡️"},
			},
		},
		{
			// Zakat & Sedekah: kewajiban finansial untuk mayoritas keluarga Indonesia
			Name: "Zakat & Sedekah", Icon: "Coins", Color: "text-yellow-600", BgColor: "bg-yellow-50", Type: "kebutuhan", Percent: 5,
			Items: []struct{ Name, Emoji string }{
				{"Zakat penghasilan (2.5%)", "🌙"}, {"Sedekah & infaq rutin", "🤲"},
			},
		},
		{
			// Hiburan & belanja dikompres jadi satu agar lebih sehat
			Name: "Hiburan & Belanja", Icon: "ShoppingCart", Color: "text-pink-500", BgColor: "bg-pink-50", Type: "keinginan", Percent: 7,
			Items: []struct{ Name, Emoji string }{
				{"Pakaian & perawatan diri", "👕"}, {"Hiburan & langganan (streaming dll)", "🎬"}, {"Hobi & rekreasi", "🎮"},
			},
		},
		{
			// Tabungan & investasi jangka panjang
			Name: "Tabungan & Investasi", Icon: "Coins", Color: "text-emerald-600", BgColor: "bg-emerald-50", Type: "kebutuhan", Percent: 5,
			Items: []struct{ Name, Emoji string }{
				{"Tabungan tujuan", "🎯"}, {"Investasi (reksa dana/emas/dll)", "📈"},
			},
		},
	}

	// 2. CLEANUP: Delete existing sub-items (Savings) for THIS user and THIS month
	// We don't delete categories because they might be reused or customized
	db.Delete(&models.Saving{}, "family_id = ? AND user_id = ? AND month = ? AND year = ?", familyID, userID, month, year)

	// 3. Create Categories and Sub-items
	for i, cDef := range categories {
		var cat models.BudgetCategory
		// Key Change: Check if category exists for this user and period
		err := db.Where("family_id = ? AND user_id = ? AND name = ? AND month = ? AND year = ?", familyID, userID, cDef.Name, month, year).First(&cat).Error
		if err != nil {
			cat = models.BudgetCategory{
				FamilyID:    familyID,
				UserID:      userID,
				Name:        cDef.Name,
				Percentage:  cDef.Percent,
				Description: "Kategori " + cDef.Name,
				Icon:        cDef.Icon,
				Color:       cDef.Color,
				BgColor:     cDef.BgColor,
				Type:        cDef.Type,
				Order:       i + 1,
				Month:       month,
				Year:        year,
			}
			if err := db.Create(&cat).Error; err != nil {
				return err
			}
		} else {
			// Update existing category properties to match defaults
			cat.Percentage = cDef.Percent
			cat.Type = cDef.Type
			cat.Icon = cDef.Icon
			cat.Color = cDef.Color
			cat.BgColor = cDef.BgColor
			db.Save(&cat)
		}

		// Create sub-items (savings)
		for _, sDef := range cDef.Items {
			itemTarget := (baseBudget * float64(cDef.Percent) / 100.0) / float64(len(cDef.Items))

			item := models.Saving{
				FamilyID:         familyID,
				UserID:           userID,
				BudgetCategoryID: &cat.ID,
				Name:             sDef.Name,
				Emoji:            sDef.Emoji,
				TargetAmount:     itemTarget,
				Month:            month,
				Year:             year,
			}
			if err := db.Create(&item).Error; err != nil {
				return err
			}
		}
	}

	return nil
}

func (s *BudgetService) GetBudgetCategories(db *gorm.DB, familyID uuid.UUID, userID uuid.UUID, month int, year int) ([]models.BudgetCategory, error) {
	if db == nil {
		db = config.DB
	}

	var categories []models.BudgetCategory
	query := db.Preload("Items", "user_id = ? AND month = ? AND year = ?", userID, month, year).
		Where("family_id = ? AND user_id = ? AND month = ? AND year = ?", familyID, userID, month, year)

	if err := query.Order("\"order\" asc").Find(&categories).Error; err != nil {
		return nil, err
	}

	return categories, nil
}
