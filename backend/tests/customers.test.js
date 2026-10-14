import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { query } from '../src/config/db';

describe('Customer API Endpoints (/api/customers)', () => {
  let adminToken;
  let managerToken;
  let analystToken;

  beforeAll(async () => {
    // Obtain tokens for all roles
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@bi.corp', password: 'Admin123!' });
    adminToken = adminLogin.body.data.accessToken;

    const managerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'manager@bi.corp', password: 'Manager123!' });
    managerToken = managerLogin.body.data.accessToken;

    const analystLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'analyst@bi.corp', password: 'Analyst123!' });
    analystToken = analystLogin.body.data.accessToken;
  });

  it('should reject unauthenticated request to /api/customers with 401', async () => {
    const res = await request(app).get('/api/customers');
    expect(res.status).toBe(401);
  });

  it('should list customers with server-side pagination for analyst', async () => {
    const res = await request(app)
      .get('/api/customers?page=1&limit=5')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBe(5);
    expect(res.body.pagination).toHaveProperty('total');
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(5);
  });

  it('should filter customers by city', async () => {
    const res = await request(app)
      .get('/api/customers?city=New York')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.every((c) => c.city === 'New York')).toBe(true);
  });

  it('should search customers by name substring', async () => {
    const res = await request(app)
      .get('/api/customers?search=Acme')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].customer_name).toContain('Acme');
  });

  it('should get customer by ID with lifetime metrics', async () => {
    const res = await request(app)
      .get('/api/customers/1')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('id', 1);
    expect(res.body.data).toHaveProperty('metrics');
    expect(res.body.data).toHaveProperty('recentSales');
  });

  it('should allow manager to create a new customer', async () => {
    const uniqueSuffix = Date.now().toString().slice(-4);
    const newCust = {
      customer_code: `CUST-TEST-${uniqueSuffix}`,
      customer_name: `Test Enterprise ${uniqueSuffix}`,
      email: `test${uniqueSuffix}@enterprise.io`,
      phone: '+1-555-0199',
      city: 'Austin',
      status: 'active',
    };

    const res = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${managerToken}`)
      .send(newCust);

    expect(res.status).toBe(201);
    expect(res.body.data.customer_code).toBe(newCust.customer_code);
  });

  it('should prevent analyst from creating a customer (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${analystToken}`)
      .send({
        customer_code: 'CUST-FORBIDDEN',
        customer_name: 'Forbidden Corp',
        email: 'forbidden@corp.com',
        city: 'Seattle',
      });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('should reject duplicate customer_code with 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customer_code: 'CUST-001', // already exists in seeds
        customer_name: 'Duplicate Test',
        email: 'unique_email_test@example.com',
        city: 'Denver',
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('should safely soft-deactivate customer with sales instead of breaking referential integrity', async () => {
    // Customer 1 has sales in synthetic seed
    const res = await request(app)
      .delete('/api/customers/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.deactivated).toBe(true);
    expect(res.body.hardDeleted).toBe(false);
  });

  afterAll(async () => {
    await query("DELETE FROM customers WHERE customer_code LIKE 'CUST-TEST-%'");
    await query("UPDATE customers SET status = 'active' WHERE id = 1");
  });
});
