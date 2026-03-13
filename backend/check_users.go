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

	var users []models.User
	db.Preload("FamilyMember").Find(&users)

	fmt.Printf("--- Users and Families ---\n")
	for _, u := range users {
		fm := "None"
		famID := "N/A"
		if u.FamilyMember != nil {
			fm = u.FamilyMember.Role
			famID = u.FamilyMember.FamilyID.String()
		}
		fmt.Printf("User: %s | Email: %s | FamilyID: %s | Role: %s\n", u.FullName, u.Email, famID, fm)
	}
}
