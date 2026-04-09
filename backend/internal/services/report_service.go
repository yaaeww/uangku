package services

import (
	"fmt"
	"keuangan-keluarga/internal/models"
	"keuangan-keluarga/internal/repositories"
	"time"
	"strconv"
	"math"
	"strings"
	"keuangan-keluarga/internal/config"
)

type FinancialSummary struct {
	TotalRevenue    float64                      `json:"total_revenue"`
	TotalExpenses   float64                      `json:"total_expenses"`
	GrossProfit     float64                      `json:"gross_profit"`
	NetProfit       float64                      `json:"net_profit"`
	ProfitMargin    float64                      `json:"profit_margin"`
	ExpenseByCat    map[string]float64           `json:"expense_by_category"`
	PeriodStart     time.Time                    `json:"period_start"`
	PeriodEnd       time.Time                    `json:"period_end"`
	RevenueDetails  []models.PaymentTransaction     `json:"revenue_details"`
	ExpenseDetails  []models.PlatformExpense        `json:"expense_details"`
	BudgetTransfers []models.PlatformBudgetTransfer     `json:"budget_transfers"`
	ExpenseAllocations []CategoryAllocation         `json:"expense_allocations"`
	ProfitAllocations  []CategoryAllocation         `json:"profit_allocations"`
	NetProfitTarget  float64                      `json:"net_profit_target"`
	ExpenseTarget   float64                      `json:"expense_target"`
	AllocationPct   float64                      `json:"allocation_pct"`
	TotalFees       float64                      `json:"total_fees"`
	NetRevenue      float64                      `json:"net_revenue"`
	TaxPct          float64                      `json:"tax_pct"`
}

type CategoryAllocation struct {
	CategoryID     string  `json:"category_id"`
	CategoryName   string  `json:"category_name"`
	Percentage     float64 `json:"percentage"`
	TargetAmount   float64 `json:"target_amount"`
	ActualAmount   float64 `json:"actual_amount"`
	TakenAmount    float64 `json:"taken_amount"`    // How much this category has borrowed from others
	TakenDetails   string  `json:"taken_details"`   // text detail from who (e.g. "ppn 1k, iklan 2k")
	ReturnedAmount float64 `json:"returned_amount"` // How much this category has returned to others
	RemainingDebt  float64 `json:"remaining_debt"`  // Net debt (Taken - Returned)
	LentAmount     float64 `json:"lent_amount"`     // How much this category has lent to others
	LentDetails    string  `json:"lent_details"`    // text detail who borrowed (e.g. "gaji 1k, iklan 2k")
}

type ReportService interface {
	GetFinancialSummary(start, end time.Time) (*FinancialSummary, error)
	AddPlatformExpense(expense *models.PlatformExpense) error
	UpdatePlatformExpense(expense *models.PlatformExpense) error
	DeletePlatformExpense(id string) error
	ListExpenses(start, end time.Time) ([]models.PlatformExpense, error)

	// Category Management
	GetAllCategories() ([]models.PlatformExpenseCategory, error)
	CreateCategory(cat *models.PlatformExpenseCategory) error
	UpdateCategory(cat *models.PlatformExpenseCategory) error
	DeleteCategory(id string) error

	// Budget Transfers
	GetBudgetTransfers(start, end time.Time) ([]models.PlatformBudgetTransfer, error)
	CreateBudgetTransfer(transfer *models.PlatformBudgetTransfer) error
	UpdateBudgetTransfer(transfer *models.PlatformBudgetTransfer) error
	DeleteBudgetTransfer(id string) error
}

type reportService struct {
	repo repositories.ReportRepository
}

func NewReportService(repo repositories.ReportRepository) ReportService {
	return &reportService{repo: repo}
}

