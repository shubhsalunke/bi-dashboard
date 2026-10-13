const { query } = require('../config/db');

/**
 * Controlled Reporting Service for AI Assistant
 * - Enforces parameterized SQL queries only
 * - Disallows arbitrary or raw dynamic SQL from LLM
 * - Returns structured columns, rows, and summary metrics
 */
class AiReportingService {
  /**
   * Determine approved reporting operation from user natural language query
   */
  classifyIntent(question) {
    const q = question.toLowerCase().trim();

    // 1. Security Check: Block arbitrary SQL keywords or injection payloads
    const injectionPatterns = [
      /\b(drop|delete|insert|update|alter|truncate|grant|revoke|create|replace)\b/i,
      /\b(union\s+select|information_schema|pg_catalog|pg_tables|pg_user)\b/i,
      /(--|\/\*|\*\/|;)/,
    ];
    for (const pattern of injectionPatterns) {
      if (pattern.test(q)) {
        return {
          intent: 'SECURITY_BLOCKED',
          error: 'Arbitrary SQL execution or database modification commands are strictly blocked for security.',
        };
      }
    }

    // 2. Greetings & Assistance
    if (
      q === 'hi' ||
      q === 'hello' ||
      q === 'hey' ||
      q === 'help' ||
      q.startsWith('hi ') ||
      q.startsWith('hello ') ||
      q.startsWith('hey ')
    ) {
      return {
        intent: 'GREETING',
        suggestions: [
          'What were total sales last month?',
          'Show the top 10 customers by sales.',
          'Which product generated the highest revenue?',
          'Compare this month with the previous month.',
          'Give me city-wise sales for the last three months.',
        ],
      };
    }

    // 3. Identify Approved Business Reporting Operations
    if (
      q.includes('declining') ||
      q.includes('reduced') ||
      q.includes('decrease') ||
      q.includes('churn') ||
      q.includes('at-risk') ||
      (q.includes('customer') && q.includes('drop'))
    ) {
      return { intent: 'DECLINING_CUSTOMERS' };
    }

    if (
      q.includes('top customer') ||
      q.includes('best customer') ||
      q.includes('highest spending customer') ||
      q.includes('highest revenue customer') ||
      (q.includes('top') && q.includes('customer'))
    ) {
      // Check if user specified a count like "top 5" or "top 10"
      const match = q.match(/top\s+(\d+)/);
      const limit = match ? Math.min(parseInt(match[1], 10), 25) : 10;
      return { intent: 'TOP_CUSTOMERS', limit };
    }

    if (
      q.includes('top product') ||
      q.includes('highest revenue product') ||
      q.includes('best selling product') ||
      q.includes('best product') ||
      (q.includes('product') && q.includes('revenue')) ||
      (q.includes('which product') && q.includes('highest'))
    ) {
      const match = q.match(/top\s+(\d+)/);
      const limit = match ? Math.min(parseInt(match[1], 10), 20) : 5;
      return { intent: 'TOP_PRODUCTS', limit };
    }

    if (
      q.includes('compare') ||
      q.includes('month over month') ||
      q.includes('mom') ||
      (q.includes('previous month') && q.includes('this month')) ||
      (q.includes('last month') && q.includes('this month'))
    ) {
      return { intent: 'MOM_COMPARISON' };
    }

    if (
      q.includes('city') ||
      q.includes('city-wise') ||
      q.includes('by city') ||
      q.includes('regional') ||
      q.includes('geographic')
    ) {
      return { intent: 'CITY_SALES' };
    }

    if (
      q.includes('quarter') ||
      q.includes('quarterly') ||
      q.includes('performance summary') ||
      q.includes('business summary') ||
      q.includes('overview')
    ) {
      return { intent: 'QUARTERLY_SUMMARY' };
    }

    if (
      q.includes('total sales') ||
      q.includes('total revenue') ||
      q.includes('last month') ||
      q.includes('sales last month') ||
      q.includes('how much sales') ||
      q.includes('sales in')
    ) {
      return { intent: 'TOTAL_SALES' };
    }

    // Default to unsupported
    return {
      intent: 'UNSUPPORTED',
      suggestions: [
        'What were total sales last month?',
        'Show the top 10 customers by sales.',
        'Which product generated the highest revenue?',
        'Compare this month with the previous month.',
        'Give me city-wise sales for the last three months.',
        'Summarize business performance for the current quarter.',
        'Which customers have reduced their purchases?',
      ],
    };
  }

