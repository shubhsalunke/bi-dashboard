const { query } = require('../config/db');

const CUSTOMER_STATUS_ORDER = ['active', 'inactive', 'on_hold', 'prospect', 'churned'];

function toIsoDateString(val) {
  if (!val) return null;
  if (val instanceof Date) {
    if (Number.isNaN(val.getTime())) return null;
    return val.toISOString().split('T')[0];
  }
  const str = String(val).trim();
  if (!str) return null;
  return str.slice(0, 10);
}

function formatUtcDate(year, month, day) {
  return new Date(Date.UTC(year, month, day)).toISOString().split('T')[0];
}

function resolveReportDateRange({ startDate = null, endDate = null, preset = '' }) {
  const explicitStart = toIsoDateString(startDate);
  const explicitEnd = toIsoDateString(endDate);
  if (explicitStart || explicitEnd) {
    return { startDate: explicitStart, endDate: explicitEnd };
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  switch (preset) {
    case '7d':
      return { startDate: formatUtcDate(year, month, day - 7), endDate: formatUtcDate(year, month, day) };
    case '30d':
      return { startDate: formatUtcDate(year, month, day - 30), endDate: formatUtcDate(year, month, day) };
    case '90d':
      return { startDate: formatUtcDate(year, month, day - 90), endDate: formatUtcDate(year, month, day) };
    case 'this_month':
      return { startDate: formatUtcDate(year, month, 1), endDate: formatUtcDate(year, month, day) };
    case 'last_month':
      return { startDate: formatUtcDate(year, month - 1, 1), endDate: formatUtcDate(year, month, 0) };
    case 'this_quarter': {
      const qStartMonth = Math.floor(month / 3) * 3;
      return { startDate: formatUtcDate(year, qStartMonth, 1), endDate: formatUtcDate(year, month, day) };
    }
    case 'this_fy': {
      const fyStartYear = month >= 3 ? year : year - 1;
      return { startDate: formatUtcDate(fyStartYear, 3, 1), endDate: formatUtcDate(year, month, day) };
    }
    case 'all':
    default:
      return { startDate: null, endDate: null };
  }
}

function computePreviousDateRange(startDate, endDate) {
  if (!startDate && !endDate) return null;
  const now = new Date();
  const todayStr = formatUtcDate(now.getFullYear(), now.getMonth(), now.getDate());
  const effectiveEnd = endDate || todayStr;
  const effectiveStart = startDate || effectiveEnd;

  const startMs = Date.parse(`${effectiveStart}T00:00:00Z`);
  const endMs = Date.parse(`${effectiveEnd}T00:00:00Z`);
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs < startMs) return null;

  const days = Math.max(1, Math.round((endMs - startMs) / 86400000) + 1);
  const prevEndMs = startMs - 86400000;
  const prevStartMs = prevEndMs - (days - 1) * 86400000;
  return {
    prevStartDate: new Date(prevStartMs).toISOString().split('T')[0],
    prevEndDate: new Date(prevEndMs).toISOString().split('T')[0],
  };
}

function calcPctChange(currentVal, previousVal) {
  const curr = Number(currentVal) || 0;
  const prev = Number(previousVal) || 0;
  if (prev <= 0) return null;
  return Number((((curr - prev) / prev) * 100).toFixed(1));
}

function buildReportWhereClause(filters = {}, { includeDate = true, includeProduct = true } = {}) {
  const conditions = ["s.status = 'completed'"];
  const values = [];

  if (includeDate) {
    if (filters.startDate) {
      values.push(filters.startDate);
      conditions.push(`s.sale_date >= $${values.length}`);
    }
    if (filters.endDate) {
      values.push(filters.endDate);
      conditions.push(`s.sale_date <= $${values.length}`);
    }
  }

  const equalityFilters = [
    ['city', 'c.city'],
    ['industry', 'c.industry'],
    ['customer_type', 'c.customer_type'],
    ['state', 'c.state'],
    ['status', 'c.status'],
  ];

  if (includeProduct) {
    equalityFilters.push(['category', 'p.category'], ['brand', 'p.brand']);
  }

  for (const [param, col] of equalityFilters) {
    if (filters[param] && String(filters[param]).trim() !== '') {
      values.push(String(filters[param]).trim());
      conditions.push(`${col} = $${values.length}`);
    }
  }

  if (filters.customerId) {
    values.push(Number(filters.customerId));
    conditions.push(`s.customer_id = $${values.length}`);
  }

  return {
    whereClause: `WHERE ${conditions.join(' AND ')}`,
    values,
  };
}

