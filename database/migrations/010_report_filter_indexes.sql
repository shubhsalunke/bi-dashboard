-- Migration: 010_report_filter_indexes.sql
-- Description: Add indexes on customers(state) and products(brand) to accelerate filtered reporting queries

CREATE INDEX IF NOT EXISTS idx_customers_state ON customers(state);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);

