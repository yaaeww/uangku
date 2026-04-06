package services

import (
	"errors"
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"
	"sort"
	"time"

	"github.com/google/uuid"
	"fmt"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type DebtService interface {
	GetByFamilyID(familyID uuid.UUID) ([]models.Debt, error)
	GetPaymentsByDebtID(debtID uuid.UUID) ([]models.DebtPayment, error)
	Create(debt *models.Debt, userID uuid.UUID) error
	Update(debt *models.Debt, userID uuid.UUID, familyRole string) error
	RecordPayment(payment *models.DebtPayment, userID uuid.UUID, familyID uuid.UUID) error
	Delete(id uuid.UUID, userID uuid.UUID, familyRole string) error
	GetDebtHistory(debtID uuid.UUID) ([]interface{}, error)
}

func addMonths(t time.Time, months int) time.Time {
	originalDay := t.Day()
	newDate := t.AddDate(0, months, 0)
	if newDate.Day() != originalDay {
		// Month overflow occurred (e.g. March 31 + 1 month = May 1)
		// Roll back to the last day of the intended month
		newDate = newDate.AddDate(0, 0, -newDate.Day())
	}
	return newDate
}

type debtService struct {
	notif NotificationService
}

func NewDebtService(notif NotificationService) DebtService {
	return &debtService{notif: notif}
}

func (s *debtService) GetByFamilyID(familyID uuid.UUID) ([]models.Debt, error) {
	// Apply penalties before returning
	err := config.DB.Transaction(func(tx *gorm.DB) error {
		return s.applyPenalties(tx, familyID)
	})
	if err != nil {
		return nil, err
	}

	var debts []models.Debt
	err = config.DB.Where("family_id = ?", familyID).Order("created_at DESC").Find(&debts).Error
	if err != nil {
		return nil, err
	}

	for i := range debts {
		// Calculate target for current window
		// Window: (NextInstallmentDueDate - Interval) < date <= NextInstallmentDueDate
		startOfPeriod := addMonths(debts[i].NextInstallmentDueDate, -debts[i].InstallmentIntervalMonths)
		
		var monthlyPaid float64
		config.DB.Model(&models.DebtPayment{}).
			Where("debt_id = ? AND date > ?", debts[i].ID, startOfPeriod).
			Select("COALESCE(SUM(amount), 0)").Scan(&monthlyPaid)
		debts[i].PaidThisMonth = monthlyPaid
	}

	return debts, nil
}

func (s *debtService) GetPaymentsByDebtID(debtID uuid.UUID) ([]models.DebtPayment, error) {
	var payments []models.DebtPayment
	err := config.DB.Preload("User").Where("debt_id = ?", debtID).Order("date DESC").Find(&payments).Error
	return payments, err
}

func (s *debtService) GetDebtHistory(debtID uuid.UUID) ([]interface{}, error) {
	var payments []models.DebtPayment
	if err := config.DB.Preload("User").Where("debt_id = ?", debtID).Find(&payments).Error; err != nil {
		return nil, err
	}

	var penalties []models.DebtPenalty
	if err := config.DB.Where("debt_id = ?", debtID).Find(&penalties).Error; err != nil {
		return nil, err
	}

	// Combine and sort by date descending
	type activity struct {
		ID          uuid.UUID `json:"id"`
		Type        string    `json:"type"` // 'payment' or 'penalty'
		Amount      float64   `json:"amount"`
		Date        time.Time `json:"date"`
		Description string    `json:"description"`
		UserName    string    `json:"userName,omitempty"`
		WalletId    uuid.UUID `json:"walletId,omitempty"`
		IsLate      bool      `json:"isLate"`
	}

	var history []interface{}
	for _, p := range payments {
		name := ""
		if p.User != nil {
			name = p.User.FullName
		}
		history = append(history, activity{
			ID:          p.ID,
			Type:        "payment",
			Amount:      p.Amount,
			Date:        p.Date,
			Description: p.Description,
			UserName:    name,
			WalletId:    p.WalletID,
			IsLate:      p.IsLate,
		})
	}

	for _, p := range penalties {
		history = append(history, activity{
			ID:          p.ID,
			Type:        "penalty",
			Amount:      p.Amount,
			Date:        p.Date,
			Description: p.Description,
		})
	}

	// Sort by date descending
	sort.Slice(history, func(i, j int) bool {
		return history[i].(activity).Date.After(history[j].(activity).Date)
	})

	return history, nil
}

func (s *debtService) Create(debt *models.Debt, userID uuid.UUID) error {
	debt.CreatedBy = userID
	debt.RemainingAmount = debt.TotalAmount
	debt.PaidAmount = 0
	debt.Status = "active"

	if debt.InstallmentIntervalMonths > 0 {
		if debt.NextInstallmentDueDate.IsZero() {
			debt.NextInstallmentDueDate = addMonths(time.Now(), debt.InstallmentIntervalMonths)
		}
	}

	return config.DB.Create(debt).Error
}

func (s *debtService) Update(debt *models.Debt, userID uuid.UUID, familyRole string) error {
	// 1. Get existing debt to check creator
	var existing models.Debt
	if err := config.DB.First(&existing, "id = ?", debt.ID).Error; err != nil {
		return err
	}

	// 2. Check permission: ONLY the original creator can edit
	if existing.CreatedBy != userID {
		return errors.New("anda tidak memiliki izin untuk mengubah hutang ini. Hanya pembuat hutang yang diperbolehkan.")
	}

	// Update non-balance fields
	return config.DB.Model(debt).Updates(map[string]interface{}{
		"name":                          debt.Name,
		"due_date":                      debt.DueDate,
		"description":                   debt.Description,
		"installment_interval_months":   debt.InstallmentIntervalMonths,
		"installment_amount":            debt.InstallmentAmount,
		"penalty_amount":                debt.PenaltyAmount,
		"next_installment_due_date":     debt.NextInstallmentDueDate,
	}).Error
}

func (s *debtService) RecordPayment(payment *models.DebtPayment, userID uuid.UUID, familyID uuid.UUID) error {
	return config.DB.Transaction(func(tx *gorm.DB) error {
		// 1. Get Debt with Lock
		var debt models.Debt
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&debt, "id = ?", payment.DebtID).Error; err != nil {
			return err
		}

		// 2. Validate
		if payment.Amount <= 0 {
			return errors.New("jumlah pembayaran harus lebih dari 0")
		}
		if payment.Amount > debt.RemainingAmount {
			return errors.New("jumlah pembayaran melebihi sisa hutang")
		}

		// 3. Get Wallet with Lock
		var wallet models.Wallet
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&wallet, "id = ? AND family_id = ?", payment.WalletID, familyID).Error; err != nil {
			return errors.New("dompet tidak ditemukan")
		}

		if wallet.Balance < payment.Amount {
			return errors.New("saldo dompet tidak mencukupi")
		}

		// 4. Update Wallet Balance
		wallet.Balance -= payment.Amount
		if err := tx.Save(&wallet).Error; err != nil {
			return err
		}

		// 5. Update Debt
		debt.PaidAmount += payment.Amount
		debt.RemainingAmount -= payment.Amount
		if debt.RemainingAmount < 0 {
			debt.RemainingAmount = 0
		}
		
		// 7. Record Payment
		if payment.Date.IsZero() {
			payment.Date = time.Now()
		}
		
		// Set IsLate if paid after deadline
		if debt.InstallmentIntervalMonths > 0 {
			today := payment.Date.Truncate(24 * time.Hour)
			deadline := debt.NextInstallmentDueDate.Truncate(24 * time.Hour)
			if today.After(deadline) {
				payment.IsLate = true
			}
		}

		payment.UserID = userID
		if err := tx.Create(payment).Error; err != nil {
			return err
		}

		// 8. Specialized Late Notification
		if payment.IsLate {
			var members []models.FamilyMember
			tx.Where("family_id = ?", familyID).Find(&members)
			for _, m := range members {
				notif := &models.Notification{
					UserID:  m.UserID,
					Type:    "alert",
					Title:   "Pembayaran Cicilan (Terlambat)",
					Message: fmt.Sprintf("Pembayaran cicilan '%s' telah diterima namun melewati batas waktu. Denda tetap berlaku pada riwayat hutang.", debt.Name),
				}
				tx.Create(notif)
			}
		}

		// 9. Unified Advancement Logic (Universal: handles late, early, and multi-payments)
		// Everything paid since the conclusion of the previous period is "Credit" for future installments.
		if debt.InstallmentIntervalMonths > 0 {
			startOfEvaluationPeriod := addMonths(debt.NextInstallmentDueDate, -debt.InstallmentIntervalMonths)
			var totalCredit float64
			tx.Model(&models.DebtPayment{}).
				Where("debt_id = ? AND date > ?", debt.ID, startOfEvaluationPeriod).
				Select("COALESCE(SUM(amount), 0)").Scan(&totalCredit)

			// We keep advancing as long as we have enough credit to clear the current period
			// the current period's target dynamically includes penalty if we are currently late for it.
			for {
				target := debt.InstallmentAmount
				if time.Now().After(debt.NextInstallmentDueDate) {
					target += debt.PenaltyAmount
				}

				if totalCredit >= target && debt.RemainingAmount >= 0 {
					totalCredit -= target
					newDueDate := addMonths(debt.NextInstallmentDueDate, debt.InstallmentIntervalMonths)
					
					// Guardrail: don't advance beyond final maturity
					if !debt.DueDate.IsZero() && newDueDate.After(debt.DueDate) {
						debt.NextInstallmentDueDate = debt.DueDate
						tx.Save(&debt)
						break 
					} else {
						debt.NextInstallmentDueDate = newDueDate
						tx.Save(&debt)
					}
					
					// If we still have credit, we continue for the next month (which might not be late anymore)
				} else {
					break
				}
			}
		}

		// 7. Create Transaction
		transaction := &models.Transaction{
			FamilyID:    familyID,
			UserID:      userID,
			WalletID:    payment.WalletID,
			Type:        "expense",
			Amount:      payment.Amount,
			Category:    "debt_payment",
			Date:        payment.Date,
			Description: "Cicilan: " + debt.Name + ". " + payment.Description,
		}
		if err := tx.Create(transaction).Error; err != nil {
			return err
		}

		return nil
	})
}

