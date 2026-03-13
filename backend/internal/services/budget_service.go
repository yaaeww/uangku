package services

import (
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"

	"github.com/google/uuid"
)

type BudgetService struct{}

func NewBudgetService() *BudgetService {
	return &BudgetService{}
}

func (s *BudgetService) SeedDefaultBudget(familyID uuid.UUID) error {
	db := config.DB

	// Check if family already has budget categories
	var count int64
	db.Model(&models.BudgetCategory{}).Where("family_id = ?", familyID).Count(&count)
	if count > 0 {
		return nil // Already has budget, don't seed
	}

	// 1. Define Categories
	categories := []models.BudgetCategory{
		{
			FamilyID:    familyID,
			Name:        "Kebutuhan",
			Percentage:  50,
			Description: "Biaya rutin bulanan yang wajib dipenuhi",
			Icon:        "ShoppingCart",
			Color:       "text-blue-500",
			BgColor:     "bg-blue-50",
			Order:       1,
		},
		{
			FamilyID:    familyID,
			Name:        "Keinginan",
			Percentage:  30,
			Description: "Pengeluaran gaya hidup & hiburan",
			Icon:        "Coffee",
			Color:       "text-amber-500",
			BgColor:     "bg-amber-50",
			Order:       2,
		},
		{
			FamilyID:    familyID,
			Name:        "Tabungan",
			Percentage:  10,
			Description: "Investasi & dana untuk masa depan",
			Icon:        "Coins",
			Color:       "text-dagang-green",
			BgColor:     "bg-dagang-green/5",
			Order:       3,
		},
		{
			FamilyID:    familyID,
			Name:        "Dana Darurat",
			Percentage:  10,
			Description: "Cadangan dana untuk keadaan tak terduga",
			Icon:        "ShieldCheck",
			Color:       "text-red-500",
			BgColor:     "bg-red-50",
			Order:       4,
		},
	}

	// 2. Create Categories and their Items
	for _, cat := range categories {
		if err := db.Create(&cat).Error; err != nil {
			return err
		}

		var items []models.Saving
		switch cat.Name {
		case "Kebutuhan":
			items = []models.Saving{
				{Name: "Makan Sehari-hari", Emoji: "🍲", TargetAmount: 3000000, DueDate: 0},
				{Name: "Belanja Dapur", Emoji: "🛒", TargetAmount: 1500000, DueDate: 0},
				{Name: "Tempat Tinggal", Emoji: "🏠", TargetAmount: 2500000, DueDate: 1},
				{Name: "Listrik & Air", Emoji: "⚡", TargetAmount: 850000, DueDate: 10},
				{Name: "Internet & Pulsa", Emoji: "📱", TargetAmount: 500000, DueDate: 5},
				{Name: "Transportasi", Emoji: "🚐", TargetAmount: 1200000, DueDate: 0},
				{Name: "Bensin / Tol", Emoji: "⛽", TargetAmount: 800000, DueDate: 0},
				{Name: "Kesehatan / Obat", Emoji: "🏥", TargetAmount: 500000, DueDate: 0},
				{Name: "Pendidikan Anak", Emoji: "🎓", TargetAmount: 2000000, DueDate: 15},
				{Name: "Perlengkapan Mandi & Cuci", Emoji: "🧼", TargetAmount: 400000, DueDate: 0},
				{Name: "Cicilan / Pinjaman", Emoji: "💳", TargetAmount: 1000000, DueDate: 25},
				{Name: "Kebutuhan Anak/Bayi", Emoji: "🍼", TargetAmount: 1500000, DueDate: 0},
				{Name: "Asuransi Kesehatan", Emoji: "⚕️", TargetAmount: 500000, DueDate: 20},
				{Name: "Sedekah / Zakat", Emoji: "🤲", TargetAmount: 500000, DueDate: 0},
			}
		case "Keinginan":
			items = []models.Saving{
				{Name: "Belanja Online (Checkout)", Emoji: "🛍️", TargetAmount: 1000000, DueDate: 0},
				{Name: "Hiburan & Streaming", Emoji: "🎬", TargetAmount: 300000, DueDate: 0},
				{Name: "Makan di Luar / Cafe", Emoji: "🍽️", TargetAmount: 1000000, DueDate: 0},
				{Name: "Jajan / Ngopi", Emoji: "☕", TargetAmount: 500000, DueDate: 0},
				{Name: "Hobi / Mainan", Emoji: "🎨", TargetAmount: 500000, DueDate: 0},
				{Name: "Gaya Hidup / Pakaian", Emoji: "👕", TargetAmount: 800000, DueDate: 0},
				{Name: "Skincare / Perawatan Diri", Emoji: "✨", TargetAmount: 700000, DueDate: 0},
				{Name: "Liburan / Staycation", Emoji: "✈️", TargetAmount: 2000000, DueDate: 0},
				{Name: "Gadget / Elektronik Baru", Emoji: "📱", TargetAmount: 1000000, DueDate: 0},
				{Name: "Hadiah / Kado", Emoji: "🎁", TargetAmount: 300000, DueDate: 0},
			}
		case "Tabungan":
			items = []models.Saving{
				{Name: "Investasi Saham", Emoji: "📈", TargetAmount: 1000000, DueDate: 0},
				{Name: "Reksa Dana / Obligasi", Emoji: "🏦", TargetAmount: 1000000, DueDate: 0},
				{Name: "Tabungan Emas", Emoji: "🪙", TargetAmount: 500000, DueDate: 0},
				{Name: "Tabungan Rumah / KPR", Emoji: "🏡", TargetAmount: 2000000, DueDate: 0},
				{Name: "Tabungan Anak", Emoji: "👨‍👩‍👧", TargetAmount: 1000000, DueDate: 0},
				{Name: "Tabungan Pensiun", Emoji: "👴", TargetAmount: 500000, DueDate: 0},
				{Name: "Deposito", Emoji: "💹", TargetAmount: 1000000, DueDate: 0},
			}
		case "Dana Darurat":
			items = []models.Saving{
				{Name: "Dana Darurat Utama", Emoji: "🛡️", TargetAmount: 5000000, DueDate: 0},
				{Name: "Dana Darurat Medis", Emoji: "🏥", TargetAmount: 2000000, DueDate: 0},
				{Name: "Dana Darurat Kendaraan", Emoji: "🚗", TargetAmount: 1000000, DueDate: 0},
				{Name: "Dana Darurat PHK", Emoji: "💼", TargetAmount: 3000000, DueDate: 0},
				{Name: "Dana Darurat Rumah", Emoji: "🏠", TargetAmount: 1500000, DueDate: 0},
			}
		}

		for _, item := range items {
			item.FamilyID = familyID
			item.BudgetCategoryID = &cat.ID
			if err := db.Create(&item).Error; err != nil {
				return err
			}
		}
	}

	return nil
}

func (s *BudgetService) GetBudgetCategories(familyID uuid.UUID) ([]models.BudgetCategory, error) {
	var categories []models.BudgetCategory
	err := config.DB.Preload("Items").Where("family_id = ?", familyID).Order("\"order\" asc").Find(&categories).Error
	return categories, err
}
