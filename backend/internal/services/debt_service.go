package services

import (
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"

	"github.com/google/uuid"
)

type DebtService interface {
	GetByFamilyID(familyID uuid.UUID) ([]models.Debt, error)
	Create(debt *models.Debt) error
	RecordPayment(payment *models.DebtPayment) error
	Delete(id uuid.UUID) error
}

type debtService struct{}

func NewDebtService() DebtService {
	return &debtService{}
}

func (s *debtService) GetByFamilyID(familyID uuid.UUID) ([]models.Debt, error) {
	var debts []models.Debt
	err := config.DB.Where("family_id = ?", familyID).Find(&debts).Error
	return debts, err
}

func (s *debtService) Create(debt *models.Debt) error {
	return config.DB.Create(debt).Error
}

func (s *debtService) RecordPayment(payment *models.DebtPayment) error {
	dbTx := config.DB.Begin()

	if err := dbTx.Create(payment).Error; err != nil {
		dbTx.Rollback()
		return err
	}

	// Update remaining amount in Debt table
	var debt models.Debt
	if err := dbTx.First(&debt, "id = ?", payment.DebtID).Error; err != nil {
		dbTx.Rollback()
		return err
	}

	debt.RemainingAmount -= payment.Amount
	if err := dbTx.Save(&debt).Error; err != nil {
		dbTx.Rollback()
		return err
	}

	return dbTx.Commit().Error
}

func (s *debtService) Delete(id uuid.UUID) error {
	return config.DB.Delete(&models.Debt{}, "id = ?", id).Error
}
