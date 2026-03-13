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
	superAdmin := models.User{
		Email:        "admin@platform.com",
		PasswordHash: string(hashedPassword),
		FullName:     "Super Admin",
		Role:         "super_admin",
		IsVerified:   true,
	}
	db.Where(models.User{Email: superAdmin.Email}).FirstOrCreate(&superAdmin)
	superAdmin.IsVerified = true
	db.Save(&superAdmin)
	fmt.Println("Super Admin created/updated.")

	// 2. Create Sample Family
	family := models.Family{
		Name: "The Stark Family",
	}
	db.Create(&family)

	// 3. Create Family Admin
	familyAdmin := models.User{
		Email:        "ned@stark.com",
		PasswordHash: string(hashedPassword),
		FullName:     "Ned Stark",
		Role:         "family_admin",
		IsVerified:   true,
	}
	db.Where(models.User{Email: familyAdmin.Email}).FirstOrCreate(&familyAdmin)
	familyAdmin.IsVerified = true
	db.Save(&familyAdmin)

	// Link Member
	db.Create(&models.FamilyMember{
		FamilyID: family.ID,
		UserID:   familyAdmin.ID,
		Role:     "admin",
	})

	// 4. Create Sample Wallet
	wallet := models.Wallet{
		FamilyID:   family.ID,
		Name:       "Main Savings",
		WalletType: "savings",
		Balance:    0, // Will be updated by transactions or initial seed
	}
	db.Create(&wallet)
	fmt.Println("Main Savings wallet created.")

	// 5. Seed Transactions (Monthly Partitioning Test)
	transactions := []models.Transaction{
		{
			FamilyID:    family.ID,
			UserID:      familyAdmin.ID,
			WalletID:    wallet.ID,
			Type:        "income",
			Amount:      10000,
			Date:        time.Date(2026, 1, 15, 0, 0, 0, 0, time.UTC),
			Description: "Sword Maintenance Allowance",
		},
		{
			FamilyID:    family.ID,
			UserID:      familyAdmin.ID,
			WalletID:    wallet.ID,
			Type:        "expense",
			Amount:      2500,
			Date:        time.Date(2026, 2, 20, 0, 0, 0, 0, time.UTC),
			Description: "Winter Supplies",
		},
		{
			FamilyID:    family.ID,
			UserID:      familyAdmin.ID,
			WalletID:    wallet.ID,
			Type:        "expense",
			Amount:      1200,
			Date:        time.Date(2026, 3, 5, 0, 0, 0, 0, time.UTC),
			Description: "Horse Feed",
		},
	}

	for _, tx := range transactions {
		db.Create(&tx)
		// Manually update wallet balance for seed (or use service if desired)
		if tx.Type == "income" {
			wallet.Balance += tx.Amount
		} else if tx.Type == "expense" {
			wallet.Balance -= tx.Amount
		}
	}
	db.Save(&wallet)

	fmt.Printf("Seeded 1 family and %d transactions across different months.\n", len(transactions))
}
