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

	var notifs []models.Notification
	db.Order("created_at desc").Find(&notifs)

	fmt.Printf("--- Notifications ---\n")
	for _, n := range notifs {
		fmt.Printf("User: %s | Title: %s | Created: %v\n", n.UserID, n.Title, n.CreatedAt)
	}

	var members []models.FamilyMember
	db.Find(&members)
	fmt.Printf("\n--- All Family Members ---\n")
	for _, m := range members {
		fmt.Printf("UserID: %s | FamilyID: %s | Role: %s\n", m.UserID, m.FamilyID, m.Role)
	}
}
