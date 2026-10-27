-- Migration: 004_ai_readonly.sql
-- Description: Create restricted views and dedicated ai_readonly database role for dynamic AI queries

-- 1. Create Restricted Views
CREATE OR REPLACE VIEW ai_customers AS
SELECT customer_code, customer_name, city, status, created_at
FROM customers;

CREATE OR REPLACE VIEW ai_products AS
SELECT id, product_name, category, unit_price, is_active
FROM products;

CREATE OR REPLACE VIEW ai_sales AS
SELECT id, customer_id, sale_date, total_amount, status
FROM sales;

CREATE OR REPLACE VIEW ai_sale_items AS
SELECT id, sale_id, product_id, quantity, unit_price, line_total
FROM sale_items;

-- 2. Create role ai_readonly if it does not already exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'ai_readonly') THEN
    CREATE ROLE ai_readonly WITH LOGIN PASSWORD 'ai_readonly_password';
  ELSE
    ALTER ROLE ai_readonly WITH LOGIN PASSWORD 'ai_readonly_password';
  END IF;
END
$$;

-- 3. Configure strict permissions for ai_readonly
-- Revoke all permissions on public schema objects
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM ai_readonly;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM ai_readonly;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM ai_readonly;

-- Explicitly revoke access to sensitive and primary tables
REVOKE ALL ON users FROM ai_readonly;
REVOKE ALL ON audit_logs FROM ai_readonly;
REVOKE ALL ON customers FROM ai_readonly;
REVOKE ALL ON products FROM ai_readonly;
REVOKE ALL ON sales FROM ai_readonly;
REVOKE ALL ON sale_items FROM ai_readonly;
REVOKE ALL ON schema_migrations FROM ai_readonly;

-- Grant USAGE on schema public
GRANT USAGE ON SCHEMA public TO ai_readonly;

-- Grant SELECT ONLY on the four AI views
GRANT SELECT ON ai_customers TO ai_readonly;
GRANT SELECT ON ai_products TO ai_readonly;
GRANT SELECT ON ai_sales TO ai_readonly;
GRANT SELECT ON ai_sale_items TO ai_readonly;

-- Enforce statement timeout at role level as secondary defense
ALTER ROLE ai_readonly SET statement_timeout = '5000ms';
