package services

import (
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SavingService interface {
	GetByFamilyID(familyID uuid.UUID) ([]models.Saving, error)
	GetByID(id uuid.UUID) (*models.Saving, error)
	Create(saving *models.Saving) error
	Update(saving *models.Saving) error
	Delete(id uuid.UUID, familyID uuid.UUID) error
}

type savingService struct{}

func NewSavingService() SavingService {
	return &savingService{}
}

func (s *savingService) GetByID(id uuid.UUID) (*models.Saving, error) {
	var saving models.Saving
	err := config.DB.First(&saving, "id = ?", id).Error
	return &saving, err
}

func (s *savingService) GetByFamilyID(familyID uuid.UUID) ([]models.Saving, error) {
	var savings []models.Saving
	err := config.DB.Where("family_id = ?", familyID).Find(&savings).Error
	return savings, err
}

func (s *savingService) Create(saving *models.Saving) error {
	return config.DB.Create(saving).Error
}

func (s *savingService) Update(saving *models.Saving) error {
	return config.DB.Save(saving).Error
}

func (s *savingService) Delete(id uuid.UUID, familyID uuid.UUID) error {
	return config.DB.Transaction(func(tx *gorm.DB) error {
		// 1. Fetch the saving to be sure it exists and belongs to the family
		var saving models.Saving
		if err := tx.Where("id = ? AND family_id = ?", id, familyID).First(&saving).Error; err != nil {
			return err
		}

		// 2. Find all transactions associated with this saving
		var transactions []models.Transaction
		if err := tx.Where("saving_id = ? AND family_id = ?", id, familyID).Find(&transactions).Error; err != nil {
			return err
		}

		// 3. Revert each transaction's impact on wallet balances
		for _, t := range transactions {
			var wallet models.Wallet
			if err := tx.First(&wallet, "id = ?", t.WalletID).Error; err == nil {
				switch t.Type {
				case "saving", "expense":
					// Both took money from wallet
					wallet.Balance += t.Amount
				case "income":
					// Gave money to wallet
					wallet.Balance -= t.Amount
				}
				
				if err := tx.Save(&wallet).Error; err != nil {
					return err
				}
			}
			
			// Delete the transaction
			if err := tx.Delete(&t).Error; err != nil {
				return err
			}
		}

		// 4. Delete the saving itself
		return tx.Delete(&saving).Error
	})
}
