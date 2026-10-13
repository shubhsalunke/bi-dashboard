const { query } = require('../config/db');

class DashboardService {
  /**
   * Executive Dashboard Summary with KPI cards and charts data
   */
  async getDashboardSummary({ startDate = null, endDate = null }) {
    const conditions = ["s.status = 'completed'"];
    const values = [];

    if (startDate) {
      values.push(startDate);
      conditions.push(`s.sale_date >= $${values.length}`);
    }
    if (endDate) {
      values.push(endDate);
      conditions.push(`s.sale_date <= $${values.length}`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // 1. KPI Cards Summary
    const kpiSql = `
      SELECT
        (SELECT COUNT(id) FROM customers) AS total_customers,
        (SELECT COUNT(id) FROM customers WHERE status = 'active') AS active_customers,
        (SELECT COUNT(id) FROM products WHERE is_active = true) AS active_products,
        COALESCE(COUNT(s.id), 0) AS total_sales_count,
        COALESCE(SUM(s.total_amount), 0) AS total_revenue,
        COALESCE(ROUND(AVG(s.total_amount), 2), 0) AS average_order_value
      FROM sales s
      ${whereClause}
    `;
    const kpiRes = await query(kpiSql, values);

    // 2. Monthly Sales Chart (Last 6 Months)
    const monthlySql = `
      SELECT 
        TO_CHAR(s.sale_date, 'YYYY-MM') AS month,
        COUNT(s.id) AS sales_count,
        ROUND(COALESCE(SUM(s.total_amount), 0), 2) AS revenue
      FROM sales s
      ${whereClause}
      GROUP BY TO_CHAR(s.sale_date, 'YYYY-MM')
      ORDER BY month ASC
    `;
    const monthlyRes = await query(monthlySql, values);

    // 3. Top 5 Customers by Sales Revenue
    const topCustomersSql = `
      SELECT 
        c.id AS customer_id,
        c.customer_name,
        c.customer_code,
        c.city,
        COUNT(s.id) AS orders_count,
        ROUND(COALESCE(SUM(s.total_amount), 0), 2) AS total_spent
      FROM customers c
      JOIN sales s ON c.id = s.customer_id
      ${whereClause}
      GROUP BY c.id, c.customer_name, c.customer_code, c.city
      ORDER BY total_spent DESC
      LIMIT 5
    `;
    const topCustomersRes = await query(topCustomersSql, values);

    // 4. Top 5 Best-Selling Products
    const topProductsSql = `
      SELECT 
        p.id AS product_id,
        p.product_name,
        p.category,
        COALESCE(SUM(si.quantity), 0) AS units_sold,
        ROUND(COALESCE(SUM(si.line_total), 0), 2) AS total_revenue
      FROM products p
      JOIN sale_items si ON p.id = si.product_id
      JOIN sales s ON si.sale_id = s.id
      ${whereClause}
      GROUP BY p.id, p.product_name, p.category
      ORDER BY total_revenue DESC
      LIMIT 5
    `;
    const topProductsRes = await query(topProductsSql, values);

    // 5. Recent 5 Completed Sales
    const recentSalesSql = `
      SELECT 
        s.id,
        s.sale_date,
        s.total_amount,
        s.status,
        c.customer_name,
        c.city
      FROM sales s
      JOIN customers c ON s.customer_id = c.id
      ORDER BY s.sale_date DESC, s.id DESC
      LIMIT 5
    `;
    const recentSalesRes = await query(recentSalesSql, []);

    return {
      kpi: kpiRes.rows[0],
      monthlySales: monthlyRes.rows,
      topCustomers: topCustomersRes.rows,
      topProducts: topProductsRes.rows,
      recentSales: recentSalesRes.rows,
    };
  }

  /**
   * Detailed Sales Reports with breakdowns by Month, Category, and City
   */
  async getSalesReport({ startDate = null, endDate = null, city = '', category = '', customerId = null }) {
    const conditions = ["s.status = 'completed'"];
    const values = [];

    if (startDate) {
      values.push(startDate);
      conditions.push(`s.sale_date >= $${values.length}`);
    }
    if (endDate) {
      values.push(endDate);
      conditions.push(`s.sale_date <= $${values.length}`);
    }
    if (city && city.trim() !== '') {
      values.push(city.trim());
      conditions.push(`c.city = $${values.length}`);
    }
    if (customerId) {
      values.push(customerId);
      conditions.push(`s.customer_id = $${values.length}`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Monthly breakdown
    const monthlySql = `
      SELECT 
        TO_CHAR(s.sale_date, 'YYYY-MM') AS month,
        COUNT(DISTINCT s.id) AS order_count,
        ROUND(SUM(s.total_amount), 2) AS revenue
      FROM sales s
      JOIN customers c ON s.customer_id = c.id
      ${whereClause}
      GROUP BY TO_CHAR(s.sale_date, 'YYYY-MM')
      ORDER BY month DESC
    `;
    const monthlyRes = await query(monthlySql, values);

    // City-wise revenue breakdown
    const citySql = `
      SELECT 
        c.city,
        COUNT(DISTINCT c.id) AS customers_count,
        COUNT(s.id) AS orders_count,
        ROUND(SUM(s.total_amount), 2) AS revenue
      FROM customers c
      JOIN sales s ON c.id = s.customer_id
      ${whereClause}
      GROUP BY c.city
      ORDER BY revenue DESC
    `;
    const cityRes = await query(citySql, values);

    // Category breakdown
    const categoryConditions = [...conditions];
    const categoryValues = [...values];
    if (category && category.trim() !== '') {
      categoryValues.push(category.trim());
      categoryConditions.push(`p.category = $${categoryValues.length}`);
    }

    const categorySql = `
      SELECT 
        p.category,
        COUNT(DISTINCT si.product_id) AS products_count,
        SUM(si.quantity) AS units_sold,
        ROUND(SUM(si.line_total), 2) AS category_revenue
      FROM products p
      JOIN sale_items si ON p.id = si.product_id
      JOIN sales s ON si.sale_id = s.id
      JOIN customers c ON s.customer_id = c.id
      WHERE ${categoryConditions.join(' AND ')}
      GROUP BY p.category
      ORDER BY category_revenue DESC
    `;
    const categoryRes = await query(categorySql, categoryValues);

    // Grand totals summary
    const summarySql = `
      SELECT 
        COUNT(DISTINCT s.id) AS total_orders,
        COUNT(DISTINCT c.id) AS unique_customers,
        COALESCE(SUM(s.total_amount), 0) AS total_revenue,
        COALESCE(ROUND(AVG(s.total_amount), 2), 0) AS average_order_value
      FROM sales s
      JOIN customers c ON s.customer_id = c.id
      ${whereClause}
    `;
    const summaryRes = await query(summarySql, values);

    return {
      summary: summaryRes.rows[0],
      byMonth: monthlyRes.rows,
      byCity: cityRes.rows,
      byCategory: categoryRes.rows,
    };
  }

  /**
   * Customer Insights Report: identifies high-value clients and purchasing trend changes
   */
  async getCustomerInsights() {
    const sql = `
      WITH recent_30 AS (
        SELECT customer_id, SUM(total_amount) AS recent_spend, COUNT(id) AS recent_orders
        FROM sales
        WHERE status = 'completed' AND sale_date >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY customer_id
      ),
      prior_30 AS (
        SELECT customer_id, SUM(total_amount) AS prior_spend, COUNT(id) AS prior_orders
        FROM sales
        WHERE status = 'completed' 
          AND sale_date >= CURRENT_DATE - INTERVAL '60 days' 
          AND sale_date < CURRENT_DATE - INTERVAL '30 days'
        GROUP BY customer_id
      ),
      lifetime AS (
        SELECT customer_id, SUM(total_amount) AS lifetime_spend, COUNT(id) AS lifetime_orders
        FROM sales
        WHERE status = 'completed'
        GROUP BY customer_id
      )
      SELECT 
        c.id AS customer_id,
        c.customer_code,
        c.customer_name,
        c.city,
        c.status,
        COALESCE(l.lifetime_spend, 0) AS lifetime_spend,
        COALESCE(l.lifetime_orders, 0) AS lifetime_orders,
        COALESCE(p.prior_spend, 0) AS prior_30d_spend,
        COALESCE(r.recent_spend, 0) AS recent_30d_spend,
        ROUND(COALESCE(r.recent_spend, 0) - COALESCE(p.prior_spend, 0), 2) AS spend_change,
        CASE 
          WHEN COALESCE(p.prior_spend, 0) > 0 AND COALESCE(r.recent_spend, 0) < COALESCE(p.prior_spend, 0) THEN 'Decreased'
          WHEN COALESCE(r.recent_spend, 0) > COALESCE(p.prior_spend, 0) THEN 'Growing'
          ELSE 'Stable'
        END AS purchase_trend,
        CASE 
          WHEN COALESCE(l.lifetime_spend, 0) >= 15000 THEN 'Tier 1 (High Value)'
          WHEN COALESCE(l.lifetime_spend, 0) >= 5000 THEN 'Tier 2 (Mid-Market)'
          ELSE 'Tier 3 (Standard)'
        END AS value_tier
      FROM customers c
      LEFT JOIN lifetime l ON c.id = l.customer_id
      LEFT JOIN recent_30 r ON c.id = r.customer_id
      LEFT JOIN prior_30 p ON c.id = p.customer_id
      ORDER BY lifetime_spend DESC
    `;

    const res = await query(sql);
    return res.rows;
  }
}

module.exports = new DashboardService();
