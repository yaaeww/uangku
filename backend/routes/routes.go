package routes

import (
	"keuangan-keluarga/internal/controllers"
	"keuangan-keluarga/internal/middlewares"
	"keuangan-keluarga/internal/repositories"
	"keuangan-keluarga/internal/services"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine) {
	router.Use(middlewares.CORSMiddleware())
	v1 := router.Group("/api/v1")

	// Dependencies
	authRepo := repositories.NewAuthRepository()
	mailService := services.NewMailService()
	authService := services.NewAuthService(authRepo, mailService)
	authController := controllers.NewAuthController(authService)

	walletRepo := repositories.NewWalletRepository()
	walletService := services.NewWalletService(walletRepo)
	walletController := controllers.NewWalletController(walletService)

	financeRepo := repositories.NewFinanceRepository()
	financeService := services.NewFinanceService(financeRepo, walletRepo)
	financeController := controllers.NewFinanceController(financeService)

	adminRepo := repositories.NewAdminRepository()
	adminService := services.NewAdminService(adminRepo)
	adminController := controllers.NewAdminController(adminService)

	savingService := services.NewSavingService()
	savingController := controllers.NewSavingController(savingService)

	debtService := services.NewDebtService()
	debtController := controllers.NewDebtController(debtService)

	// Public Routes
	v1.POST("/auth/login", authController.Login)
	v1.POST("/auth/register", authController.Register)
	v1.POST("/auth/verify-otp", authController.VerifyOTP)
	v1.POST("/auth/forgot-password", authController.ForgotPassword)
	v1.POST("/auth/reset-password", authController.ResetPassword)

	// Protected Routes
	protected := v1.Group("")
	protected.Use(middlewares.AuthMiddleware())
	{
		// Finance Routes
		finance := protected.Group("/finance")
		finance.Use(middlewares.TenantMiddleware())
		{
			finance.GET("/transactions", financeController.ListTransactions)
			finance.GET("/summary", financeController.GetDashboardSummary)
			finance.POST("/transactions", financeController.CreateTransaction)
			finance.POST("/transactions/bulk", financeController.CreateBulkTransactions)
			finance.PUT("/transactions/:id", financeController.UpdateTransaction)
			finance.DELETE("/transactions/:id", financeController.DeleteTransaction)

			// Wallet Routes
			finance.GET("/wallets", walletController.List)
			finance.POST("/wallets", walletController.Create)
			finance.PUT("/wallets", walletController.Update)
			finance.DELETE("/wallets/:id", walletController.Delete)

			// Saving Routes
			finance.GET("/savings", savingController.ListSavings)
			finance.POST("/savings", savingController.CreateSaving)
			finance.PUT("/savings", savingController.UpdateSaving)
			finance.DELETE("/savings/:id", savingController.DeleteSaving)

			// Debt Routes
			finance.GET("/debts", debtController.ListDebts)
			finance.POST("/debts", debtController.CreateDebt)
			finance.POST("/debts/payment", debtController.RecordPayment)
			finance.DELETE("/debts/:id", debtController.DeleteDebt)
		}

		// Admin Routes
		admin := protected.Group("/admin")
		admin.Use(middlewares.AdminMiddleware())
		{
			admin.GET("/stats", adminController.GetStats)
			admin.GET("/applications", adminController.GetApplications)
			admin.POST("/applications/:id/approve", adminController.ApproveApplication)
			admin.POST("/applications/:id/reject", adminController.RejectApplication)
			admin.GET("/families", adminController.GetFamilies)
		}
	}
}
