package main

import (
	"fmt"
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"
	"time"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	config.LoadConfig()
	config.ConnectDatabase()

	db := config.DB

	// 1. Create Super Admin
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	var superAdmin models.User
	if err := db.Where("email = ?", "admin@platform.com").First(&superAdmin).Error; err != nil {
		superAdmin = models.User{
			Email:        "admin@platform.com",
			PasswordHash: string(hashedPassword),
			FullName:     "Super Admin",
			Role:         "super_admin",
			IsVerified:   true,
		}
		if err := db.Create(&superAdmin).Error; err != nil {
			fmt.Printf("Error creating super admin: %v\n", err)
		} else {
			fmt.Println("Super Admin created.")
		}
	} else {
		superAdmin.PasswordHash = string(hashedPassword)
		superAdmin.IsVerified = true
		db.Save(&superAdmin)
		fmt.Println("Super Admin updated.")
	}

	// 1.1 Create Content Strategist (SEO)
	var strategist models.User
	if err := db.Where("email = ?", "strategist@uangku.id").First(&strategist).Error; err != nil {
		strategist = models.User{
			Email:        "strategist@uangku.id",
			PasswordHash: string(hashedPassword),
			FullName:     "SEO Specialist",
			Role:         "content_strategist",
			IsVerified:   true,
		}
		if err := db.Create(&strategist).Error; err != nil {
			fmt.Printf("Error creating strategist: %v\n", err)
		} else {
			fmt.Println("Content Strategist created.")
		}
	} else {
		strategist.PasswordHash = string(hashedPassword)
		strategist.IsVerified = true
		db.Save(&strategist)
		fmt.Println("Content Strategist updated.")
	}

	// 2. Create Sample Family
	family := models.Family{
		Name: "The Stark Family",
	}
	if err := db.Where(models.Family{Name: family.Name}).FirstOrCreate(&family).Error; err != nil {
		fmt.Printf("Error creating family: %v\n", err)
	} else {
		fmt.Println("The Stark Family created/updated.")
	}

	// 3. Create Family Admin
	familyAdmin := models.User{
		Email:        "ned@stark.com",
		PasswordHash: string(hashedPassword),
		FullName:     "Ned Stark",
		Role:         "family_admin",
		IsVerified:   true,
	}
	if err := db.Where(models.User{Email: familyAdmin.Email}).FirstOrCreate(&familyAdmin).Error; err != nil {
		fmt.Printf("Error creating family admin: %v\n", err)
	} else {
		familyAdmin.IsVerified = true
		db.Save(&familyAdmin)
		fmt.Println("Family Admin created/updated.")
	}

	// Link Member
	var membership models.FamilyMember
	if err := db.Where(models.FamilyMember{FamilyID: family.ID, UserID: familyAdmin.ID}).FirstOrCreate(&membership, models.FamilyMember{
		FamilyID: family.ID,
		UserID:   familyAdmin.ID,
		Role:     "admin",
	}).Error; err != nil {
		fmt.Printf("Error linking member: %v\n", err)
	}

	// ... (Wait, I'll stop here to avoid making the file too long in one edit)

	// 4. Create Sample Wallet
	wallet := models.Wallet{
		FamilyID:   family.ID,
		Name:       "Main Savings",
		WalletType: "savings",
		Balance:    0, // Will be updated by transactions or initial seed
	}
	db.Create(&wallet)
	fmt.Println("Main Savings wallet created.")

	// 5. Seed Transactions
	transactions := []models.Transaction{
		// Incomes
		{
			FamilyID:    family.ID,
			UserID:      familyAdmin.ID,
			WalletID:    wallet.ID,
			Type:        "income",
			Amount:      15000000,
			Category:    "Gaji",
			Date:        time.Date(2026, time.Now().Month(), 1, 0, 0, 0, 0, time.Local),
			Description: "Gaji Bulanan Suami",
		},
		{
			FamilyID:    family.ID,
			UserID:      familyAdmin.ID,
			WalletID:    wallet.ID,
			Type:        "income",
			Amount:      8000000,
			Category:    "Gaji",
			Date:        time.Date(2026, time.Now().Month(), 1, 0, 0, 0, 0, time.Local),
			Description: "Gaji Bulanan Istri",
		},
		{
			FamilyID:    family.ID,
			UserID:      familyAdmin.ID,
			WalletID:    wallet.ID,
			Type:        "income",
			Amount:      2500000,
			Category:    "Freelance",
			Date:        time.Date(2026, time.Now().Month(), 15, 0, 0, 0, 0, time.Local),
			Description: "Project Sampingan",
		},

		// Expenses
		{
			FamilyID:    family.ID,
			UserID:      familyAdmin.ID,
			WalletID:    wallet.ID,
			Type:        "expense",
			Amount:      1500000,
			Category:    "Belanja Dapur",
			Date:        time.Date(2026, time.Now().Month(), 2, 0, 0, 0, 0, time.Local),
			Description: "Belanja Bulanan Supermarket",
		},
		{
			FamilyID:    family.ID,
			UserID:      familyAdmin.ID,
			WalletID:    wallet.ID,
			Type:        "expense",
			Amount:      2500000,
			Category:    "Tempat Tinggal",
			Date:        time.Date(2026, time.Now().Month(), 5, 0, 0, 0, 0, time.Local),
			Description: "Bayar KPR",
		},
		{
			FamilyID:    family.ID,
			UserID:      familyAdmin.ID,
			WalletID:    wallet.ID,
			Type:        "expense",
			Amount:      600000,
			Category:    "Listrik & Air",
			Date:        time.Date(2026, time.Now().Month(), 10, 0, 0, 0, 0, time.Local),
			Description: "Token Listrik PLN",
		},
		{
			FamilyID:    family.ID,
			UserID:      familyAdmin.ID,
			WalletID:    wallet.ID,
			Type:        "expense",
			Amount:      400000,
			Category:    "Internet & Pulsa",
			Date:        time.Date(2026, time.Now().Month(), 11, 0, 0, 0, 0, time.Local),
			Description: "Bayar Indihome",
		},
		{
			FamilyID:    family.ID,
			UserID:      familyAdmin.ID,
			WalletID:    wallet.ID,
			Type:        "expense",
			Amount:      350000,
			Category:    "Makan Sehari-hari",
			Date:        time.Date(2026, time.Now().Month(), 12, 0, 0, 0, 0, time.Local),
			Description: "GoFood Hokben",
		},
		{
			FamilyID:    family.ID,
			UserID:      familyAdmin.ID,
			WalletID:    wallet.ID,
			Type:        "expense",
			Amount:      500000,
			Category:    "Sedekah / Zakat",
			Date:        time.Date(2026, time.Now().Month(), 15, 0, 0, 0, 0, time.Local),
			Description: "Sedekah Jumat",
		},
	}

	for _, tx := range transactions {
		db.Create(&tx)
		// Manually update wallet balance for seed (or use service if desired)
		switch tx.Type {
		case "income":
			wallet.Balance += tx.Amount
		case "expense":
			wallet.Balance -= tx.Amount
		}
	}
	db.Save(&wallet)

	fmt.Printf("Seeded 1 family and %d transactions across different months.\n", len(transactions))
}
