package services

import (
	"fmt"
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SavingService interface {
	GetByFamilyID(familyID uuid.UUID, month, year int) ([]models.Saving, error)
	GetByID(id uuid.UUID) (*models.Saving, error)
	Create(saving *models.Saving) error
	Update(saving *models.Saving, userID uuid.UUID, role string) error
	Delete(id uuid.UUID, familyID uuid.UUID, userID uuid.UUID, role string) error
	DeleteByCategory(categoryID uuid.UUID, familyID uuid.UUID, userID uuid.UUID) error
}

type savingService struct {
	notif NotificationService
}

func NewSavingService(notif NotificationService) SavingService {
	return &savingService{notif: notif}
}

func (s *savingService) GetByID(id uuid.UUID) (*models.Saving, error) {
	var saving models.Saving
	err := config.DB.Preload("User").First(&saving, "id = ?", id).Error
	return &saving, err
}

func (s *savingService) GetByFamilyID(familyID uuid.UUID, month, year int) ([]models.Saving, error) {
	var savings []models.Saving
	query := config.DB.Preload("User").Where("family_id = ?", familyID)
	
	if month > 0 && year > 0 {
		query = query.Where("(month = ? AND year = ?) OR (month = 0 AND year = 0)", month, year)
	} else {
		// Default to only showing long-term goals if no period specified
		query = query.Where("month = 0 AND year = 0")
	}
	
	err := query.Find(&savings).Error
	return savings, err
}

func (s *savingService) Create(saving *models.Saving) error {
	return config.DB.Create(saving).Error
}

func (s *savingService) Update(saving *models.Saving, userID uuid.UUID, role string) error {
	// RBAC: Owner OR (Head of Family/Treasurer) can update
	isAdmin := role == "head_of_family" || role == "treasurer"
	if !isAdmin && saving.UserID != userID && saving.UserID != uuid.Nil {
		return fmt.Errorf("anda tidak memiliki izin untuk mengubah budget ini")
	}
	return config.DB.Save(saving).Error
}

func (s *savingService) Delete(id uuid.UUID, familyID uuid.UUID, userID uuid.UUID, role string) error {
	return config.DB.Transaction(func(tx *gorm.DB) error {
		// 1. Fetch the saving to be sure it exists and belongs to the family
		var saving models.Saving
		if err := tx.Where("id = ? AND family_id = ?", id, familyID).First(&saving).Error; err != nil {
			return err
		}

		// RBAC: Owner OR (Head of Family/Treasurer) can delete
		isAdmin := role == "head_of_family" || role == "treasurer"
		if !isAdmin && saving.UserID != userID && saving.UserID != uuid.Nil {
			return fmt.Errorf("anda tidak memiliki izin untuk menghapus budget ini")
		}

		// 2. Fetch and delete linked transactions with balance reversion
		var transactions []models.Transaction
		if err := tx.Where("(saving_id = ? OR goal_id = ?) AND family_id = ?", id, id, familyID).Find(&transactions).Error; err != nil {
			return err
		}

		for _, t := range transactions {
			// Revert Balance
			var wallet models.Wallet
			if err := tx.First(&wallet, "id = ?", t.WalletID).Error; err == nil {
				switch t.Type {
				case "expense", "saving", "goal_allocation":
					wallet.Balance += t.Amount
				case "income":
					wallet.Balance -= t.Amount
				case "transfer":
					wallet.Balance += (t.Amount + t.Fee)
					if t.ToWalletID != nil {
						var toWallet models.Wallet
						if err := tx.First(&toWallet, "id = ?", *t.ToWalletID).Error; err == nil {
							toWallet.Balance -= t.Amount
							tx.Save(&toWallet)
						}
					}
				}
				tx.Save(&wallet)
			}
			tx.Delete(&t)
		}

		// 4. Delete the saving itself
		return tx.Delete(&saving).Error
	})
}

func (s *savingService) DeleteByCategory(categoryID uuid.UUID, familyID uuid.UUID, userID uuid.UUID) error {
	return config.DB.Transaction(func(tx *gorm.DB) error {
		// 1. Find all savings for this user in this category
		var savings []models.Saving
		if err := tx.Where("budget_category_id = ? AND family_id = ? AND user_id = ?", categoryID, familyID, userID).Find(&savings).Error; err != nil {
			return err
		}

		for _, sa := range savings {
			// Fetch and delete linked transactions with balance reversion
			var transactions []models.Transaction
			if err := tx.Where("(saving_id = ? OR goal_id = ?) AND family_id = ?", sa.ID, sa.ID, familyID).Find(&transactions).Error; err != nil {
				return err
			}

			for _, t := range transactions {
				// Revert Balance
				var wallet models.Wallet
				if err := tx.First(&wallet, "id = ?", t.WalletID).Error; err == nil {
					switch t.Type {
					case "expense", "saving", "goal_allocation":
						wallet.Balance += t.Amount
					case "income":
						wallet.Balance -= t.Amount
					case "transfer":
						wallet.Balance += (t.Amount + t.Fee)
						if t.ToWalletID != nil {
							var toWallet models.Wallet
							if err := tx.First(&toWallet, "id = ?", *t.ToWalletID).Error; err == nil {
								toWallet.Balance -= t.Amount
								tx.Save(&toWallet)
							}
						}
					}
					tx.Save(&wallet)
				}
				tx.Delete(&t)
			}

			// Delete the saving itself
			if err := tx.Delete(&sa).Error; err != nil {
				return err
			}
		}
		return nil
	})
}
