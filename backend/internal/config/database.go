package config

import (
	"fmt"
	"log"
	"os"

	"keuangan-keluarga/internal/models"
	"github.com/google/uuid"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func ConnectDatabase() {
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s",
		AppConfig.DBHost, AppConfig.DBUser, AppConfig.DBPassword, AppConfig.DBName, AppConfig.DBPort, AppConfig.DBSSLMode)

	log.Printf("Connecting to database %s on %s:%s...", AppConfig.DBName, AppConfig.DBHost, AppConfig.DBPort)
	database, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})

	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	DB = database
	log.Println("Database connection established")

	// Run migrations
	log.Println("Running AutoMigrate for core models...")
	if err := DB.Exec(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`).Error; err != nil {
		log.Printf("Warning: Failed to create uuid-ossp extension: %v", err)
	}
	if err := DB.Exec(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`).Error; err != nil {
		log.Printf("Warning: Failed to create pgcrypto extension: %v", err)
	}

	err = DB.AutoMigrate(
		&models.BudgetCategory{},
		&models.User{},
		&models.Family{},
		&models.FamilyMember{},
		&models.FamilyApplication{},
		&models.FamilyInvitation{},
		&models.Wallet{},
		&models.Transaction{},
		&models.BudgetCategory{},
		&models.Saving{},
		&models.Debt{},
		&models.DebtPayment{},
		&models.DebtPenalty{},
		&models.Notification{},
		&models.SystemSetting{},
		&models.SubscriptionPlan{},
		&models.PaymentTransaction{},
		&models.PaymentChannel{},
		&models.FamilyChallenge{},
		&models.BlogCategory{},
		&models.BlogPost{},
		&models.SitemapConfig{},
		&models.PlatformExpense{},
		&models.PlatformExpenseCategory{},
		&models.PlatformBudgetTransfer{},
		&models.Asset{},
		&models.Goal{},
		&models.SupportReport{},
		&models.BudgetPlan{},
	)
	if err != nil {
		log.Fatal("Failed to run migrations:", err)
	}

	// Seed default settings
	seedDefaultSettings()
	// Seed subscription plans
	seedSubscriptionPlans()
	// Seed Blog Categories
	seedBlogCategories()

	// Retroactively seed missing budgets for all families
	seedMissingBudgets()

	// Manual Migration for Partitioning (SAS Method)
	log.Println("Setting up transactions partitioning (SAS Method)...")
	setupPartitionedTransactions()

	// Apply Financial Integrity Constraints
	log.Println("Applying financial integrity constraints...")
	applyFinancialConstraints()

	log.Println("Database initialization and migrations completed")
}

