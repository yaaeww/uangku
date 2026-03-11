package services

import (
	"fmt"
	"log"
)

type MailService interface {
	SendOTP(email, otp string) error
	SendResetToken(email, token string) error
}

type mailService struct{}

func NewMailService() MailService {
	return &mailService{}
}

func (s *mailService) SendOTP(email, otp string) error {
	// For production, integrate with SendGrid, Mailgun, or SMTP
	// For development, we just log to console
	fmt.Println("-------------------------------------------")
	fmt.Printf("TO: %s\n", email)
	fmt.Printf("SUBJECT: Verifikasi Akun DagangFinance\n")
	fmt.Printf("BODY: Kode OTP Anda adalah: %s. Kode ini berlaku selama 15 menit.\n", otp)
	fmt.Println("-------------------------------------------")
	log.Printf("Email OTP sent to %s", email)
	return nil
}

func (s *mailService) SendResetToken(email, token string) error {
	fmt.Println("-------------------------------------------")
	fmt.Printf("TO: %s\n", email)
	fmt.Printf("SUBJECT: Reset Password DagangFinance\n")
	fmt.Printf("BODY: Klik link berikut untuk reset password: http://localhost:5173/reset-password?token=%s\n", token)
	fmt.Println("-------------------------------------------")
	log.Printf("Reset email sent to %s", email)
	return nil
}