function buildCustomerWhereClause(filters = {}) {
  const conditions = [];
  const values = [];

  const customerFilters = [
    ['city', 'c.city'],
    ['industry', 'c.industry'],
    ['customer_type', 'c.customer_type'],
    ['state', 'c.state'],
    ['status', 'c.status'],
  ];

  for (const [param, col] of customerFilters) {
    if (filters[param] && String(filters[param]).trim() !== '') {
      values.push(String(filters[param]).trim());
      conditions.push(`${col} = $${values.length}`);
    }
  }

  if (filters.customerId) {
    values.push(Number(filters.customerId));
    conditions.push(`c.id = $${values.length}`);
  }

  return {
    whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    values,
  };
}

class DashboardService {
  /**
   * Executive Dashboard Summary with filters, period comparisons, charts, and alert tables
   */
  async getDashboardSummary(rawFilters = {}) {
    const {
      city = '',
      category = '',
      brand = '',
      industry = '',
      customer_type = '',
      preset = '',
      granularity = 'monthly',
      recentSalesStatus = '',
      topProductsSort = 'revenue',
      topProductsLimit = 5,
      topCustomersSort = 'spent',
      topCustomersLimit = 5,
    } = rawFilters;

    const { startDate, endDate } = resolveReportDateRange({
      startDate: rawFilters.startDate,
      endDate: rawFilters.endDate,
      preset,
    });

    const normalizedFilters = {
      startDate,
      endDate,
      city,
      category,
      brand,
      industry,
      customer_type,
    };

    const { whereClause, values } = buildReportWhereClause(normalizedFilters);
    const baseJoin = `
      FROM sales s
      JOIN customers c ON s.customer_id = c.id
      JOIN sale_items si ON si.sale_id = s.id
      JOIN products p ON si.product_id = p.id
    `;

    const { whereClause: custWhere, values: custValues } = buildCustomerWhereClause(normalizedFilters);

    // Product filter conditions for inventory KPIs and low-stock alerts
    const prodConditions = ['is_active = true'];
    const prodValues = [];
    if (category && String(category).trim() !== '') {
      prodValues.push(String(category).trim());
      prodConditions.push(`category = $${prodValues.length}`);
    }
    if (brand && String(brand).trim() !== '') {
      prodValues.push(String(brand).trim());
      prodConditions.push(`brand = $${prodValues.length}`);
    }
    const prodWhere = `WHERE ${prodConditions.join(' AND ')}`;

    // New customers in period
    const newCustConditions = custWhere ? [custWhere.replace(/^WHERE\s+/i, '')] : [];
    const newCustValues = [...custValues];
    if (startDate) {
      newCustValues.push(startDate);
      newCustConditions.push(`c.created_at::date >= $${newCustValues.length}`);
    }
    if (endDate) {
      newCustValues.push(endDate);
      newCustConditions.push(`c.created_at::date <= $${newCustValues.length}`);
    }
    const newCustWhere = newCustConditions.length > 0 ? `WHERE ${newCustConditions.join(' AND ')}` : '';

    // 1. Sales KPIs
    const salesKpiSql = `
      SELECT
        COUNT(DISTINCT s.id)::int AS total_sales_count,
        COALESCE(SUM(si.line_total), 0)::numeric(14,2) AS total_revenue,
        COALESCE(ROUND(SUM(si.line_total) / NULLIF(COUNT(DISTINCT s.id), 0), 2), 0)::numeric(14,2) AS average_order_value,
        COALESCE(SUM(si.quantity), 0)::int AS total_units
      ${baseJoin}
      ${whereClause}
    `;

    // 1b. Customer KPIs & status breakdown
    const statusSql = `
      SELECT c.status, COUNT(c.id)::int AS count
      FROM customers c
      ${custWhere}
      GROUP BY c.status
    `;
    const newCustomersSql = `
      SELECT COUNT(c.id)::int AS new_customers
      FROM customers c
      ${newCustWhere}
    `;

    // 1c. Product KPIs & Low Stock Alerts list
    const prodKpiSql = `
      SELECT
        COUNT(id)::int AS active_products,
        COUNT(id) FILTER (WHERE stock_quantity <= reorder_level)::int AS low_stock_products,
        COUNT(id) FILTER (WHERE stock_quantity = 0)::int AS out_of_stock_products
      FROM products
      ${prodWhere}
    `;
    const lowStockAlertsSql = `
      SELECT id, sku, product_name, category, brand, stock_quantity, reorder_level, unit_price
      FROM products
      ${prodWhere} AND stock_quantity <= reorder_level
      ORDER BY stock_quantity ASC, reorder_level DESC, product_name ASC
    `;

    // 2. Monthly & Weekly Sales Trends
    const monthlySql = `
      SELECT 
        TO_CHAR(s.sale_date, 'YYYY-MM') AS month,
        COUNT(DISTINCT s.id)::int AS sales_count,
        ROUND(COALESCE(SUM(si.line_total), 0), 2) AS revenue
      ${baseJoin}
      ${whereClause}
      GROUP BY TO_CHAR(s.sale_date, 'YYYY-MM')
      ORDER BY month ASC
    `;
    const weeklySql = `
      SELECT
        TO_CHAR(DATE_TRUNC('week', s.sale_date), 'YYYY-MM-DD') AS week_start,
        COUNT(DISTINCT s.id)::int AS sales_count,
        ROUND(COALESCE(SUM(si.line_total), 0), 2) AS revenue
      ${baseJoin}
      ${whereClause}
      GROUP BY DATE_TRUNC('week', s.sale_date)
      ORDER BY week_start ASC
    `;

    // 3. Breakdown charts (City, Category, Brand, Customer Type)
    const citySql = `
      SELECT
        c.city,
        COUNT(DISTINCT c.id)::int AS customers_count,
        COUNT(DISTINCT s.id)::int AS orders_count,
        ROUND(COALESCE(SUM(si.line_total), 0), 2) AS revenue
      ${baseJoin}
      ${whereClause}
      GROUP BY c.city
      ORDER BY revenue DESC
    `;
    const categorySql = `
      SELECT
        p.category,
        COALESCE(SUM(si.quantity), 0)::int AS units_sold,
        ROUND(COALESCE(SUM(si.line_total), 0), 2) AS revenue
      ${baseJoin}
      ${whereClause}
      GROUP BY p.category
      ORDER BY revenue DESC
    `;
    const brandSql = `
      SELECT
        COALESCE(NULLIF(TRIM(p.brand), ''), 'Unspecified') AS brand,
        COALESCE(SUM(si.quantity), 0)::int AS units_sold,
        ROUND(COALESCE(SUM(si.line_total), 0), 2) AS total_revenue
      ${baseJoin}
      ${whereClause}
      GROUP BY COALESCE(NULLIF(TRIM(p.brand), ''), 'Unspecified')
      ORDER BY total_revenue DESC
    `;
    const customerTypeSql = `
      SELECT
        COALESCE(NULLIF(TRIM(c.customer_type), ''), 'Unspecified') AS customer_type,
        COUNT(DISTINCT c.id)::int AS customers_count,
        COUNT(DISTINCT s.id)::int AS orders_count,
        ROUND(COALESCE(SUM(si.line_total), 0), 2) AS revenue
      ${baseJoin}
      ${whereClause}
      GROUP BY COALESCE(NULLIF(TRIM(c.customer_type), ''), 'Unspecified')
      ORDER BY revenue DESC
    `;

    // 4. Top Customers & Top Products (configurable sort & limit)
    const safeCustLimit = Number(topCustomersLimit) === 10 ? 10 : 5;
    const custOrderBy =
      topCustomersSort === 'orders'
        ? 'orders_count DESC, total_spent DESC'
        : 'total_spent DESC, orders_count DESC';
    const topCustomersValues = [...values, safeCustLimit];
    const topCustomersSql = `
      SELECT 
        c.id AS customer_id,
        c.customer_name,
        c.customer_code,
        c.city,
        COUNT(DISTINCT s.id)::int AS orders_count,
        ROUND(COALESCE(SUM(si.line_total), 0), 2) AS total_spent
      ${baseJoin}
      ${whereClause}
      GROUP BY c.id, c.customer_name, c.customer_code, c.city
      ORDER BY ${custOrderBy}
      LIMIT $${topCustomersValues.length}
    `;

    const safeProdLimit = Number(topProductsLimit) === 10 ? 10 : 5;
    const prodOrderBy =
      topProductsSort === 'units'
        ? 'units_sold DESC, total_revenue DESC'
        : 'total_revenue DESC, units_sold DESC';
    const topProductsValues = [...values, safeProdLimit];
    const topProductsSql = `
      SELECT 
        p.id AS product_id,
        p.product_name,
        p.category,
        COALESCE(SUM(si.quantity), 0)::int AS units_sold,
        ROUND(COALESCE(SUM(si.line_total), 0), 2) AS total_revenue
      ${baseJoin}
      ${whereClause}
      GROUP BY p.id, p.product_name, p.category
      ORDER BY ${prodOrderBy}
      LIMIT $${topProductsValues.length}
    `;

    // 5. Recent 10 Sales (supports optional status filter + active dashboard filters)
    const recentConditions = [];
    const recentValues = [];
    if (recentSalesStatus && String(recentSalesStatus).trim() !== '') {
      recentValues.push(String(recentSalesStatus).trim());
      recentConditions.push(`s.status = $${recentValues.length}`);
    }
    if (startDate) {
      recentValues.push(startDate);
      recentConditions.push(`s.sale_date >= $${recentValues.length}`);
    }
    if (endDate) {
      recentValues.push(endDate);
      recentConditions.push(`s.sale_date <= $${recentValues.length}`);
    }
    if (city && String(city).trim() !== '') {
      recentValues.push(String(city).trim());
      recentConditions.push(`c.city = $${recentValues.length}`);
    }
    if (industry && String(industry).trim() !== '') {
      recentValues.push(String(industry).trim());
      recentConditions.push(`c.industry = $${recentValues.length}`);
    }
    if (customer_type && String(customer_type).trim() !== '') {
      recentValues.push(String(customer_type).trim());
      recentConditions.push(`c.customer_type = $${recentValues.length}`);
    }
    if (category && String(category).trim() !== '') {
      recentValues.push(String(category).trim());
      recentConditions.push(`p.category = $${recentValues.length}`);
    }
    if (brand && String(brand).trim() !== '') {
      recentValues.push(String(brand).trim());
      recentConditions.push(`p.brand = $${recentValues.length}`);
    }
    const recentWhere = recentConditions.length > 0 ? `WHERE ${recentConditions.join(' AND ')}` : '';
    const recentSalesSql = `
      SELECT DISTINCT
        s.id,
        s.sale_date,
        s.total_amount,
        s.status,
        s.customer_id,
        c.customer_name,
        c.city
      FROM sales s
      JOIN customers c ON s.customer_id = c.id
      LEFT JOIN sale_items si ON si.sale_id = s.id
      LEFT JOIN products p ON si.product_id = p.id
      ${recentWhere}
      ORDER BY s.sale_date DESC, s.id DESC
      LIMIT 10
    `;

    // Filter options metadata
    const filterOptionsSql = `
      SELECT
        (SELECT COALESCE(ARRAY_AGG(DISTINCT city ORDER BY city), ARRAY[]::varchar[]) FROM customers WHERE city IS NOT NULL AND city != '') AS cities,
        (SELECT COALESCE(ARRAY_AGG(DISTINCT category ORDER BY category), ARRAY[]::varchar[]) FROM products WHERE category IS NOT NULL AND category != '') AS categories,
        (SELECT COALESCE(ARRAY_AGG(DISTINCT brand ORDER BY brand), ARRAY[]::varchar[]) FROM products WHERE brand IS NOT NULL AND brand != '') AS brands
    `;

    // Previous period comparison
    const prevRange = computePreviousDateRange(startDate, endDate);
    let prevKpiPromise = Promise.resolve(null);
    if (prevRange) {
      const { whereClause: prevWhere, values: prevValues } = buildReportWhereClause({
        ...normalizedFilters,
        startDate: prevRange.prevStartDate,
        endDate: prevRange.prevEndDate,
      });
      const prevKpiSql = `
        SELECT
          COUNT(DISTINCT s.id)::int AS total_sales_count,
          COALESCE(SUM(si.line_total), 0)::numeric(14,2) AS total_revenue,
          COALESCE(ROUND(SUM(si.line_total) / NULLIF(COUNT(DISTINCT s.id), 0), 2), 0)::numeric(14,2) AS average_order_value
        ${baseJoin}
        ${prevWhere}
      `;
      prevKpiPromise = query(prevKpiSql, prevValues);
    }

    const [
      salesKpiRes,
      statusRes,
      newCustRes,
      prodKpiRes,
      lowStockRes,
      monthlyRes,
      weeklyRes,
      cityRes,
      categoryRes,
      brandRes,
      customerTypeRes,
      topCustomersRes,
      topProductsRes,
      recentSalesRes,
      filterOptionsRes,
      prevKpiRes,
    ] = await Promise.all([
      query(salesKpiSql, values),
      query(statusSql, custValues),
      query(newCustomersSql, newCustValues),
      query(prodKpiSql, prodValues),
      query(lowStockAlertsSql, prodValues),
      query(monthlySql, values),
      query(weeklySql, values),
      query(citySql, values),
      query(categorySql, values),
      query(brandSql, values),
      query(customerTypeSql, values),
      query(topCustomersSql, topCustomersValues),
      query(topProductsSql, topProductsValues),
      query(recentSalesSql, recentValues),
      query(filterOptionsSql),
      prevKpiPromise,
    ]);

    const statusCountMap = new Map(statusRes.rows.map((r) => [r.status, parseInt(r.count, 10) || 0]));
    const customersByStatus = CUSTOMER_STATUS_ORDER.map((st) => ({
      status: st,
      count: statusCountMap.get(st) || 0,
    }));
    const totalCustomers = customersByStatus.reduce((sum, item) => sum + item.count, 0);

    const salesKpi = salesKpiRes.rows[0];
    const prodKpi = prodKpiRes.rows[0];
    const kpi = {
      total_customers: totalCustomers,
      active_customers: statusCountMap.get('active') || 0,
      inactive_customers: statusCountMap.get('inactive') || 0,
      on_hold_customers: statusCountMap.get('on_hold') || 0,
      prospect_customers: statusCountMap.get('prospect') || 0,
      churned_customers: statusCountMap.get('churned') || 0,
      new_customers: newCustRes.rows[0]?.new_customers ?? 0,
      active_products: prodKpi?.active_products ?? 0,
      low_stock_products: prodKpi?.low_stock_products ?? 0,
      out_of_stock_products: prodKpi?.out_of_stock_products ?? 0,
      total_sales_count: salesKpi?.total_sales_count ?? 0,
      total_revenue: salesKpi?.total_revenue ?? 0,
      average_order_value: salesKpi?.average_order_value ?? 0,
      total_units: salesKpi?.total_units ?? 0,
    };

    const prevKpi = prevKpiRes ? prevKpiRes.rows[0] : null;
    const comparison = prevKpi
      ? {
          total_revenue_pct: calcPctChange(kpi.total_revenue, prevKpi.total_revenue),
          total_orders_pct: calcPctChange(kpi.total_sales_count, prevKpi.total_sales_count),
          average_order_value_pct: calcPctChange(kpi.average_order_value, prevKpi.average_order_value),
        }
      : null;

    const byPeriod =
      granularity === 'weekly'
        ? weeklyRes.rows.map((w) => ({
            period: w.week_start,
            sales_count: w.sales_count,
            revenue: w.revenue,
          }))
        : monthlyRes.rows.map((m) => ({
            period: m.month,
            sales_count: m.sales_count,
            revenue: m.revenue,
          }));

    return {
      kpi,
      previousKpi: prevKpi,
      comparison,
      granularity,
      byPeriod,
      customersByStatus,
      monthlySales: monthlyRes.rows,
      weeklySales: weeklyRes.rows,
      byCity: cityRes.rows,
      byCategory: categoryRes.rows,
      byBrand: brandRes.rows,
      byCustomerType: customerTypeRes.rows,
      topCustomers: topCustomersRes.rows,
      topProducts: topProductsRes.rows,
      recentSales: recentSalesRes.rows,
      lowStockProducts: lowStockRes.rows,
      filterOptions: filterOptionsRes.rows[0] || { cities: [], categories: [], brands: [] },
    };
  }

