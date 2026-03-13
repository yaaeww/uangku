package services

import (
	"fmt"
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"
	"log"
	"time"

	"github.com/google/uuid"
)

type NotificationService interface {
	SendDailyReminders() error
	GetNotifications(userID uuid.UUID) ([]models.Notification, error)
	MarkAsRead(id uuid.UUID) error
}

type notificationService struct {
	mail MailService
}

func NewNotificationService(mail MailService) NotificationService {
	return &notificationService{mail: mail}
}

func (s *notificationService) SendDailyReminders() error {
	today := time.Now().Truncate(24 * time.Hour)
	
	// 1. Find all verified users
	var users []models.User
	if err := config.DB.Where("is_verified = true").Find(&users).Error; err != nil {
		return err
	}

	for _, user := range users {
		// 2. Check for transactions today
		var count int64
		config.DB.Model(&models.Transaction{}).
			Where("user_id = ? AND date >= ?", user.ID, today).
			Count(&count)

		if count == 0 {
			// 3. Send WhatsApp Reminder
			message := fmt.Sprintf("Halo %s! 👋\n\nWah, sepertinya hari ini belum ada pengeluaran yang dicatit nih. Yuk, jangan biarkan catatan keuangan keluarga bolong-bolong! Segera catatkan pengeluaranmu di DagangFinance ya. 😉", user.FullName)
			
			if user.PhoneNumber != "" {
				err := s.mail.SendWhatsApp(user.PhoneNumber, message)
				if err != nil {
					log.Printf("Failed to send daily reminder to %s: %v", user.PhoneNumber, err)
					continue
				}

				// 4. Record Notification in DB
				notification := &models.Notification{
					UserID:  user.ID,
					Type:    "reminder",
					Title:   "Pengingat Harian",
					Message: message,
				}
				config.DB.Create(notification)
				log.Printf("Daily reminder sent to user %s (%s)", user.FullName, user.PhoneNumber)
			}
		} else {
            // Already logged something today
            message := fmt.Sprintf("Halo %s! 👋\n\nTerima kasih ya sudah rajin mencatat keuangan hari ini! Keluarga sangat terbantu dengan kedisiplinanmu. Tetap semangat mengelola keuangan! 🚀", user.FullName)
            
            // Optionally send a "Good Job" message or just log it to DB (app notification)
            notification := &models.Notification{
                UserID:  user.ID,
                Type:    "info",
                Title:   "Mantap!",
                Message: message,
            }
            config.DB.Create(notification)
        }
	}

	return nil
}

func (s *notificationService) GetNotifications(userID uuid.UUID) ([]models.Notification, error) {
	var notifications []models.Notification
	err := config.DB.Where("user_id = ?", userID).Order("created_at DESC").Limit(50).Find(&notifications).Error
	return notifications, err
}

func (s *notificationService) MarkAsRead(id uuid.UUID) error {
	return config.DB.Model(&models.Notification{}).Where("id = ?", id).Update("is_read", true).Error
}
