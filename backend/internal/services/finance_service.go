package services

import (
	"fmt"
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"
	"keuangan-keluarga/internal/repositories"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type FinanceService interface {
	GetMonthlyTransactions(familyID uuid.UUID, month int, year int) ([]models.Transaction, error)
	GetDashboardSummary(familyID uuid.UUID, month int, year int) (*repositories.DashboardSummary, error)
	CreateTransaction(tx *models.Transaction) error
	CreateBulkTransactions(txs []models.Transaction) error
	DeleteTransaction(id uuid.UUID, familyID uuid.UUID) error
	UpdateTransaction(id uuid.UUID, updatedTx *models.Transaction) error
}

type financeService struct {
	repo       repositories.FinanceRepository
	walletRepo repositories.WalletRepository
}

func NewFinanceService(repo repositories.FinanceRepository, walletRepo repositories.WalletRepository) FinanceService {
	return &financeService{repo: repo, walletRepo: walletRepo}
}

func (s *financeService) GetMonthlyTransactions(familyID uuid.UUID, month int, year int) ([]models.Transaction, error) {
	return s.repo.GetMonthlyTransactions(familyID, month, year)
}

func (s *financeService) CreateBulkTransactions(txs []models.Transaction) error {
	dbTx := config.DB.Begin()
	for i := range txs {
		if err := s.createTransactionWithDB(dbTx, &txs[i]); err != nil {
			dbTx.Rollback()
			return err
		}
	}
	return dbTx.Commit().Error
}

func (s *financeService) GetDashboardSummary(familyID uuid.UUID, month int, year int) (*repositories.DashboardSummary, error) {
	return s.repo.GetDashboardSummary(familyID, month, year)
}

func (s *financeService) CreateTransaction(tx *models.Transaction) error {
	dbTx := config.DB.Begin()
	if err := s.createTransactionWithDB(dbTx, tx); err != nil {
		dbTx.Rollback()
		return err
	}
	return dbTx.Commit().Error
}

func (s *financeService) DeleteTransaction(id uuid.UUID, familyID uuid.UUID) error {
	dbTx := config.DB.Begin()

	// 1. Fetch transaction
	tx, err := s.repo.GetByID(id)
	if err != nil {
		dbTx.Rollback()
		return err
	}

	// Safety check
	if tx.FamilyID != familyID {
		dbTx.Rollback()
		return fmt.Errorf("transaction not found")
	}

	// 2. Revert balance impact
	if err := s.revertTransactionWithDB(dbTx, tx); err != nil {
		dbTx.Rollback()
		return err
	}

	// 3. Delete record
	if err := s.repo.Delete(id, familyID); err != nil {
		dbTx.Rollback()
		return err
	}

	return dbTx.Commit().Error
}

func (s *financeService) UpdateTransaction(id uuid.UUID, updatedTx *models.Transaction) error {
	dbTx := config.DB.Begin()

	// 1. Fetch old transaction
	oldTx, err := s.repo.GetByID(id)
	if err != nil {
		dbTx.Rollback()
		return err
	}

	// Safety check
	if oldTx.FamilyID != updatedTx.FamilyID {
		dbTx.Rollback()
		return fmt.Errorf("transaction not found")
	}

	// 2. Revert old impact
	if err := s.revertTransactionWithDB(dbTx, oldTx); err != nil {
		dbTx.Rollback()
		return err
	}

	// 3. Apply new impact (reuse create logic but with Save instead of Create for the tx itself later)
	if err := s.applyTransactionImpactWithDB(dbTx, updatedTx); err != nil {
		dbTx.Rollback()
		return err
	}

	// 4. Update transaction record
	updatedTx.ID = id // Ensure ID stays same
	if updatedTx.CreatedAt.IsZero() {
		updatedTx.CreatedAt = oldTx.CreatedAt
	}
	if err := dbTx.Save(updatedTx).Error; err != nil {
		dbTx.Rollback()
		return err
	}

	return dbTx.Commit().Error
}

func (s *financeService) revertTransactionWithDB(dbTx *gorm.DB, tx *models.Transaction) error {
	switch tx.Type {
	case "income":
		var wallet models.Wallet
		if err := dbTx.First(&wallet, "id = ?", tx.WalletID).Error; err != nil {
			return err
		}
		wallet.Balance -= tx.Amount
		return dbTx.Save(&wallet).Error

	case "expense":
		var wallet models.Wallet
		if err := dbTx.First(&wallet, "id = ?", tx.WalletID).Error; err != nil {
			return err
		}
		wallet.Balance += tx.Amount
		return dbTx.Save(&wallet).Error

	case "transfer":
		var fromWallet, toWallet models.Wallet
		if err := dbTx.First(&fromWallet, "id = ?", tx.WalletID).Error; err != nil {
			return err
		}
		if tx.ToWalletID != nil {
			if err := dbTx.First(&toWallet, "id = ?", *tx.ToWalletID).Error; err != nil {
				return err
			}
			toWallet.Balance -= tx.Amount
			if err := dbTx.Save(&toWallet).Error; err != nil {
				return err
			}
		}
		fromWallet.Balance += (tx.Amount + tx.Fee)
		return dbTx.Save(&fromWallet).Error

	case "saving":
		var wallet models.Wallet
		var saving models.Saving
		if err := dbTx.First(&wallet, "id = ?", tx.WalletID).Error; err != nil {
			return err
		}
		if tx.SavingID != nil {
			if err := dbTx.First(&saving, "id = ?", *tx.SavingID).Error; err != nil {
				return err
			}
			saving.CurrentBalance -= tx.Amount
			if err := dbTx.Save(&saving).Error; err != nil {
				return err
			}
		}
		wallet.Balance += tx.Amount
		return dbTx.Save(&wallet).Error
	}
	return nil
}

// Rename the internal create logic to be generic "apply impact"
func (s *financeService) applyTransactionImpactWithDB(dbTx *gorm.DB, tx *models.Transaction) error {
	// Re-using the core switch logic from createTransactionWithDB
	// but without the Create(tx) call at the end.

	if tx.Amount <= 0 {
		return fmt.Errorf("transaction amount must be greater than 0")
	}

	switch tx.Type {
	case "income":
		var wallet models.Wallet
		if err := dbTx.First(&wallet, "id = ?", tx.WalletID).Error; err != nil {
			return err
		}
		wallet.Balance += tx.Amount
		return dbTx.Save(&wallet).Error

	case "expense":
		var wallet models.Wallet
		if err := dbTx.First(&wallet, "id = ?", tx.WalletID).Error; err != nil {
			return err
		}
		if wallet.Balance < tx.Amount {
			return fmt.Errorf("insufficient balance in %s", wallet.Name)
		}
		wallet.Balance -= tx.Amount
		return dbTx.Save(&wallet).Error

	case "transfer":
		var fromWallet models.Wallet
		if err := dbTx.First(&fromWallet, "id = ?", tx.WalletID).Error; err != nil {
			return err
		}
		if tx.ToWalletID == nil {
			return fmt.Errorf("destination wallet is required for transfer")
		}
		var toWallet models.Wallet
		if err := dbTx.First(&toWallet, "id = ?", *tx.ToWalletID).Error; err != nil {
			return err
		}

		totalDeduction := tx.Amount + tx.Fee
		if fromWallet.Balance < totalDeduction {
			return fmt.Errorf("insufficient balance in %s for transfer", fromWallet.Name)
		}

		fromWallet.Balance -= totalDeduction
		toWallet.Balance += tx.Amount

		if err := dbTx.Save(&fromWallet).Error; err != nil {
			return err
		}
		return dbTx.Save(&toWallet).Error

	case "saving":
		if tx.SavingID == nil {
			return fmt.Errorf("saving ID is required")
		}
		var wallet models.Wallet
		if err := dbTx.First(&wallet, "id = ?", tx.WalletID).Error; err != nil {
			return err
		}
		var saving models.Saving
		if err := dbTx.First(&saving, "id = ?", tx.SavingID).Error; err != nil {
			return err
		}
		if wallet.Balance < tx.Amount {
			return fmt.Errorf("insufficient balance")
		}
		wallet.Balance -= tx.Amount
		saving.CurrentBalance += tx.Amount
		if err := dbTx.Save(&wallet).Error; err != nil {
			return err
		}
		return dbTx.Save(&saving).Error
	}
	return fmt.Errorf("invalid type")
}

func (s *financeService) createTransactionWithDB(dbTx *gorm.DB, tx *models.Transaction) error {
	if err := s.applyTransactionImpactWithDB(dbTx, tx); err != nil {
		return err
	}
	return dbTx.Create(tx).Error
}