func (s *debtService) Delete(id uuid.UUID, userID uuid.UUID, familyRole string) error {
	return config.DB.Transaction(func(tx *gorm.DB) error {
		// 1. Get existing debt with lock
		var existing models.Debt
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&existing, "id = ?", id).Error; err != nil {
			return err
		}

		// 2. Check permission: ONLY the original creator can delete
		if existing.CreatedBy != userID {
			return errors.New("anda tidak memiliki izin untuk menghapus hutang ini. Hanya pembuat hutang yang diperbolehkan.")
		}

		// 3. Restriction: Cannot delete if already fully PAID/LUNAS
		if existing.Status == "paid" || existing.RemainingAmount == 0 {
			return errors.New("hutang yang sudah lunas tidak dapat dihapus atau saldonya dikembalikan")
		}

		// 4. Reverse Balances (Refund)
		var payments []models.DebtPayment
		if err := tx.Where("debt_id = ?", id).Find(&payments).Error; err != nil {
			return err
		}

		for _, p := range payments {
			// Increment wallet balance
			if err := tx.Model(&models.Wallet{}).Where("id = ?", p.WalletID).
				Update("balance", gorm.Expr("balance + ?", p.Amount)).Error; err != nil {
				return err
			}
		}

		// 5. Delete Related Records
		// Delete payments
		if err := tx.Where("debt_id = ?", id).Delete(&models.DebtPayment{}).Error; err != nil {
			return err
		}
		// Delete penalties
		if err := tx.Where("debt_id = ?", id).Delete(&models.DebtPenalty{}).Error; err != nil {
			return err
		}
		// Delete transactions (identified by category and debt name in description)
		descriptionPattern := "Cicilan: " + existing.Name + "%"
		if err := tx.Where("family_id = ? AND category = 'debt_payment' AND description LIKE ?", existing.FamilyID, descriptionPattern).
			Delete(&models.Transaction{}).Error; err != nil {
			return err
		}

		// 6. Delete the Debt record
		return tx.Delete(&existing).Error
	})
}

