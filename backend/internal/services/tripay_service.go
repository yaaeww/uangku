package services

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"keuangan-keluarga/internal/models"
	"net/http"
	"os"
	"time"
)

type TripayService interface {
	CreateTransaction(plan *models.SubscriptionPlan, user *models.User, method string) (*TripayResponse, error)
	ValidateCallback(body []byte, signature string) bool
}

type tripayService struct {
	MerchantCode string
	ApiKey       string
	PrivateKey   string
	BaseUrl      string
}

func NewTripayService() TripayService {
	return &tripayService{
		MerchantCode: os.Getenv("TRIPAY_MERCHANT_CODE"),
		ApiKey:       os.Getenv("TRIPAY_API_KEY"),
		PrivateKey:   os.Getenv("TRIPAY_PRIVATE_KEY"),
		BaseUrl:      os.Getenv("TRIPAY_API_URL"),
	}
}

type TripayResponse struct {
	Success bool `json:"success"`
	Message string `json:"message"`
	Data    struct {
		Reference    string `json:"reference"`
		MerchantRef  string `json:"merchant_ref"`
		PaymentName  string `json:"payment_name"`
		PaymentMethod string `json:"payment_method"`
		Amount       float64 `json:"amount"`
		FeeMerchant  float64 `json:"fee_merchant"`
		FeeCustomer  float64 `json:"fee_customer"`
		TotalFee     float64 `json:"total_fee"`
		AmountReceived float64 `json:"amount_received"`
		PayCode      string `json:"pay_code"`
		QRCodeURL    string `json:"qr_url"`
		CheckoutURL  string `json:"checkout_url"`
		Status       string `json:"status"`
		ExpiredTime  int64  `json:"expired_time"`
		Instructions []struct {
			Title string   `json:"title"`
			Steps []string `json:"steps"`
		} `json:"instructions"`
	} `json:"data"`
}

func (s *tripayService) CreateTransaction(plan *models.SubscriptionPlan, user *models.User, method string) (*TripayResponse, error) {
	merchantRef := fmt.Sprintf("INV-%d", time.Now().UnixNano())
	amount := int(plan.Price)

	// Generate Signature for Request
	// Format: merchant_code + merchant_ref + amount
	payload := s.MerchantCode + merchantRef + fmt.Sprintf("%d", amount)
	h := hmac.New(sha256.New, []byte(s.PrivateKey))
	h.Write([]byte(payload))
	signature := hex.EncodeToString(h.Sum(nil))

	requestBody := map[string]interface{}{
		"method":         method,
		"merchant_ref":   merchantRef,
		"amount":         amount,
		"customer_name":  user.FullName,
		"customer_email": user.Email,
		"order_items": []map[string]interface{}{
			{
				"sku":      plan.ID.String(),
				"name":     plan.Name,
				"price":    amount,
				"quantity": 1,
			},
		},
		"callback_url": os.Getenv("URL_CALLBACK"), // We'll need to ensure this is in .env
		"return_url":   os.Getenv("URL_RETURN"),
		"expired_time": (time.Now().Unix() + (24 * 3600)), // 24 hours
		"signature":    signature,
	}

	jsonBody, _ := json.Marshal(requestBody)
	req, err := http.NewRequest("POST", s.BaseUrl+"/transaction/create", bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.ApiKey)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var tripayResp TripayResponse
	if err := json.Unmarshal(body, &tripayResp); err != nil {
		return nil, fmt.Errorf("failed to parse tripay response: %s", string(body))
	}

	if !tripayResp.Success {
		return nil, errors.New(tripayResp.Message)
	}

	return &tripayResp, nil
}

func (s *tripayService) ValidateCallback(body []byte, signature string) bool {
	h := hmac.New(sha256.New, []byte(s.PrivateKey))
	h.Write(body)
	expectedSignature := hex.EncodeToString(h.Sum(nil))
	return expectedSignature == signature
}
