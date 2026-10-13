import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app';

describe('GET /api/health - Backend Foundation Health Check', () => {
  it('should return 200 OK with healthy status and database metrics', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('status', 'UP');
    expect(res.body).toHaveProperty('database');
    expect(res.body.database.status).toBe('healthy');
    expect(res.body.database.database).toBe('business_intelligence');
    expect(res.body.database).toHaveProperty('serverTime');
    expect(res.body.database).toHaveProperty('pool');
    expect(res.body).toHaveProperty('version');
    expect(res.body).toHaveProperty('uptimeSeconds');
  });

  it('should return 404 for unknown endpoints with consistent JSON error schema', async () => {
    const res = await request(app).get('/api/unknown-endpoint-xyz');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.error).toHaveProperty('code', 'NOT_FOUND');
    expect(res.body.error.message).toContain('Route not found');
  });
});
