package services

import (
	"time"
)
type ParsedReceiptItem struct {
	Name     string  `json:"name"`
	Quantity int     `json:"quantity"`
	Price    float64 `json:"price"`
	Total    float64 `json:"total"`
	Category string  `json:"category"`
}

type ParsedReceipt struct {
	Merchant     string              `json:"merchant"`
	Date         string              `json:"date"` // Changed to string for flexibility from AI
	Items        []ParsedReceiptItem `json:"items"`
	Total        float64             `json:"total"`
	IsValid      bool                `json:"is_valid"`
	ErrorMessage string              `json:"error_message"`
}

type ScannerService interface {
	ScanReceipt(imageData []byte) (*ParsedReceipt, error)
}

type scannerService struct {
	provider ReceiptProvider
}

func NewScannerService() ScannerService {
	// Use local OCR system instead of OpenAI
	provider := NewLocalOCRProvider()

	return &scannerService{
		provider: provider,
	}
}

func (s *scannerService) ScanReceipt(imageData []byte) (*ParsedReceipt, error) {
	if s.provider == nil {
		// Fallback to mock if no provider is configured (for dev)
		return &ParsedReceipt{
			Merchant: "MOCK - ALFAMART",
			Date:     time.Now().Format("2006-01-02"),
			Items: []ParsedReceiptItem{
				{Name: "MOCK ITEM", Quantity: 1, Price: 10000, Total: 10000, Category: "Lainnya"},
			},
			Total:   10000,
			IsValid: true,
		}, nil
	}

	return s.provider.Scan(imageData)
}
