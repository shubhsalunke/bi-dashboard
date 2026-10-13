-- ==============================================================================
-- Query Performance Analysis & Optimization with EXPLAIN ANALYZE
-- Database: business_intelligence
-- ==============================================================================

-- 1. Optimized Customer lookup by code (Demonstrates Index Scan on idx_customers_code)
EXPLAIN ANALYZE
SELECT id, customer_code, customer_name, email, city, status
FROM customers
WHERE customer_code = 'CUST-005';

-- 2. Optimized Sales range lookup with status (Demonstrates Index Scan on idx_sales_date_status)
EXPLAIN ANALYZE
SELECT id, customer_id, sale_date, total_amount, status
FROM sales
WHERE sale_date >= CURRENT_DATE - INTERVAL '90 days'
  AND status = 'completed'
ORDER BY sale_date DESC;

-- 3. Optimized Top Customer Sales Aggregation (Demonstrates HashJoin + Index usage)
EXPLAIN ANALYZE
SELECT 
    c.customer_name,
    c.city,
    COUNT(s.id) AS orders_count,
    SUM(s.total_amount) AS revenue
FROM customers c
JOIN sales s ON c.id = s.customer_id
WHERE s.status = 'completed'
GROUP BY c.customer_name, c.city
ORDER BY revenue DESC
LIMIT 10;

-- 4. Optimized Top Products Revenue (Demonstrates nested Index Scans on sale_items.sale_id and sale_items.product_id)
EXPLAIN ANALYZE
SELECT 
    p.product_name,
    p.category,
    SUM(si.quantity) AS units_sold,
    SUM(si.line_total) AS revenue
FROM products p
JOIN sale_items si ON p.id = si.product_id
JOIN sales s ON si.sale_id = s.id
WHERE s.status = 'completed'
GROUP BY p.product_name, p.category
ORDER BY revenue DESC
LIMIT 5;
