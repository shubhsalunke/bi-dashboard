-- ==============================================================================
-- Core Business Intelligence Reporting SQL Queries
-- Database: business_intelligence
-- ==============================================================================

-- 1. Monthly Sales & Revenue Trend
SELECT 
    TO_CHAR(sale_date, 'YYYY-MM') AS month_year,
    COUNT(id) AS total_orders,
    SUM(total_amount) AS monthly_revenue,
    ROUND(AVG(total_amount), 2) AS average_order_value
FROM sales
WHERE status = 'completed'
GROUP BY TO_CHAR(sale_date, 'YYYY-MM')
ORDER BY month_year DESC;

-- 2. Top 10 Customers by Total Sales Revenue
SELECT 
    c.id AS customer_id,
    c.customer_code,
    c.customer_name,
    c.city,
    COUNT(s.id) AS total_orders,
    SUM(s.total_amount) AS total_spent
FROM customers c
JOIN sales s ON c.id = s.customer_id
WHERE s.status = 'completed'
GROUP BY c.id, c.customer_code, c.customer_name, c.city
ORDER BY total_spent DESC
LIMIT 10;

-- 3. Top Products by Total Revenue Generated
SELECT 
    p.id AS product_id,
    p.product_name,
    p.category,
    SUM(si.quantity) AS total_units_sold,
    SUM(si.line_total) AS total_revenue
FROM products p
JOIN sale_items si ON p.id = si.product_id
JOIN sales s ON si.sale_id = s.id
WHERE s.status = 'completed'
GROUP BY p.id, p.product_name, p.category
ORDER BY total_revenue DESC
LIMIT 10;

-- 4. City-wise Revenue Distribution
SELECT 
    c.city,
    COUNT(DISTINCT c.id) AS active_customers,
    COUNT(s.id) AS total_orders,
    SUM(s.total_amount) AS city_revenue
FROM customers c
JOIN sales s ON c.id = s.customer_id
WHERE s.status = 'completed'
GROUP BY c.city
ORDER BY city_revenue DESC;

-- 5. Customer Purchasing Trends (Comparing Recent 30 Days vs Prior 30-60 Days)
WITH recent_30 AS (
    SELECT customer_id, SUM(total_amount) AS recent_spend
    FROM sales
    WHERE status = 'completed' AND sale_date >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY customer_id
),
prior_30 AS (
    SELECT customer_id, SUM(total_amount) AS prior_spend
    FROM sales
    WHERE status = 'completed' 
      AND sale_date >= CURRENT_DATE - INTERVAL '60 days' 
      AND sale_date < CURRENT_DATE - INTERVAL '30 days'
    GROUP BY customer_id
)
SELECT 
    c.id AS customer_id,
    c.customer_name,
    c.city,
    COALESCE(p.prior_spend, 0) AS prior_30d_spend,
    COALESCE(r.recent_spend, 0) AS recent_30d_spend,
    ROUND(COALESCE(r.recent_spend, 0) - COALESCE(p.prior_spend, 0), 2) AS spend_change,
    CASE 
        WHEN COALESCE(p.prior_spend, 0) > 0 AND COALESCE(r.recent_spend, 0) < COALESCE(p.prior_spend, 0) THEN 'Decreased'
        WHEN COALESCE(r.recent_spend, 0) > COALESCE(p.prior_spend, 0) THEN 'Growing'
        ELSE 'Stable'
    END AS purchase_trend
FROM customers c
LEFT JOIN recent_30 r ON c.id = r.customer_id
LEFT JOIN prior_30 p ON c.id = p.customer_id
WHERE c.status = 'active'
ORDER BY spend_change ASC;
