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
	SendDebtReminders() error
	GetNotifications(userID uuid.UUID) ([]models.Notification, error)
	MarkAsRead(id uuid.UUID) error
	MarkAllAsRead(userID uuid.UUID) error
	DeleteNotification(id uuid.UUID) error
	DeleteAllNotifications(userID uuid.UUID) error
	DeleteBulkNotifications(userID uuid.UUID, ids []uuid.UUID) error
	NotifyUser(userID uuid.UUID, nType, title, message string) error
	NotifyUserInApp(userID uuid.UUID, nType, title, message string) error
	NotifyFamily(familyID, skipUserID uuid.UUID, nType, title, message string) error
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
			message := fmt.Sprintf("Halo %s! 👋\n\nWah, sepertinya hari ini belum ada pengeluaran yang dicatat nih. Yuk, jangan biarkan catatan keuangan keluarga bolong-bolong! Segera catatkan pengeluaranmu di Uangku ya. 😉", user.FullName)
			s.NotifyUser(user.ID, "reminder", "Pengingat Harian", message)
		} else {
			message := fmt.Sprintf("Halo %s! 👋\n\nTerima kasih ya sudah rajin mencatat keuangan hari ini! Keluarga sangat terbantu dengan kedisiplinanmu. Tetap semangat mengelola keuangan! 🚀", user.FullName)
			s.NotifyUser(user.ID, "info", "Mantap!", message)
		}
	}

	return nil
}

func (s *notificationService) SendDebtReminders() error {
	now := time.Now()
	// Find active debts with upcoming installment due dates
	var debts []models.Debt
	err := config.DB.Where("status = 'active' AND installment_interval_months > 0 AND next_installment_due_date > ?", now).Find(&debts).Error
	if err != nil {
		return err
	}

	for _, d := range debts {
		// Calculate days until due date (relative to today)
		// e.g., if today is 1st and due is 4th, target-now = 3 days
		daysUntil := int(time.Until(d.NextInstallmentDueDate).Hours() / 24)

		var title, message string
		shouldNotify := false

		switch daysUntil {
		case 3:
			// H-3 Reminder
			title = "Pengingat Cicilan (H-3)"
			message = fmt.Sprintf("Halo! 👋 Cicilan untuk '%s' sebesar Rp %.0f akan jatuh tempo dalam 3 hari (%s). Jangan lupa disiapkan ya!", 
				d.Name, d.InstallmentAmount, d.NextInstallmentDueDate.Format("02-01-2006"))
			shouldNotify = true
		case -1:
			// H+1 Overdue Reminder
			title = "Tagihan Terlambat! (H+1)"
			message = fmt.Sprintf("⚠️ Perhatian! Cicilan untuk '%s' sebesar Rp %.0f sudah melewati jatuh tempo (%s). Silakan lakukan pembayaran segera.", 
				d.Name, d.InstallmentAmount, d.NextInstallmentDueDate.Format("02-01-2006"))
			shouldNotify = true
		}

		if shouldNotify && (d.LastReminderSentAt.IsZero() || d.LastReminderSentAt.Before(now.AddDate(0, 0, -1))) {
			// Find family members to notify
			var members []models.FamilyMember
			config.DB.Where("family_id = ?", d.FamilyID).Find(&members)

			for _, m := range members {
				s.NotifyUser(m.UserID, "reminder", title, message)
			}

			// Update debt to avoid duplicate reminders today
			config.DB.Model(&d).Update("last_reminder_sent_at", now)
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

func (s *notificationService) MarkAllAsRead(userID uuid.UUID) error {
	return config.DB.Model(&models.Notification{}).Where("user_id = ? AND is_read = false", userID).Update("is_read", true).Error
}

func (s *notificationService) DeleteNotification(id uuid.UUID) error {
	return config.DB.Delete(&models.Notification{}, "id = ?", id).Error
}

func (s *notificationService) DeleteAllNotifications(userID uuid.UUID) error {
	return config.DB.Delete(&models.Notification{}, "user_id = ?", userID).Error
}

func (s *notificationService) DeleteBulkNotifications(userID uuid.UUID, ids []uuid.UUID) error {
	return config.DB.Where("user_id = ? AND id IN ?", userID, ids).Delete(&models.Notification{}).Error
}

func (s *notificationService) NotifyUserInApp(userID uuid.UUID, nType, title, message string) error {
	notification := &models.Notification{
		UserID:  userID,
		Type:    nType,
		Title:   title,
		Message: message,
	}
	return config.DB.Create(notification).Error
}

func (s *notificationService) NotifyFamily(familyID, skipUserID uuid.UUID, nType, title, message string) error {
	var userIDs []uuid.UUID
	err := config.DB.Table("family_members").Where("family_id = ?", familyID).Pluck("user_id", &userIDs).Error
	if err != nil {
		return err
	}

	for _, uID := range userIDs {
		if uID == skipUserID {
			continue
		}
		// Create in-app notification for members
		if err := s.NotifyUserInApp(uID, nType, title, message); err != nil {
			log.Printf("[Notification] Failed to notify family member %s: %v", uID, err)
		}
	}
	return nil
}

func (s *notificationService) NotifyUser(userID uuid.UUID, nType, title, message string) error {
	// 1. Record Notification in DB
	if err := s.NotifyUserInApp(userID, nType, title, message); err != nil {
		log.Printf("[Notification] Failed to save to DB: %v", err)
	}

	// 2. Fetch User for Phone Number
	var user models.User
	if err := config.DB.Select("phone_number").Where("id = ?", userID).First(&user).Error; err != nil {
		return err
	}

	// 3. Send WhatsApp if phone number exists
	if user.PhoneNumber != "" {
		waMessage := fmt.Sprintf("Uangku: *%s*\n\n%s", title, message)
		err := s.mail.SendWhatsApp(user.PhoneNumber, waMessage)
		if err != nil {
			log.Printf("[Notification] Failed to send WhatsApp to %s: %v", user.PhoneNumber, err)
			return err
		}
		log.Printf("[Notification] WhatsApp sent to %s: %s", user.PhoneNumber, title)
	}

	return nil
}