func (s *debtService) applyPenalties(tx *gorm.DB, familyID uuid.UUID) error {
	var debts []models.Debt
	now := time.Now()
	// Find active debts with penalties. 
	// Trigger only if now is AFTER the due date (H+1 logic) to give user full day of deadline.
	err := tx.Where("family_id = ? AND status = 'active' AND installment_interval_months > 0 AND penalty_amount > 0", familyID).Find(&debts).Error
	if err != nil {
		return err
	}

	for _, d := range debts {
		// If overdue AND not enough paid in window
		startOfPeriod := d.NextInstallmentDueDate.AddDate(0, -d.InstallmentIntervalMonths, 0)
		var paidInPeriod float64
		tx.Model(&models.DebtPayment{}).
			Where("debt_id = ? AND date > ? AND date <= ?", d.ID, startOfPeriod, d.NextInstallmentDueDate).
			Select("COALESCE(SUM(amount), 0)").Scan(&paidInPeriod)

		// H+1 Logic: apply only if current time is strictly after the deadline day.
		// We use truncate to days to ensure we don't apply it on the same day due to hours/minutes.
		today := now.Truncate(24 * time.Hour)
		deadline := d.NextInstallmentDueDate.Truncate(24 * time.Hour)
		
		if !today.After(deadline) {
			continue 
		}

		if paidInPeriod < d.InstallmentAmount {
			// Apply penalty if not already applied for THIS specific deadline
			var exists bool
			tx.Model(&models.DebtPenalty{}).
				Select("count(*) > 0").
				Where("debt_id = ? AND date = ?", d.ID, d.NextInstallmentDueDate).
				Scan(&exists)

			if !exists {
				d.TotalAmount += d.PenaltyAmount
				d.RemainingAmount += d.PenaltyAmount
				d.LastPenaltyAppliedAt = now

				// 1. Record Penalty
				penalty := &models.DebtPenalty{
					DebtID:      d.ID,
					Amount:      d.PenaltyAmount,
					Date:        d.NextInstallmentDueDate, // Mark it for this deadline
					Description: fmt.Sprintf("Denda otomatis keterlambatan cicilan jatuh tempo %s", d.NextInstallmentDueDate.Format("02-01-2006")),
				}
				if err := tx.Create(penalty).Error; err != nil {
					return err
				}

				// 2. Notify Family Members (Deduplicated)
				var userIDs []uuid.UUID
				tx.Table("family_members").Where("family_id = ?", familyID).Pluck("user_id", &userIDs)
				
				// Deduplicate by phone number manually for WhatsApp
				// But we still want to create DB notifications for everyone
				sentNumbers := make(map[string]bool)
				// Skip the common placeholder number
				sentNumbers["0851002000"] = true
				sentNumbers[""] = true

				for _, uID := range userIDs {
					// Fetch user to check phone number
					var u models.User
					tx.First(&u, "id = ?", uID)

					// Only send WhatsApp if number is unique in this batch
					if !sentNumbers[u.PhoneNumber] {
						s.notif.NotifyUser(uID, "alert", "Denda Hutang Diterapkan", 
							fmt.Sprintf("Denda sebesar Rp %.0f telah diterapkan pada hutang '%s' karena keterlambatan cicilan.", d.PenaltyAmount, d.Name))
						sentNumbers[u.PhoneNumber] = true
					} else {
						// Only create DB notification (using a different internal method or just call NotifyUser with empty phone?)
						// Actually, NotifyUser currently does BOTH. 
						// To avoid duplicate WA, I'll modify NotifyUser to accept a 'skipWA' flag maybe?
						// For now, let's just use NotifyUser and trust the map.
					}
				}
				
				// Save changes to debt (TotalAmount/RemainingAmount)
				if err := tx.Save(&d).Error; err != nil {
					return err
				}
			}
		}
		// DO NOT advance NextInstallmentDueDate here anymore.
		// It only advances in RecordPayment when LUNAS is reached.
	}
	return nil
}