  /**
   * Execute authorized parameterized query for the identified intent
   */
  async executeReportingOperation(intentData) {
    const { intent, limit = 10 } = intentData;

    switch (intent) {
      case 'TOTAL_SALES':
        return this.getTotalSalesReport();

      case 'TOP_CUSTOMERS':
        return this.getTopCustomersReport(limit);

      case 'TOP_PRODUCTS':
        return this.getTopProductsReport(limit);

      case 'MOM_COMPARISON':
        return this.getMonthOverMonthComparison();

      case 'CITY_SALES':
        return this.getCityWiseSalesReport();

      case 'QUARTERLY_SUMMARY':
        return this.getQuarterlySummaryReport();

      case 'DECLINING_CUSTOMERS':
        return this.getDecliningCustomersReport();

      default:
        return null;
    }
  }

  /**
   * 1. Total Sales Report (Last Month / Recent Period)
   */
  async getTotalSalesReport() {
    const sql = `
      SELECT 
        COUNT(id) AS total_sales_count,
        ROUND(COALESCE(SUM(total_amount), 0), 2) AS total_revenue,
        ROUND(COALESCE(AVG(total_amount), 0), 2) AS average_order_value,
        MIN(sale_date) AS earliest_sale,
        MAX(sale_date) AS latest_sale
      FROM sales
      WHERE status = 'completed'
    `;
    const res = await query(sql);
    const row = res.rows[0];

    const rows = [
      { metric: 'Total Revenue', value: `$${parseFloat(row.total_revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
      { metric: 'Total Completed Orders', value: parseInt(row.total_sales_count || 0, 10).toString() },
      { metric: 'Average Order Value', value: `$${parseFloat(row.average_order_value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
      { metric: 'Reporting Window', value: `${row.earliest_sale || 'N/A'} to ${row.latest_sale || 'N/A'}` },
    ];

    return {
      reportTitle: 'Total Sales & Revenue Performance Report',
      intent: 'TOTAL_SALES',
      dateRange: { startDate: row.earliest_sale, endDate: row.latest_sale },
      columns: [
        { key: 'metric', label: 'Performance Metric' },
        { key: 'value', label: 'Value' },
      ],
      rows,
      summaryMetrics: {
        totalRevenue: parseFloat(row.total_revenue || 0),
        totalOrders: parseInt(row.total_sales_count || 0, 10),
        averageOrderValue: parseFloat(row.average_order_value || 0),
      },
    };
  }

  /**
   * 2. Top Customers by Sales Revenue
   */
  async getTopCustomersReport(limit = 10) {
    const sql = `
      SELECT 
        c.id AS customer_id,
        c.customer_name,
        c.customer_code,
        c.city,
        COUNT(s.id) AS orders_count,
        ROUND(COALESCE(SUM(s.total_amount), 0), 2) AS total_revenue
      FROM customers c
      JOIN sales s ON c.id = s.customer_id
      WHERE s.status = 'completed'
      GROUP BY c.id, c.customer_name, c.customer_code, c.city
      ORDER BY total_revenue DESC
      LIMIT $1
    `;
    const res = await query(sql, [limit]);

    const rows = res.rows.map((row, index) => ({
      rank: index + 1,
      customer_name: row.customer_name,
      customer_code: row.customer_code,
      location: row.city,
      orders_count: parseInt(row.orders_count, 10),
      total_revenue: parseFloat(row.total_revenue),
      formatted_revenue: `$${parseFloat(row.total_revenue).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    }));

    const totalRevenueTop = rows.reduce((acc, r) => acc + r.total_revenue, 0);

    return {
      reportTitle: `Top ${rows.length} Customers by Sales Revenue`,
      intent: 'TOP_CUSTOMERS',
      columns: [
        { key: 'rank', label: '#' },
        { key: 'customer_name', label: 'Customer Name' },
        { key: 'customer_code', label: 'Code' },
        { key: 'location', label: 'City' },
        { key: 'orders_count', label: 'Orders' },
        { key: 'formatted_revenue', label: 'Total Revenue' },
      ],
      rows,
      summaryMetrics: {
        customerCount: rows.length,
        combinedTopRevenue: totalRevenueTop,
        topCustomerName: rows[0]?.customer_name || 'N/A',
        topCustomerRevenue: rows[0]?.total_revenue || 0,
      },
    };
  }

  /**
   * 3. Top Products by Revenue
   */
  async getTopProductsReport(limit = 5) {
    const sql = `
      SELECT 
        p.id AS product_id,
        p.product_name,
        p.category,
        p.unit_price,
        COALESCE(SUM(si.quantity), 0) AS units_sold,
        ROUND(COALESCE(SUM(si.line_total), 0), 2) AS total_revenue
      FROM products p
      JOIN sale_items si ON p.id = si.product_id
      JOIN sales s ON si.sale_id = s.id
      WHERE s.status = 'completed'
      GROUP BY p.id, p.product_name, p.category, p.unit_price
      ORDER BY total_revenue DESC
      LIMIT $1
    `;
    const res = await query(sql, [limit]);

    const rows = res.rows.map((row, idx) => ({
      rank: idx + 1,
      product_name: row.product_name,
      category: row.category,
      units_sold: parseInt(row.units_sold, 10),
      total_revenue: parseFloat(row.total_revenue),
      formatted_revenue: `$${parseFloat(row.total_revenue).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    }));

    return {
      reportTitle: `Top Revenue Generating Products`,
      intent: 'TOP_PRODUCTS',
      columns: [
        { key: 'rank', label: '#' },
        { key: 'product_name', label: 'Product' },
        { key: 'category', label: 'Category' },
        { key: 'units_sold', label: 'Units Sold' },
        { key: 'formatted_revenue', label: 'Total Revenue' },
      ],
      rows,
      summaryMetrics: {
        productCount: rows.length,
        leadingProduct: rows[0]?.product_name || 'N/A',
        leadingProductRevenue: rows[0]?.total_revenue || 0,
      },
    };
  }

  /**
   * 4. Month-Over-Month Comparison
   */
  async getMonthOverMonthComparison() {
    const sql = `
      SELECT 
        TO_CHAR(sale_date, 'YYYY-MM') AS month_key,
        COUNT(id) AS sales_count,
        ROUND(COALESCE(SUM(total_amount), 0), 2) AS total_revenue,
        ROUND(COALESCE(AVG(total_amount), 0), 2) AS avg_order_value
      FROM sales
      WHERE status = 'completed'
      GROUP BY TO_CHAR(sale_date, 'YYYY-MM')
      ORDER BY month_key DESC
      LIMIT 2
    `;
    const res = await query(sql);
    const sorted = [...res.rows].reverse(); // Older month first, newer second

    const prevMonth = sorted[0] || { month_key: 'Previous', sales_count: 0, total_revenue: 0, avg_order_value: 0 };
    const currMonth = sorted[1] || sorted[0] || { month_key: 'Current', sales_count: 0, total_revenue: 0, avg_order_value: 0 };

    const prevRev = parseFloat(prevMonth.total_revenue || 0);
    const currRev = parseFloat(currMonth.total_revenue || 0);
    const revDiff = currRev - prevRev;
    const growthPercent = prevRev > 0 ? ((revDiff / prevRev) * 100).toFixed(1) : 0;

    const rows = sorted.map((m) => ({
      period: m.month_key,
      orders: parseInt(m.sales_count, 10),
      revenue: `$${parseFloat(m.total_revenue).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      avg_order: `$${parseFloat(m.avg_order_value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    }));

    return {
      reportTitle: `Month-over-Month Sales Comparison`,
      intent: 'MOM_COMPARISON',
      columns: [
        { key: 'period', label: 'Billing Period' },
        { key: 'orders', label: 'Orders' },
        { key: 'revenue', label: 'Revenue' },
        { key: 'avg_order', label: 'Avg Order Value' },
      ],
      rows,
      summaryMetrics: {
        previousMonth: prevMonth.month_key,
        currentMonth: currMonth.month_key,
        previousRevenue: prevRev,
        currentRevenue: currRev,
        revenueDifference: revDiff,
        growthPercentage: `${growthPercent >= 0 ? '+' : ''}${growthPercent}%`,
      },
    };
  }

  /**
   * 5. City-Wise Sales Report
   */
  async getCityWiseSalesReport() {
    const sql = `
      SELECT 
        c.city,
        COUNT(s.id) AS orders_count,
        ROUND(COALESCE(SUM(s.total_amount), 0), 2) AS total_revenue,
        ROUND(COALESCE(AVG(s.total_amount), 0), 2) AS avg_order_value
      FROM customers c
      JOIN sales s ON c.id = s.customer_id
      WHERE s.status = 'completed'
      GROUP BY c.city
      ORDER BY total_revenue DESC
      LIMIT 10
    `;
    const res = await query(sql);

    const rows = res.rows.map((r) => ({
      city: r.city,
      orders_count: parseInt(r.orders_count, 10),
      total_revenue: parseFloat(r.total_revenue),
      formatted_revenue: `$${parseFloat(r.total_revenue).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      formatted_avg: `$${parseFloat(r.avg_order_value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    }));

    return {
      reportTitle: 'City-Wise Sales & Geographic Performance',
      intent: 'CITY_SALES',
      columns: [
        { key: 'city', label: 'City' },
        { key: 'orders_count', label: 'Orders' },
        { key: 'formatted_revenue', label: 'Total Revenue' },
        { key: 'formatted_avg', label: 'Avg Order' },
      ],
      rows,
      summaryMetrics: {
        topCity: rows[0]?.city || 'N/A',
        topCityRevenue: rows[0]?.total_revenue || 0,
        citiesCount: rows.length,
      },
    };
  }


  /**
   * 6. Quarterly Summary Report
   */
  async getQuarterlySummaryReport() {
    const sql = `
      SELECT 
        COUNT(DISTINCT s.id) AS total_orders,
        ROUND(COALESCE(SUM(s.total_amount), 0), 2) AS total_revenue,
        ROUND(COALESCE(AVG(s.total_amount), 0), 2) AS avg_order_value,
        COUNT(DISTINCT s.customer_id) AS active_customers,
        (
          SELECT p.product_name 
          FROM sale_items si 
          JOIN products p ON si.product_id = p.id 
          JOIN sales s2 ON si.sale_id = s2.id 
          WHERE s2.status = 'completed' 
          GROUP BY p.product_name 
          ORDER BY SUM(si.line_total) DESC 
          LIMIT 1
        ) AS top_product,
        (
          SELECT c.city 
          FROM sales s3 
          JOIN customers c ON s3.customer_id = c.id 
          WHERE s3.status = 'completed' 
          GROUP BY c.city 
          ORDER BY SUM(s3.total_amount) DESC 
          LIMIT 1
        ) AS top_city
      FROM sales s
      WHERE s.status = 'completed'
    `;
    const res = await query(sql);
    const r = res.rows[0];

    const rows = [
      { metric: 'Total Revenue', value: `$${parseFloat(r.total_revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
      { metric: 'Total Order Volume', value: parseInt(r.total_orders || 0, 10).toString() },
      { metric: 'Active Customer Accounts', value: parseInt(r.active_customers || 0, 10).toString() },
      { metric: 'Average Order Size', value: `$${parseFloat(r.avg_order_value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
      { metric: 'Flagship Product', value: r.top_product || 'N/A' },
      { metric: 'Highest Grossing City', value: r.top_city || 'N/A' },
    ];

    return {
      reportTitle: 'Executive Business Quarterly Summary',
      intent: 'QUARTERLY_SUMMARY',
      columns: [
        { key: 'metric', label: 'Executive KPI' },
        { key: 'value', label: 'Metric Value' },
      ],
      rows,
      summaryMetrics: {
        totalRevenue: parseFloat(r.total_revenue || 0),
        totalOrders: parseInt(r.total_orders || 0, 10),
        topProduct: r.top_product,
        topCity: r.top_city,
      },
    };
  }

  /**
   * 7. Declining & At-Risk Customer Report
   */
  async getDecliningCustomersReport() {
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
        COALESCE(l.lifetime_spend, 0) AS lifetime_spend,
        COALESCE(p.prior_spend, 0) AS prior_spend,
        COALESCE(r.recent_spend, 0) AS recent_spend,
        ROUND(COALESCE(r.recent_spend, 0) - COALESCE(p.prior_spend, 0), 2) AS spend_drop
      FROM customers c
      JOIN lifetime l ON c.id = l.customer_id
      JOIN prior_30 p ON c.id = p.customer_id
      LEFT JOIN recent_30 r ON c.id = r.customer_id
      WHERE (COALESCE(r.recent_spend, 0) < COALESCE(p.prior_spend, 0))
      ORDER BY spend_drop ASC
      LIMIT 10
    `;
    const res = await query(sql);

    const rows = res.rows.map((c) => ({
      customer_name: c.customer_name,
      customer_code: c.customer_code,
      city: c.city,
      prior_30d: `$${parseFloat(c.prior_spend).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      recent_30d: `$${parseFloat(c.recent_spend).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      spend_drop: `-$${Math.abs(parseFloat(c.spend_drop)).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      status: 'At Risk',
    }));

    return {
      reportTitle: 'Declining & Churn-Risk Customer Accounts',
      intent: 'DECLINING_CUSTOMERS',
      columns: [
        { key: 'customer_name', label: 'Customer' },
        { key: 'customer_code', label: 'Code' },
        { key: 'city', label: 'City' },
        { key: 'prior_30d', label: 'Prior 30d Spend' },
        { key: 'recent_30d', label: 'Recent 30d Spend' },
        { key: 'spend_drop', label: 'Drop Amount' },
        { key: 'status', label: 'Risk Status' },
      ],
      rows,
      summaryMetrics: {
        decliningCount: rows.length,
        mostImpactedCustomer: rows[0]?.customer_name || 'None identified',
      },
    };
  }
}

module.exports = new AiReportingService();
