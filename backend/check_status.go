package main

import (
	"fmt"
	"keuangan-keluarga/internal/models"
	"log"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	godotenv.Load()
	dsn := "host=127.0.0.1 user=postgres password=admin dbname=keuangan_keluarga port=5432 sslmode=disable"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal(err)
	}

	var payments []models.PaymentTransaction
	db.Order("created_at desc").Find(&payments)

	fmt.Printf("--- All Payment Transactions ---\n")
	for _, p := range payments {
		fmt.Printf("ID: %s | Ref: %s | Status: %s | Family: %s | Plan: %s | PaidAt: %v\n", 
			p.ID, p.Reference, p.Status, p.FamilyID, p.PlanName, p.PaidAt)
	}

	var families []models.Family
	db.Find(&families)
	fmt.Printf("\n--- All Families Status ---\n")
	for _, f := range families {
		fmt.Printf("ID: %s | Name: %s | Status: %s | Plan: %s | EndsAt: %v\n", 
			f.ID, f.Name, f.Status, f.SubscriptionPlan, f.SubscriptionEndsAt)
	}
}