func (s *reportService) GetFinancialSummary(start, end time.Time) (*FinancialSummary, error) {
	revenue, err := s.repo.GetRevenueByPeriod(start, end)
	if err != nil {
		return nil, err
	}

	expenses, err := s.repo.GetExpensesByPeriod(start, end)
	if err != nil {
		return nil, err
	}

	expenseByCat, err := s.repo.GetExpensesByCategory(start, end)
	if err != nil {
		return nil, err
	}

	// Fetch TriPay Fees (COGS)
	tripayFees, err := s.repo.GetTotalFeesByPeriod(start, end)
	if err != nil {
		return nil, err
	}

	// Fetch details
	revenueDetails, err := s.repo.ListRevenueByPeriod(start, end)
	if err != nil {
		return nil, err
	}

	expenseDetails, err := s.repo.ListExpensesByPeriod(start, end)
	if err != nil {
		return nil, err
	}

	// Fetch transfers
	transfers, err := s.repo.GetBudgetTransfersByPeriod(start, end)
	if err != nil {
		fmt.Printf("Warning: failed to fetch budget transfers: %v\n", err)
	}

	transfersMap := make(map[string]float64)
	type CategoryDebt struct {
		Taken    float64
		Returned float64
		Lent     float64
	}
	debtMap := make(map[string]*CategoryDebt)

	for _, t := range transfers {
		// Net Adjustment to TargetAmount
		transfersMap[t.FromCategory] -= t.Amount
		transfersMap[t.ToCategory] += t.Amount

		// Debt tracking
		if debtMap[t.FromCategory] == nil {
			debtMap[t.FromCategory] = &CategoryDebt{}
		}
		if debtMap[t.ToCategory] == nil {
			debtMap[t.ToCategory] = &CategoryDebt{}
		}

		switch t.Type {
		case "TAKEN":
			debtMap[t.ToCategory].Taken += t.Amount
			debtMap[t.FromCategory].Lent += t.Amount
		case "RETURN":
			debtMap[t.FromCategory].Returned += t.Amount
			debtMap[t.ToCategory].Lent -= t.Amount
		}
	}

	// NEW: Build LentDetails and TakenDetails maps
	lentDetailsMap := make(map[string][]string)
	takenDetailsMap := make(map[string][]string)
	for _, t := range transfers {
		amountStr := fmt.Sprintf("%v", t.Amount)
		if t.Amount >= 1000 {
			amountStr = fmt.Sprintf("%vk", math.Round(t.Amount/1000))
		}

		switch t.Type {
		case "TAKEN":
			lentDetailsMap[t.FromCategory] = append(lentDetailsMap[t.FromCategory], fmt.Sprintf("%s (%s)", t.ToCategory, amountStr))
			takenDetailsMap[t.ToCategory] = append(takenDetailsMap[t.ToCategory], fmt.Sprintf("%s (%s)", t.FromCategory, amountStr))
		case "RETURN":
			// For returns, we can also record who returned to whom
			// but usually we just care about the initial borrow
		}
	}

	// 2. Fetch tax percentage from settings
	var taxPctStr string
	config.DB.Model(&models.SystemSetting{}).Where("key = ?", "tax_percentage").Select("value").Scan(&taxPctStr)
	taxPct, _ := strconv.ParseFloat(taxPctStr, 64)
	if taxPct == 0 {
		taxPct = 11 // Default fallback
	}

	ppnAmount := math.Round(revenue * (taxPct / 100))
	otherExpenses := expenses
	
	// Net Profit = Revenue - PPN - COGS - OtherExpenses
	netProfit := revenue - ppnAmount - tripayFees - otherExpenses

	// NEW: Calculate dynamic allocations based on hierarchy
	// 1. Get total expense allocation percentage from settings
	var allocationPctStr string
	config.DB.Model(&models.SystemSetting{}).Where("key = ?", "platform_expense_allocation_pct").Select("value").Scan(&allocationPctStr)
	allocationPct, _ := strconv.ParseFloat(allocationPctStr, 64)
	if allocationPct == 0 {
		allocationPct = 60 // Default fallback
	}

	// 3. Total Expense Budget (e.g. 60% of Gross Revenue)
	totalExpenseBudget := math.Round(revenue * (allocationPct / 100))
	
	// 4. Mandatory Deductions from the 60% Budget
	ppnTarget := ppnAmount
	// Gateway/TriPay fees are also part of the expense cake
	tripayFees = math.Round(tripayFees)
	
	// 5. Remaining Budget for Operational Categories
	operationalBudget := math.Round(totalExpenseBudget - ppnTarget - tripayFees)
	if operationalBudget < 0 {
		operationalBudget = 0
	}

	// 4. Net Profit Target (The remaining portion, e.g. 40%)
	netProfitTarget := math.Round(revenue - totalExpenseBudget)

	categories, _ := s.repo.GetAllCategories()
	var expenseAllocations []CategoryAllocation
	var profitAllocations []CategoryAllocation

	// Add Mandatory Tax (PPN) - This takes a piece of the 60%
	taxName := fmt.Sprintf("Pajak PPN (%v%%) - Hutang Ke Negara", taxPct)
	expenseAllocations = append(expenseAllocations, CategoryAllocation{
		CategoryID:   "tax-ppn",
		CategoryName: taxName,
		Percentage:   taxPct, 
		TargetAmount: ppnTarget,
		ActualAmount: math.Round(expenseByCat["Pajak PPN (11%)"] + expenseByCat[taxName] + expenseByCat["Pajak PPN"]), // support variants
	})

	// Add Mandatory Gateway Fee (TriPay) - This also takes a piece of the 60%
	gatewayPct := 0.0
	if revenue > 0 {
		gatewayPct = math.Round((tripayFees/revenue)*10000) / 100 // Round to 2 decimal places
	}
	expenseAllocations = append(expenseAllocations, CategoryAllocation{
		CategoryID:   "tax-gateway",
		CategoryName: "Biaya Gateway (TriPay) - Hutang",
		Percentage:   gatewayPct,
		TargetAmount: tripayFees, 
		ActualAmount: math.Round(expenseByCat["Biaya Gateway (TriPay)"] + expenseByCat["Biaya Gateway"]),
	})

	// 5. Dynamic Categories (Expense & Profit)
	for _, cat := range categories {
		actual := math.Round(expenseByCat[cat.Name])
		
		if cat.Type == "PROFIT" {
			// Profit target is a percentage of the total net profit target
			target := math.Round(netProfitTarget * (cat.Percentage / 100))
			profitAllocations = append(profitAllocations, CategoryAllocation{
				CategoryID:   cat.ID.String(),
				CategoryName: cat.Name,
				Percentage:   cat.Percentage,
				TargetAmount: target,
				ActualAmount: actual,
			})
		} else {
			// Expense target is a percentage of the remaining operational budget
			target := math.Round(operationalBudget * (cat.Percentage / 100))
			expenseAllocations = append(expenseAllocations, CategoryAllocation{
				CategoryID:   cat.ID.String(),
				CategoryName: cat.Name,
				Percentage:   cat.Percentage,
				TargetAmount: target,
				ActualAmount: actual,
			})
		}
	}

	// 6. Apply Dynamic Budget Transfers & Debt Info
	for i := range expenseAllocations {
		name := expenseAllocations[i].CategoryName
		if adj, exists := transfersMap[name]; exists {
			expenseAllocations[i].TargetAmount += adj
		}
		if dm, exists := debtMap[name]; exists {
			expenseAllocations[i].TakenAmount = dm.Taken
			expenseAllocations[i].ReturnedAmount = dm.Returned
			expenseAllocations[i].RemainingDebt = math.Max(0, dm.Taken-dm.Returned)
			expenseAllocations[i].LentAmount = math.Max(0, dm.Lent)
			if details, exists := lentDetailsMap[name]; exists {
				expenseAllocations[i].LentDetails = strings.Join(details, ", ")
			}
			if details, exists := takenDetailsMap[name]; exists {
				expenseAllocations[i].TakenDetails = strings.Join(details, ", ")
			}
		}
	}
	for i := range profitAllocations {
		name := profitAllocations[i].CategoryName
		if adj, exists := transfersMap[name]; exists {
			profitAllocations[i].TargetAmount += adj
		}
		if dm, exists := debtMap[name]; exists {
			profitAllocations[i].TakenAmount = dm.Taken
			profitAllocations[i].ReturnedAmount = dm.Returned
			profitAllocations[i].RemainingDebt = math.Max(0, dm.Taken-dm.Returned)
			profitAllocations[i].LentAmount = math.Max(0, dm.Lent)
			if details, exists := lentDetailsMap[name]; exists {
				profitAllocations[i].LentDetails = strings.Join(details, ", ")
			}
			if details, exists := takenDetailsMap[name]; exists {
				profitAllocations[i].TakenDetails = strings.Join(details, ", ")
			}
		}
	}

	// Final Summary Total Expenses & Stats
	grossProfit := revenue - tripayFees
	// Total Expenses = Recorded Expenses + PPN + Gateway Fees
	totalExpensesWithCogs := expenses + tripayFees + ppnAmount
	var margin float64
	if revenue > 0 {
		margin = (netProfit / revenue) * 100
	}

	return &FinancialSummary{
		TotalRevenue:    math.Round(revenue),
		TotalExpenses:   math.Round(totalExpensesWithCogs),
		GrossProfit:     math.Round(grossProfit),
		NetProfit:       math.Round(netProfit),
		ProfitMargin:    math.Round(margin*100) / 100,
		ExpenseByCat:    expenseByCat,
		PeriodStart:     start,
		PeriodEnd:       end,
		RevenueDetails:  revenueDetails,
		ExpenseDetails:  expenseDetails,
		BudgetTransfers: transfers,
		ExpenseAllocations: expenseAllocations,
		ProfitAllocations:  profitAllocations,
		NetProfitTarget: netProfitTarget,
		ExpenseTarget:   totalExpenseBudget,
		AllocationPct:   allocationPct,
		TotalFees:       tripayFees,
		NetRevenue:      math.Round(revenue - tripayFees),
		TaxPct:          taxPct,
	}, nil
}

