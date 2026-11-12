import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';

describe('Dashboard & Reporting Endpoints (/api/dashboard & /api/reports)', () => {
  let analystToken;

  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'analyst@bi.corp', password: 'Analyst123!' });
    analystToken = loginRes.body.data.accessToken;
  });

  it('should return executive dashboard summary with KPIs and chart datasets', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const data = res.body.data;
    // KPI metrics
    expect(data).toHaveProperty('kpi');
    expect(parseInt(data.kpi.total_customers, 10)).toBeGreaterThan(0);
    expect(parseInt(data.kpi.active_customers, 10)).toBeGreaterThan(0);
    expect(data.kpi).toHaveProperty('inactive_customers');
    expect(data.kpi).toHaveProperty('on_hold_customers');
    expect(data.kpi).toHaveProperty('prospect_customers');
    expect(data.kpi).toHaveProperty('churned_customers');
    expect(data.kpi).toHaveProperty('new_customers');
    expect(data.kpi).toHaveProperty('out_of_stock_products');
    expect(data.kpi).toHaveProperty('total_units');
    expect(parseFloat(data.kpi.total_revenue)).toBeGreaterThan(0);
    expect(parseInt(data.kpi.total_sales_count, 10)).toBeGreaterThan(0);

    // Customer status breakdown
    expect(data.customersByStatus).toBeInstanceOf(Array);
    expect(data.customersByStatus.map((item) => item.status)).toEqual([
      'active',
      'inactive',
      'on_hold',
      'prospect',
      'churned',
    ]);

    // Monthly & weekly sales + breakdowns
    expect(data.monthlySales).toBeInstanceOf(Array);
    expect(data.monthlySales.length).toBeGreaterThan(0);
    expect(data.monthlySales[0]).toHaveProperty('month');
    expect(data.monthlySales[0]).toHaveProperty('revenue');
    expect(data.weeklySales).toBeInstanceOf(Array);
    expect(data.byCity).toBeInstanceOf(Array);
    expect(data.byCategory).toBeInstanceOf(Array);
    expect(data.byBrand).toBeInstanceOf(Array);
    expect(data.byCustomerType).toBeInstanceOf(Array);
    expect(data.lowStockProducts).toBeInstanceOf(Array);
    expect(data.filterOptions).toHaveProperty('cities');

    // Top customers
    expect(data.topCustomers).toBeInstanceOf(Array);
    expect(data.topCustomers.length).toBeLessThanOrEqual(5);

    // Top products
    expect(data.topProducts).toBeInstanceOf(Array);
    expect(data.topProducts.length).toBeLessThanOrEqual(5);

    // Recent sales (up to 10)
    expect(data.recentSales).toBeInstanceOf(Array);
    expect(data.recentSales.length).toBeLessThanOrEqual(10);
  });

  it('should filter dashboard summary by preset, city, category, brand, customer_type, industry, and table controls', async () => {
    const res = await request(app)
      .get(
        '/api/dashboard/summary?preset=this_fy&city=Pune&industry=Finance&customer_type=Large%20Business&granularity=weekly&topProductsSort=units&topProductsLimit=10&topCustomersSort=orders&topCustomersLimit=10&recentSalesStatus=completed'
      )
      .set('Authorization', `Bearer ${analystToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.granularity).toBe('weekly');
    expect(res.body.data.comparison).toHaveProperty('total_revenue_pct');
    expect(res.body.data.comparison).toHaveProperty('total_orders_pct');
    expect(res.body.data.comparison).toHaveProperty('average_order_value_pct');
    expect(res.body.data.byCity.every((c) => c.city === 'Pune')).toBe(true);
    expect(res.body.data.recentSales.every((s) => s.status === 'completed')).toBe(true);
  });

  it('should reject invalid dashboard summary query params with 400', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary?preset=bad_preset&industry=Crypto&customer_type=VIP&topProductsLimit=99&recentSalesStatus=unknown')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(res.status).toBe(400);
    const msg = res.body.error.details.map((d) => d.message).join(' | ');
    expect(msg).toContain('preset must be one of');
    expect(msg).toContain('industry must be one of');
    expect(msg).toContain('customer_type must be one of');
    expect(msg).toContain('topProductsLimit must be 5 or 10');
    expect(msg).toContain('recentSalesStatus must be one of');
  });

  it('should return sales report with extended KPIs, breakdowns, weekly data, and customer trends', async () => {
    const res = await request(app)
      .get('/api/reports/sales')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const data = res.body.data;
    expect(data).toHaveProperty('summary');
    expect(data.summary).toHaveProperty('total_units');
    expect(data.summary).toHaveProperty('top_customer');
    expect(data).toHaveProperty('byMonth');
    expect(data).toHaveProperty('byWeek');
    expect(data).toHaveProperty('byCity');
    expect(data).toHaveProperty('byCategory');
    expect(data).toHaveProperty('byBrand');
    expect(data).toHaveProperty('byIndustry');
    expect(data).toHaveProperty('byCustomerType');
    expect(data).toHaveProperty('byState');
    expect(data).toHaveProperty('topCustomers');
    expect(data).toHaveProperty('newVsReturningByMonth');
    expect(data).toHaveProperty('customersByStatus');
    expect(data).toHaveProperty('filterOptions');
  });

  it('should filter reports by category, brand, industry, customer_type, state, status, preset, and granularity', async () => {
    const res = await request(app)
      .get(
        '/api/reports/sales?industry=Finance&customer_type=Large%20Business&state=Maharashtra&status=active&preset=this_fy&granularity=weekly'
      )
      .set('Authorization', `Bearer ${analystToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.granularity).toBe('weekly');
    expect(res.body.data.comparison).toHaveProperty('total_revenue_pct');
    expect(res.body.data.comparison).toHaveProperty('total_orders_pct');
    expect(res.body.data.comparison).toHaveProperty('average_order_value_pct');
    expect(res.body.data.byIndustry.every((r) => r.industry === 'Finance')).toBe(true);

    const brandRes = await request(app)
      .get('/api/reports/brand-sales?category=Cloud%20Infrastructure&industry=IT%20Services')
      .set('Authorization', `Bearer ${analystToken}`);
    expect(brandRes.status).toBe(200);
    expect(Array.isArray(brandRes.body.data)).toBe(true);

    const insightsFilteredRes = await request(app)
      .get('/api/reports/customer-insights?industry=Finance&state=Maharashtra')
      .set('Authorization', `Bearer ${analystToken}`);
    expect(insightsFilteredRes.status).toBe(200);
    expect(Array.isArray(insightsFilteredRes.body.data)).toBe(true);
    expect(insightsFilteredRes.body.data.every((c) => c.industry === 'Finance')).toBe(true);
  });

  it('should reject invalid report query parameters with 400 and clear error messages', async () => {
    const badRes = await request(app)
      .get('/api/reports/sales?preset=invalid&industry=Crypto&customer_type=NGO&state=Wakanda&status=archived&granularity=yearly')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(badRes.status).toBe(400);
    const msg = badRes.body.error.details.map((d) => d.message).join(' | ');
    expect(msg).toContain('preset must be one of');
    expect(msg).toContain('industry must be one of');
    expect(msg).toContain('customer_type must be one of');
    expect(msg).toContain('state must be a valid Indian state');
    expect(msg).toContain('status must be one of');
    expect(msg).toContain('granularity must be one of');

    const badDateOrderRes = await request(app)
      .get('/api/reports/sales?startDate=2026-10-15&endDate=2026-10-01')
      .set('Authorization', `Bearer ${analystToken}`);
    expect(badDateOrderRes.status).toBe(400);
    expect(badDateOrderRes.body.error.details[0].message).toContain('startDate must not be after endDate');
  });

  it('should return customer insights with purchasing trends and tiers', async () => {
    const res = await request(app)
      .get('/api/reports/customer-insights')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('value_tier');
    expect(res.body.data[0]).toHaveProperty('purchase_trend');
  });
});
