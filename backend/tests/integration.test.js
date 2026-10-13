import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app';

describe('End-to-End Live Integration Verification', () => {
  let token;

  it('1. POST /api/auth/login authenticates and yields bearer token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@bi.corp', password: 'Admin123!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('admin');
    token = res.body.data.accessToken;
  });

  it('2. GET /api/customers retrieves paginated customer directory', async () => {
    const res = await request(app)
      .get('/api/customers?limit=3')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(3);
    expect(res.body.pagination.total).toBeGreaterThanOrEqual(30);
  });

  it('3. POST /api/sales creates atomic sale with server-computed line totals', async () => {
    // Products 2 ($650) and 3 ($220) are guaranteed active
    const res = await request(app)
      .post('/api/sales')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customer_id: 3,
        items: [
          { product_id: 2, quantity: 2 }, // $650 * 2 = $1300
          { product_id: 3, quantity: 1 }, // $220 * 1 = $220
        ],
      });

    expect(res.status).toBe(201);
    expect(parseFloat(res.body.data.total_amount)).toBe(1520.00);
  });

  it('4. GET /api/dashboard/summary calculates accurate KPIs and analytics', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(parseFloat(res.body.data.kpi.total_revenue)).toBeGreaterThan(0);
    expect(parseInt(res.body.data.kpi.total_sales_count, 10)).toBeGreaterThan(0);
  });

  it('5. GET /api/reports/sales provides geographic and category distributions', async () => {
    const res = await request(app)
      .get('/api/reports/sales')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.byCity.length).toBeGreaterThan(0);
    expect(res.body.data.byCategory.length).toBeGreaterThan(0);
  });

  it('6. GET /api/docs.json serves valid OpenAPI 3.0 specification', async () => {
    const res = await request(app).get('/api/docs.json');

    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.0');
    expect(res.body.info.title).toContain('Business Intelligence');
    expect(res.body.paths).toHaveProperty('/api/auth/login');
    expect(res.body.paths).toHaveProperty('/api/customers');
    expect(res.body.paths).toHaveProperty('/api/sales');
    expect(res.body.paths).toHaveProperty('/api/dashboard/summary');
  });
});
