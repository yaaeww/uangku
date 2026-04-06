package services

import (
	"keuangan-keluarga/internal/models"
	"keuangan-keluarga/internal/repositories"
	"time"

	"github.com/google/uuid"
)

type SupportService interface {
	CreateTicket(userID, familyID, subject, message string) (*models.SupportReport, error)
	GetMyTickets(userID string) ([]models.SupportReport, error)
	GetAllTickets() ([]models.SupportReport, error)
	ReplyTicket(id, reply string) error
	GetTicketByID(id string) (*models.SupportReport, error)
}

type supportService struct {
	repo repositories.SupportRepository
}

func NewSupportService(repo repositories.SupportRepository) SupportService {
	return &supportService{repo: repo}
}

func (s *supportService) CreateTicket(userID, familyID, subject, message string) (*models.SupportReport, error) {
	uID, _ := uuid.Parse(userID)
	fID, _ := uuid.Parse(familyID)

	report := &models.SupportReport{
		UserID:   uID,
		FamilyID: fID,
		Subject:  subject,
		Message:  message,
		Status:   "OPEN",
	}

	if err := s.repo.Create(report); err != nil {
		return nil, err
	}
	return report, nil
}

func (s *supportService) GetMyTickets(userID string) ([]models.SupportReport, error) {
	return s.repo.ListByUser(userID)
}

func (s *supportService) GetAllTickets() ([]models.SupportReport, error) {
	return s.repo.ListAll()
}

func (s *supportService) ReplyTicket(id, reply string) error {
	report, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}

	now := time.Now()
	report.AdminReply = reply
	report.RepliedAt = &now
	report.Status = "RESOLVED"

	return s.repo.Update(report)
}

func (s *supportService) GetTicketByID(id string) (*models.SupportReport, error) {
	return s.repo.GetByID(id)
}