func (s *reportService) ListExpenses(start, end time.Time) ([]models.PlatformExpense, error) {
	return s.repo.ListExpensesByPeriod(start, end)
}

func (s *reportService) AddPlatformExpense(expense *models.PlatformExpense) error {
	if expense.Amount <= 0 {
		return fmt.Errorf("jumlah pengeluaran harus lebih besar dari 0")
	}
	return s.repo.CreateExpense(expense)
}

func (s *reportService) UpdatePlatformExpense(expense *models.PlatformExpense) error {
	if expense.Amount <= 0 {
		return fmt.Errorf("jumlah pengeluaran harus lebih besar dari 0")
	}
	return s.repo.UpdateExpense(expense)
}

func (s *reportService) DeletePlatformExpense(id string) error {
	return s.repo.DeleteExpense(id)
}

func (s *reportService) GetAllCategories() ([]models.PlatformExpenseCategory, error) {
	return s.repo.GetAllCategories()
}

func (s *reportService) CreateCategory(cat *models.PlatformExpenseCategory) error {
	if cat.Name == "" {
		return fmt.Errorf("nama kategori tidak boleh kosong")
	}
	return s.repo.CreateCategory(cat)
}

func (s *reportService) UpdateCategory(cat *models.PlatformExpenseCategory) error {
	if cat.Name == "" {
		return fmt.Errorf("nama kategori tidak boleh kosong")
	}
	return s.repo.UpdateCategory(cat)
}

