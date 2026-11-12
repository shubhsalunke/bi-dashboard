import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { query } from '../src/config/db';
import userService from '../src/services/user.service';

describe('Enhanced User Management API (/api/users)', () => {
  let adminToken;
  let adminUserId;
  let analystToken;
  let createdUserId;
  const createdEmail = `user-enhanced-${Date.now()}@bi.corp`;
  const initialPassword = 'InitialPass123!';

  beforeAll(async () => {
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@bi.corp', password: 'Admin123!' });
    adminToken = adminRes.body.data.accessToken;
    adminUserId = adminRes.body.data.user.id;

    const analystRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'analyst@bi.corp', password: 'Analyst123!' });
    analystToken = analystRes.body.data.accessToken;
  });

  afterAll(async () => {
    if (createdUserId) {
      await query('DELETE FROM users WHERE id = $1', [createdUserId]);
      await query("DELETE FROM audit_logs WHERE entity = 'USER' AND entity_id = $1", [
        createdUserId,
      ]);
    }
  });

  it('blocks non-admin roles on all new user endpoints', async () => {
    const endpoints = [
      () => request(app).get('/api/users').set('Authorization', `Bearer ${analystToken}`),
      () =>
        request(app)
          .patch(`/api/users/${adminUserId}/status`)
          .set('Authorization', `Bearer ${analystToken}`)
          .send({ is_active: false }),
      () =>
        request(app)
          .post(`/api/users/${adminUserId}/reset-password`)
          .set('Authorization', `Bearer ${analystToken}`),
      () =>
        request(app)
          .get(`/api/users/${adminUserId}/activity`)
          .set('Authorization', `Bearer ${analystToken}`),
      () =>
        request(app)
          .delete(`/api/users/${adminUserId}`)
          .set('Authorization', `Bearer ${analystToken}`),
    ];

    for (const call of endpoints) {
      const res = await call();
      expect(res.status).toBe(403);
    }
  });

  it('creates a user with phone and department and rejects invalid phone or duplicate email', async () => {
    const badPhoneRes = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Bad Phone User',
        email: createdEmail,
        password: initialPassword,
        role: 'analyst',
        phone: 'invalid@@phone!',
      });
    expect(badPhoneRes.status).toBe(400);

    const createRes = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Enhanced Test User',
        email: createdEmail,
        password: initialPassword,
        role: 'analyst',
        phone: '+91 98765 43210',
        department: 'Finance',
        is_active: true,
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data).toHaveProperty('id');
    expect(createRes.body.data.phone).toBe('+91 98765 43210');
    expect(createRes.body.data.department).toBe('Finance');
    expect(createRes.body.data).not.toHaveProperty('password_hash');
    createdUserId = createRes.body.data.id;

    const dupRes = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Duplicate Email User',
        email: createdEmail,
        password: initialPassword,
        role: 'analyst',
      });
    expect(dupRes.status).toBe(409);
    expect(dupRes.body.error.message.toLowerCase()).toContain('email');
  });

  it('preserves existing password when updating user with blank or omitted password', async () => {
    const updateRes = await request(app)
      .put(`/api/users/${createdUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Enhanced Test User Updated',
        role: 'manager',
        department: 'Operations',
        password: '',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.name).toBe('Enhanced Test User Updated');
    expect(updateRes.body.data.role).toBe('manager');
    expect(updateRes.body.data.department).toBe('Operations');
    expect(updateRes.body.data).not.toHaveProperty('password_hash');

    // Original password still works
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: createdEmail, password: initialPassword });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.user.role).toBe('manager');
  });

  it('supports search, role/status filtering, sorting, and pagination', async () => {
    const res = await request(app)
      .get('/api/users')
      .query({
        search: 'Operations',
        role: 'manager',
        status: 'active',
        sortBy: 'name',
        sortOrder: 'asc',
        page: 1,
        limit: 10,
      })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toHaveProperty('total');
    expect(res.body).toHaveProperty('activeAdminCount');
    const found = res.body.data.find((u) => u.id === createdUserId);
    expect(found).toBeTruthy();
    expect(found.last_login_at).toBeTruthy();
    expect(found).not.toHaveProperty('password_hash');
  });

  it('enforces self-protection and last-active-admin safety rules', async () => {
    const selfDeactivate = await request(app)
      .patch(`/api/users/${adminUserId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ is_active: false });
    expect(selfDeactivate.status).toBe(400);

    const selfDemote = await request(app)
      .put(`/api/users/${adminUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'analyst' });
    expect(selfDemote.status).toBe(400);

    const selfDelete = await request(app)
      .delete(`/api/users/${adminUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(selfDelete.status).toBe(400);

    // Direct service check for last-active-admin guard when acting on a sole active admin
    const activeAdmins = await query(
      "SELECT id, role, is_active FROM users WHERE role = 'admin' AND is_active = true ORDER BY id ASC"
    );
    if (activeAdmins.rows.length === 1) {
      await expect(
        userService.assertAdminSafety({
          targetUser: activeAdmins.rows[0],
          adminId: 999999,
          isDeactivating: true,
        })
      ).rejects.toThrow(/last active Administrator/i);
    }
  });

  it('resets user password to a usable temporary password and toggles status', async () => {
    const resetRes = await request(app)
      .post(`/api/users/${createdUserId}/reset-password`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.data.temporaryPassword).toBeTruthy();
    expect(resetRes.body.data.temporaryPassword.length).toBeGreaterThanOrEqual(12);
    expect(resetRes.body.data.user).not.toHaveProperty('password_hash');

    const tempLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: createdEmail, password: resetRes.body.data.temporaryPassword });
    expect(tempLogin.status).toBe(200);

    const deactivateRes = await request(app)
      .patch(`/api/users/${createdUserId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ is_active: false });
    expect(deactivateRes.status).toBe(200);
    expect(deactivateRes.body.data.is_active).toBe(false);

    const activateRes = await request(app)
      .patch(`/api/users/${createdUserId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ is_active: true });
    expect(activateRes.status).toBe(200);
    expect(activateRes.body.data.is_active).toBe(true);
  });

  it('returns per-user activity log with created, updated, role, reset, status, and login events', async () => {
    const activityRes = await request(app)
      .get(`/api/users/${createdUserId}/activity`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(activityRes.status).toBe(200);
    expect(Array.isArray(activityRes.body.data)).toBe(true);
    const actions = activityRes.body.data.map((entry) => entry.action);
    expect(actions).toContain('USER_CREATED');
    expect(actions).toContain('USER_UPDATED');
    expect(actions).toContain('USER_ROLE_CHANGED');
    expect(actions).toContain('USER_PASSWORD_RESET');
    expect(actions).toContain('USER_DEACTIVATED');
    expect(actions).toContain('USER_ACTIVATED');
    expect(actions).toContain('USER_LOGIN');
  });

  it('deletes a non-protected user and logs USER_DELETED', async () => {
    const delRes = await request(app)
      .delete(`/api/users/${createdUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);

    const getRes = await request(app)
      .get(`/api/users/${createdUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(getRes.status).toBe(404);
    createdUserId = null;
  });
});