func applyFinancialConstraints() {
	// Wallets - REMOVED strict balance >= 0 to allow over-budget and reverts
	DB.Exec(`ALTER TABLE wallets DROP CONSTRAINT IF EXISTS wallets_balance_non_negative;`)
	DB.Exec(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wallets_name_not_empty') THEN ALTER TABLE wallets ADD CONSTRAINT wallets_name_not_empty CHECK (name <> ''); END IF; END $$;`)

	// Savings
	DB.Exec(`ALTER TABLE savings ADD COLUMN IF NOT EXISTS category VARCHAR(255) DEFAULT 'savings';`)
	DB.Exec(`ALTER TABLE savings ADD COLUMN IF NOT EXISTS emoji VARCHAR(50);`)
	DB.Exec(`ALTER TABLE savings ADD COLUMN IF NOT EXISTS due_date INTEGER DEFAULT 0;`)
	DB.Exec(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'savings_target_positive') THEN ALTER TABLE savings ADD CONSTRAINT savings_target_positive CHECK (target_amount > 0); END IF; END $$;`)
	// REMOVED strict balance >= 0 to allow over-budget states
	DB.Exec(`ALTER TABLE savings DROP CONSTRAINT IF EXISTS savings_balance_non_negative;`)

	// Debts
	DB.Exec(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'debts_total_positive') THEN ALTER TABLE debts ADD CONSTRAINT debts_total_positive CHECK (total_amount > 0); END IF; END $$;`)
	DB.Exec(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'debts_remaining_non_negative') THEN ALTER TABLE debts ADD CONSTRAINT debts_remaining_non_negative CHECK (remaining_amount >= 0); END IF; END $$;`)

	// Debt Payments
	DB.Exec(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'debt_payments_amount_positive') THEN ALTER TABLE debt_payments ADD CONSTRAINT debt_payments_amount_positive CHECK (amount > 0); END IF; END $$;`)

	// Transactions
	DB.Exec(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_amount_positive') THEN ALTER TABLE transactions ADD CONSTRAINT transactions_amount_positive CHECK (amount > 0); END IF; END $$;`)

	// Platform Expenses
	DB.Exec(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'platform_expenses_amount_positive') THEN ALTER TABLE platform_expenses ADD CONSTRAINT platform_expenses_amount_positive CHECK (amount > 0); END IF; END $$;`)

	// Performance Indexes (Anti-Kejebol)
	DB.Exec(`CREATE INDEX IF NOT EXISTS idx_debt_payments_debt_date ON debt_payments (debt_id, date);`)
	DB.Exec(`CREATE INDEX IF NOT EXISTS idx_debts_status_due ON debts (status, next_installment_due_date);`)
	DB.Exec(`CREATE INDEX IF NOT EXISTS idx_debt_penalties_debt_date ON debt_penalties (debt_id, date);`)

	log.Println("Financial integrity constraints and performance indexes applied")
}

func setupPartitionedTransactions() {
	// 0. Check if table 'transactions' exists
	var exists bool
	DB.Raw("SELECT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'transactions')").Scan(&exists)

	if exists {
		// Check if it's partitioned
		var isPartitioned bool
		DB.Raw(`
			SELECT EXISTS (
				SELECT 1 FROM pg_partitioned_table 
				WHERE partrelid = to_regclass('transactions')
			)
		`).Scan(&isPartitioned)

		if !isPartitioned {
			log.Println("Detected non-partitioned 'transactions' table.")
			// We MUST NOT drop a table with potential data without warning.
			// Recreating as partitioned is better handled via rename.
			newName := "transactions_backup_" + fmt.Sprintf("%d", os.Getpid())
			log.Printf("Renaming existing 'transactions' table to '%s' to allow recreation as partitioned...", newName)
			if err := DB.Exec(fmt.Sprintf("ALTER TABLE transactions RENAME TO %s", newName)).Error; err != nil {
				log.Printf("Error renaming non-partitioned table: %v. FAILED to prepare for partitioning.", err)
				return // Don't proceed with partition creation if rename failed
			}
		} else {
			// Check if 'date' column is DATE instead of TIMESTAMP
			var dataType string
			DB.Raw("SELECT data_type FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'date'").Scan(&dataType)
			if dataType == "date" {
				log.Printf("Detected 'transactions.date' as DATE type. Recreating as TIMESTAMP WITH TIME ZONE for real-time support...")
				if err := DB.Exec("DROP TABLE transactions CASCADE").Error; err != nil {
					log.Printf("Error dropping table with old date type: %v", err)
				}
				// Note: Dropping CASCADE is aggressive but since we want to change PARTITION KEY type,
				// it's the most reliable way in early dev.
			}
		}
	}

	// 1. Create the main partitioned table
	DB.Exec(`
		CREATE TABLE IF NOT EXISTS transactions (
			id UUID NOT NULL,
			family_id UUID NOT NULL,
			user_id UUID NOT NULL,
			wallet_id UUID NOT NULL,
			to_wallet_id UUID,
			type VARCHAR(255) NOT NULL,
			amount DECIMAL(12,2) NOT NULL,
			fee DECIMAL(12,2) NOT NULL DEFAULT 0,
			category VARCHAR(255),
			date TIMESTAMP WITH TIME ZONE NOT NULL,
			description TEXT,
			saving_id UUID,
			goal_id UUID,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (id, family_id, date)
		) PARTITION BY RANGE (date);
	`)

	// Ensure columns exist in the main table (and thus in partitions created in the future)
	DB.Exec(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS wallet_id UUID;`)
	DB.Exec(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS to_wallet_id UUID;`)
	DB.Exec(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS fee DECIMAL(12,2) DEFAULT 0;`)
	DB.Exec(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS category VARCHAR(255);`)
	DB.Exec(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS saving_id UUID;`)
	DB.Exec(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS goal_id UUID;`)

	// 2. Create indices for faster lookups (SAS Method Indexing)
	DB.Exec(`CREATE INDEX IF NOT EXISTS idx_transactions_family_date ON transactions (family_id, date DESC);`)
	DB.Exec(`CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions (user_id);`)
	DB.Exec(`CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON transactions (wallet_id);`)
	DB.Exec(`CREATE INDEX IF NOT EXISTS idx_transactions_saving_id ON transactions (saving_id);`)
	DB.Exec(`CREATE INDEX IF NOT EXISTS idx_transactions_goal_id ON transactions (goal_id);`)

	// 3. Create dynamic monthly partitions
	log.Println("Ensuring initial partitions exist (Jan 2024 - Future)...")
	// Seed from 2024 to current month + 12
	startSeed := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	endSeed := time.Now().AddDate(0, 13, 0)
	
	for t := startSeed; t.Before(endSeed); t = t.AddDate(0, 1, 0) {
		if err := EnsurePartitionForDate(DB, t); err != nil {
			log.Printf("Warning during initial seeding: %v", err)
		}
	}
	
	log.Println("Database partitioning (SAS Method) verified")
}

// EnsurePartitionForDate checks and creates a partition for the given date if it doesn't exist.
// This allows on-demand partition creation for any date (past or future).
func EnsurePartitionForDate(db *gorm.DB, date time.Time) error {
	year := date.Year()
	month := int(date.Month())

	tableName := fmt.Sprintf("transactions_%d_%02d", year, month)
	startDate := fmt.Sprintf("%d-%02d-01", year, month)

	// End date is first day of next month
	endTarget := time.Date(year, date.Month()+1, 1, 0, 0, 0, 0, time.UTC)
	endDate := endTarget.Format("2006-01-02")

	query := fmt.Sprintf(`
		CREATE TABLE IF NOT EXISTS %s 
		PARTITION OF transactions 
		FOR VALUES FROM ('%s') TO ('%s');
	`, tableName, startDate, endDate)

	if err := db.Exec(query).Error; err != nil {
		return fmt.Errorf("could not ensure partition %s: %w", tableName, err)
	}
	return nil
}

func seedDefaultSettings() {
	defaultSettings := []models.SystemSetting{
		{
			Key:   "trial_duration_days",
			Value: "7",
		},
		{
			Key:   "trial_max_members",
			Value: "2",
		},
		{
			Key:   "website_name",
			Value: "Uangku",
		},
		{
			Key:   "logo_url_light",
			Value: "",
		},
		{
			Key:   "logo_url_dark",
			Value: "",
		},
		{
			Key:   "platform_expense_allocation_pct",
			Value: "60",
		},
		{
			Key:   "otp_expiry_duration",
			Value: "15",
		},
		{
			Key:   "resend_otp_duration",
			Value: "60",
		},
		{
			Key:   "contact_address",
			Value: "Jl. Cigadung Raya Tengah No.52, RT.2, Cigadung, Kec. Cibeunying Kaler, Kota Bandung, Jawa Barat 40191",
		},
		{
			Key:   "contact_building",
			Value: "Jasaweb Pro / AplikasiDagang Center",
		},
		{
			Key:   "contact_email_support",
			Value: "info@aplikasidagang.co.id",
		},
		{
			Key:   "contact_email_admin",
			Value: "admin@aplikasidagang.co.id",
		},
		{
			Key:   "contact_phone_primary",
			Value: "0812 2242 9289",
		},
		{
			Key:   "contact_phone_secondary",
			Value: "0813 8486 8040",
		},
		{
			Key:   "social_instagram_1",
			Value: "https://www.instagram.com/jasaweb_pro/",
		},
		{
			Key:   "social_instagram_2",
			Value: "https://www.instagram.com/aplikasidagang/",
		},
		{
			Key:   "social_youtube",
			Value: "https://www.youtube.com/@aplikasidagang",
		},
		{
			Key:   "social_facebook",
			Value: "https://www.facebook.com/aplikasidagang?_rdc=1&_rdr#",
		},
		{
			Key:   "social_tiktok",
			Value: "https://www.tiktok.com/@aplikasidagang",
		},
		{
			Key:   "social_twitter",
			Value: "https://x.com/aplikasidagang",
		},
		{
			Key:   "whatsapp_number",
			Value: "6281222429289",
		},
		{
			Key:   "whatsapp_link",
			Value: "https://wa.me/6281222429289",
		},
	}

	for _, s := range defaultSettings {
		var exists bool
		DB.Model(&models.SystemSetting{}).
			Select("count(*) > 0").
			Where("key = ?", s.Key).
			Scan(&exists)

		// For contact and social keys, we want to ensure they are synced/updated if they are defaults
		isContactKey := len(s.Key) > 8 && (s.Key[:8] == "contact_" || s.Key[:7] == "social_" || s.Key[:9] == "whatsapp_")
		
		if !exists {
			log.Printf("Seeding default setting: %s = %s", s.Key, s.Value)
			DB.Create(&s)
		} else if isContactKey {
			// Optional: Only update if it's a known "old" default or if we want to force sync
			// For this task, we force update to ensure the user's new address is applied
			DB.Model(&models.SystemSetting{}).Where("key = ?", s.Key).Update("value", s.Value)
		}
	}
}

func seedSubscriptionPlans() {
	defaultPlans := []models.SubscriptionPlan{
		{
			Name:         "Standard",
			Price:        25000,
			MaxMembers:   2,
			DurationDays: 30,
			Description:  "Cocok untuk pasangan muda",
			Features:     "Hingga 2 Anggota;Laporan Bulanan;Multi Dompet;Eksport Data",
		},
		{
			Name:         "Family",
			Price:        50000,
			MaxMembers:   5,
			DurationDays: 30,
			Description:  "Pilihan populer untuk keluarga kecil",
			Features:     "Hingga 5 Anggota;Laporan Mingguan & Bulanan;Analisis Anggaran;Target Menabung",
		},
		{
			Name:         "Premium",
			Price:        100000,
			MaxMembers:   10,
			DurationDays: 30,
			Description:  "Fitur lengkap untuk keluarga besar",
			Features:     "Hingga 10 Anggota;Prioritas Support;Backup Otomatis;Manajemen Utang",
		},
	}

	for _, p := range defaultPlans {
		// Use FirstOrCreate to ensure we don't duplicate names
		DB.Where(models.SubscriptionPlan{Name: p.Name}).FirstOrCreate(&p)
	}
}

func seedBlogCategories() {
	log.Println("Seeding default blog categories...")
	categories := []models.BlogCategory{
		{Name: "Tips Keuangan", Slug: "tips-keuangan", Description: "Tips dan trik mengelola keuangan keluarga"},
		{Name: "Investasi", Slug: "investasi", Description: "Panduan investasi cerdas untuk masa depan"},
		{Name: "Gaya Hidup", Slug: "gaya-hidup", Description: "Keseimbangan antara gaya hidup dan finansial"},
		{Name: "Berita", Slug: "berita", Description: "Berita terbaru seputar ekonomi dan finansial"},
		{Name: "Edukasi", Slug: "edukasi", Description: "Materi edukasi finansial untuk keluarga"},
	}

	for i := range categories {
		if err := DB.Where("slug = ?", categories[i].Slug).FirstOrCreate(&categories[i]).Error; err != nil {
			log.Printf("Warning: failed to seed blog category %s: %v\n", categories[i].Name, err)
		}
	}
}

func seedMissingBudgets() {
	var families []models.Family
	// Optimized: Only fetch families that DON'T have any budget categories yet
	err := DB.Where("id NOT IN (SELECT DISTINCT family_id FROM budget_categories)").Find(&families).Error
	if err != nil {
		log.Printf("[ERROR] Failed to fetch families for budget seeding: %v", err)
		return
	}

	for _, family := range families {
		log.Printf("[INFO] Seeding default budget for family: %s (%s)", family.Name, family.ID)
			
			// Define default categories
			categories := []models.BudgetCategory{
				{FamilyID: family.ID, Name: "Kebutuhan", Percentage: 50, Description: "Biaya rutin bulanan yang wajib dipenuhi", Icon: "ShoppingCart", Color: "text-blue-500", BgColor: "bg-blue-50", Order: 1},
				{FamilyID: family.ID, Name: "Keinginan", Percentage: 30, Description: "Pengeluaran gaya hidup & hiburan", Icon: "Coffee", Color: "text-amber-500", BgColor: "bg-amber-50", Order: 2},
				{FamilyID: family.ID, Name: "Tabungan", Percentage: 10, Description: "Investasi & dana untuk masa depan", Icon: "Coins", Color: "text-dagang-green", BgColor: "bg-dagang-green/5", Order: 3},
				{FamilyID: family.ID, Name: "Dana Darurat", Percentage: 10, Description: "Cadangan dana untuk keadaan tak terduga", Icon: "ShieldCheck", Color: "text-red-500", BgColor: "bg-red-50", Order: 4},
			}

			for i := range categories {
				if err := DB.Create(&categories[i]).Error; err != nil {
					log.Printf("[ERROR] Failed to create budget category %s for family %s: %v", categories[i].Name, family.ID, err)
					continue
				}

				var items []models.Saving
				switch categories[i].Name {
				case "Kebutuhan":
					items = []models.Saving{
						{Name: "Makan", Emoji: "🍲", TargetAmount: 1000000, DueDate: 1},
						{Name: "Tempat Tinggal", Emoji: "🏠", TargetAmount: 2500000, DueDate: 1},
						{Name: "Listrik", Emoji: "⚡", TargetAmount: 500000, DueDate: 10},
						{Name: "Air", Emoji: "💧", TargetAmount: 150000, DueDate: 10},
						{Name: "Internet", Emoji: "🌐", TargetAmount: 400000, DueDate: 5},
						{Name: "Transportasi", Emoji: "🚐", TargetAmount: 800000, DueDate: 0},
						{Name: "Kesehatan", Emoji: "🏥", TargetAmount: 300000, DueDate: 0},
						{Name: "Pendidikan", Emoji: "🎓", TargetAmount: 1000000, DueDate: 0},
						{Name: "Sedekah", Emoji: "🙌", TargetAmount: 200000, DueDate: 0},
						{Name: "Kebutuhan Lain", Emoji: "📦", TargetAmount: 500000, DueDate: 0},
					}
				case "Keinginan":
					items = []models.Saving{
						{Name: "Belanja Online", Emoji: "🛍️", TargetAmount: 1000000, DueDate: 25},
						{Name: "Hiburan", Emoji: "🎬", TargetAmount: 500000, DueDate: 0},
						{Name: "Hangout", Emoji: "☕", TargetAmount: 700000, DueDate: 0},
						{Name: "Jajan", Emoji: "🍿", TargetAmount: 400000, DueDate: 0},
						{Name: "Hobi", Emoji: "🎨", TargetAmount: 300000, DueDate: 0},
						{Name: "Gaya Hidup", Emoji: "👔", TargetAmount: 600000, DueDate: 0},
					}
				case "Tabungan":
					items = []models.Saving{
						{Name: "Investasi Saham", Emoji: "📈", TargetAmount: 1000000, DueDate: 0},
					}
				case "Dana Darurat":
					items = []models.Saving{
						{Name: "Dana Darurat Utama", Emoji: "🛡️", TargetAmount: 1000000, DueDate: 0},
					}
				}

				for j := range items {
					items[j].ID = uuid.New()
					items[j].FamilyID = family.ID
					items[j].BudgetCategoryID = &categories[i].ID
					if err := DB.Create(&items[j]).Error; err != nil {
						log.Printf("[ERROR] Failed to create item %s for category %s: %v", items[j].Name, categories[i].Name, err)
					}
				}
			}
	}
}
