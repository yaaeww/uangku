package main

import (
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/routes"
	"log"

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

	log.Printf("Starting Server on port %s...", config.AppConfig.Port)
	if err := router.Run(":" + config.AppConfig.Port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
