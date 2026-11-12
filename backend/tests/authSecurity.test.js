import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createRequire } from 'module';
import app from '../src/app';
import { query } from '../src/config/db';
import { seedDatabase } from '../src/database/seed';

const require = createRequire(import.meta.url);
const mailer = require('../src/utils/mailer');
const config = require('../src/config/env');

describe('Enhanced Auth Security, Lockout & Forgot Password (/api/auth)', () => {
  let adminToken;
  let inactiveUserId;
  let resetUserId;
  const inactiveEmail = `inactive-auth-${Date.now()}@bi.corp`;
  const resetEmail = `reset-auth-${Date.now()}@bi.corp`;
  const testPassword = 'UserPass123!';

  beforeAll(async () => {
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@bi.corp', password: 'Admin123!' });
    adminToken = adminRes.body.data.accessToken;

    const hash = await bcrypt.hash(testPassword, 10);
    const inactiveRes = await query(
      `INSERT INTO users (name, email, password_hash, role, is_active)
       VALUES ('Inactive Test', $1, $2, 'analyst', false)
       RETURNING id`,
      [inactiveEmail, hash]
    );
    inactiveUserId = inactiveRes.rows[0].id;

    const resetRes = await query(
      `INSERT INTO users (name, email, password_hash, role, is_active)
       VALUES ('Reset Test', $1, $2, 'analyst', true)
       RETURNING id`,
      [resetEmail, hash]
    );
    resetUserId = resetRes.rows[0].id;
  });

  afterAll(async () => {
    await query('DELETE FROM login_attempts WHERE email IN ($1, $2, $3)', [
      inactiveEmail,
      resetEmail,
      'lockout-missing@bi.corp',
    ]);
    if (inactiveUserId) {
      await query('DELETE FROM users WHERE id = $1', [inactiveUserId]);
      await query('DELETE FROM audit_logs WHERE user_email = $1', [inactiveEmail]);
    }
    if (resetUserId) {
      await query('DELETE FROM password_reset_requests WHERE user_id = $1', [resetUserId]);
      await query('DELETE FROM users WHERE id = $1', [resetUserId]);
      await query('DELETE FROM audit_logs WHERE user_email = $1', [resetEmail]);
    }
    await query('DELETE FROM audit_logs WHERE user_email = $1', ['lockout-missing@bi.corp']);
  });

  it('returns identical generic error for wrong email and wrong password', async () => {
    const missingEmailRes = await request(app)
      .post('/api/auth/login')
      .set('User-Agent', 'VitestAgent/1.0')
      .send({ email: 'does-not-exist@bi.corp', password: 'WrongPassword1!' });

    const wrongPassRes = await request(app)
      .post('/api/auth/login')
      .set('User-Agent', 'VitestAgent/1.0')
      .send({ email: resetEmail, password: 'WrongPassword1!' });

    expect(missingEmailRes.status).toBe(401);
    expect(wrongPassRes.status).toBe(401);
    expect(missingEmailRes.body.error.message).toBe('Invalid email or password');
    expect(wrongPassRes.body.error.message).toBe('Invalid email or password');

    // Clean up failed attempts for resetEmail before further tests
    await query('DELETE FROM login_attempts WHERE email IN ($1, $2)', [
      'does-not-exist@bi.corp',
      resetEmail,
    ]);
    await query('DELETE FROM audit_logs WHERE user_email = $1', ['does-not-exist@bi.corp']);
  });

  it('requires valid password before revealing inactive status with exact message', async () => {
    const wrongPassInactive = await request(app)
      .post('/api/auth/login')
      .send({ email: inactiveEmail, password: 'WrongPassword1!' });
    expect(wrongPassInactive.status).toBe(401);
    expect(wrongPassInactive.body.error.message).toBe('Invalid email or password');

    const rightPassInactive = await request(app)
      .post('/api/auth/login')
      .send({ email: inactiveEmail, password: testPassword });
    expect(rightPassInactive.status).toBe(403);
    expect(rightPassInactive.body.error.message).toBe(
      'Your account is deactivated. Contact the administrator.'
    );
  });

  it('locks out after 5 failed attempts per IP + email with clear wait message and logs audit without passwords', async () => {
    const targetEmail = 'lockout-missing@bi.corp';
    const secretWrongPass = 'SuperSecretAttempt99!';

    for (let i = 0; i < 5; i += 1) {
      const failRes = await request(app)
        .post('/api/auth/login')
        .set('User-Agent', 'LockoutSuite/2.0')
        .send({ email: targetEmail, password: secretWrongPass });
      expect(failRes.status).toBe(401);
    }

    const lockedRes = await request(app)
      .post('/api/auth/login')
      .set('User-Agent', 'LockoutSuite/2.0')
      .send({ email: targetEmail, password: secretWrongPass });

    expect(lockedRes.status).toBe(429);
    expect(lockedRes.body.error.message).toMatch(/Too many attempts, try again in \d+ minute/i);

    const auditRes = await query(
      `SELECT action, details, ip_address
       FROM audit_logs
       WHERE user_email = $1
       ORDER BY id DESC
       LIMIT 6`,
      [targetEmail]
    );
    expect(auditRes.rowCount).toBeGreaterThanOrEqual(5);
    auditRes.rows.forEach((row) => {
      expect(row.action).toBe('USER_LOGIN_FAILED');
      expect(row.details.userAgent).toBe('LockoutSuite/2.0');
      expect(JSON.stringify(row.details)).not.toContain(secretWrongPass);
    });
  });

  it('issues 30-day refresh token when rememberMe is true', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: resetEmail, password: testPassword, rememberMe: true });

    expect(res.status).toBe(200);
    const decoded = jwt.decode(res.body.data.refreshToken);
    expect(decoded.rememberMe).toBe(true);
    const ttlDays = Math.round((decoded.exp - decoded.iat) / 86400);
    expect(ttlDays).toBe(30);
  });

  it('handles forgot-password without email enumeration and lets admin fulfill pending request', async () => {
    const unknownForgot = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody-here@bi.corp' });
    expect(unknownForgot.status).toBe(200);
    expect(unknownForgot.body.message).toBe(
      'If this email exists, the administrator has been notified'
    );

    const knownForgot = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: resetEmail });
    expect(knownForgot.status).toBe(200);
    expect(knownForgot.body.message).toBe(
      'If this email exists, the administrator has been notified'
    );

    // Admin sees pending request
    const pendingRes = await request(app)
      .get('/api/users/reset-requests')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(pendingRes.status).toBe(200);
    const pendingItem = pendingRes.body.data.find((r) => r.email === resetEmail);
    expect(pendingItem).toBeTruthy();
    expect(pendingItem.delivery_method).toBe('admin_queue');

    // Admin completes reset request -> receives temporary password
    const completeRes = await request(app)
      .post(`/api/users/reset-requests/${pendingItem.id}/complete`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(completeRes.status).toBe(200);
    expect(completeRes.body.data.temporaryPassword).toBeTruthy();

    // User logs in with temporary password
    const loginTemp = await request(app)
      .post('/api/auth/login')
      .send({ email: resetEmail, password: completeRes.body.data.temporaryPassword });
    expect(loginTemp.status).toBe(200);
  });

  it('sends reset link email when SMTP is configured and allows resetting via token', async () => {
    let capturedResetUrl = '';
    const origHost = config.smtp.host;
    const origFrom = config.smtp.from;
    config.smtp.host = 'smtp.test.local';
    config.smtp.from = 'no-reply@test.local';
    const sendStub = vi
      .spyOn(mailer, 'sendPasswordResetEmail')
      .mockImplementation(async ({ resetUrl }) => {
        capturedResetUrl = resetUrl;
        return { sent: true };
      });

    try {
      const forgotRes = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: resetEmail });
      expect(forgotRes.status).toBe(200);
      expect(sendStub).toHaveBeenCalledTimes(1);
      expect(capturedResetUrl).toContain('resetToken=');

      const rawToken = new URL(capturedResetUrl).searchParams.get('resetToken');
      const tokenResetRes = await request(app)
        .post('/api/auth/reset-password-token')
        .send({ token: rawToken, password: 'NewEmailReset99!' });
      expect(tokenResetRes.status).toBe(200);

      const loginNewRes = await request(app)
        .post('/api/auth/login')
        .send({ email: resetEmail, password: 'NewEmailReset99!' });
      expect(loginNewRes.status).toBe(200);

      // Reusing same token fails
      const reuseRes = await request(app)
        .post('/api/auth/reset-password-token')
        .send({ token: rawToken, password: 'AnotherPass99!' });
      expect(reuseRes.status).toBe(400);
    } finally {
      config.smtp.host = origHost;
      config.smtp.from = origFrom;
      sendStub.mockRestore();
    }
  });

  it('refuses to run demo seedDatabase in NODE_ENV=production', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      await expect(seedDatabase()).rejects.toThrow(/NODE_ENV=production/i);
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });
});
