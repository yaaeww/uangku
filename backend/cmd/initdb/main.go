package main

import (
	"fmt"
	"keuangan-keluarga/internal/config"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	config.LoadConfig()

	// Connect to default 'postgres' database to create the new one
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=postgres port=%s sslmode=%s",
		config.AppConfig.DBHost, config.AppConfig.DBUser, config.AppConfig.DBPassword, config.AppConfig.DBPort, config.AppConfig.DBSSLMode)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to postgres database:", err)
	}

	// Create the database
	err = db.Exec(fmt.Sprintf("CREATE DATABASE %s", config.AppConfig.DBName)).Error
	if err != nil {
		fmt.Printf("Database might already exist or error: %v\n", err)
	} else {
		fmt.Printf("Database %s created successfully.\n", config.AppConfig.DBName)
	}
}
