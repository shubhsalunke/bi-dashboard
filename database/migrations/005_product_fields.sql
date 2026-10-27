-- Migration: 005_product_fields.sql
-- Description: Add sku, cost_price, stock_quantity, description to products table, and update ai_products view

-- 1. Add new columns
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS sku VARCHAR(30),
  ADD COLUMN IF NOT EXISTS cost_price NUMERIC(12,2) CHECK (cost_price >= 0),
  ADD COLUMN IF NOT EXISTS stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. Populate sku for existing rows before adding unique constraint
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn
  FROM products
  WHERE sku IS NULL OR sku = ''
)
UPDATE products p
SET sku = 'PRD-' || LPAD(numbered.rn::text, 3, '0')
FROM numbered
WHERE p.id = numbered.id;

-- 3. Enforce NOT NULL and UNIQUE on sku
ALTER TABLE products ALTER COLUMN sku SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_sku_key'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_sku_key UNIQUE (sku);
  END IF;
END $$;

-- 4. Update ai_products view to include sku and stock_quantity (not cost_price)
DROP VIEW IF EXISTS ai_products CASCADE;

CREATE VIEW ai_products AS
SELECT id, sku, product_name, category, unit_price, stock_quantity, is_active
FROM products;

-- 5. Restore permissions for ai_readonly
GRANT SELECT ON ai_products TO ai_readonly;
