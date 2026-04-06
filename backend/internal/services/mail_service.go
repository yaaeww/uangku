package services

import (
	"encoding/json"
	"fmt"
	"io"
	"keuangan-keluarga/internal/config"
	"log"
	"net/http"
	"net/smtp"
	"net/url"
	"strings"
)

type MailService interface {
	SendOTP(email, otp string, expiryMinutes int) error
	SendWhatsAppOTP(phone, otp string, expiryMinutes int) error
	SendWhatsApp(phone, message string) error
	SendResetToken(email, token string) error
	SendInvitation(email, familyName, inviterName, role string, invitationID string) error
}

type mailService struct{}

func NewMailService() MailService {
	return &mailService{}
}

func normalizePhone(phone string) string {
	phone = strings.ReplaceAll(phone, " ", "")
	phone = strings.ReplaceAll(phone, "-", "")
	phone = strings.ReplaceAll(phone, "+", "")

	if strings.HasPrefix(phone, "08") {
		return "628" + phone[2:]
	}
	return phone
}

func (s *mailService) SendOTP(email, otp string, expiryMinutes int) error {
	log.Printf("[MAIL] OTP for %s: %s (Expires in %d min)", email, otp, expiryMinutes)
	// If SMTP configuration is missing, fallback to log
	if config.AppConfig.SMTPUser == "" || config.AppConfig.SMTPPass == "" {
		return nil
	}

	subject := "Verifikasi Akun Uangku"
	body := fmt.Sprintf("Kode OTP Anda adalah: %s. Kode ini berlaku selama %d menit.", otp, expiryMinutes)

	return s.sendActualEmail(email, subject, body)
}

func (s *mailService) SendWhatsAppOTP(phone, otp string, expiryMinutes int) error {
	log.Printf("[WA] OTP for %s: %s (Expires in %d min)", phone, otp, expiryMinutes)
	if config.AppConfig.WAToken == "" {
		return nil
	}

	message := fmt.Sprintf("Kode OTP Uangku Anda adalah: %s. Berlaku selama %d menit. Jangan bagikan kode ini kepada siapa pun.", otp, expiryMinutes)

	data := url.Values{}
	data.Set("target", normalizePhone(phone))
	data.Set("message", message)

	req, _ := http.NewRequest("POST", config.AppConfig.WAUrl, strings.NewReader(data.Encode()))
	req.Header.Add("Authorization", config.AppConfig.WAToken)
	req.Header.Add("Content-Type", "application/x-www-form-urlencoded")

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Printf("[WA] Request error: %v", err)
		return err
	}
	defer res.Body.Close()

	body, _ := io.ReadAll(res.Body)
	var response struct {
		Status bool   `json:"status"`
		Reason string `json:"reason"`
	}
	json.Unmarshal(body, &response)

	if !response.Status || res.StatusCode != http.StatusOK {
		log.Printf("[WA] API Error: %d - %s (Reason: %s)", res.StatusCode, string(body), response.Reason)
		return fmt.Errorf("WA API error: %s", response.Reason)
	}

	return nil
}

func (s *mailService) SendWhatsApp(phone, message string) error {
	if config.AppConfig.WAToken == "" {
		return nil
	}

	data := url.Values{}
	data.Set("target", normalizePhone(phone))
	data.Set("message", message)

	req, _ := http.NewRequest("POST", config.AppConfig.WAUrl, strings.NewReader(data.Encode()))
	req.Header.Add("Authorization", config.AppConfig.WAToken)
	req.Header.Add("Content-Type", "application/x-www-form-urlencoded")

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Printf("[WA] Request error: %v", err)
		return err
	}
	defer res.Body.Close()

	body, _ := io.ReadAll(res.Body)
	var response struct {
		Status bool   `json:"status"`
		Reason string `json:"reason"`
	}
	json.Unmarshal(body, &response)

	if !response.Status || res.StatusCode != http.StatusOK {
		log.Printf("[WA] API Error: %d - %s (Reason: %s)", res.StatusCode, string(body), response.Reason)
		return fmt.Errorf("WA API error: %s", response.Reason)
	}

	return nil
}

func (s *mailService) SendResetToken(email, token string) error {
	subject := "Reset Password Uangku"
	body := fmt.Sprintf("Klik link berikut untuk reset password: http://localhost:5173/reset-password?token=%s", token)

	if config.AppConfig.SMTPUser == "" {
		return nil
	}

	return s.sendActualEmail(email, subject, body)
}

func (s *mailService) SendInvitation(email, familyName, inviterName, role string, invitationID string) error {
	subject := fmt.Sprintf("Undangan Bergabung ke Keluarga %s", familyName)
	body := fmt.Sprintf("Halo! %s mengundang Anda untuk bergabung ke keluarga '%s' sebagai %s.\nSilakan daftar di Uangku menggunakan email ini untuk langsung bergabung.\nLink: http://localhost:5173/register?invitation_id=%s", inviterName, familyName, role, invitationID)

	if config.AppConfig.SMTPUser == "" {
		return nil
	}

	return s.sendActualEmail(email, subject, body)
}

func (s *mailService) sendActualEmail(to, subject, body string) error {
	auth := smtp.PlainAuth("", config.AppConfig.SMTPUser, config.AppConfig.SMTPPass, config.AppConfig.SMTPHost)

	from := fmt.Sprintf("Uangku <%s>", config.AppConfig.SMTPUser)
	msg := []byte(fmt.Sprintf("To: %s\r\n"+
		"From: %s\r\n"+
		"Subject: %s\r\n"+
		"Content-Type: text/plain; charset=UTF-8\r\n"+
		"\r\n"+
		"%s\r\n", to, from, subject, body))

	addr := fmt.Sprintf("%s:%s", config.AppConfig.SMTPHost, config.AppConfig.SMTPPort)
	err := smtp.SendMail(addr, auth, config.AppConfig.SMTPUser, []string{to}, msg)
	if err != nil {
		log.Printf("Failed to send email to %s: %v", to, err)
		return err
	}

	return nil
}
