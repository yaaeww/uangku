package main

import (
	"log"
	"time"

	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"
	"keuangan-keluarga/internal/repositories"

	"github.com/google/uuid"
)

func main() {
	config.LoadConfig()
	config.ConnectDatabase()

	repo := repositories.NewFinanceRepository()

	// 1. Get all unique (family_id, month, year) from transactions
	type Group struct {
		FamilyID uuid.UUID
		Month    int
		Year     int
	}
	var groups []Group

	log.Println("FETCHING unique family clusters from transactions...")
	config.DB.Model(&models.Transaction{}).
		Select("family_id, CAST(EXTRACT(MONTH FROM date) AS INTEGER) as month, CAST(EXTRACT(YEAR FROM date) AS INTEGER) as year").
		Group("family_id, month, year").
		Scan(&groups)

	log.Printf("Found %d family/month clusters to backfill.", len(groups))

	for i, g := range groups {
		log.Printf("[%d/%d] Processing Family: %s | Period: %d/%d", i+1, len(groups), g.FamilyID, g.Month, g.Year)
		start := time.Now()
		
		err := repo.SyncMonthlySummary(g.FamilyID, g.Month, g.Year)
		if err != nil {
			log.Printf("Error processing %s: %v", g.FamilyID, err)
		} else {
			log.Printf("   Done in %v", time.Since(start))
		}
	}

	log.Println("BACKFILL COMPLETED SUCCESSFULLY!")
}
