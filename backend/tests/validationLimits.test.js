import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';

describe('System Validation & Boundary Limit Enforcement', () => {
  let adminToken;
  let managerToken;

  beforeAll(async () => {
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@bi.corp', password: 'Admin123!' });
    adminToken = adminLogin.body.data.accessToken;

    const managerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'manager@bi.corp', password: 'Manager123!' });
    managerToken = managerLogin.body.data.accessToken;
  });

  describe('1. Authentication Validation Limits', () => {
    it('should reject email exceeding 254 characters with 400', async () => {
      const longEmail = 'a'.repeat(245) + '@bi.corp'; // 252 + @bi.corp > 254
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: longEmail, password: 'Password123!' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject password exceeding 128 characters with 400', async () => {
      const longPassword = 'P'.repeat(129);
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@bi.corp', password: longPassword });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid email format with 400', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'invalid-email-no-at', password: 'Admin123!' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. Product Validation Limits', () => {
    it('should reject product name exceeding 150 characters with 400', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          product_name: 'A'.repeat(151),
          category: 'Cloud Infrastructure',
          unit_price: 100,
        });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject product code exceeding 30 characters or with invalid characters', async () => {
      const resLong = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          sku: 'A'.repeat(31),
          product_name: 'Test Product Limits',
          category: 'Cloud Infrastructure',
          unit_price: 100,
        });
      expect(resLong.status).toBe(400);

      const resSpecial = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          sku: 'PRD@#$123',
          product_name: 'Test Product Limits',
          category: 'Cloud Infrastructure',
          unit_price: 100,
        });
      expect(resSpecial.status).toBe(400);
    });

    it('should reject brand > 60 chars and supplier > 100 chars', async () => {
      const resBrand = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          product_name: 'Brand Limit Test',
          category: 'Cloud Infrastructure',
          brand: 'B'.repeat(61),
          unit_price: 100,
        });
      expect(resBrand.status).toBe(400);

      const resSupplier = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          product_name: 'Supplier Limit Test',
          category: 'Cloud Infrastructure',
          supplier: 'S'.repeat(101),
          unit_price: 100,
        });
      expect(resSupplier.status).toBe(400);
    });

    it('should reject unit_price exceeding ₹10,000,000 or < ₹0.01 or > 2 decimal places', async () => {
      const resOver = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          product_name: 'Price Limit Test',
          category: 'Cloud Infrastructure',
          unit_price: 10000000.01,
        });
      expect(resOver.status).toBe(400);

      const resZero = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          product_name: 'Price Limit Test',
          category: 'Cloud Infrastructure',
          unit_price: 0,
        });
      expect(resZero.status).toBe(400);

      const resDecimals = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          product_name: 'Price Limit Test',
          category: 'Cloud Infrastructure',
          unit_price: 99.999,
        });
      expect(resDecimals.status).toBe(400);
    });

    it('should reject cost_price greater than unit_price with 400', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          product_name: 'Cost Exceeds Unit Price',
          category: 'Cloud Infrastructure',
          unit_price: 500,
          cost_price: 600,
        });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject GST % exceeding 28 with 400', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          product_name: 'GST Test',
          category: 'Cloud Infrastructure',
          unit_price: 500,
          gst_percent: 29,
        });
      expect(res.status).toBe(400);
    });

    it('should reject stock_quantity and reorder_level > 1,000,000', async () => {
      const resStock = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          product_name: 'Stock Limit Test',
          category: 'Cloud Infrastructure',
          unit_price: 100,
          stock_quantity: 1000001,
        });
      expect(resStock.status).toBe(400);

      const resReorder = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          product_name: 'Reorder Limit Test',
          category: 'Cloud Infrastructure',
          unit_price: 100,
          reorder_level: 1000001,
        });
      expect(resReorder.status).toBe(400);
    });

    it('should reject warranty_months exceeding 120 with 400', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          product_name: 'Warranty Test',
          category: 'Cloud Infrastructure',
          unit_price: 100,
          warranty_months: 121,
        });
      expect(res.status).toBe(400);
    });

    it('should reject description exceeding 1000 characters with 400', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          product_name: 'Desc Test',
          category: 'Cloud Infrastructure',
          unit_price: 100,
          description: 'D'.repeat(1001),
        });
      expect(res.status).toBe(400);
    });
  });

  describe('3. Customer Validation Limits', () => {
    it('should reject customer name > 100 characters with 400', async () => {
      const res = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          customer_code: 'CUST-VAL-101',
          customer_name: 'C'.repeat(101),
          email: 'validcust@example.com',
          city: 'Mumbai',
        });
      expect(res.status).toBe(400);
    });

    it('should reject phone numbers that are not exactly 10 digits', async () => {
      // 9 digits
      const resShort = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          customer_code: 'CUST-VAL-102',
          customer_name: 'Valid Customer',
          email: 'cust102@example.com',
          phone: '982019901',
          city: 'Mumbai',
        });
      expect(resShort.status).toBe(400);

      // 11 digits
      const resLong = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          customer_code: 'CUST-VAL-103',
          customer_name: 'Valid Customer',
          email: 'cust103@example.com',
          phone: '98201990190',
          city: 'Mumbai',
        });
      expect(resLong.status).toBe(400);

      // letters/special chars
      const resAlpha = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          customer_code: 'CUST-VAL-104',
          customer_name: 'Valid Customer',
          email: 'cust104@example.com',
          phone: '+9198201990',
          city: 'Mumbai',
        });
      expect(resAlpha.status).toBe(400);
    });
  });

  describe('4. Sales Validation Limits', () => {
    it('should reject sale line item quantity < 1 or > 100,000', async () => {
      const resZero = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          customer_id: 1,
          items: [{ product_id: 1, quantity: 0 }],
        });
      expect(resZero.status).toBe(400);

      const resExcess = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          customer_id: 1,
          items: [{ product_id: 1, quantity: 100001 }],
        });
      expect(resExcess.status).toBe(400);
    });

    it('should reject sale discount < 0 or > 100', async () => {
      const resNegative = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          customer_id: 1,
          discount: -5,
          items: [{ product_id: 1, quantity: 1 }],
        });
      expect(resNegative.status).toBe(400);

      const resOver = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          customer_id: 1,
          discount: 105,
          items: [{ product_id: 1, quantity: 1 }],
        });
      expect(resOver.status).toBe(400);
    });
  });

  describe('5. User Management Validation Limits', () => {
    it('should reject user name > 100 characters', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'U'.repeat(101),
          email: 'newuser@bi.corp',
          password: 'Password123!',
          role: 'analyst',
        });
      expect(res.status).toBe(400);
    });

    it('should reject user password < 6 or > 128 characters', async () => {
      const resShort = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Short Password User',
          email: 'shortpass@bi.corp',
          password: '123',
          role: 'analyst',
        });
      expect(resShort.status).toBe(400);

      const resLong = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Long Password User',
          email: 'longpass@bi.corp',
          password: 'P'.repeat(129),
          role: 'analyst',
        });
      expect(resLong.status).toBe(400);
    });
  });

  describe('6. Request Body Limit (100kb)', () => {
    it('should reject requests exceeding 100kb payload size with 413', async () => {
      const hugeString = 'X'.repeat(110 * 1024); // 110 KB
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@bi.corp', password: hugeString });
      expect(res.status).toBe(413);
    });
  });
});
