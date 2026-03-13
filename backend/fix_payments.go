package main

import (
	"fmt"
	"keuangan-keluarga/internal/models"
	"log"
	"time"

	"github.com/google/uuid"
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

	// 1. Find all UNPAID payments for the Stark Family
	familyID, _ := uuid.Parse("a6c6d92d-0117-48ee-8437-2d7f56fa9c27")
	var payments []models.PaymentTransaction
	db.Where("family_id = ? AND status = ?", familyID, "UNPAID").Find(&payments)

	fmt.Printf("Found %d UNPAID payments for family %s\n", len(payments), familyID)

	for _, p := range payments {
		fmt.Printf("Activating payment %s (Ref: %s)\n", p.ID, p.Reference)
		
		// Update Payment
		now := time.Now()
		p.Status = "PAID"
		p.PaidAt = &now
		db.Save(&p)

		// Activate Sub (Manual logic check)
		var family models.Family
		db.First(&family, "id = ?", p.FamilyID)

		var plan models.SubscriptionPlan
		db.First(&plan, "id = ?", p.PlanID)

		var newEnd time.Time
		if family.SubscriptionEndsAt.After(time.Now()) {
			newEnd = family.SubscriptionEndsAt.AddDate(0, 0, plan.DurationDays)
		} else {
			newEnd = time.Now().AddDate(0, 0, plan.DurationDays)
		}

		db.Model(&family).Updates(map[string]interface{}{
			"status":               "active",
			"subscription_plan":    plan.Name,
			"subscription_ends_at": newEnd,
		})

		fmt.Printf("Family %s updated to active, plan %s, ends %s\n", family.ID, plan.Name, newEnd.Format("2006-01-02"))

		// Create Notif
		var member models.FamilyMember
		db.Where("family_id = ?", p.FamilyID).First(&member)

		if member.UserID != uuid.Nil {
			notif := models.Notification{
				UserID:  member.UserID,
				Type:    "subscription",
				Title:   "Pembayaran Berhasil!",
				Message: fmt.Sprintf("Selamat! Paket '%s' Anda telah aktif hingga %s.", plan.Name, newEnd.Format("02 Jan 2006")),
			}
			db.Create(&notif)
			fmt.Printf("Notification created for user %s\n", member.UserID)
		}
	}
}
