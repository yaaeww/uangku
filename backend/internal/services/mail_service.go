package services

import (
	"fmt"
	"keuangan-keluarga/internal/config"
	"log"
	"net/http"
	"net/smtp"
	"strings"
)

type MailService interface {
	SendOTP(email, otp string) error
	SendWhatsAppOTP(phone, otp string) error
	SendWhatsApp(phone, message string) error
	SendResetToken(email, token string) error
	SendInvitation(email, familyName, inviterName, role string) error
}

type mailService struct{}

func NewMailService() MailService {
	return &mailService{}
}

func (s *mailService) SendOTP(email, otp string) error {
	// If SMTP configuration is missing, fallback to log
	if config.AppConfig.SMTPUser == "" || config.AppConfig.SMTPPass == "" {
		log.Printf("[MOCK] Email OTP to %s: %s", email, otp)
		return nil
	}

	subject := "Verifikasi Akun Uangku"
	body := fmt.Sprintf("Kode OTP Anda adalah: %s. Kode ini berlaku selama 15 menit.", otp)

	return s.sendActualEmail(email, subject, body)
}

func (s *mailService) SendWhatsAppOTP(phone, otp string) error {
	if config.AppConfig.WAToken == "" {
		log.Printf("[MOCK] WhatsApp OTP to %s: %s", phone, otp)
		return nil
	}

	message := fmt.Sprintf("Kode OTP Uangku Anda adalah: %s. Berlaku selama 15 menit. Jangan bagikan kode ini kepada siapa pun.", otp)

	payload := strings.NewReader(fmt.Sprintf("target=%s&message=%s", phone, message))
	req, _ := http.NewRequest("POST", config.AppConfig.WAUrl, payload)
	req.Header.Add("Authorization", config.AppConfig.WAToken)
	req.Header.Add("Content-Type", "application/x-www-form-urlencoded")

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Printf("Failed to send WhatsApp: %v", err)
		return err
	}
	defer res.Body.Close()

	log.Printf("WhatsApp OTP sent to %s via Fonnte", phone)
	return nil
}

func (s *mailService) SendWhatsApp(phone, message string) error {
	if config.AppConfig.WAToken == "" {
		log.Printf("[MOCK] WhatsApp to %s: %s", phone, message)
		return nil
	}

	payload := strings.NewReader(fmt.Sprintf("target=%s&message=%s", phone, message))
	req, _ := http.NewRequest("POST", config.AppConfig.WAUrl, payload)
	req.Header.Add("Authorization", config.AppConfig.WAToken)
	req.Header.Add("Content-Type", "application/x-www-form-urlencoded")

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Printf("Failed to send WhatsApp: %v", err)
		return err
	}
	defer res.Body.Close()

	log.Printf("WhatsApp message sent to %s via Fonnte", phone)
	return nil
}

func (s *mailService) SendResetToken(email, token string) error {
	subject := "Reset Password Uangku"
	body := fmt.Sprintf("Klik link berikut untuk reset password: http://localhost:5173/reset-password?token=%s", token)

	if config.AppConfig.SMTPUser == "" {
		log.Printf("[MOCK] Reset Email to %s: %s", email, token)
		return nil
	}

	return s.sendActualEmail(email, subject, body)
}

func (s *mailService) SendInvitation(email, familyName, inviterName, role string) error {
	subject := fmt.Sprintf("Undangan Bergabung ke Keluarga %s", familyName)
	body := fmt.Sprintf("Halo! %s mengundang Anda untuk bergabung ke keluarga '%s' sebagai %s.\nSilakan daftar di Uangku menggunakan email ini untuk langsung bergabung.\nLink: http://localhost:5173/register", inviterName, familyName, role)

	if config.AppConfig.SMTPUser == "" {
		log.Printf("[MOCK] Invitation to %s: %s", email, familyName)
		return nil
	}

	return s.sendActualEmail(email, subject, body)
}

func (s *mailService) sendActualEmail(to, subject, body string) error {
	auth := smtp.PlainAuth("", config.AppConfig.SMTPUser, config.AppConfig.SMTPPass, config.AppConfig.SMTPHost)

	msg := []byte(fmt.Sprintf("To: %s\r\n"+
		"Subject: %s\r\n"+
		"Content-Type: text/plain; charset=UTF-8\r\n"+
		"\r\n"+
		"%s\r\n", to, subject, body))

	addr := fmt.Sprintf("%s:%s", config.AppConfig.SMTPHost, config.AppConfig.SMTPPort)
	err := smtp.SendMail(addr, auth, config.AppConfig.SMTPUser, []string{to}, msg)
	if err != nil {
		log.Printf("Failed to send email to %s: %v", to, err)
		return err
	}

	log.Printf("Actual Email sent to %s", to)
	return nil
}
