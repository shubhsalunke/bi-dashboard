-- Migration: 011_dashboard_stock_index.sql
-- Description: Add composite index on products(is_active, stock_quantity) for low-stock and out-of-stock dashboard queries

CREATE INDEX IF NOT EXISTS idx_products_active_stock ON products(is_active, stock_quantity);

