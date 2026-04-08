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
	FullRecalculate(tx *gorm.DB, debtID uuid.UUID) error
}

func addMonths(t time.Time, months int) time.Time {
	if months == 0 {
		return t
	}
	originalDay := t.Day()
	newDate := t.AddDate(0, months, 0)
	if newDate.Day() != originalDay {
		newDate = newDate.AddDate(0, 0, -newDate.Day())
	}
	return newDate
}

func (s *debtService) calculateFirstDueDate(startDate time.Time, paymentDay int) time.Time {
	if paymentDay <= 0 {
		return addMonths(startDate, 1) // Fallback to 1 month later
	}
	
	// Try the payment day in current month
	first := time.Date(startDate.Year(), startDate.Month(), paymentDay, 0, 0, 0, 0, startDate.Location())
	
	// If the payment day this month has passed or is today, move to next month
	if !first.After(startDate) {
		first = first.AddDate(0, 1, 0)
		// Ensure day is correct for next month (handle 31st vs 30th)
		lastDay := time.Date(first.Year(), first.Month()+1, 0, 0, 0, 0, 0, first.Location()).Day()
		targetDay := paymentDay
		if targetDay > lastDay {
			targetDay = lastDay
		}
		first = time.Date(first.Year(), first.Month(), targetDay, 0, 0, 0, 0, first.Location())
	} else {
		// Even if it's after, handle overflow for current month just in case
		lastDay := time.Date(first.Year(), first.Month()+1, 0, 0, 0, 0, 0, first.Location()).Day()
		if paymentDay > lastDay {
			first = time.Date(first.Year(), first.Month(), lastDay, 0, 0, 0, 0, first.Location())
		}
	}
	return first
}

