package services

import (
	"fmt"
	"keuangan-keluarga/internal/config"
	"keuangan-keluarga/internal/models"
	"keuangan-keluarga/internal/repositories"

	"github.com/google/uuid"
)

type WalletService interface {
	CreateWallet(familyID, userID uuid.UUID, name string, walletType string, accountNumber string, initialBalance float64) error
	GetFamilyWallets(familyID, userID uuid.UUID, role string) ([]models.Wallet, error)
	GetWalletByID(id uuid.UUID) (*models.Wallet, error)
	UpdateWallet(requestingUserID uuid.UUID, wallet *models.Wallet) error
	DeleteWallet(requestingUserID uuid.UUID, id uuid.UUID) error
}

type walletService struct {
	repo repositories.WalletRepository
}

func NewWalletService(repo repositories.WalletRepository) WalletService {
	return &walletService{repo: repo}
}

func (s *walletService) CreateWallet(familyID, userID uuid.UUID, name string, walletType string, accountNumber string, initialBalance float64) error {
	// ... (limit logic omitted for brevity, keeping existing code)
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

	wallet := &models.Wallet{
		FamilyID:      familyID,
		UserID:        userID,
		Name:          name,
		WalletType:    walletType,
		AccountNumber: accountNumber,
		Balance:       initialBalance,
	}
	return s.repo.Create(wallet)
}

func (s *walletService) GetFamilyWallets(familyID, userID uuid.UUID, role string) ([]models.Wallet, error) {
	isPrivileged := role == "head_of_family" || role == "treasurer"
	
	var wallets []models.Wallet
	var err error
	
	if isPrivileged {
		wallets, err = s.repo.GetByFamilyID(familyID)
	} else {
		wallets, err = s.repo.GetByUserID(familyID, userID)
	}
	
	if err != nil {
		return nil, err
	}

	return wallets, nil
}

func (s *walletService) GetWalletByID(id uuid.UUID) (*models.Wallet, error) {
	return s.repo.GetByID(id)
}

func (s *walletService) UpdateWallet(requestingUserID uuid.UUID, wallet *models.Wallet) error {
	existing, err := s.repo.GetByID(wallet.ID)
	if err != nil {
		return err
	}
	if existing.UserID != requestingUserID {
		return fmt.Errorf("anda tidak memiliki izin untuk mengubah dompet ini. Hanya pembuat dompet yang diperbolehkan.")
	}
	return s.repo.Update(wallet)
}

func (s *walletService) DeleteWallet(requestingUserID uuid.UUID, id uuid.UUID) error {
	existing, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}
	if existing.UserID != requestingUserID {
		return fmt.Errorf("anda tidak memiliki izin untuk menghapus dompet ini. Hanya pembuat dompet yang diperbolehkan.")
	}
	return s.repo.Delete(id)
}
