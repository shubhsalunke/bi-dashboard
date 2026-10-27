import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app';
const aiSqlGeneratorService = require('../src/services/aiSqlGenerator.service');

describe('Dynamic AI SQL Guardrails & Execution', () => {
  let adminToken;
  let origDynamicSql;
  let origGeminiKey;

  beforeAll(async () => {
    origDynamicSql = process.env.AI_DYNAMIC_SQL;
    origGeminiKey = process.env.GEMINI_API_KEY;

    // Login as admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@bi.corp', password: 'Admin123!' });
    adminToken = adminLogin.body.data.accessToken;
  });

  afterAll(() => {
    process.env.AI_DYNAMIC_SQL = origDynamicSql;
    process.env.GEMINI_API_KEY = origGeminiKey;
  });

  describe('1. AST SQL Validator Security Guardrails (Unit Tests)', () => {
    it('rejects "drop table customers"', () => {
      expect(() => {
        aiSqlGeneratorService.validateSql('DROP TABLE customers;');
      }).toThrow(/(Only SELECT|syntax error)/i);
    });

    it('rejects "show user passwords" / invalid commands', () => {
      expect(() => {
        aiSqlGeneratorService.validateSql('SHOW user passwords;');
      }).toThrow(/(Only SELECT|syntax error)/i);
    });

    it('rejects "list audit logs" / queries selecting from audit_logs table', () => {
      expect(() => {
        aiSqlGeneratorService.validateSql('SELECT * FROM audit_logs;');
      }).toThrow(/prohibited/i);
    });

    it('rejects prompt injection attempts running DELETE', () => {
      expect(() => {
        aiSqlGeneratorService.validateSql('DELETE FROM ai_customers WHERE 1=1;');
      }).toThrow(/(Only SELECT|prohibited)/i);
    });

    it('rejects SQL with two statements (multi-statement injection)', () => {
      expect(() => {
        aiSqlGeneratorService.validateSql('SELECT * FROM ai_customers; SELECT * FROM ai_products;');
      }).toThrow(/Multiple SQL statements/i);
    });

    it('rejects SQL using users table', () => {
      expect(() => {
        aiSqlGeneratorService.validateSql('SELECT email, password_hash FROM users;');
      }).toThrow(/Access to table or view 'users' is strictly prohibited/i);
    });

    it('rejects SQL with pg_sleep function call', () => {
      expect(() => {
        aiSqlGeneratorService.validateSql('SELECT pg_sleep(5) FROM ai_customers;');
      }).toThrow(/Function 'pg_sleep' is not permitted/i);
    });

    it('rejects other dangerous system functions (e.g. pg_read_file, dblink)', () => {
      expect(() => {
        aiSqlGeneratorService.validateSql("SELECT pg_read_file('/etc/passwd') FROM ai_customers;");
      }).toThrow(/Function 'pg_read_file' is not permitted/i);
    });
  });

  describe('2. Valid SELECTs on Allowed Views & LIMIT Enforcement', () => {
    it('validates SELECT on ai_customers and appends LIMIT 100 if none provided', () => {
      const validated = aiSqlGeneratorService.validateSql('SELECT customer_name, city FROM ai_customers');
      expect(validated).toContain('LIMIT 100');
      expect(validated.toLowerCase()).toContain('ai_customers');
    });

    it('validates SELECT on ai_products and caps LIMIT to 100 if > 100', () => {
      const validated = aiSqlGeneratorService.validateSql('SELECT product_name, unit_price FROM ai_products LIMIT 250');
      expect(validated).toContain('LIMIT 100');
      expect(validated).not.toContain('250');
    });

    it('validates SELECT on ai_sales with existing LIMIT under 100', () => {
      const validated = aiSqlGeneratorService.validateSql('SELECT id, total_amount FROM ai_sales LIMIT 25');
      expect(validated).toContain('LIMIT 25');
    });

    it('validates SELECT on ai_sale_items with allowed aggregate functions', () => {
      const validated = aiSqlGeneratorService.validateSql('SELECT product_id, SUM(quantity) as total_qty FROM ai_sale_items GROUP BY product_id');
      expect(validated).toContain('LIMIT 100');
    });

    it('validates Common Table Expressions (WITH ... SELECT) referencing allowed views', () => {
      const sql = 'WITH active_p AS (SELECT * FROM ai_products WHERE is_active = true) SELECT * FROM active_p';
      const validated = aiSqlGeneratorService.validateSql(sql);
      expect(validated).toContain('LIMIT 100');
    });
  });

  describe('3. Dynamic Flow Execution & Retry Handling (API Integration with Mocked Gemini)', () => {
    beforeAll(() => {
      process.env.AI_DYNAMIC_SQL = 'true';
      process.env.GEMINI_API_KEY = 'mock-gemini-test-key';
    });

    afterAll(() => {
      process.env.AI_DYNAMIC_SQL = 'false';
    });

    it('answers with not_about_data message when Gemini determines question is off-topic', async () => {
      vi.spyOn(aiSqlGeneratorService, 'generateSql').mockResolvedValueOnce({
        error: 'not_about_data',
      });

      const res = await request(app)
        .post('/api/ai/ask')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ question: 'What is the capital of Australia?' });

      expect(res.status).toBe(200);
      expect(res.body.data.intent).toBe('NOT_ABOUT_DATA');
      expect(res.body.data.answer).toBe('I can only answer questions about the sales, customers and products in this system.');
      expect(res.body.data.rows).toEqual([]);
    });

    it('executes valid dynamic query, grounds explanation, and returns table data', async () => {
      vi.spyOn(aiSqlGeneratorService, 'generateSql').mockResolvedValueOnce({
        sql: 'SELECT customer_name, city FROM ai_customers ORDER BY customer_name ASC',
      });
      vi.spyOn(aiSqlGeneratorService, 'generateExplanation').mockResolvedValueOnce(
        'Here are the customer accounts registered across various cities.'
      );

      const res = await request(app)
        .post('/api/ai/ask')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ question: 'List all companies and their cities in alphabetical order' });

      expect(res.status).toBe(200);
      expect(res.body.data.intent).toBe('DYNAMIC_SQL');
      expect(res.body.data.answer).toBe('Here are the customer accounts registered across various cities.');
      expect(res.body.data.rows.length).toBeGreaterThan(0);
      expect(res.body.data.columns.some((c) => c.key === 'customer_name')).toBe(true);
      expect(res.body.data.columns.some((c) => c.key === 'city')).toBe(true);
    });

    it('retries with Gemini once if initial query fails with DB error, and succeeds on retry', async () => {
      // First attempt produces invalid SQL, second attempt succeeds
      const generateSqlSpy = vi.spyOn(aiSqlGeneratorService, 'generateSql')
        .mockResolvedValueOnce({
          sql: 'SELECT nonexistent_col FROM ai_customers',
        })
        .mockResolvedValueOnce({
          sql: 'SELECT customer_name, status FROM ai_customers',
        });

      vi.spyOn(aiSqlGeneratorService, 'generateExplanation').mockResolvedValueOnce(
        'Customers retrieved after query correction.'
      );

      const res = await request(app)
        .post('/api/ai/ask')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ question: 'Show customer statuses' });

      expect(res.status).toBe(200);
      expect(generateSqlSpy).toHaveBeenCalledTimes(2);
      expect(res.body.data.intent).toBe('DYNAMIC_SQL');
      expect(res.body.data.rows.length).toBeGreaterThan(0);
    });

    it('falls back to plain guidance if query still fails after retry', async () => {
      vi.spyOn(aiSqlGeneratorService, 'generateSql')
        .mockResolvedValueOnce({
          sql: 'SELECT bad_col_1 FROM ai_customers',
        })
        .mockResolvedValueOnce({
          sql: 'SELECT bad_col_2 FROM ai_customers',
        });

      const res = await request(app)
        .post('/api/ai/ask')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ question: 'Some impossible question that breaks twice' });

      expect(res.status).toBe(200);
      expect(res.body.data.intent).toBe('UNSUPPORTED');
      expect(res.body.data.answer).toContain("I can't answer that yet. Try one of these:");
    });

    it('falls back to default unsupported behavior when AI_DYNAMIC_SQL is false', async () => {
      process.env.AI_DYNAMIC_SQL = 'false';

      const res = await request(app)
        .post('/api/ai/ask')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ question: 'Tell me about the weather in London' });

      expect(res.status).toBe(200);
      expect(res.body.data.intent).toBe('UNSUPPORTED');
      expect(res.body.data.answer).toContain("I can't answer that yet. Try one of these:");
    });
  });
});
