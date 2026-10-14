import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { query } from '../src/config/db';

describe('Sales API Endpoints & Transaction Rollback (/api/sales)', () => {
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

  it('should list sales with pagination for authenticated users', async () => {
    const res = await request(app)
      .get('/api/sales?page=1&limit=5')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(5);
    expect(res.body.pagination.total).toBeGreaterThan(0);
  });

  it('should retrieve a sale by ID with nested line items', async () => {
    const res = await request(app)
      .get('/api/sales/1')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('id', 1);
    expect(res.body.data).toHaveProperty('items');
    expect(res.body.data.items).toBeInstanceOf(Array);
    expect(res.body.data.items.length).toBeGreaterThan(0);
  });

  it('should successfully create a multi-item sale in a single database transaction with server-calculated totals', async () => {
    // Customer 2 (Apex FinTech, active)
    // Products 2 ($650) and 3 ($220) are active
    const salePayload = {
      customer_id: 2,
      sale_date: '2026-10-13',
      status: 'completed',
      items: [
        { product_id: 2, quantity: 2 }, // 2 * 650 = 1300
        { product_id: 3, quantity: 1 }, // 1 * 220 = 220
      ],
    };

    const res = await request(app)
      .post('/api/sales')
      .set('Authorization', `Bearer ${managerToken}`)
      .send(salePayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    // Expected server-calculated total: 1300 + 220 = 1520.00
    expect(parseFloat(res.body.data.total_amount)).toBe(1520.00);
    expect(res.body.data.items.length).toBe(2);
  });

  it('CRITICAL: should roll back transaction completely when an invalid item is submitted (Atomic Rollback Test)', async () => {
    // 1. Record current row counts in sales and sale_items
    const salesBeforeRes = await query('SELECT COUNT(*) FROM sales');
    const itemsBeforeRes = await query('SELECT COUNT(*) FROM sale_items');
    const initialSalesCount = parseInt(salesBeforeRes.rows[0].count, 10);
    const initialItemsCount = parseInt(itemsBeforeRes.rows[0].count, 10);

    // 2. Submit sale where Item 1 is active (product 2), but Item 2 has a NON-EXISTENT product_id (999999)
    const invalidSalePayload = {
      customer_id: 2,
      sale_date: '2026-10-13',
      items: [
        { product_id: 2, quantity: 2 },
        { product_id: 999999, quantity: 1 }, // Non-existent product
      ],
    };

    const res = await request(app)
      .post('/api/sales')
      .set('Authorization', `Bearer ${managerToken}`)
      .send(invalidSalePayload);

    // 3. Request must be rejected with 400 Bad Request
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('Product with ID 999999 does not exist');

    // 4. Verify ZERO rows were persisted in both sales and sale_items (Complete rollback)
    const salesAfterRes = await query('SELECT COUNT(*) FROM sales');
    const itemsAfterRes = await query('SELECT COUNT(*) FROM sale_items');
    const finalSalesCount = parseInt(salesAfterRes.rows[0].count, 10);
    const finalItemsCount = parseInt(itemsAfterRes.rows[0].count, 10);

    expect(finalSalesCount).toBe(initialSalesCount);
    expect(finalItemsCount).toBe(initialItemsCount);
  });

  it('should prevent analyst from creating a sale (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/sales')
      .set('Authorization', `Bearer ${analystToken}`)
      .send({
        customer_id: 2,
        items: [{ product_id: 2, quantity: 1 }],
      });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  afterAll(async () => {
    await query("DELETE FROM sales WHERE id > 5");
  });
});
