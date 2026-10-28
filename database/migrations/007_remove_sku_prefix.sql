-- Migration: 007_remove_sku_prefix.sql
-- Description: Remove 'SKU-' prefix from existing product codes

UPDATE products
SET sku = REPLACE(sku, 'SKU-', '')
WHERE sku LIKE 'SKU-%';