func (s *reportService) DeleteCategory(id string) error {
	return s.repo.DeleteCategory(id)
}

func (s *reportService) GetBudgetTransfers(start, end time.Time) ([]models.PlatformBudgetTransfer, error) {
	return s.repo.GetBudgetTransfersByPeriod(start, end)
}

func (s *reportService) CreateBudgetTransfer(transfer *models.PlatformBudgetTransfer) error {
	if transfer.Amount <= 0 {
		return fmt.Errorf("jumlah transfer harus lebih besar dari 0")
	}
	if transfer.FromCategory == transfer.ToCategory {
		return fmt.Errorf("kategori sumber dan tujuan tidak boleh sama")
	}
	// Default Type if empty
	if transfer.Type == "" {
		transfer.Type = "TAKEN"
	}
	return s.repo.CreateBudgetTransfer(transfer)
}

func (s *reportService) UpdateBudgetTransfer(transfer *models.PlatformBudgetTransfer) error {
	if transfer.Amount <= 0 {
		return fmt.Errorf("jumlah transfer harus lebih besar dari 0")
	}
	return s.repo.UpdateBudgetTransfer(transfer)
}

func (s *reportService) DeleteBudgetTransfer(id string) error {
	return s.repo.DeleteBudgetTransfer(id)
}