  /**
   * Detailed Sales Reports with multi-dimensional filters, previous-period comparison, and chart datasets
   */
  async getSalesReport(rawFilters = {}) {
    const {
      city = '',
      category = '',
      brand = '',
      industry = '',
      customer_type = '',
      state = '',
      status = '',
      customerId = null,
      preset = '',
      granularity = 'monthly',
    } = rawFilters;

    const { startDate, endDate } = resolveReportDateRange({
      startDate: rawFilters.startDate,
      endDate: rawFilters.endDate,
      preset,
    });

    const normalizedFilters = {
      startDate,
      endDate,
      city,
      category,
      brand,
      industry,
      customer_type,
      state,
      status,
      customerId,
    };

    const { whereClause, values } = buildReportWhereClause(normalizedFilters);

    const baseJoin = `
      FROM sales s
      JOIN customers c ON s.customer_id = c.id
      JOIN sale_items si ON si.sale_id = s.id
      JOIN products p ON si.product_id = p.id
    `;

    // Summary KPIs
    const summarySql = `
      SELECT 
        COUNT(DISTINCT s.id)::int AS total_orders,
        COUNT(DISTINCT c.id)::int AS unique_customers,
        COALESCE(SUM(si.line_total), 0)::numeric(14,2) AS total_revenue,
        COALESCE(ROUND(SUM(si.line_total) / NULLIF(COUNT(DISTINCT s.id), 0), 2), 0)::numeric(14,2) AS average_order_value,
        COALESCE(SUM(si.quantity), 0)::int AS total_units
      ${baseJoin}
      ${whereClause}
    `;

    // Monthly breakdown
    const monthlySql = `
      SELECT 
        TO_CHAR(s.sale_date, 'YYYY-MM') AS month,
        COUNT(DISTINCT s.id)::int AS order_count,
        COALESCE(SUM(si.quantity), 0)::int AS units_sold,
        ROUND(SUM(si.line_total), 2) AS revenue
      ${baseJoin}
      ${whereClause}
      GROUP BY TO_CHAR(s.sale_date, 'YYYY-MM')
      ORDER BY month DESC
    `;

    // Weekly breakdown
    const weeklySql = `
      SELECT
        TO_CHAR(DATE_TRUNC('week', s.sale_date), 'YYYY-MM-DD') AS week_start,
        COUNT(DISTINCT s.id)::int AS order_count,
        COALESCE(SUM(si.quantity), 0)::int AS units_sold,
        ROUND(SUM(si.line_total), 2) AS revenue
      ${baseJoin}
      ${whereClause}
      GROUP BY DATE_TRUNC('week', s.sale_date)
      ORDER BY week_start ASC
    `;

    // City-wise revenue breakdown
    const citySql = `
      SELECT 
        c.city,
        COUNT(DISTINCT c.id)::int AS customers_count,
        COUNT(DISTINCT s.id)::int AS orders_count,
        ROUND(SUM(si.line_total), 2) AS revenue
      ${baseJoin}
      ${whereClause}
      GROUP BY c.city
      ORDER BY revenue DESC
    `;

    // Category breakdown
    const categorySql = `
      SELECT 
        p.category,
        COUNT(DISTINCT si.product_id)::int AS products_count,
        COALESCE(SUM(si.quantity), 0)::int AS units_sold,
        ROUND(SUM(si.line_total), 2) AS category_revenue
      ${baseJoin}
      ${whereClause}
      GROUP BY p.category
      ORDER BY category_revenue DESC
    `;

    // Brand breakdown
    const brandSql = `
      SELECT
        COALESCE(NULLIF(TRIM(p.brand), ''), 'Unspecified') AS brand,
        COALESCE(SUM(si.quantity), 0)::int AS units_sold,
        ROUND(COALESCE(SUM(si.line_total), 0), 2) AS total_revenue
      ${baseJoin}
      ${whereClause}
      GROUP BY COALESCE(NULLIF(TRIM(p.brand), ''), 'Unspecified')
      ORDER BY total_revenue DESC
    `;

    // Industry breakdown
    const industrySql = `
      SELECT
        COALESCE(NULLIF(TRIM(c.industry), ''), 'Unspecified') AS industry,
        COUNT(DISTINCT c.id)::int AS customers_count,
        COUNT(DISTINCT s.id)::int AS orders_count,
        ROUND(COALESCE(SUM(si.line_total), 0), 2) AS revenue
      ${baseJoin}
      ${whereClause}
      GROUP BY COALESCE(NULLIF(TRIM(c.industry), ''), 'Unspecified')
      ORDER BY revenue DESC
    `;

    // Customer Type breakdown
    const customerTypeSql = `
      SELECT
        COALESCE(NULLIF(TRIM(c.customer_type), ''), 'Unspecified') AS customer_type,
        COUNT(DISTINCT c.id)::int AS customers_count,
        COUNT(DISTINCT s.id)::int AS orders_count,
        ROUND(COALESCE(SUM(si.line_total), 0), 2) AS revenue
      ${baseJoin}
      ${whereClause}
      GROUP BY COALESCE(NULLIF(TRIM(c.customer_type), ''), 'Unspecified')
      ORDER BY revenue DESC
    `;

    // State breakdown
    const stateSql = `
      SELECT
        COALESCE(NULLIF(TRIM(c.state), ''), 'Unspecified') AS state,
        COUNT(DISTINCT c.id)::int AS customers_count,
        COUNT(DISTINCT s.id)::int AS orders_count,
        ROUND(COALESCE(SUM(si.line_total), 0), 2) AS revenue
      ${baseJoin}
      ${whereClause}
      GROUP BY COALESCE(NULLIF(TRIM(c.state), ''), 'Unspecified')
      ORDER BY revenue DESC
    `;

    // Top 10 Customers by revenue
    const topCustomersSql = `
      SELECT
        c.id AS customer_id,
        c.customer_code,
        c.customer_name,
        c.city,
        c.industry,
        c.customer_type,
        COUNT(DISTINCT s.id)::int AS orders_count,
        COALESCE(SUM(si.quantity), 0)::int AS units_sold,
        ROUND(COALESCE(SUM(si.line_total), 0), 2) AS total_revenue
      ${baseJoin}
      ${whereClause}
      GROUP BY c.id, c.customer_code, c.customer_name, c.city, c.industry, c.customer_type
      ORDER BY total_revenue DESC, orders_count DESC
      LIMIT 10
    `;

    // New vs Returning Customers per month
    const newVsReturningSql = `
      WITH customer_first_sale AS (
        SELECT customer_id, DATE_TRUNC('month', MIN(sale_date)) AS first_month
        FROM sales
        WHERE status = 'completed'
        GROUP BY customer_id
      ),
      monthly_active AS (
        SELECT DISTINCT
          TO_CHAR(DATE_TRUNC('month', s.sale_date), 'YYYY-MM') AS month,
          DATE_TRUNC('month', s.sale_date) AS month_date,
          s.customer_id,
          cfs.first_month
        ${baseJoin}
        JOIN customer_first_sale cfs ON cfs.customer_id = s.customer_id
        ${whereClause}
      )
      SELECT
        month,
        COUNT(*) FILTER (WHERE month_date = first_month)::int AS new_customers,
        COUNT(*) FILTER (WHERE month_date > first_month)::int AS returning_customers
      FROM monthly_active
      GROUP BY month
      ORDER BY month ASC
    `;

    // Customer count by status (respecting customer-level filters)
    const { whereClause: custWhere, values: custValues } = buildCustomerWhereClause(normalizedFilters);
    const customerStatusSql = `
      SELECT c.status, COUNT(c.id)::int AS count
      FROM customers c
      ${custWhere}
      GROUP BY c.status
    `;

    // Filter options metadata
    const filterOptionsSql = `
      SELECT
        (SELECT COALESCE(ARRAY_AGG(DISTINCT city ORDER BY city), ARRAY[]::varchar[]) FROM customers WHERE city IS NOT NULL AND city != '') AS cities,
        (SELECT COALESCE(ARRAY_AGG(DISTINCT category ORDER BY category), ARRAY[]::varchar[]) FROM products WHERE category IS NOT NULL AND category != '') AS categories,
        (SELECT COALESCE(ARRAY_AGG(DISTINCT brand ORDER BY brand), ARRAY[]::varchar[]) FROM products WHERE brand IS NOT NULL AND brand != '') AS brands
    `;

    const prevRange = computePreviousDateRange(startDate, endDate);
    let prevSummaryPromise = Promise.resolve(null);
    if (prevRange) {
      const { whereClause: prevWhere, values: prevValues } = buildReportWhereClause({
        ...normalizedFilters,
        startDate: prevRange.prevStartDate,
        endDate: prevRange.prevEndDate,
      });
      const prevSummarySql = `
        SELECT 
          COUNT(DISTINCT s.id)::int AS total_orders,
          COUNT(DISTINCT c.id)::int AS unique_customers,
          COALESCE(SUM(si.line_total), 0)::numeric(14,2) AS total_revenue,
          COALESCE(ROUND(SUM(si.line_total) / NULLIF(COUNT(DISTINCT s.id), 0), 2), 0)::numeric(14,2) AS average_order_value,
          COALESCE(SUM(si.quantity), 0)::int AS total_units
        ${baseJoin}
        ${prevWhere}
      `;
      prevSummaryPromise = query(prevSummarySql, prevValues);
    }

    const [
      summaryRes,
      monthlyRes,
      weeklyRes,
      cityRes,
      categoryRes,
      brandRes,
      industryRes,
      customerTypeRes,
      stateRes,
      topCustomersRes,
      newVsReturningRes,
      customerStatusRes,
      filterOptionsRes,
      prevSummaryRes,
    ] = await Promise.all([
      query(summarySql, values),
      query(monthlySql, values),
      query(weeklySql, values),
      query(citySql, values),
      query(categorySql, values),
      query(brandSql, values),
      query(industrySql, values),
      query(customerTypeSql, values),
      query(stateSql, values),
      query(topCustomersSql, values),
      query(newVsReturningSql, values),
      query(customerStatusSql, custValues),
      query(filterOptionsSql),
      prevSummaryPromise,
    ]);

    const statusCountMap = new Map(
      customerStatusRes.rows.map((r) => [r.status, parseInt(r.count, 10) || 0])
    );
    const customersByStatus = CUSTOMER_STATUS_ORDER.map((st) => ({
      status: st,
      count: statusCountMap.get(st) || 0,
    }));

    const summary = {
      ...summaryRes.rows[0],
      top_customer: topCustomersRes.rows[0] || null,
    };

    const previousSummary = prevSummaryRes ? prevSummaryRes.rows[0] : null;
    const comparison = previousSummary
      ? {
          total_orders_pct: calcPctChange(summary.total_orders, previousSummary.total_orders),
          total_revenue_pct: calcPctChange(summary.total_revenue, previousSummary.total_revenue),
          average_order_value_pct: calcPctChange(
            summary.average_order_value,
            previousSummary.average_order_value
          ),
        }
      : null;

    const byPeriod =
      granularity === 'weekly'
        ? weeklyRes.rows.map((w) => ({
            period: w.week_start,
            order_count: w.order_count,
            units_sold: w.units_sold,
            revenue: w.revenue,
          }))
        : [...monthlyRes.rows].reverse().map((m) => ({
            period: m.month,
            order_count: m.order_count,
            units_sold: m.units_sold,
            revenue: m.revenue,
          }));

    return {
      summary,
      previousSummary,
      comparison,
      granularity,
      byPeriod,
      byMonth: monthlyRes.rows,
      byWeek: weeklyRes.rows,
      byCity: cityRes.rows,
      byCategory: categoryRes.rows,
      byBrand: brandRes.rows,
      byIndustry: industryRes.rows,
      byCustomerType: customerTypeRes.rows,
      byState: stateRes.rows,
      topCustomers: topCustomersRes.rows,
      newVsReturningByMonth: newVsReturningRes.rows,
      customersByStatus,
      filterOptions: filterOptionsRes.rows[0] || { cities: [], categories: [], brands: [] },
      appliedFilters: {
        startDate,
        endDate,
        preset: preset || '',
      },
    };
  }

