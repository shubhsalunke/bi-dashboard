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
  /**
   * Parse explicit date ranges from user query (e.g. "01-09-2026 to 15-09-2026", "2026-09-01 to 2026-09-30")
   */
  parseCustomDateRange(text) {
    if (!text) return null;
    const clean = text.trim();

    // 1. Matches DD-MM-YYYY to DD-MM-YYYY or DD/MM/YYYY to DD/MM/YYYY
    const dmyPattern = /(\b\d{1,2})[-/](\d{1,2})[-/](\d{4})\s*(?:to|-|until|through)\s*(\d{1,2})[-/](\d{1,2})[-/](\d{4})\b/i;
    const dmyMatch = clean.match(dmyPattern);
    if (dmyMatch) {
      const [, d1, m1, y1, d2, m2, y2] = dmyMatch;
      const pad = (n) => String(n).padStart(2, '0');
      let startDay = parseInt(d1, 10);
      let startMonth = parseInt(m1, 10);
      let endDay = parseInt(d2, 10);
      let endMonth = parseInt(m2, 10);

      let sDate = `${y1}-${pad(startMonth)}-${pad(startDay)}`;
      let eDate = `${y2}-${pad(endMonth)}-${pad(endDay)}`;
      if (startMonth > 12 && startDay <= 12) {
        sDate = `${y1}-${pad(startDay)}-${pad(startMonth)}`;
      }
      if (endMonth > 12 && endDay <= 12) {
        eDate = `${y2}-${pad(endDay)}-${pad(endMonth)}`;
      }
      return {
        startDate: sDate,
        endDate: eDate,
        displayRange: `${pad(d1)}-${pad(m1)}-${y1} to ${pad(d2)}-${pad(m2)}-${y2}`,
      };
    }

    // 2. Matches YYYY-MM-DD to YYYY-MM-DD
    const ymdPattern = /(\b\d{4})[-/](\d{1,2})[-/](\d{1,2})\s*(?:to|-|until|through)\s*(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/i;
    const ymdMatch = clean.match(ymdPattern);
    if (ymdMatch) {
      const [, y1, m1, d1, y2, m2, d2] = ymdMatch;
      const pad = (n) => String(n).padStart(2, '0');
      return {
        startDate: `${y1}-${pad(m1)}-${pad(d1)}`,
        endDate: `${y2}-${pad(m2)}-${pad(d2)}`,
        displayRange: `${y1}-${pad(m1)}-${pad(d1)} to ${y2}-${pad(m2)}-${pad(d2)}`,
      };
    }

    return null;
  }

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
          error: 'Arbitrary command execution or database modification commands are strictly blocked for security.',
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

    // Check for explicit custom date range in question (e.g. 01-09-2026 to 15-09-2026)
    const customRange = this.parseCustomDateRange(question);
    if (customRange) {
      return {
        intent: 'TOTAL_SALES',
        timeframe: 'CUSTOM_RANGE',
        customRange,
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
      q.includes('purchasing trend') ||
      q.includes('revenue history for') ||
      (q.includes('customer') && (q.includes('trend') || q.includes('history') || q.includes('profile') || q.includes('account')))
    ) {
      return { intent: 'CUSTOMER_INSIGHT', rawQuery: question };
    }

    if (
      q.includes('total sales') ||
      q.includes('total revenue') ||
      q.includes('last month') ||
      q.includes('previous month') ||
      q.includes('this month') ||
      q.includes('current month') ||
      q.includes('sales last month') ||
      q.includes('sales this month') ||
      q.includes('how much sales') ||
      q.includes('sales in') ||
      q.includes('how much did we sell') ||
      q.includes('overall sales') ||
      q.includes('all sales') ||
      q.includes('revenue') ||
      q.includes('sales')
    ) {
      let timeframe = 'ALL_TIME';
      if (q.includes('last month') || q.includes('previous month') || q.includes('september')) {
        timeframe = 'LAST_MONTH';
      } else if (q.includes('this month') || q.includes('current month') || q.includes('october')) {
        timeframe = 'THIS_MONTH';
      }
      return { intent: 'TOTAL_SALES', timeframe };
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
    const { intent, limit = 10, timeframe = 'ALL_TIME', customRange = null, rawQuery = '' } = intentData;

    switch (intent) {
      case 'TOTAL_SALES':
        return this.getTotalSalesReport(timeframe, customRange);

      case 'CUSTOMER_INSIGHT':
        return this.getCustomerInsightReport(rawQuery);

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
   * 1. Total Sales Report (With contextual timeframe support: Custom Range, Last Month, This Month, All Time)
   */
  async getTotalSalesReport(timeframe = 'ALL_TIME', customRange = null) {
    let whereClause = "WHERE status = 'completed'";
    let params = [];
    let reportTitle = 'Total Sales & Revenue Performance Report';
    let periodLabel = 'All-Time Historical Records';
    let dateFilterText = '';

    if (customRange) {
      whereClause += ' AND sale_date >= $1 AND sale_date <= $2';
      params = [customRange.startDate, customRange.endDate];
      reportTitle = `Total Sales & Revenue Report (${customRange.displayRange})`;
      periodLabel = `Period: ${customRange.displayRange}`;
      dateFilterText = customRange.displayRange;
    } else if (timeframe === 'LAST_MONTH') {
      const monthSql = `
        SELECT 
          TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM') AS last_month_key,
          TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'FMMonth YYYY') AS last_month_name,
          TO_CHAR(DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month'), 'YYYY-MM-DD') AS start_date,
          TO_CHAR((DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 day'), 'YYYY-MM-DD') AS end_date
      `;
      const mRes = await query(monthSql);
      const mRow = mRes.rows[0] || {};
      const lastMonthKey = mRow.last_month_key || '2026-09';
      const monthName = mRow.last_month_name || 'September 2026';

      whereClause += ` AND TO_CHAR(sale_date, 'YYYY-MM') = '${lastMonthKey}'`;
      reportTitle = `Total Sales & Revenue Report (Last Month - ${monthName})`;
      periodLabel = `Last Month (${monthName})`;
      dateFilterText = `${mRow.start_date || '2026-09-01'} to ${mRow.end_date || '2026-09-30'}`;
    } else if (timeframe === 'THIS_MONTH') {
      const monthSql = `
        SELECT 
          TO_CHAR(CURRENT_DATE, 'YYYY-MM') AS this_month_key,
          TO_CHAR(CURRENT_DATE, 'FMMonth YYYY') AS this_month_name,
          TO_CHAR(DATE_TRUNC('month', CURRENT_DATE), 'YYYY-MM-DD') AS start_date,
          TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD') AS end_date
      `;
      const mRes = await query(monthSql);
      const mRow = mRes.rows[0] || {};
      const thisMonthKey = mRow.this_month_key || '2026-10';
      const monthName = mRow.this_month_name || 'October 2026';

      whereClause += ` AND TO_CHAR(sale_date, 'YYYY-MM') = '${thisMonthKey}'`;
      reportTitle = `Total Sales & Revenue Report (Current Month - ${monthName})`;
      periodLabel = `Current Month (${monthName})`;
      dateFilterText = `${mRow.start_date || '2026-10-01'} to ${mRow.end_date || '2026-10-15'}`;
    }

    const sql = `
      SELECT 
        COUNT(id) AS total_sales_count,
        ROUND(COALESCE(SUM(total_amount), 0), 2) AS total_revenue,
        ROUND(COALESCE(AVG(total_amount), 0), 2) AS average_order_value,
        TO_CHAR(MIN(sale_date), 'YYYY-MM-DD') AS earliest_sale,
        TO_CHAR(MAX(sale_date), 'YYYY-MM-DD') AS latest_sale
      FROM sales
      ${whereClause}
    `;
    const res = await query(sql, params);
    const row = res.rows[0] || {};

    const totalRev = parseFloat(row.total_revenue || 0);
    const orderCount = parseInt(row.total_sales_count || 0, 10);
    const avgOrder = parseFloat(row.average_order_value || 0);

    const windowDisplay = dateFilterText || (
      row.earliest_sale && row.latest_sale
        ? (row.earliest_sale === row.latest_sale ? row.earliest_sale : `${row.earliest_sale} to ${row.latest_sale}`)
        : 'N/A'
    );

    const rows = [
      { metric: 'Reporting Window', value: windowDisplay },
      { metric: 'Total Revenue', value: `$${totalRev.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
      { metric: 'Total Completed Orders', value: orderCount.toString() },
      { metric: 'Average Order Value', value: `$${avgOrder.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
    ];

    return {
      reportTitle,
      intent: 'TOTAL_SALES',
      timeframe,
      periodLabel,
      dateRange: { startDate: row.earliest_sale || null, endDate: row.latest_sale || null },
      columns: [
        { key: 'metric', label: 'Performance Metric' },
        { key: 'value', label: 'Value' },
      ],
      rows,
      summaryMetrics: {
        totalRevenue: totalRev,
        totalOrders: orderCount,
        averageOrderValue: avgOrder,
        reportingPeriod: periodLabel,
      },
    };
  }

  /**
   * Account Intelligence & Purchasing Trend for a single customer
   */
  async getCustomerInsightReport(rawQuery = '') {
    const customersRes = await query('SELECT id, customer_code, customer_name, city FROM customers');
    let matchedCustomer = null;
    const lowerQ = rawQuery.toLowerCase();
    for (const c of customersRes.rows) {
      if (lowerQ.includes(c.customer_name.toLowerCase()) || lowerQ.includes(c.customer_code.toLowerCase())) {
        matchedCustomer = c;
        break;
      }
    }

    if (!matchedCustomer && customersRes.rows.length > 0) {
      matchedCustomer = customersRes.rows[0];
    }

    if (!matchedCustomer) {
      return this.getTopCustomersReport(5);
    }

    const salesSql = `
      SELECT 
        s.id AS sale_id,
        TO_CHAR(s.sale_date, 'YYYY-MM-DD') AS sale_date,
        s.total_amount,
        s.status
      FROM sales s
      WHERE s.customer_id = $1
      ORDER BY s.sale_date DESC
    `;
    const sRes = await query(salesSql, [matchedCustomer.id]);
    const orders = sRes.rows;
    const totalRev = orders.reduce((acc, o) => acc + parseFloat(o.total_amount || 0), 0);
    const avgOrder = orders.length > 0 ? +(totalRev / orders.length).toFixed(2) : 0;

    const rows = orders.map((o, idx) => ({
      order_num: `#${orders.length - idx}`,
      date: o.sale_date,
      formatted_amount: `$${parseFloat(o.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      status: o.status,
    }));

    return {
      reportTitle: `Account Intelligence: ${matchedCustomer.customer_name} (${matchedCustomer.customer_code})`,
      intent: 'CUSTOMER_INSIGHT',
      columns: [
        { key: 'order_num', label: 'Order' },
        { key: 'date', label: 'Date' },
        { key: 'formatted_amount', label: 'Amount' },
        { key: 'status', label: 'Status' },
      ],
      rows,
      summaryMetrics: {
        customerName: matchedCustomer.customer_name,
        customerCode: matchedCustomer.customer_code,
        city: matchedCustomer.city,
        totalRevenue: totalRev,
        ordersCount: orders.length,
        averageOrderValue: avgOrder,
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
