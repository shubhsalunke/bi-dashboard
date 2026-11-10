-- Migration: 008_extend_ai_views.sql
-- Description: Extend ai_* read-only views with safe analytical columns, preserve PII/sensitive exclusions,
--              and enforce statement_timeout and connection limit on ai_readonly role.

-- 1. Recreate ai_customers (adds id for safe joins; excludes email, phone)
DROP VIEW IF EXISTS ai_customers CASCADE;
CREATE VIEW ai_customers AS
SELECT
  id,
  customer_code,
  customer_name,
  city,
  status,
  created_at
FROM customers;

-- 2. Recreate ai_products (adds gst_percent, warranty_months, description, created_at; excludes cost_price, supplier)
DROP VIEW IF EXISTS ai_products CASCADE;
CREATE VIEW ai_products AS
SELECT
  id,
  sku,
  product_name,
  category,
  brand,
  unit_price,
  unit,
  stock_quantity,
  reorder_level,
  gst_percent,
  warranty_months,
  description,
  is_active,
  created_at
FROM products;

-- 3. Recreate ai_sales (adds created_at; excludes created_by)
DROP VIEW IF EXISTS ai_sales CASCADE;
CREATE VIEW ai_sales AS
SELECT
  id,
  customer_id,
  sale_date,
  total_amount,
  status,
  created_at
FROM sales;

-- 4. Recreate ai_sale_items (adds created_at)
DROP VIEW IF EXISTS ai_sale_items CASCADE;
CREATE VIEW ai_sale_items AS
SELECT
  id,
  sale_id,
  product_id,
  quantity,
  unit_price,
  line_total,
  created_at
FROM sale_items;

-- 5. Re-enforce least-privilege permissions for ai_readonly
REVOKE ALL ON users FROM ai_readonly;
REVOKE ALL ON audit_logs FROM ai_readonly;
REVOKE ALL ON customers FROM ai_readonly;
REVOKE ALL ON products FROM ai_readonly;
REVOKE ALL ON sales FROM ai_readonly;
REVOKE ALL ON sale_items FROM ai_readonly;
REVOKE ALL ON schema_migrations FROM ai_readonly;

GRANT USAGE ON SCHEMA public TO ai_readonly;
GRANT SELECT ON ai_customers TO ai_readonly;
GRANT SELECT ON ai_products TO ai_readonly;
GRANT SELECT ON ai_sales TO ai_readonly;
GRANT SELECT ON ai_sale_items TO ai_readonly;

-- 6. Enforce timeout and connection cap on ai_readonly role
ALTER ROLE ai_readonly SET statement_timeout = '5s';
ALTER ROLE ai_readonly WITH CONNECTION LIMIT 15;