  /**
   * Customer Insights Report: identifies high-value clients and purchasing trend changes
   */
  async getCustomerInsights(rawFilters = {}) {
    const {
      city = '',
      category = '',
      brand = '',
      industry = '',
      customer_type = '',
      state = '',
      status = '',
      customerId = null,
      preset = '',
    } = rawFilters;

    const { startDate, endDate } = resolveReportDateRange({
      startDate: rawFilters.startDate,
      endDate: rawFilters.endDate,
      preset,
    });

    const normalizedFilters = {
      startDate,
      endDate,
      city,
      category,
      brand,
      industry,
      customer_type,
      state,
      status,
      customerId,
    };

    const { whereClause: custWhere, values: custValues } = buildCustomerWhereClause(normalizedFilters);

    const hasProductOrDateFilter = Boolean(startDate || endDate || category || brand);
    const salesConditions = ["s.status = 'completed'"];
    const salesValues = [...custValues];

    if (startDate) {
      salesValues.push(startDate);
      salesConditions.push(`s.sale_date >= $${salesValues.length}`);
    }
    if (endDate) {
      salesValues.push(endDate);
      salesConditions.push(`s.sale_date <= $${salesValues.length}`);
    }
    if (category && String(category).trim() !== '') {
      salesValues.push(String(category).trim());
      salesConditions.push(`p.category = $${salesValues.length}`);
    }
    if (brand && String(brand).trim() !== '') {
      salesValues.push(String(brand).trim());
      salesConditions.push(`p.brand = $${salesValues.length}`);
    }

    const lifetimeWhere = `WHERE ${salesConditions.join(' AND ')}`;

    const sql = `
      WITH filtered_customers AS (
        SELECT c.id, c.customer_code, c.customer_name, c.city, c.state, c.industry, c.customer_type, c.status
        FROM customers c
        ${custWhere}
      ),
      recent_30 AS (
        SELECT s.customer_id, SUM(si.line_total) AS recent_spend, COUNT(DISTINCT s.id) AS recent_orders
        FROM sales s
        JOIN sale_items si ON si.sale_id = s.id
        JOIN products p ON si.product_id = p.id
        ${lifetimeWhere} AND s.sale_date >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY s.customer_id
      ),
      prior_30 AS (
        SELECT s.customer_id, SUM(si.line_total) AS prior_spend, COUNT(DISTINCT s.id) AS prior_orders
        FROM sales s
        JOIN sale_items si ON si.sale_id = s.id
        JOIN products p ON si.product_id = p.id
        ${lifetimeWhere}
          AND s.sale_date >= CURRENT_DATE - INTERVAL '60 days'
          AND s.sale_date < CURRENT_DATE - INTERVAL '30 days'
        GROUP BY s.customer_id
      ),
      lifetime AS (
        SELECT s.customer_id, SUM(si.line_total) AS lifetime_spend, COUNT(DISTINCT s.id) AS lifetime_orders
        FROM sales s
        JOIN sale_items si ON si.sale_id = s.id
        JOIN products p ON si.product_id = p.id
        ${lifetimeWhere}
        GROUP BY s.customer_id
      )
      SELECT 
        c.id AS customer_id,
        c.customer_code,
        c.customer_name,
        c.city,
        c.state,
        c.industry,
        c.customer_type,
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
      FROM filtered_customers c
      ${hasProductOrDateFilter ? 'JOIN' : 'LEFT JOIN'} lifetime l ON c.id = l.customer_id
      LEFT JOIN recent_30 r ON c.id = r.customer_id
      LEFT JOIN prior_30 p ON c.id = p.customer_id
      ORDER BY lifetime_spend DESC
    `;

    const res = await query(sql, salesValues);
    return res.rows;
  }

