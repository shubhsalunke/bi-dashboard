-- Migration: 006_product_brand_supplier.sql
-- Description: Add brand, supplier, unit, gst_percent, reorder_level, warranty_months to products and update ai_products view

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS brand VARCHAR(100),
  ADD COLUMN IF NOT EXISTS supplier VARCHAR(150),
  ADD COLUMN IF NOT EXISTS unit VARCHAR(30) NOT NULL DEFAULT 'per unit',
  ADD COLUMN IF NOT EXISTS gst_percent NUMERIC(5,2) NOT NULL DEFAULT 18 CHECK (gst_percent >= 0 AND gst_percent <= 28),
  ADD COLUMN IF NOT EXISTS reorder_level INT NOT NULL DEFAULT 10 CHECK (reorder_level >= 0),
  ADD COLUMN IF NOT EXISTS warranty_months INT CHECK (warranty_months >= 0);

-- Recreate ai_products view to include brand, unit, and reorder_level (excluding cost_price and supplier)
DROP VIEW IF EXISTS ai_products CASCADE;

CREATE VIEW ai_products AS
SELECT id, sku, product_name, category, brand, unit_price, unit, stock_quantity, reorder_level, is_active
FROM products;

GRANT SELECT ON ai_products TO ai_readonly;
