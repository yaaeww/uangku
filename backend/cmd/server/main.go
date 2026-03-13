package main

import (
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/services"
	"keuangan-keluarga/routes"
	"log"
	"time"

	"github.com/gin-gonic/gin"
)

func main() {
	log.Println("Initializing server...")

	// 1. Load configuration
	log.Println("Loading configuration...")
	config.LoadConfig()

	// 2. Connect to Database
	log.Println("Initializing database and running migrations (this may take a few seconds)...")
	config.ConnectDatabase()

	// 3. Initialize Router
	log.Println("Initializing router...")
	router := gin.Default()

	// 4. Setup Routes
	log.Println("Setting up routes...")
	routes.SetupRoutes(router)

	// 5. Start Background Scheduler for Daily Reminders
	go startDailyReminderScheduler()

	log.Printf("Starting Server on port %s...", config.AppConfig.Port)
	if err := router.Run(":" + config.AppConfig.Port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

func startDailyReminderScheduler() {
	log.Println("Background Scheduler started for Daily Reminders")
	
	// Re-initialize services needed for background task
	// This mirrors the setup in routes.go
	mailService := services.NewMailService()
	notifService := services.NewNotificationService(mailService)

	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()

	for {
		now := time.Now()
		// Target time: 20:00 (8 PM)
		if now.Hour() == 20 {
			log.Println("Executing scheduled Daily Reminders...")
			err := notifService.SendDailyReminders()
			if err != nil {
				log.Printf("Error during daily reminders: %v", err)
			}
		}
		<-ticker.C
	}
}
