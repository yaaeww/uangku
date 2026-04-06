package repositories

import (
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"

	"github.com/google/uuid"
)

type WalletRepository interface {
	Create(wallet *models.Wallet) error
	GetByFamilyID(familyID uuid.UUID) ([]models.Wallet, error)
	GetByUserID(familyID, userID uuid.UUID) ([]models.Wallet, error)
	GetByID(id uuid.UUID) (*models.Wallet, error)
	Update(wallet *models.Wallet) error
	Delete(id uuid.UUID) error
}

type walletRepository struct{}

func NewWalletRepository() WalletRepository {
	return &walletRepository{}
}

func (r *walletRepository) Create(wallet *models.Wallet) error {
	return config.DB.Create(wallet).Error
}

func (r *walletRepository) GetByFamilyID(familyID uuid.UUID) ([]models.Wallet, error) {
	var wallets []models.Wallet
	err := config.DB.Preload("User").Where("family_id = ?", familyID).Find(&wallets).Error
	return wallets, err
}

func (r *walletRepository) GetByUserID(familyID, userID uuid.UUID) ([]models.Wallet, error) {
	var wallets []models.Wallet
	err := config.DB.Preload("User").Where("family_id = ? AND user_id = ?", familyID, userID).Find(&wallets).Error
	return wallets, err
}

func (r *walletRepository) GetByID(id uuid.UUID) (*models.Wallet, error) {
	var wallet models.Wallet
	err := config.DB.First(&wallet, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &wallet, nil
}

func (r *walletRepository) Update(wallet *models.Wallet) error {
	return config.DB.Save(wallet).Error
}

func (r *walletRepository) Delete(id uuid.UUID) error {
	return config.DB.Delete(&models.Wallet{}, "id = ?", id).Error
}