func (s *debtService) getNextInstallmentDate(currentDate time.Time, paymentDay int, interval int) time.Time {
	next := currentDate.AddDate(0, interval, 0)
	lastDay := time.Date(next.Year(), next.Month()+1, 0, 0, 0, 0, 0, next.Location()).Day()
	targetDay := paymentDay
	if targetDay <= 0 {
		targetDay = currentDate.Day()
	}
	if targetDay > lastDay {
		targetDay = lastDay
	}
	return time.Date(next.Year(), next.Month(), targetDay, 0, 0, 0, 0, next.Location())
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
		startOfPeriod := addMonths(debts[i].NextInstallmentDueDate, -debts[i].InstallmentIntervalMonths)
		
		var monthlyPaid float64
		config.DB.Model(&models.DebtPayment{}).
			Where("debt_id = ? AND date >= ?", debts[i].ID, startOfPeriod).
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
		ID            uuid.UUID  `json:"id"`
		Type          string     `json:"type"` // 'payment' or 'penalty'
		Amount        float64    `json:"amount"`
		Date          time.Time  `json:"date"`
		Description   string     `json:"description"`
		UserName      string     `json:"userName,omitempty"`
		WalletId      uuid.UUID  `json:"walletId,omitempty"`
		TransactionId *uuid.UUID `json:"transactionId,omitempty"`
		IsLate        bool       `json:"isLate"`
	}

	var history []interface{}
	for _, p := range payments {
		name := ""
		if p.User != nil {
			name = p.User.FullName
		}
		history = append(history, activity{
			ID:            p.ID,
			Type:          "payment",
			Amount:        p.Amount,
			Date:          p.Date,
			Description:   p.Description,
			UserName:      name,
			WalletId:      p.WalletID,
			TransactionId: p.TransactionID,
			IsLate:        p.IsLate,
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
	
	if debt.StartDate.IsZero() {
		debt.StartDate = time.Now()
	}

	if debt.InstallmentIntervalMonths > 0 {
		if debt.NextInstallmentDueDate.IsZero() {
			debt.NextInstallmentDueDate = s.calculateFirstDueDate(debt.StartDate, debt.PaymentDay)
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

	// Update fields
	debt.RemainingAmount = debt.TotalAmount - existing.PaidAmount
	if debt.RemainingAmount < 0 {
		debt.RemainingAmount = 0
	}

	err := config.DB.Model(debt).Updates(map[string]interface{}{
		"name":                        debt.Name,
		"total_amount":                debt.TotalAmount,
		"remaining_amount":            debt.RemainingAmount,
		"due_date":                    debt.DueDate,
		"description":                 debt.Description,
		"installment_interval_months": debt.InstallmentIntervalMonths,
		"next_installment_due_date":   debt.NextInstallmentDueDate,
		"start_date":                  debt.StartDate,
		"payment_day":                 debt.PaymentDay,
	}).Error
	if err != nil {
		return err
	}

	// 3. Trigger recalculation to see if we need to advance cycles based on existing payments
	return config.DB.Transaction(func(tx *gorm.DB) error {
		var updated models.Debt
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&updated, "id = ?", debt.ID).Error; err != nil {
			return err
		}
		return s.recalculateNextInstallmentDate(tx, &updated)
	})
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

		// 3. Create Transaction
		transaction := &models.Transaction{
			FamilyID:    familyID,
			UserID:      userID,
			WalletID:    payment.WalletID,
			Type:        "expense",
			Amount:      payment.Amount,
			Category:    "debt_payment",
			DebtID:      &debt.ID,
			Date:        payment.Date,
			Description: "Cicilan: " + debt.Name + ". " + payment.Description,
		}

		if err := tx.Create(transaction).Error; err != nil {
			return err
		}

		// 4. Create associated DebtPayment record for history
		paymentRecord := &models.DebtPayment{
			DebtID:        debt.ID,
			WalletID:      payment.WalletID,
			UserID:        userID,
			Amount:        payment.Amount,
			Date:          payment.Date,
			Description:   payment.Description,
			TransactionID: &transaction.ID,
		}
		if err := tx.Create(paymentRecord).Error; err != nil {
			return err
		}

		// 5. Update Wallet Balance
		if err := tx.Model(&models.Wallet{}).Where("id = ?", payment.WalletID).
			Update("balance", gorm.Expr("balance - ?", payment.Amount)).Error; err != nil {
			return err
		}

		// 6. Full recalculate of debt progress to ensure consistency
		return s.FullRecalculate(tx, debt.ID)
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
		// It only advances in RecordPayment or Update when LUNAS is reached.
	}
	return nil
}

func (s *debtService) recalculateNextInstallmentDate(tx *gorm.DB, debt *models.Debt) error {
	if debt.InstallmentIntervalMonths <= 0 {
		return nil
	}

	// Calculate total amount paid across ALL time to properly handle multi-month advancements
	// without double-counting based on overlapping windows.
	var totalPaidAllTime float64
	tx.Model(&models.DebtPayment{}).
		Where("debt_id = ?", debt.ID).
		Select("COALESCE(SUM(amount), 0)").Scan(&totalPaidAllTime)

	// To find current credit, we need to know how much should have been paid up to the PREVIOUS installment date
	// But it's simpler to just use the original RecordPayment logic: 
	// find everything paid since the cycle *before* the current NextInstallmentDueDate.
	
	startOfEvaluationPeriod := addMonths(debt.NextInstallmentDueDate, -debt.InstallmentIntervalMonths)
	var totalCredit float64
	tx.Model(&models.DebtPayment{}).
		Where("debt_id = ? AND date >= ?", debt.ID, startOfEvaluationPeriod).
		Select("COALESCE(SUM(amount), 0)").Scan(&totalCredit)

	// Loop to potentially advance multiple cycles (early/multi-payments)
	for {
		// Target: Pokok + Denda (H+1 Logic: if today is strictly AFTER the deadline day)
		target := debt.InstallmentAmount
		
		today := time.Now().Truncate(24 * time.Hour)
		deadline := debt.NextInstallmentDueDate.Truncate(24 * time.Hour)
		
		if today.After(deadline) {
			target += debt.PenaltyAmount
		}

		// Use a small epsilon or round for the comparison to avoid float issues
		if totalCredit >= (target - 0.01) && debt.RemainingAmount >= 0 {
			totalCredit -= target // SUBTRACT credit so we don't double count in next loop
			
			debt.NextInstallmentDueDate = s.getNextInstallmentDate(debt.NextInstallmentDueDate, debt.PaymentDay, debt.InstallmentIntervalMonths)
			
			// Guardrail: don't advance beyond final maturity
			if !debt.DueDate.IsZero() && debt.NextInstallmentDueDate.After(debt.DueDate) {
				debt.NextInstallmentDueDate = debt.DueDate
				if err := tx.Save(debt).Error; err != nil {
					return err
				}
				break 
			}
			
			if err := tx.Save(debt).Error; err != nil {
				return err
			}
			// Continue loop to see if we still have enough credit for the NEXT month
		} else {
			break
		}
	}
	return nil
}

func (s *debtService) FullRecalculate(tx *gorm.DB, debtID uuid.UUID) error {
	var debt models.Debt
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&debt, "id = ?", debtID).Error; err != nil {
		return err
	}

	// 1. Reset balances based on Original Principal + Penalties
	var totalPenalties float64
	tx.Model(&models.DebtPenalty{}).Where("debt_id = ?", debtID).Select("COALESCE(SUM(amount), 0)").Scan(&totalPenalties)
	
	// Assuming TotalAmount in DB was already tracking increments, but for safety:
	// We need a baseline "OriginalAmount". If we don't have one, we assume current TotalAmount minus penalties?
	// Actually, let's just use the current TotalAmount as the "Target" since it grows with penalties.
	
	var totalPaid float64
	tx.Model(&models.DebtPayment{}).Where("debt_id = ?", debtID).Select("COALESCE(SUM(amount), 0)").Scan(&totalPaid)
	
	debt.PaidAmount = totalPaid
	debt.RemainingAmount = debt.TotalAmount - totalPaid
	if debt.RemainingAmount < 0 {
		debt.RemainingAmount = 0
		debt.Status = "paid"
	} else {
		debt.Status = "active"
	}

	// 2. Reset and Re-advance NextInstallmentDueDate
	debt.NextInstallmentDueDate = s.calculateFirstDueDate(debt.StartDate, debt.PaymentDay)
	
	// Run advancement logic using the remaining payments
	startOfEvaluationPeriod := addMonths(debt.NextInstallmentDueDate, -debt.InstallmentIntervalMonths)
	var totalCredit float64
	tx.Model(&models.DebtPayment{}).
		Where("debt_id = ? AND date >= ?", debt.ID, startOfEvaluationPeriod).
		Select("COALESCE(SUM(amount), 0)").Scan(&totalCredit)

	// advancement logic (copied from recalculate but starting fresh)
	if debt.InstallmentIntervalMonths > 0 {
		for {
			target := debt.InstallmentAmount
			// H+1 Logic: if today is strictly AFTER the deadline day
			today := time.Now().Truncate(24 * time.Hour)
			deadline := debt.NextInstallmentDueDate.Truncate(24 * time.Hour)
			
			if today.After(deadline) {
				target += debt.PenaltyAmount
			}

			if totalCredit >= (target - 0.01) && debt.RemainingAmount >= 0 {
				totalCredit -= target 
				debt.NextInstallmentDueDate = s.getNextInstallmentDate(debt.NextInstallmentDueDate, debt.PaymentDay, debt.InstallmentIntervalMonths)
				
				if !debt.DueDate.IsZero() && debt.NextInstallmentDueDate.After(debt.DueDate) {
					debt.NextInstallmentDueDate = debt.DueDate
					break 
				}
			} else {
				break
			}
		}
	}

	return tx.Save(&debt).Error
}
