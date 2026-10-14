import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { query } from '../src/config/db';

describe('Product API Endpoints (/api/products)', () => {
  let adminToken;
  let managerToken;
  let analystToken;

  beforeAll(async () => {
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

  it('should list products with pagination and category filter', async () => {
    const res = await request(app)
      .get('/api/products?category=Cloud Infrastructure')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.every((p) => p.category === 'Cloud Infrastructure')).toBe(true);
  });

  it('should allow manager to create a new product with positive unit price', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        product_name: 'AI Neural Accelerator Add-on',
        category: 'Analytics & AI',
        unit_price: 1850.00,
        is_active: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.product_name).toBe('AI Neural Accelerator Add-on');
    expect(parseFloat(res.body.data.unit_price)).toBe(1850.00);
  });

  it('should reject non-positive unit price with 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        product_name: 'Invalid Free Item',
        category: 'Analytics & AI',
        unit_price: -50.00,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should prevent analyst from creating products (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${analystToken}`)
      .send({
        product_name: 'Unauthorized Product',
        category: 'Cybersecurity',
        unit_price: 99.00,
      });

    expect(res.status).toBe(403);
  });

  it('should allow admin to update and deactivate a product', async () => {
    const updateRes = await request(app)
      .put('/api/products/1')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ unit_price: 499.00 });

    expect(updateRes.status).toBe(200);
    expect(parseFloat(updateRes.body.data.unit_price)).toBe(499.00);

    const deleteRes = await request(app)
      .delete('/api/products/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.message).toContain('deactivated successfully');
  });

  afterAll(async () => {
    await query("DELETE FROM products WHERE product_name = 'AI Neural Accelerator Add-on'");
    await query("UPDATE products SET is_active = true, unit_price = 450.00 WHERE id = 1");
  });
});