  /**
   * Get brand sales summary: brand, units_sold, total_revenue (completed sales only, filterable)
   */
  async getBrandSalesReport(rawFilters = {}) {
    const { startDate, endDate } = resolveReportDateRange({
      startDate: rawFilters.startDate,
      endDate: rawFilters.endDate,
      preset: rawFilters.preset || '',
    });

    const { whereClause, values } = buildReportWhereClause({
      ...rawFilters,
      startDate,
      endDate,
    });

    const sql = `
      SELECT 
        p.brand,
        COALESCE(SUM(si.quantity), 0)::int AS units_sold,
        COALESCE(SUM(si.line_total), 0)::numeric(14,2) AS total_revenue
      FROM products p
      JOIN sale_items si ON si.product_id = p.id
      JOIN sales s ON s.id = si.sale_id
      JOIN customers c ON s.customer_id = c.id
      ${whereClause} AND p.brand IS NOT NULL AND p.brand != ''
      GROUP BY p.brand
      ORDER BY total_revenue DESC;
    `;

    const res = await query(sql, values);
    return res.rows.map((row) => ({
      brand: row.brand,
      units_sold: parseInt(row.units_sold, 10),
      total_revenue: parseFloat(row.total_revenue),
    }));
  }
}

module.exports = new DashboardService();
