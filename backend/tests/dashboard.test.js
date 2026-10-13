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
    expect(parseFloat(data.kpi.total_revenue)).toBeGreaterThan(0);
    expect(parseInt(data.kpi.total_sales_count, 10)).toBeGreaterThan(0);

    // Monthly sales chart
    expect(data.monthlySales).toBeInstanceOf(Array);
    expect(data.monthlySales.length).toBeGreaterThan(0);
    expect(data.monthlySales[0]).toHaveProperty('month');
    expect(data.monthlySales[0]).toHaveProperty('revenue');

    // Top customers
    expect(data.topCustomers).toBeInstanceOf(Array);
    expect(data.topCustomers.length).toBeLessThanOrEqual(5);

    // Top products
    expect(data.topProducts).toBeInstanceOf(Array);
    expect(data.topProducts.length).toBeLessThanOrEqual(5);

    // Recent sales
    expect(data.recentSales).toBeInstanceOf(Array);
    expect(data.recentSales.length).toBeLessThanOrEqual(5);
  });

  it('should return sales report with monthly, city, and category breakdowns', async () => {
    const res = await request(app)
      .get('/api/reports/sales')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('summary');
    expect(res.body.data).toHaveProperty('byMonth');
    expect(res.body.data).toHaveProperty('byCity');
    expect(res.body.data).toHaveProperty('byCategory');
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
