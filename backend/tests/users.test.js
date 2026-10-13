import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';

describe('User and Role Management API (/api/users - Admin Restricted)', () => {
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

  it('should allow admin to list all users', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThanOrEqual(3);
    // Ensure no password hashes are exposed
    expect(res.body.data[0]).not.toHaveProperty('password_hash');
  });

  it('should prevent non-admin (manager) from accessing /api/users (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('should allow admin to create a new user with role', async () => {
    const unique = Date.now().toString().slice(-4);
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Dev Analyst ${unique}`,
        email: `analyst${unique}@bi.corp`,
        password: 'Password123!',
        role: 'analyst',
        is_active: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe(`analyst${unique}@bi.corp`);
    expect(res.body.data.role).toBe('analyst');
    expect(res.body.data).not.toHaveProperty('password_hash');
  });

  it('should allow admin to retrieve audit logs', async () => {
    const res = await request(app)
      .get('/api/users/audit-logs?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.pagination).toHaveProperty('total');
  });
});
