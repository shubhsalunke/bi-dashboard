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

  it('should allow manager to create a new product with sku, cost price, stock, and description', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        sku: 'TEST-999',
        product_name: 'Enterprise Security Enclave',
        category: 'Cybersecurity',
        unit_price: 2500.00,
        cost_price: 1500.00,
        stock_quantity: 15,
        description: 'Isolated hardware security module for key management.',
        is_active: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.sku).toBe('TEST-999');
    expect(res.body.data.cost_price).toBe(1500.00);
    expect(res.body.data.stock_quantity).toBe(15);
    expect(res.body.data.description).toBe('Isolated hardware security module for key management.');
  });

  it('should reject duplicate SKU with 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        sku: 'TEST-999',
        product_name: 'Duplicate SKU Item',
        category: 'Cybersecurity',
        unit_price: 999.00,
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should reject negative cost price or negative stock quantity', async () => {
    const resCost = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        sku: 'NEG-001',
        product_name: 'Negative Cost Item',
        category: 'Cybersecurity',
        unit_price: 100.00,
        cost_price: -20.00,
      });
    expect(resCost.status).toBe(400);

    const resStock = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        sku: 'NEG-002',
        product_name: 'Negative Stock Item',
        category: 'Cybersecurity',
        unit_price: 100.00,
        stock_quantity: -5,
      });
    expect(resStock.status).toBe(400);
  });

  it('should filter products by stock status (reorder_level) and price range', async () => {
    // Low stock filter (<= reorder_level)
    const lowStockRes = await request(app)
      .get('/api/products?stock_status=low')
      .set('Authorization', `Bearer ${analystToken}`);
    expect(lowStockRes.status).toBe(200);
    expect(lowStockRes.body.data.every((p) => p.stock_quantity > 0 && p.stock_quantity <= p.reorder_level)).toBe(true);

    // Price range filter
    const priceRes = await request(app)
      .get('/api/products?min_price=500&max_price=1500')
      .set('Authorization', `Bearer ${analystToken}`);
    expect(priceRes.status).toBe(200);
    expect(priceRes.body.data.every((p) => p.unit_price >= 500 && p.unit_price <= 1500)).toBe(true);
  });

  it('should filter products by brand', async () => {
    const brandRes = await request(app)
      .get('/api/products?brand=Tata')
      .set('Authorization', `Bearer ${analystToken}`);
    expect(brandRes.status).toBe(200);
    expect(brandRes.body.data.length).toBeGreaterThan(0);
    expect(brandRes.body.data.every((p) => p.brand === 'Tata')).toBe(true);
  });

  it('should validate brand, supplier, gst_percent, and reorder_level fields on create', async () => {
    // Invalid GST (> 28%)
    const invalidGstRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        sku: 'VAL-001',
        product_name: 'Invalid GST Product',
        category: 'Cybersecurity',
        unit_price: 100.00,
        gst_percent: 35.00,
      });
    expect(invalidGstRes.status).toBe(400);

    // Valid create with brand and supplier
    const validRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        sku: 'VAL-002',
        product_name: 'Tata Cloud Shield',
        category: 'Cybersecurity',
        brand: 'Tata',
        supplier: 'Tata Security Corp',
        unit: 'per license/yr',
        unit_price: 1000.00,
        gst_percent: 18.00,
        reorder_level: 12,
        warranty_months: 24,
      });
    expect(validRes.status).toBe(201);
    expect(validRes.body.data.brand).toBe('Tata');
    expect(validRes.body.data.supplier).toBe('Tata Security Corp');
    expect(validRes.body.data.gst_percent).toBe(18.00);
    expect(validRes.body.data.reorder_level).toBe(12);
    expect(validRes.body.data.warranty_months).toBe(24);
  });

  it('should return units_sold and total_revenue in products list', async () => {
    const res = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    const first = res.body.data[0];
    expect(first).toHaveProperty('units_sold');
    expect(first).toHaveProperty('total_revenue');
    expect(typeof first.units_sold).toBe('number');
    expect(typeof first.total_revenue).toBe('number');
  });

  it('should return product details including margin, price_with_gst and recent sales', async () => {
    const res = await request(app)
      .get('/api/products/1/details')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id', 1);
    expect(res.body.data).toHaveProperty('sku');
    expect(res.body.data).toHaveProperty('brand');
    expect(res.body.data).toHaveProperty('gst_percent');
    expect(res.body.data).toHaveProperty('price_with_gst');
    expect(res.body.data.price_with_gst).toBeCloseTo(res.body.data.unit_price * (1 + res.body.data.gst_percent / 100), 2);
    expect(res.body.data).toHaveProperty('margin');
    expect(res.body.data).toHaveProperty('units_sold');
    expect(res.body.data).toHaveProperty('total_revenue');
    expect(Array.isArray(res.body.data.recent_sales)).toBe(true);
  });

  it('should return brand sales aggregated via GET /api/reports/brand-sales', async () => {
    const res = await request(app)
      .get('/api/reports/brand-sales')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    const first = res.body.data[0];
    expect(first).toHaveProperty('brand');
    expect(first).toHaveProperty('units_sold');
    expect(first).toHaveProperty('total_revenue');
  });

  afterAll(async () => {
    await query("DELETE FROM products WHERE product_name IN ('AI Neural Accelerator Add-on', 'Enterprise Security Enclave', 'Duplicate SKU Item', 'Tata Cloud Shield') OR sku IN ('TEST-999', 'VAL-001', 'VAL-002')");
    await query("UPDATE products SET is_active = true, unit_price = 450.00 WHERE id = 1");
  });
});
