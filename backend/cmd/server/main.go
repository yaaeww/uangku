package main

import (
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/services"
	"keuangan-keluarga/internal/workers"
	"keuangan-keluarga/routes"
	"log"
	"os"
	"os/exec"
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
	router.SetTrustedProxies(nil) // Silence trusted proxies warning

	// 4. Setup Routes
	log.Println("Setting up routes...")
	routes.SetupRoutes(router)

	// 5. Start Persistent OCR Service (Node.js)
	go startOCRService()

	// 6. Start Background Scheduler for Daily Reminders
	go startDailyReminderScheduler()

	// 7. Start Partition Worker (Weekly Maintenance)
	workers.StartPartitionWorker()

	log.Printf("Starting Server on port %s...", config.AppConfig.Port)
	if err := router.Run(":" + config.AppConfig.Port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

func startOCRService() {
	log.Println("Starting Persistent OCR Service (Node.js)...")
	// Execute node scripts/ocr-service.js
	cmd := exec.Command("node", "scripts/ocr-service.js")
	
	// Pipe output to see initialization logs
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Start(); err != nil {
		log.Printf("CRITICAL ERROR: Failed to start OCR service: %v. Please make sure node is installed.", err)
		return
	}

	log.Printf("OCR Service process started with PID %d", cmd.Process.Pid)
	
	err := cmd.Wait()
	if err != nil {
		log.Printf("OCR Service exited: %v", err)
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

			log.Println("Executing scheduled Debt Reminders...")
			err = notifService.SendDebtReminders()
			if err != nil {
				log.Printf("Error during debt reminders: %v", err)
			}
		}
		<-ticker.C
	}
}
