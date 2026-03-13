package services

import (
	"errors"
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type DebtService interface {
	GetByFamilyID(familyID uuid.UUID) ([]models.Debt, error)
	GetPaymentsByDebtID(debtID uuid.UUID) ([]models.DebtPayment, error)
	Create(debt *models.Debt) error
	RecordPayment(payment *models.DebtPayment, userID uuid.UUID, familyID uuid.UUID) error
	Delete(id uuid.UUID) error
}

type debtService struct{}

func NewDebtService() DebtService {
	return &debtService{}
}

func (s *debtService) GetByFamilyID(familyID uuid.UUID) ([]models.Debt, error) {
	var debts []models.Debt
	err := config.DB.Where("family_id = ?", familyID).Order("created_at DESC").Find(&debts).Error
	return debts, err
}

func (s *debtService) GetPaymentsByDebtID(debtID uuid.UUID) ([]models.DebtPayment, error) {
	var payments []models.DebtPayment
	err := config.DB.Where("debt_id = ?", debtID).Order("date DESC").Find(&payments).Error
	return payments, err
}

func (s *debtService) Create(debt *models.Debt) error {
	debt.RemainingAmount = debt.TotalAmount
	debt.PaidAmount = 0
	debt.Status = "active"
	return config.DB.Create(debt).Error
}

func (s *debtService) RecordPayment(payment *models.DebtPayment, userID uuid.UUID, familyID uuid.UUID) error {
	return config.DB.Transaction(func(tx *gorm.DB) error {
		// 1. Get Debt
		var debt models.Debt
		if err := tx.First(&debt, "id = ?", payment.DebtID).Error; err != nil {
			return err
		}

		// 2. Validate
		if payment.Amount <= 0 {
			return errors.New("jumlah pembayaran harus lebih dari 0")
		}
		if payment.Amount > debt.RemainingAmount {
			return errors.New("jumlah pembayaran melebihi sisa hutang")
		}

		// 3. Get Wallet
		var wallet models.Wallet
		if err := tx.First(&wallet, "id = ? AND family_id = ?", payment.WalletID, familyID).Error; err != nil {
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
		if debt.RemainingAmount <= 0 {
			debt.Status = "paid"
		}
		if err := tx.Save(&debt).Error; err != nil {
			return err
		}

		// 6. Record Payment
		if payment.Date.IsZero() {
			payment.Date = time.Now()
		}
		if err := tx.Create(payment).Error; err != nil {
			return err
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

func (s *debtService) Delete(id uuid.UUID) error {
	return config.DB.Delete(&models.Debt{}, "id = ?", id).Error
}
