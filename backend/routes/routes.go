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
	// Static files
	router.Static("/uploads", "./uploads")

	router.NoRoute(func(c *gin.Context) {
		if c.Request.Method == "OPTIONS" {
			c.Header("Access-Control-Allow-Origin", "http://localhost:5173")
			c.Header("Access-Control-Allow-Credentials", "true")
			c.Header("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
			c.Header("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
			c.AbortWithStatus(204)
			return
		}
		c.AbortWithStatusJSON(404, gin.H{"error": "Route not found"})
	})

	v1 := router.Group("/api/v1")

	// Dependencies
	authRepo := repositories.NewAuthRepository()
	mailService := services.NewMailService()
	authService := services.NewAuthService(authRepo, mailService)
	authController := controllers.NewAuthController(authService)

	walletRepo := repositories.NewWalletRepository()
	walletService := services.NewWalletService(walletRepo)
	walletController := controllers.NewWalletController(walletService)

	behaviorRepo := repositories.NewBehaviorRepository()
	financeRepo := repositories.NewFinanceRepository()
	financeService := services.NewFinanceService(financeRepo, walletRepo, behaviorRepo)
	financeController := controllers.NewFinanceController(financeService)

	memberRepo := repositories.NewMemberRepository()
	adminRepo := repositories.NewAdminRepository()
	adminService := services.NewAdminService(adminRepo, memberRepo, mailService)
	adminController := controllers.NewAdminController(adminService)

	savingService := services.NewSavingService()
	savingController := controllers.NewSavingController(savingService)

	debtService := services.NewDebtService()
	debtController := controllers.NewDebtController(debtService)

	notificationService := services.NewNotificationService(mailService)
	notificationController := controllers.NewNotificationController(notificationService)

	familyController := controllers.NewFamilyController()

	tripayService := services.NewTripayService()
	paymentController := controllers.NewPaymentController(tripayService)

	// Public Routes
	v1.POST("/auth/login", authController.Login)
	v1.POST("/auth/register", authController.Register)
	v1.POST("/auth/verify-otp", authController.VerifyOTP)
	v1.POST("/auth/forgot-password", authController.ForgotPassword)
	v1.POST("/auth/reset-password", authController.ResetPassword)
	v1.GET("/auth/invitation/:id", authController.GetInvitation)

	v1.POST("/auth/reset-password/request-otp", authController.RequestResetOTP)
	v1.POST("/auth/reset-password/verify-otp", authController.ResetWithOTP)

	// Public System Info
	v1.GET("/public/settings", adminController.GetPublicSettings)
	v1.GET("/public/plans", adminController.GetPublicPlans)
	v1.GET("/public/plans/:id", adminController.GetPlanByID)

	// TriPay Callback (Public — called by TriPay server directly)
	v1.POST("/payment/callback", paymentController.HandleCallback)

	// Payment Status Polling (Public — used by frontend to check payment status)
	v1.GET("/payment/status/:reference", paymentController.GetPaymentStatus)

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
			finance.GET("/behavior", financeController.GetBehaviorSummary)

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
			finance.GET("/debts/:id/history", debtController.GetPaymentHistory)
			finance.DELETE("/debts/:id", debtController.DeleteDebt)

			finance.GET("/members", adminController.GetMembers)
			finance.POST("/members/invite", adminController.InviteMember)
			finance.PUT("/members/:id/role", adminController.UpdateMemberRole)
			finance.DELETE("/members/:id", adminController.RemoveMember)

			// Profile Management
			finance.PUT("/profile", authController.UpdateProfile)
			finance.PUT("/profile/password", authController.UpdatePassword)

			// Notification Routes
			finance.GET("/notifications", notificationController.ListNotifications)
			finance.PUT("/notifications/:id/read", notificationController.MarkAsRead)

			// Family Profile Routes
			finance.GET("/families/profile", familyController.GetFamilyProfile)
			finance.PUT("/families/profile", familyController.UpdateFamily)
			finance.DELETE("/families/profile/photo", familyController.DeleteFamilyPhoto)

			// Payment Routes
			finance.POST("/payment/create", paymentController.CreatePayment)
			finance.GET("/payment/:id", paymentController.GetPayment)
		}

		// Admin Routes
		admin := protected.Group("/admin")
		admin.Use(middlewares.AdminMiddleware())
		{
			admin.GET("/stats", adminController.GetStats)
			admin.GET("/applications", adminController.GetApplications)
			admin.POST("/applications/:id/approve", adminController.ApproveApplication)
			admin.POST("/applications/:id/reject", adminController.RejectApplication)
			
			// User Management
			admin.GET("/users", adminController.GetUsers)
			admin.PUT("/users", adminController.UpdateUser)
			admin.POST("/users/:id/toggle-block", adminController.ToggleUserBlock)

			admin.GET("/families", adminController.GetFamilies)
			admin.DELETE("/families/:id", adminController.DeleteFamily)
			admin.GET("/settings", adminController.GetSettings)
			admin.PUT("/settings/:key", adminController.UpdateSetting)

			admin.GET("/plans", adminController.GetPlans)
			admin.POST("/plans", adminController.CreatePlan)
			admin.PUT("/plans", adminController.UpdatePlan)
			admin.DELETE("/plans/:id", adminController.DeletePlan)
		}
	}
}
