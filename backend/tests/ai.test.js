import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import aiProviderService from '../src/services/aiProvider.service';

describe('AI Business Assistant API (POST /api/ai/ask)', () => {
  let adminToken;
  let analystToken;
  let origProvider;

  beforeAll(async () => {
    origProvider = process.env.AI_PROVIDER;
    // Mock AI provider responses as per Section 7 of assessment requirements
    process.env.AI_PROVIDER = 'mock';

    // 1. Authenticate as Admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@bi.corp', password: 'Admin123!' });
    adminToken = adminLogin.body.data.accessToken;

    // 2. Authenticate as Analyst
    const analystLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'analyst@bi.corp', password: 'Analyst123!' });
    analystToken = analystLogin.body.data.accessToken;
  });

  afterAll(() => {
    process.env.AI_PROVIDER = origProvider;
  });

  describe('1. Authentication & Input Validation', () => {
    it('should reject unauthenticated request with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/ai/ask')
        .send({ question: 'What were total sales last month?' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject empty question with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/ai/ask')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ question: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('BAD_REQUEST');
    });

    it('should reject questions shorter than 3 characters', async () => {
      const res = await request(app)
        .post('/api/ai/ask')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ question: 'Hi' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('BAD_REQUEST');
    });

    it('should reject questions exceeding 500 characters', async () => {
      const longQuestion = 'a'.repeat(501);
      const res = await request(app)
        .post('/api/ai/ask')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ question: longQuestion });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('BAD_REQUEST');
    });
  });

  describe('2. Security & SQL Injection Prevention', () => {
    it('should block arbitrary SQL commands (e.g. DROP TABLE) without executing them', async () => {
      const res = await request(app)
        .post('/api/ai/ask')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ question: 'DROP TABLE users; SELECT * FROM customers;' });

      expect(res.status).toBe(200);
      expect(res.body.data.intent).toBe('SECURITY_BLOCKED');
      expect(res.body.data.answer).toContain('strictly blocked for security');
      expect(res.body.data.rows).toEqual([]);
    });

    it('should block SQL UNION SELECT attempts', async () => {
      const res = await request(app)
        .post('/api/ai/ask')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ question: 'Show me UNION SELECT password_hash FROM users--' });

      expect(res.status).toBe(200);
      expect(res.body.data.intent).toBe('SECURITY_BLOCKED');
      expect(res.body.data.rows).toEqual([]);
    });
  });

  describe('3. Supported Business Reporting Questions', () => {
    it('Question 1: Total sales last month / period', async () => {
      const res = await request(app)
        .post('/api/ai/ask')
        .set('Authorization', `Bearer ${analystToken}`)
        .send({ question: 'What were total sales last month?' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.intent).toBe('TOTAL_SALES');
      expect(res.body.data.reportTitle).toContain('Total Sales');
      expect(res.body.data.answer).toContain('$');
      expect(res.body.data.summaryMetrics).toHaveProperty('totalRevenue');
      expect(res.body.data.summaryMetrics).toHaveProperty('totalOrders');
      expect(res.body.data.rows.length).toBeGreaterThan(0);
    });

    it('Question 2: Top 10 customers by sales', async () => {
      const res = await request(app)
        .post('/api/ai/ask')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ question: 'Show the top 10 customers by sales' });

      expect(res.status).toBe(200);
      expect(res.body.data.intent).toBe('TOP_CUSTOMERS');
      expect(res.body.data.reportTitle).toContain('Top');
      expect(res.body.data.columns.length).toBeGreaterThanOrEqual(4);
      expect(res.body.data.rows.length).toBeGreaterThan(0);
      expect(res.body.data.rows[0]).toHaveProperty('customer_name');
      expect(res.body.data.rows[0]).toHaveProperty('total_revenue');
      // Grounded check: answer mentions leading customer
      expect(res.body.data.answer).toContain(res.body.data.rows[0].customer_name);
    });

    it('Question 3: Highest revenue product', async () => {
      const res = await request(app)
        .post('/api/ai/ask')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ question: 'Which product generated the highest revenue?' });

      expect(res.status).toBe(200);
      expect(res.body.data.intent).toBe('TOP_PRODUCTS');
      expect(res.body.data.rows.length).toBeGreaterThan(0);
      expect(res.body.data.rows[0]).toHaveProperty('product_name');
      expect(res.body.data.rows[0]).toHaveProperty('total_revenue');
      expect(res.body.data.answer).toContain(res.body.data.rows[0].product_name);
    });

    it('Question 4: Compare this month with the previous month', async () => {
      const res = await request(app)
        .post('/api/ai/ask')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ question: 'Compare this month with the previous month' });

      expect(res.status).toBe(200);
      expect(res.body.data.intent).toBe('MOM_COMPARISON');
      expect(res.body.data.summaryMetrics).toHaveProperty('growthPercentage');
      expect(res.body.data.answer).toContain('Month-over-month');
    });

    it('Question 5: City-wise sales for the last three months', async () => {
      const res = await request(app)
        .post('/api/ai/ask')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ question: 'Give me city-wise sales for the last three months' });

      expect(res.status).toBe(200);
      expect(res.body.data.intent).toBe('CITY_SALES');
      expect(res.body.data.columns.some((c) => c.key === 'city')).toBe(true);
      expect(res.body.data.rows.length).toBeGreaterThan(0);
    });

    it('Question 6: Summarize business performance for the current quarter', async () => {
      const res = await request(app)
        .post('/api/ai/ask')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ question: 'Summarize business performance for the current quarter' });

      expect(res.status).toBe(200);
      expect(res.body.data.intent).toBe('QUARTERLY_SUMMARY');
      expect(res.body.data.summaryMetrics).toHaveProperty('totalRevenue');
      expect(res.body.data.summaryMetrics).toHaveProperty('topProduct');
      expect(res.body.data.answer).toContain('quarterly summary');
    });

    it('Question 7: Which customers have reduced their purchases', async () => {
      const res = await request(app)
        .post('/api/ai/ask')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ question: 'Which customers have reduced their purchases?' });

      expect(res.status).toBe(200);
      expect(res.body.data.intent).toBe('DECLINING_CUSTOMERS');
      expect(res.body.data.summaryMetrics).toHaveProperty('decliningCount');
      expect(res.body.data.columns.some((c) => c.key === 'spend_drop')).toBe(true);
    });
  });

  describe('4. Unsupported Questions & Guidance', () => {
    it('should return helpful guidance and suggested questions for unsupported queries', async () => {
      const res = await request(app)
        .post('/api/ai/ask')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ question: 'What is the weather in Tokyo today?' });

      expect(res.status).toBe(200);
      expect(res.body.data.intent).toBe('UNSUPPORTED');
      expect(res.body.data.answer).toContain('does not match a supported reporting operation');
      expect(res.body.data.suggestions).toBeDefined();
      expect(res.body.data.suggestions.length).toBeGreaterThan(3);
    });
  });

  describe('5. Provider Configuration & Error Handling', () => {
    it('should return 503 AI_NOT_CONFIGURED if provider is openai but OPENAI_API_KEY is missing', async () => {
      const origProvider = process.env.AI_PROVIDER;
      const origKey = process.env.OPENAI_API_KEY;

      process.env.AI_PROVIDER = 'openai';
      process.env.OPENAI_API_KEY = '';

      try {
        const res = await request(app)
          .post('/api/ai/ask')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ question: 'What were total sales last month?' });

        expect(res.status).toBe(503);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('AI_NOT_CONFIGURED');
        expect(res.body.error.message).toContain('OPENAI_API_KEY');
      } finally {
        process.env.AI_PROVIDER = origProvider;
        process.env.OPENAI_API_KEY = origKey;
      }
    });

    it('should handle OpenAI API timeout error safely', async () => {
      const origProvider = process.env.AI_PROVIDER;
      const origKey = process.env.OPENAI_API_KEY;
      const origFetch = global.fetch;

      process.env.AI_PROVIDER = 'openai';
      process.env.OPENAI_API_KEY = 'sk-mock-test-key-for-timeout';

      global.fetch = vi.fn().mockImplementationOnce(() => {
        const abortErr = new Error('The operation was aborted');
        abortErr.name = 'AbortError';
        throw abortErr;
      });

      try {
        const res = await request(app)
          .post('/api/ai/ask')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ question: 'What were total sales last month?' });

        expect(res.status).toBe(504);
        expect(res.body.error.code).toBe('AI_TIMEOUT');
      } finally {
        global.fetch = origFetch;
        process.env.AI_PROVIDER = origProvider;
        process.env.OPENAI_API_KEY = origKey;
      }
    });
  });
});
