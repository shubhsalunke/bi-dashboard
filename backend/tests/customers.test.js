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
      .get('/api/customers?city=Mumbai')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.every((c) => c.city === 'Mumbai')).toBe(true);
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

  it('should allow manager to create and update a customer with extended fields and new statuses', async () => {
    const uniqueSuffix = Date.now().toString().slice(-4);
    const newCust = {
      customer_code: `CUST-TEST-${uniqueSuffix}`,
      customer_name: `Test Enterprise ${uniqueSuffix}`,
      email: `test${uniqueSuffix}@enterprise.io`,
      phone: '9820199019',
      city: 'Pune',
      status: 'prospect',
      industry: 'IT Services',
      customer_type: 'Startup',
      contact_person: 'Aarav Mehta',
      state: 'Maharashtra',
      gst_number: '27aaaca1234a1z5',
      address: 'Suite 402, Baner Road, Pune 411045',
      notes: 'Evaluating annual cloud subscription',
    };

    const res = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${managerToken}`)
      .send(newCust);

    expect(res.status).toBe(201);
    expect(res.body.data.customer_code).toBe(newCust.customer_code);
    expect(res.body.data.status).toBe('prospect');
    expect(res.body.data.industry).toBe('IT Services');
    expect(res.body.data.customer_type).toBe('Startup');
    expect(res.body.data.contact_person).toBe('Aarav Mehta');
    expect(res.body.data.state).toBe('Maharashtra');
    expect(res.body.data.gst_number).toBe('27AAACA1234A1Z5');
    expect(res.body.data.address).toBe(newCust.address);
    expect(res.body.data.notes).toBe(newCust.notes);

    // Filter by industry, customer_type, and status
    const filterRes = await request(app)
      .get('/api/customers?industry=IT%20Services&customer_type=Startup&status=prospect')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(filterRes.status).toBe(200);
    expect(filterRes.body.data.some((c) => c.id === res.body.data.id)).toBe(true);

    // Update to on_hold and churned
    const updateRes = await request(app)
      .put(`/api/customers/${res.body.data.id}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        status: 'on_hold',
        industry: 'Finance',
        customer_type: 'Large Business',
        state: 'Karnataka',
        gst_number: '29AABCU9603R1ZM',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.status).toBe('on_hold');
    expect(updateRes.body.data.industry).toBe('Finance');
    expect(updateRes.body.data.customer_type).toBe('Large Business');
    expect(updateRes.body.data.state).toBe('Karnataka');
    expect(updateRes.body.data.gst_number).toBe('29AABCU9603R1ZM');
  });

  it('should reject invalid dropdown values and badly formatted GST number on create and update', async () => {
    const badCreateRes = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        customer_code: 'CUST-BAD-1',
        customer_name: 'Bad Payload Corp',
        email: 'badpayload@example.com',
        city: 'Pune',
        status: 'archived',
        industry: 'Crypto',
        customer_type: 'Government',
        state: 'Atlantis',
        gst_number: 'INVALIDGST12345',
      });

    expect(badCreateRes.status).toBe(400);
    const createMessages = badCreateRes.body.error.details.map((d) => d.message).join(' | ');
    expect(createMessages).toContain('Status must be one of');
    expect(createMessages).toContain('Industry must be one of');
    expect(createMessages).toContain('Customer type must be one of');
    expect(createMessages).toContain('State must be a valid Indian state');
    expect(createMessages).toContain('GST number must be a valid 15-character GSTIN');

    const badUpdateRes = await request(app)
      .put('/api/customers/1')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        status: 'unknown_status',
        gst_number: '12345',
      });

    expect(badUpdateRes.status).toBe(400);
    const updateMessages = badUpdateRes.body.error.details.map((d) => d.message).join(' | ');
    expect(updateMessages).toContain('Status must be one of');
    expect(updateMessages).toContain('GST number must be a valid 15-character GSTIN');
  });

  it('should prevent analyst from creating a customer (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${analystToken}`)
      .send({
        customer_code: 'CUST-FORBIDDEN',
        customer_name: 'Forbidden Corp',
        email: 'forbidden@corp.com',
        city: 'Nagpur',
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
        city: 'Hyderabad',
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
