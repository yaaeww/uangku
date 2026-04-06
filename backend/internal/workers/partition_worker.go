package workers

import (
	"keuangan-keluarga/internal/config"
	"log"
	"time"
)

// StartPartitionWorker starts a background goroutine that ensures future partitions exist.
// It checks once a week.
func StartPartitionWorker() {
	log.Println("Starting Partition Worker (Weekly Maintenance)...")
	go func() {
		for {
			log.Println("[PartitionWorker] Checking future partitions...")
			// Ensure 13 months ahead (covers the rest of this year and all of next)
			now := time.Now()
			for i := 0; i < 13; i++ {
				target := now.AddDate(0, i, 0)
				if err := config.EnsurePartitionForDate(config.DB, target); err != nil {
					log.Printf("[PartitionWorker] Error creating partition: %v", err)
				}
			}
			
			// Sleep for 1 week
			time.Sleep(7 * 24 * time.Hour)
		}
	}()
}
