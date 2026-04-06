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
	CreateTransaction(plan *models.SubscriptionPlan, user *models.User, channel *models.PaymentChannel) (*TripayResponse, error)
	GetPaymentChannels() ([]TripayChannelResponse, error)
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

type TripayChannelResponse struct {
	Group   string `json:"group"`
	Code    string `json:"code"`
	Name    string `json:"name"`
	Type    string `json:"type"`
	FeeMerchant struct {
		Flat    float64 `json:"flat"`
		Percent float64 `json:"percent"`
	} `json:"fee_merchant"`
	FeeCustomer struct {
		Flat    float64 `json:"flat"`
		Percent float64 `json:"percent"`
	} `json:"fee_customer"`
	Active  bool   `json:"active"`
	IconURL string `json:"icon_url"`
}

type TripayChannelsWrapper struct {
	Success bool                    `json:"success"`
	Message string                  `json:"message"`
	Data    []TripayChannelResponse `json:"data"`
}

func (s *tripayService) CreateTransaction(plan *models.SubscriptionPlan, user *models.User, channel *models.PaymentChannel) (*TripayResponse, error) {
	merchantRef := fmt.Sprintf("INV-%d", time.Now().UnixNano())
	price := float64(plan.Price)
	finalAmount := price

	// If customer bears the fee, we must add it to the amount
	if channel.FeeBorneBy == "customer" {
		// Formula: Charge = (Price + Flat) / (1 - Percent/100)
		percent := channel.FeePercent
		flat := channel.FeeFlat

		if percent < 100 {
			finalAmount = (price + flat) / (1 - (percent / 100))
		}
	}

	amountInt := int(finalAmount)
	// Round up to ensure we cover the fee
	if finalAmount > float64(amountInt) {
		amountInt++
	}

	// Generate Signature
	payload := s.MerchantCode + merchantRef + fmt.Sprintf("%d", amountInt)
	h := hmac.New(sha256.New, []byte(s.PrivateKey))
	h.Write([]byte(payload))
	signature := hex.EncodeToString(h.Sum(nil))

	customerPhone := user.PhoneNumber
	if customerPhone == "" {
		customerPhone = "081000000000" // Fallback for sandbox/users without phone
	}

	requestBody := map[string]interface{}{
		"method":         channel.Code,
		"merchant_ref":   merchantRef,
		"amount":         amountInt,
		"customer_name":  user.FullName,
		"customer_email": user.Email,
		"customer_phone": customerPhone,
		"order_items": []map[string]interface{}{
			{
				"sku":      plan.ID.String(),
				"name":     plan.Name,
				"price":    amountInt,
				"quantity": 1,
			},
		},
		"callback_url": os.Getenv("URL_CALLBACK"),
		"return_url":   os.Getenv("URL_RETURN"),
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

func (s *tripayService) GetPaymentChannels() ([]TripayChannelResponse, error) {
	req, err := http.NewRequest("GET", s.BaseUrl+"/merchant/payment-channel", nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+s.ApiKey)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var wrapper TripayChannelsWrapper
	if err := json.Unmarshal(body, &wrapper); err != nil {
		return nil, fmt.Errorf("failed to parse tripay channels response: %s", string(body))
	}

	if !wrapper.Success {
		return nil, errors.New(wrapper.Message)
	}

	return wrapper.Data, nil
}
