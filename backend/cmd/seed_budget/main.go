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
			{ FamilyID: family.ID, Name: "Makan Sehari-hari", Category: "needs", TargetAmount: 3000000, Emoji: "🍲", DueDate: 0 },
			{ FamilyID: family.ID, Name: "Belanja Dapur", Category: "needs", TargetAmount: 1500000, Emoji: "🛒", DueDate: 0 },
			{ FamilyID: family.ID, Name: "Tempat Tinggal", Category: "needs", TargetAmount: 2500000, Emoji: "🏠", DueDate: 1 },
			{ FamilyID: family.ID, Name: "Listrik & Air", Category: "needs", TargetAmount: 850000, Emoji: "⚡", DueDate: 10 },
			{ FamilyID: family.ID, Name: "Internet & Pulsa", Category: "needs", TargetAmount: 500000, Emoji: "📱", DueDate: 5 },
			{ FamilyID: family.ID, Name: "Transportasi", Category: "needs", TargetAmount: 1200000, Emoji: "🚐", DueDate: 0 },
			{ FamilyID: family.ID, Name: "Bensin / Tol", Category: "needs", TargetAmount: 800000, Emoji: "⛽", DueDate: 0 },
			{ FamilyID: family.ID, Name: "Kesehatan / Obat", Category: "needs", TargetAmount: 500000, Emoji: "🏥", DueDate: 0 },
			{ FamilyID: family.ID, Name: "Pendidikan Anak", Category: "needs", TargetAmount: 2000000, Emoji: "🎓", DueDate: 15 },
			{ FamilyID: family.ID, Name: "Perlengkapan Mandi & Cuci", Category: "needs", TargetAmount: 400000, Emoji: "🧼", DueDate: 0 },
			{ FamilyID: family.ID, Name: "Cicilan / Pinjaman", Category: "needs", TargetAmount: 1000000, Emoji: "💳", DueDate: 25 },
			{ FamilyID: family.ID, Name: "Kebutuhan Anak/Bayi", Category: "needs", TargetAmount: 1500000, Emoji: "🍼", DueDate: 0 },
			{ FamilyID: family.ID, Name: "Asuransi Kesehatan", Category: "needs", TargetAmount: 500000, Emoji: "⚕️", DueDate: 20 },
			{ FamilyID: family.ID, Name: "Sedekah / Zakat", Category: "needs", TargetAmount: 500000, Emoji: "🤲", DueDate: 0 },

			// KEINGINAN (Wants)
			{ FamilyID: family.ID, Name: "Belanja Online (Checkout)", Category: "wants", TargetAmount: 1000000, Emoji: "🛍️", DueDate: 0 },
			{ FamilyID: family.ID, Name: "Hiburan & Streaming", Category: "wants", TargetAmount: 300000, Emoji: "🎬", DueDate: 0 },
			{ FamilyID: family.ID, Name: "Makan di Luar / Cafe", Category: "wants", TargetAmount: 1000000, Emoji: "🍽️", DueDate: 0 },
			{ FamilyID: family.ID, Name: "Jajan / Ngopi", Category: "wants", TargetAmount: 500000, Emoji: "☕", DueDate: 0 },
			{ FamilyID: family.ID, Name: "Hobi / Mainan", Category: "wants", TargetAmount: 500000, Emoji: "🎨", DueDate: 0 },
			{ FamilyID: family.ID, Name: "Gaya Hidup / Pakaian", Category: "wants", TargetAmount: 800000, Emoji: "👕", DueDate: 0 },
			{ FamilyID: family.ID, Name: "Skincare / Perawatan Diri", Category: "wants", TargetAmount: 700000, Emoji: "✨", DueDate: 0 },
			{ FamilyID: family.ID, Name: "Liburan / Staycation", Category: "wants", TargetAmount: 2000000, Emoji: "✈️", DueDate: 0 },
			{ FamilyID: family.ID, Name: "Gadget / Elektronik Baru", Category: "wants", TargetAmount: 1000000, Emoji: "📱", DueDate: 0 },
			{ FamilyID: family.ID, Name: "Hadiah / Kado", Category: "wants", TargetAmount: 300000, Emoji: "🎁", DueDate: 0 },

			// TABUNGAN (Savings)
			{ FamilyID: family.ID, Name: "Investasi Saham", Category: "savings", TargetAmount: 1000000, Emoji: "📈", DueDate: 0 },
			{ FamilyID: family.ID, Name: "Reksa Dana / Obligasi", Category: "savings", TargetAmount: 1000000, Emoji: "🏦", DueDate: 0 },
			{ FamilyID: family.ID, Name: "Tabungan Emas", Category: "savings", TargetAmount: 500000, Emoji: "🪙", DueDate: 0 },
			{ FamilyID: family.ID, Name: "Tabungan Rumah / KPR", Category: "savings", TargetAmount: 2000000, Emoji: "🏡", DueDate: 0 },
			{ FamilyID: family.ID, Name: "Tabungan Anak", Category: "savings", TargetAmount: 1000000, Emoji: "👨‍👩‍👧", DueDate: 0 },
			{ FamilyID: family.ID, Name: "Tabungan Pensiun", Category: "savings", TargetAmount: 500000, Emoji: "👴", DueDate: 0 },
			{ FamilyID: family.ID, Name: "Deposito", Category: "savings", TargetAmount: 1000000, Emoji: "💹", DueDate: 0 },

			// DANA DARURAT (Emergency)
			{ FamilyID: family.ID, Name: "Dana Darurat Utama", Category: "emergency", TargetAmount: 5000000, Emoji: "🛡️", DueDate: 0 },
			{ FamilyID: family.ID, Name: "Dana Darurat Medis", Category: "emergency", TargetAmount: 2000000, Emoji: "🏥", DueDate: 0 },
			{ FamilyID: family.ID, Name: "Dana Darurat Kendaraan", Category: "emergency", TargetAmount: 1000000, Emoji: "🚗", DueDate: 0 },
			{ FamilyID: family.ID, Name: "Dana Darurat PHK", Category: "emergency", TargetAmount: 3000000, Emoji: "💼", DueDate: 0 },
			{ FamilyID: family.ID, Name: "Dana Darurat Rumah", Category: "emergency", TargetAmount: 1500000, Emoji: "🏠", DueDate: 0 },
		}

		for _, item := range budgetItems {
			item.ID = uuid.New()
			db.Create(&item)
		}
	}

	fmt.Println("Seeding completed successfully for all Stark Families!")
}
