-- PostgreSQL Schema Initialization Example with Partitioning and Multi-tenancy

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Core Identity
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Primary Tenant Table
CREATE TABLE families (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Membership Link
CREATE TABLE family_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES families(id),
    user_id UUID NOT NULL REFERENCES users(id),
    role VARCHAR(50) NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(family_id, user_id)
);

-- Partitioned High-Volume Event Table
-- Partitioned by RANGE on date column.
CREATE TABLE transactions (
    id UUID DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES families(id),
    user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, date) -- Primary key bounds partition logic
) PARTITION BY RANGE (date);

-- Example Monthly Partitions (Typically created via cron/pg_partman)
CREATE TABLE transactions_2026_01 PARTITION OF transactions FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE transactions_2026_02 PARTITION OF transactions FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE transactions_2026_03 PARTITION OF transactions FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

-- COMPOSITE INDEXES FOR FAST MULTI-TENANT & PARTITION QUERIES
CREATE INDEX idx_transactions_family_date ON transactions(family_id, date);
CREATE INDEX idx_transactions_family_user ON transactions(family_id, user_id);
-- CREATE INDEX idx_incomes_category ON incomes(family_id, category_id, date);
