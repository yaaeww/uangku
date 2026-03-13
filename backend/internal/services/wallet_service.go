package services

import (
	"fmt"
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"
	"keuangan-keluarga/internal/repositories"

	"github.com/google/uuid"
)

type WalletService interface {
	CreateWallet(familyID uuid.UUID, name string, walletType string, accountNumber string, initialBalance float64) error
	GetFamilyWallets(familyID uuid.UUID) ([]models.Wallet, error)
	GetWalletByID(id uuid.UUID) (*models.Wallet, error)
	UpdateWallet(wallet *models.Wallet) error
	DeleteWallet(id uuid.UUID) error
}

type walletService struct {
	repo repositories.WalletRepository
}

func NewWalletService(repo repositories.WalletRepository) WalletService {
	return &walletService{repo: repo}
}

func (s *walletService) CreateWallet(familyID uuid.UUID, name string, walletType string, accountNumber string, initialBalance float64) error {
	// --- LIMIT CHECK BEGIN ---
	var family models.Family
	if err := config.DB.First(&family, "id = ?", familyID).Error; err != nil {
		return err
	}

	var currentCount int64
	config.DB.Model(&models.Wallet{}).Where("family_id = ?", familyID).Count(&currentCount)

	maxWallets := 2 // Default for Trial
	switch family.SubscriptionPlan {
	case "Standard":
		maxWallets = 3
	case "Family":
		maxWallets = 10
	case "Premium":
		maxWallets = 99
	}

	if int(currentCount) >= maxWallets {
		return fmt.Errorf("limit dompet tercapai. Paket '%s' hanya memperbolehkan maksimal %d dompet. Silakan upgrade paket Anda.", family.SubscriptionPlan, maxWallets)
	}
	// --- LIMIT CHECK END ---

	wallet := &models.Wallet{
		FamilyID:      familyID,
		Name:          name,
		WalletType:    walletType,
		AccountNumber: accountNumber,
		Balance:       initialBalance,
	}
	return s.repo.Create(wallet)
}

func (s *walletService) GetFamilyWallets(familyID uuid.UUID) ([]models.Wallet, error) {
	return s.repo.GetByFamilyID(familyID)
}

func (s *walletService) GetWalletByID(id uuid.UUID) (*models.Wallet, error) {
	return s.repo.GetByID(id)
}

func (s *walletService) UpdateWallet(wallet *models.Wallet) error {
	return s.repo.Update(wallet)
}

func (s *walletService) DeleteWallet(id uuid.UUID) error {
	return s.repo.Delete(id)
}
