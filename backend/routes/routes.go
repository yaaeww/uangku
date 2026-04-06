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

	// Root route
	router.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "running",
			"message": "Uangku Backend API is live",
		})
	})

	router.NoRoute(func(c *gin.Context) {
		if c.Request.Method == "OPTIONS" {
			c.Header("Access-Control-Allow-Origin", "http://localhost:5173")
			c.Header("Access-Control-Allow-Credentials", "true")
			c.Header("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE, PATCH")
			c.Header("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With, X-Access-Token")
			c.AbortWithStatus(204)
			return
		}
		c.AbortWithStatusJSON(404, gin.H{"error": "Route not found"})
	})

	v1 := router.Group("/api/v1")

	// Dependencies
	savingService := services.NewSavingService()
	budgetService := services.NewBudgetService()
	budgetController := controllers.NewBudgetController(budgetService, savingService)

	authRepo := repositories.NewAuthRepository()
	mailService := services.NewMailService()
	authService := services.NewAuthService(authRepo, mailService, budgetService)
	authController := controllers.NewAuthController(authService)

	walletRepo := repositories.NewWalletRepository()
	walletService := services.NewWalletService(walletRepo)
	walletController := controllers.NewWalletController(walletService)

	behaviorRepo := repositories.NewBehaviorRepository()
	financeRepo := repositories.NewFinanceRepository()
	goalRepo := repositories.NewGoalRepository()
	assetRepo := repositories.NewAssetRepository()
	budgetRepo := repositories.NewBudgetRepository()
	aiService := services.NewAIService()

	financeService := services.NewFinanceService(financeRepo, walletRepo, behaviorRepo, assetRepo, goalRepo, budgetRepo, aiService)
	financeController := controllers.NewFinanceController(financeService)

	memberRepo := repositories.NewMemberRepository()
	adminRepo := repositories.NewAdminRepository()
	tripayService := services.NewTripayService()
	adminService := services.NewAdminService(adminRepo, memberRepo, mailService, tripayService)
	adminController := controllers.NewAdminController(adminService)

	savingController := controllers.NewSavingController(savingService)

	notificationService := services.NewNotificationService(mailService)
	notificationController := controllers.NewNotificationController(notificationService)

	debtService := services.NewDebtService(notificationService)
	debtController := controllers.NewDebtController(debtService)

	familyController := controllers.NewFamilyController()

	paymentController := controllers.NewPaymentController(tripayService, notificationService)

	scannerService := services.NewScannerService()
	scannerController := controllers.NewScannerController(scannerService)

	reportRepo := repositories.NewReportRepository()
	reportService := services.NewReportService(reportRepo)
	reportController := controllers.NewReportController(reportService)

	supportRepo := repositories.NewSupportRepository()
	supportService := services.NewSupportService(supportRepo)
	supportController := controllers.NewSupportController(supportService)

	assetService := services.NewAssetService(assetRepo, goalRepo)
	assetController := controllers.NewAssetController(assetService)

	goalService := services.NewGoalService(goalRepo, assetRepo)
	goalController := controllers.NewGoalController(goalService, financeService, walletService)

	// Public Routes
	v1.POST("/auth/login", authController.Login)
	v1.POST("/auth/register", authController.Register)
	v1.POST("/auth/verify-otp", authController.VerifyOTP)
	v1.POST("/auth/resend-otp", authController.ResendOTP)
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
	v1.GET("/public/payment-channels", paymentController.GetActiveChannels)

	// Sitemap (Public SEO)
	sitemapController := controllers.NewSitemapController()
	router.GET("/sitemap.xml", sitemapController.GenerateSitemap)
	router.GET("/robots.txt", sitemapController.GetRobotsTxt)

	// Blog Public
	blogRepo := repositories.NewBlogRepository()
	blogController := controllers.NewBlogController(blogRepo)
	v1.GET("/blog", blogController.List)
	v1.GET("/blog/categories", blogController.GetCategories)
	v1.GET("/blog/:slug", blogController.Get)

	// Protected Routes
	protected := v1.Group("")
	protected.Use(middlewares.AuthMiddleware())
	{
		// Blog Management (Restricted)
		blog := protected.Group("/blog-mgmt")
		{
			blog.POST("/posts", blogController.Create)
			blog.PUT("/posts", blogController.Update)
			blog.DELETE("/posts/:id", blogController.Delete)
			blog.GET("/categories", blogController.GetCategories)
			blog.POST("/categories", blogController.CreateCategory)
			blog.PUT("/categories", blogController.UpdateCategory)
			blog.DELETE("/categories/:id", blogController.DeleteCategory)
			blog.POST("/upload", blogController.UploadImage)

			// Sitemap Config Management
			blog.GET("/sitemap", sitemapController.ListConfigs)
			blog.POST("/sitemap", sitemapController.CreateConfig)
			blog.PUT("/sitemap/:id", sitemapController.UpdateConfig)
			blog.DELETE("/sitemap/:id", sitemapController.DeleteConfig)
			blog.PATCH("/sitemap/:id/toggle-bots", sitemapController.ToggleBots)
		}

		// Finance Routes
		finance := protected.Group("/finance")
		finance.Use(middlewares.TenantMiddleware(), middlewares.RBACReadOnlyMiddleware())
		{
			finance.GET("/transactions", financeController.ListTransactions)
			finance.GET("/summary", financeController.GetDashboardSummary)
			finance.POST("/transactions", financeController.CreateTransaction)
			finance.POST("/transactions/bulk", financeController.CreateBulkTransactions)
			finance.POST("/transactions/scan", scannerController.ScanReceipt)
			finance.PUT("/transactions/:id", financeController.UpdateTransaction)
			finance.DELETE("/transactions/:id", financeController.DeleteTransaction)
			finance.GET("/behavior", financeController.GetBehaviorSummary)
			finance.GET("/coach-analysis", financeController.GetCoachAnalysis)
			finance.POST("/behavior/challenges/join", financeController.JoinChallenge)

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
			finance.PUT("/debts/:id", debtController.UpdateDebt)
			finance.POST("/debts/payment", debtController.RecordPayment)
			finance.GET("/debts/:id/history", debtController.GetPaymentHistory)
			finance.DELETE("/debts/:id", debtController.DeleteDebt)

			finance.GET("/members", adminController.GetMembers)
			finance.GET("/members/invitations", adminController.GetInvitations)
			finance.DELETE("/members/invitations/:id", adminController.DeleteInvitation)
			finance.POST("/members/invite", adminController.InviteMember)
			finance.PUT("/members/:id/role", adminController.UpdateMemberRole)
			finance.DELETE("/members/:id", adminController.RemoveMember)

			// Profile Management
			finance.GET("/me", authController.GetCurrentUser)
			finance.PUT("/profile", authController.UpdateProfile)
			finance.PUT("/profile/password", authController.UpdatePassword)

			// Notification Routes
			finance.GET("/notifications", notificationController.ListNotifications)
			finance.PUT("/notifications/mark-all-read", notificationController.MarkAllAsRead)
			finance.PUT("/notifications/:id/read", notificationController.MarkAsRead)
			finance.DELETE("/notifications/all", notificationController.DeleteAllNotifications)
			finance.DELETE("/notifications/bulk", notificationController.DeleteBulkNotifications)
			finance.DELETE("/notifications/:id", notificationController.DeleteNotification)

			// Family Profile Routes
			finance.GET("/families/profile", familyController.GetFamilyProfile)
			finance.PUT("/families/profile", familyController.UpdateFamily)
			finance.DELETE("/families/profile/photo", familyController.DeleteFamilyPhoto)
			finance.PUT("/families/plan", familyController.UpdateSubscriptionPlan)

			// Support Report Routes
			finance.POST("/support/tickets", supportController.CreateTicket)
			finance.GET("/support/tickets", supportController.ListMyTickets)

			// Payment Routes
			finance.POST("/payment/create", paymentController.CreatePayment)
			finance.GET("/payments", paymentController.ListPayments)
			finance.GET("/payment/:id", paymentController.GetPayment)
			finance.GET("/payment/latest-pending", paymentController.GetLatestPending)
			finance.DELETE("/payments/:id", paymentController.DeletePayment)
			finance.POST("/payment/simulate", paymentController.SimulatePayment)
			finance.POST("/payment/:id/upload-proof", paymentController.UploadProof)

			// Budget Planning Routes
			budget := finance.Group("/budget")
			{
				budget.GET("/categories", budgetController.ListCategories)
				budget.POST("/categories", budgetController.CreateCategory)
				budget.PUT("/categories/:id", budgetController.UpdateCategory)
				budget.DELETE("/categories/:id", budgetController.DeleteCategory)
				budget.DELETE("/categories/:id/clear", budgetController.ClearCategoryItems)
				budget.PUT("", financeController.UpdateFamilyBudget)
				budget.PUT("/member", familyController.UpdateMemberBudget)
				budget.POST("/member/default", familyController.ApplyDefaultAllocation)
				budget.DELETE("/categories", budgetController.ClearAllCategories)
			}

			// Asset Routes
			finance.GET("/assets", assetController.List)
			finance.POST("/assets", assetController.Create)
			finance.PUT("/assets", assetController.Update)
			finance.DELETE("/assets/:id", assetController.Delete)

			// Goal Routes
			finance.GET("/goals", goalController.List)
			finance.POST("/goals", goalController.Create)
			finance.PUT("/goals", goalController.Update)
			finance.POST("/goals/convert", goalController.ConvertToAsset)
			finance.POST("/goals/fund", goalController.AllocateFromWallet)
			finance.GET("/goals/:id/history", goalController.GetHistory)
			finance.DELETE("/goals/:id", goalController.Delete)
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
			admin.POST("/users", adminController.CreateUserAdmin)
			admin.PUT("/users", adminController.UpdateUser)
			admin.PUT("/users/:id", adminController.UpdateUserAdmin)
			admin.DELETE("/users/:id", adminController.DeleteUserAdmin)
			admin.POST("/users/:id/toggle-block", adminController.ToggleUserBlock)

			admin.GET("/superadmins", adminController.GetSuperAdmins)
			admin.POST("/superadmins", adminController.CreateSuperAdmin)
			admin.PUT("/superadmins/:id", adminController.UpdateSuperAdmin)
			admin.DELETE("/superadmins/:id", adminController.DeleteSuperAdmin)

			admin.GET("/families", adminController.GetFamilies)
			admin.DELETE("/families/:id", adminController.DeleteFamily)
			admin.POST("/families/:id/toggle-block", adminController.ToggleFamilyBlock)
			admin.GET("/settings", adminController.GetSettings)
			admin.PUT("/settings/:key", adminController.UpdateSetting)

			admin.GET("/plans", adminController.GetPlans)
			admin.POST("/plans", adminController.CreatePlan)
			admin.PUT("/plans", adminController.UpdatePlan)
			admin.DELETE("/plans/:id", adminController.DeletePlan)

			admin.GET("/transactions", adminController.GetPaymentTransactions)
			admin.POST("/upload-logo", adminController.UploadLogo)

			// Payment Channel Management
			admin.GET("/payment-channels", adminController.GetPaymentChannels)
			admin.POST("/payment-channels", adminController.CreatePaymentChannel)
			admin.POST("/payment-channels/sync", adminController.SyncPaymentChannels)
			admin.PUT("/payment-channels", adminController.UpdatePaymentChannel)
			admin.DELETE("/payment-channels/:id", adminController.DeletePaymentChannel)
			admin.POST("/payment-channels/upload-logo", paymentController.UploadBankLogo)
			admin.POST("/payments/manual/status", paymentController.UpdateManualStatus)

			// Financial Reporting Routes
			admin.GET("/reports/financial", reportController.GetFinancialSummary)
			admin.POST("/reports/expenses", reportController.AddExpense)
			admin.PUT("/reports/expenses/:id", reportController.UpdateExpense)
			admin.DELETE("/reports/expenses/:id", reportController.DeleteExpense)

			// NEW: Category Management
			admin.GET("/reports/categories", reportController.ListCategories)
			admin.POST("/reports/categories", reportController.AddCategory)
			admin.PUT("/reports/categories", reportController.UpdateCategory)
			admin.DELETE("/reports/categories/:id", reportController.DeleteCategory)

			// Budget Transfers
			admin.POST("/reports/transfers", reportController.CreateBudgetTransfer)
			admin.PUT("/reports/transfers/:id", reportController.UpdateBudgetTransfer)
			admin.DELETE("/reports/transfers/:id", reportController.DeleteBudgetTransfer)

			// Support Management Routes
			admin.GET("/support/tickets", supportController.AdminListAllTickets)
			admin.POST("/support/tickets/:id/reply", supportController.AdminReplyTicket)
		}
	}
}
