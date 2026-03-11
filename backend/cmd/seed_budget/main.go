package main

import (
	"fmt"
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"

	"github.com/google/uuid"
)

func main() {
	config.LoadConfig()
	config.ConnectDatabase()

	db := config.DB

	// Find ALL families named "The Stark Family"
	var families []models.Family
	db.Where("name = ?", "The Stark Family").Find(&families)

	if len(families) == 0 {
		fmt.Println("No 'The Stark Family' found.")
		return
	}

	fmt.Printf("Seeding budget for %d families named 'The Stark Family'\n", len(families))

	for _, family := range families {
		fmt.Printf("Processing family: %s\n", family.ID)

		// Clear existing savings for this family
		db.Where("family_id = ?", family.ID).Delete(&models.Saving{})

		budgetItems := []models.Saving{
			// KEBUTUHAN (Needs)
			{
				FamilyID:     family.ID,
				Name:         "Makan",
				Category:     "needs",
				TargetAmount: 1000000,
				Emoji:        "🍲",
				DueDate:      1,
			},
			{
				FamilyID:     family.ID,
				Name:         "Tempat Tinggal",
				Category:     "needs",
				TargetAmount: 2500000,
				Emoji:        "🏠",
				DueDate:      1,
			},
			{
				FamilyID:     family.ID,
				Name:         "Listrik",
				Category:     "needs",
				TargetAmount: 500000,
				Emoji:        "⚡",
				DueDate:      10,
			},
			{
				FamilyID:     family.ID,
				Name:         "Air",
				Category:     "needs",
				TargetAmount: 150000,
				Emoji:        "💧",
				DueDate:      10,
			},
			{
				FamilyID:     family.ID,
				Name:         "Internet",
				Category:     "needs",
				TargetAmount: 400000,
				Emoji:        "🌐",
				DueDate:      5,
			},
			{
				FamilyID:     family.ID,
				Name:         "Transportasi",
				Category:     "needs",
				TargetAmount: 800000,
				Emoji:        "🚐",
				DueDate:      0,
			},
			{
				FamilyID:     family.ID,
				Name:         "Kesehatan",
				Category:     "needs",
				TargetAmount: 300000,
				Emoji:        "🏥",
				DueDate:      0,
			},
			{
				FamilyID:     family.ID,
				Name:         "Pendidikan",
				Category:     "needs",
				TargetAmount: 1000000,
				Emoji:        "🎓",
				DueDate:      0,
			},
			{
				FamilyID:     family.ID,
				Name:         "Sedekah",
				Category:     "needs",
				TargetAmount: 200000,
				Emoji:        "🙌",
				DueDate:      0,
			},
			{
				FamilyID:     family.ID,
				Name:         "Kebutuhan Lain",
				Category:     "needs",
				TargetAmount: 500000,
				Emoji:        "📦",
				DueDate:      0,
			},

			// KEINGINAN (Wants)
			{
				FamilyID:     family.ID,
				Name:         "Belanja Online",
				Category:     "wants",
				TargetAmount: 1000000,
				Emoji:        "🛍️",
				DueDate:      25,
			},
			{
				FamilyID:     family.ID,
				Name:         "Hiburan",
				Category:     "wants",
				TargetAmount: 500000,
				Emoji:        "🎬",
				DueDate:      0,
			},
			{
				FamilyID:     family.ID,
				Name:         "Hangout",
				Category:     "wants",
				TargetAmount: 700000,
				Emoji:        "☕",
				DueDate:      0,
			},
			{
				FamilyID:     family.ID,
				Name:         "Jajan",
				Category:     "wants",
				TargetAmount: 400000,
				Emoji:        "🍿",
				DueDate:      0,
			},
			{
				FamilyID:     family.ID,
				Name:         "Hobi",
				Category:     "wants",
				TargetAmount: 300000,
				Emoji:        "🎨",
				DueDate:      0,
			},
			{
				FamilyID:     family.ID,
				Name:         "Gaya Hidup",
				Category:     "wants",
				TargetAmount: 600000,
				Emoji:        "👔",
				DueDate:      0,
			},

			// TABUNGAN (Savings)
			{
				FamilyID:     family.ID,
				Name:         "Investasi Saham",
				Category:     "savings",
				TargetAmount: 1000000,
				Emoji:        "📈",
				DueDate:      0,
			},

			// DANA DARURAT (Emergency)
			{
				FamilyID:     family.ID,
				Name:         "Dana Darurat Utama",
				Category:     "emergency",
				TargetAmount: 1000000,
				Emoji:        "🛡️",
				DueDate:      0,
			},
		}

		for _, item := range budgetItems {
			item.ID = uuid.New()
			db.Create(&item)
		}
	}

	fmt.Println("Seeding completed successfully for all Stark Families!")
}
