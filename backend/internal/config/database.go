package config

import (
	"fmt"
	"log"
	"os"

	"keuangan-keluarga/internal/models"

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
		Logger: logger.Default.LogMode(logger.Info),
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
		&models.User{},
		&models.Family{},
		&models.FamilyMember{},
		&models.FamilyApplication{},
		&models.FamilyInvitation{},
		&models.Wallet{},
		&models.Saving{},
		&models.Debt{},
		&models.DebtPayment{},
		&models.Notification{},
		&models.SystemSetting{},
		&models.SubscriptionPlan{},
		&models.PaymentTransaction{},
	)
	if err != nil {
		log.Fatal("Failed to run migrations:", err)
	}

	// Seed default settings
	seedDefaultSettings()
	// Seed subscription plans
	seedSubscriptionPlans()

	// Manual Migration for Partitioning (SAS Method)
	log.Println("Setting up transactions partitioning (SAS Method)...")
	setupPartitionedTransactions()

	// Apply Financial Integrity Constraints
	log.Println("Applying financial integrity constraints...")
	applyFinancialConstraints()

	log.Println("Database initialization and migrations completed")
}

func applyFinancialConstraints() {
	// Wallets
	DB.Exec(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wallets_balance_non_negative') THEN ALTER TABLE wallets ADD CONSTRAINT wallets_balance_non_negative CHECK (balance >= 0); END IF; END $$;`)
	DB.Exec(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wallets_name_not_empty') THEN ALTER TABLE wallets ADD CONSTRAINT wallets_name_not_empty CHECK (name <> ''); END IF; END $$;`)

	// Savings
	DB.Exec(`ALTER TABLE savings ADD COLUMN IF NOT EXISTS category VARCHAR(255) DEFAULT 'savings';`)
	DB.Exec(`ALTER TABLE savings ADD COLUMN IF NOT EXISTS emoji VARCHAR(50);`)
	DB.Exec(`ALTER TABLE savings ADD COLUMN IF NOT EXISTS due_date INTEGER DEFAULT 0;`)
	DB.Exec(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'savings_target_positive') THEN ALTER TABLE savings ADD CONSTRAINT savings_target_positive CHECK (target_amount > 0); END IF; END $$;`)
	DB.Exec(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'savings_balance_non_negative') THEN ALTER TABLE savings ADD CONSTRAINT savings_balance_non_negative CHECK (current_balance >= 0); END IF; END $$;`)

	// Debts
	DB.Exec(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'debts_total_positive') THEN ALTER TABLE debts ADD CONSTRAINT debts_total_positive CHECK (total_amount > 0); END IF; END $$;`)
	DB.Exec(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'debts_remaining_non_negative') THEN ALTER TABLE debts ADD CONSTRAINT debts_remaining_non_negative CHECK (remaining_amount >= 0); END IF; END $$;`)

	// Debt Payments
	DB.Exec(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'debt_payments_amount_positive') THEN ALTER TABLE debt_payments ADD CONSTRAINT debt_payments_amount_positive CHECK (amount > 0); END IF; END $$;`)

	// Transactions
	DB.Exec(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_amount_positive') THEN ALTER TABLE transactions ADD CONSTRAINT transactions_amount_positive CHECK (amount > 0); END IF; END $$;`)

	log.Println("Financial integrity constraints (CHECK) applied")
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

	// 2. Create indices for faster lookups (SAS Method Indexing)
	DB.Exec(`CREATE INDEX IF NOT EXISTS idx_transactions_family_date ON transactions (family_id, date DESC);`)
	DB.Exec(`CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions (user_id);`)
	DB.Exec(`CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON transactions (wallet_id);`)
	DB.Exec(`CREATE INDEX IF NOT EXISTS idx_transactions_saving_id ON transactions (saving_id);`)

	// 3. Create monthly partitions for 2026
	months := []string{
		"01", "02", "03", "04", "05", "06",
		"07", "08", "09", "10", "11", "12",
	}

	for i, m := range months {
		tableName := fmt.Sprintf("transactions_2026_%s", m)
		startDate := fmt.Sprintf("2026-%s-01", m)

		// End date is first day of next month
		var endDate string
		if i == 11 {
			endDate = "2027-01-01"
		} else {
			endDate = fmt.Sprintf("2026-%s-01", months[i+1])
		}

		query := fmt.Sprintf(`
			CREATE TABLE IF NOT EXISTS %s 
			PARTITION OF transactions 
			FOR VALUES FROM ('%s') TO ('%s');
		`, tableName, startDate, endDate)

		if err := DB.Exec(query).Error; err != nil {
			log.Printf("Warning: Could not create partition %s: %v", tableName, err)
		}
	}
	log.Println("Database partitioning (SAS Method) verified")
}

func seedDefaultSettings() {
	defaultSettings := []models.SystemSetting{
		{
			Key:   "trial_duration_days",
			Value: "7",
		},
	}

	for _, s := range defaultSettings {
		var exists bool
		DB.Model(&models.SystemSetting{}).
			Select("count(*) > 0").
			Where("key = ?", s.Key).
			Scan(&exists)

		if !exists {
			log.Printf("Seeding default setting: %s = %s", s.Key, s.Value)
			DB.Create(&s)
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
