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
				{Name: "Makan", Emoji: "🍲", TargetAmount: 1000000, DueDate: 1},
				{Name: "Tempat Tinggal", Emoji: "🏠", TargetAmount: 2500000, DueDate: 1},
				{Name: "Listrik", Emoji: "⚡", TargetAmount: 500000, DueDate: 10},
				{Name: "Air", Emoji: "💧", TargetAmount: 150000, DueDate: 10},
				{Name: "Internet", Emoji: "🌐", TargetAmount: 400000, DueDate: 5},
				{Name: "Transportasi", Emoji: "🚐", TargetAmount: 800000, DueDate: 0},
				{Name: "Kesehatan", Emoji: "🏥", TargetAmount: 300000, DueDate: 0},
				{Name: "Pendidikan", Emoji: "🎓", TargetAmount: 1000000, DueDate: 0},
				{Name: "Sedekah", Emoji: "🙌", TargetAmount: 200000, DueDate: 0},
				{Name: "Kebutuhan Lain", Emoji: "📦", TargetAmount: 500000, DueDate: 0},
			}
		case "Keinginan":
			items = []models.Saving{
				{Name: "Belanja Online", Emoji: "🛍️", TargetAmount: 1000000, DueDate: 25},
				{Name: "Hiburan", Emoji: "🎬", TargetAmount: 500000, DueDate: 0},
				{Name: "Hangout", Emoji: "☕", TargetAmount: 700000, DueDate: 0},
				{Name: "Jajan", Emoji: "🍿", TargetAmount: 400000, DueDate: 0},
				{Name: "Hobi", Emoji: "🎨", TargetAmount: 300000, DueDate: 0},
				{Name: "Gaya Hidup", Emoji: "👔", TargetAmount: 600000, DueDate: 0},
			}
		case "Tabungan":
			items = []models.Saving{
				{Name: "Investasi Saham", Emoji: "📈", TargetAmount: 1000000, DueDate: 0},
			}
		case "Dana Darurat":
			items = []models.Saving{
				{Name: "Dana Darurat Utama", Emoji: "🛡️", TargetAmount: 1000000, DueDate: 0},
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
