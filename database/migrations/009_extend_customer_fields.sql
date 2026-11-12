-- Migration: 009_extend_customer_fields.sql
-- Description: Add nullable extended profile columns to customers, expand customer status CHECK constraint,
--              add filter indexes, and refresh ai_customers read-only view.

-- 1. Add nullable extended customer columns (non-breaking)
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS industry VARCHAR(100),
  ADD COLUMN IF NOT EXISTS customer_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS contact_person VARCHAR(150),
  ADD COLUMN IF NOT EXISTS state VARCHAR(100),
  ADD COLUMN IF NOT EXISTS gst_number VARCHAR(15),
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Drop any existing CHECK constraint on customers.status and apply expanded status constraint
DO $$
DECLARE
  constraint_rec RECORD;
BEGIN
  FOR constraint_rec IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE c.conrelid = 'customers'::regclass
      AND c.contype = 'c'
      AND a.attname = 'status'
  LOOP
    EXECUTE format('ALTER TABLE customers DROP CONSTRAINT IF EXISTS %I', constraint_rec.conname);
  END LOOP;
END $$;

ALTER TABLE customers
  ADD CONSTRAINT customers_status_check
  CHECK (status IN ('active', 'inactive', 'on_hold', 'prospect', 'churned'));

-- 3. Add nullable CHECK constraints for industry and customer_type
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_industry_check;
ALTER TABLE customers
  ADD CONSTRAINT customers_industry_check
  CHECK (
    industry IS NULL OR
    industry IN ('IT Services', 'Finance', 'Healthcare', 'Retail', 'Manufacturing', 'Education', 'Other')
  );

ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_customer_type_check;
ALTER TABLE customers
  ADD CONSTRAINT customers_customer_type_check
  CHECK (
    customer_type IS NULL OR
    customer_type IN ('Enterprise', 'SMB', 'Startup', 'Individual')
  );

-- 4. Add filter indexes
CREATE INDEX IF NOT EXISTS idx_customers_industry ON customers(industry);
CREATE INDEX IF NOT EXISTS idx_customers_customer_type ON customers(customer_type);

-- 5. Recreate ai_customers view with safe analytical fields (still excluding email, phone, contact_person, gst_number, address, notes)
DROP VIEW IF EXISTS ai_customers CASCADE;
CREATE VIEW ai_customers AS
SELECT
  id,
  customer_code,
  customer_name,
  city,
  state,
  industry,
  customer_type,
  status,
  created_at
FROM customers;

GRANT SELECT ON ai_customers TO ai_readonly;

