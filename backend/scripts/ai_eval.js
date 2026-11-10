/**
 * AI Text-to-SQL Evaluation Script (40 Questions)
 *
 * Usage:
 *   GEMINI_API_KEY=your_key AI_DYNAMIC_SQL=true node scripts/ai_eval.js
 */

const config = require('../src/config/env');
const { pool, aiPool, queryAiReadonly } = require('../src/config/db');
const aiSqlGeneratorService = require('../src/services/aiSqlGenerator.service');

const EVAL_CASES = [
  {
    id: 1,
    question: 'How many total customers are registered?',
    referenceSql: 'SELECT COUNT(*)::int AS customer_count FROM ai_customers',
  },
  {
    id: 2,
    question: 'How many active customers do we have?',
    referenceSql: "SELECT COUNT(*)::int AS active_customers FROM ai_customers WHERE status = 'active'",
  },
  {
    id: 3,
    question: 'List all active customers in Mumbai sorted alphabetically.',
    referenceSql: "SELECT customer_code, customer_name, city FROM ai_customers WHERE status = 'active' AND LOWER(city) = 'mumbai' ORDER BY customer_name ASC",
  },
  {
    id: 4,
    question: 'Which cities have active customers and how many in each city?',
    referenceSql: "SELECT city, COUNT(*)::int AS customer_count FROM ai_customers WHERE status = 'active' GROUP BY city ORDER BY customer_count DESC, city ASC",
  },
  {
    id: 5,
    question: 'How many active products are in the catalog?',
    referenceSql: 'SELECT COUNT(*)::int AS active_products FROM ai_products WHERE is_active = true',
  },
  {
    id: 6,
    question: 'Which active products are low on stock (stock at or below reorder level)?',
    referenceSql: 'SELECT sku, product_name, stock_quantity, reorder_level FROM ai_products WHERE is_active = true AND stock_quantity <= reorder_level ORDER BY stock_quantity ASC, product_name ASC',
  },
  {
    id: 7,
    question: 'Which products are completely out of stock?',
    referenceSql: 'SELECT sku, product_name, category, brand FROM ai_products WHERE stock_quantity = 0 ORDER BY product_name ASC',
  },
  {
    id: 8,
    question: 'What is the most expensive active product by unit price?',
    referenceSql: 'SELECT product_name, category, brand, unit_price FROM ai_products WHERE is_active = true ORDER BY unit_price DESC LIMIT 1',
  },
  {
    id: 9,
    question: 'List all Tata brand products and their unit prices.',
    referenceSql: "SELECT sku, product_name, category, unit_price FROM ai_products WHERE LOWER(brand) = 'tata' ORDER BY unit_price DESC",
  },
  {
    id: 10,
    question: 'How many products belong to each category?',
    referenceSql: 'SELECT category, COUNT(*)::int AS product_count FROM ai_products GROUP BY category ORDER BY product_count DESC, category ASC',
  },
  {
    id: 11,
    question: 'Which products have a 24-month warranty?',
    referenceSql: 'SELECT sku, product_name, brand, warranty_months FROM ai_products WHERE warranty_months = 24 ORDER BY product_name ASC',
  },
  {
    id: 12,
    question: 'What is the total completed sales revenue across all time?',
    referenceSql: "SELECT ROUND(COALESCE(SUM(total_amount), 0), 2) AS total_revenue FROM ai_sales WHERE status = 'completed'",
  },
  {
    id: 13,
    question: 'How many completed orders are there and what is the average order value?',
    referenceSql: "SELECT COUNT(*)::int AS total_orders, ROUND(COALESCE(AVG(total_amount), 0), 2) AS avg_order_value FROM ai_sales WHERE status = 'completed'",
  },
  {
    id: 14,
    question: 'Show total orders and total amount broken down by sale status.',
    referenceSql: 'SELECT status, COUNT(*)::int AS order_count, ROUND(COALESCE(SUM(total_amount), 0), 2) AS total_amount FROM ai_sales GROUP BY status ORDER BY order_count DESC',
  },
  {
    id: 15,
    question: 'What were total completed sales in October 2026?',
    referenceSql: "SELECT COUNT(*)::int AS order_count, ROUND(COALESCE(SUM(total_amount), 0), 2) AS total_revenue FROM ai_sales WHERE status = 'completed' AND sale_date >= '2026-10-01' AND sale_date < '2026-11-01'",
  },
  {
    id: 16,
    question: 'What were total completed sales in September 2026?',
    referenceSql: "SELECT COUNT(*)::int AS order_count, ROUND(COALESCE(SUM(total_amount), 0), 2) AS total_revenue FROM ai_sales WHERE status = 'completed' AND sale_date >= '2026-09-01' AND sale_date < '2026-10-01'",
  },
  {
    id: 17,
    question: 'Show monthly completed revenue from oldest to newest.',
    referenceSql: "SELECT TO_CHAR(DATE_TRUNC('month', sale_date), 'YYYY-MM') AS month, COUNT(*)::int AS orders, ROUND(SUM(total_amount), 2) AS revenue FROM ai_sales WHERE status = 'completed' GROUP BY 1 ORDER BY 1 ASC",
  },
  {
    id: 18,
    question: 'Which month had the highest completed revenue?',
    referenceSql: "SELECT TO_CHAR(DATE_TRUNC('month', sale_date), 'YYYY-MM') AS month, ROUND(SUM(total_amount), 2) AS revenue FROM ai_sales WHERE status = 'completed' GROUP BY 1 ORDER BY revenue DESC LIMIT 1",
  },
  {
    id: 19,
    question: 'Show the top 3 customers by total completed spend.',
    referenceSql: "SELECT c.customer_name, c.city, ROUND(SUM(s.total_amount), 2) AS total_spent FROM ai_customers c JOIN ai_sales s ON s.customer_id = c.id WHERE s.status = 'completed' GROUP BY c.id, c.customer_name, c.city ORDER BY total_spent DESC LIMIT 3",
  },
  {
    id: 20,
    question: 'Which customer placed the single largest completed order?',
    referenceSql: "SELECT c.customer_name, s.id AS sale_id, s.sale_date, s.total_amount FROM ai_sales s JOIN ai_customers c ON s.customer_id = c.id WHERE s.status = 'completed' ORDER BY s.total_amount DESC LIMIT 1",
  },
  {
    id: 21,
    question: 'Show completed sales revenue by customer city.',
    referenceSql: "SELECT c.city, COUNT(s.id)::int AS orders_count, ROUND(SUM(s.total_amount), 2) AS total_revenue FROM ai_customers c JOIN ai_sales s ON s.customer_id = c.id WHERE s.status = 'completed' GROUP BY c.city ORDER BY total_revenue DESC",
  },
  {
    id: 22,
    question: 'What was total completed revenue from customers in Pune?',
    referenceSql: "SELECT ROUND(COALESCE(SUM(s.total_amount), 0), 2) AS pune_revenue FROM ai_sales s JOIN ai_customers c ON s.customer_id = c.id WHERE s.status = 'completed' AND LOWER(c.city) = 'pune'",
  },
  {
    id: 23,
    question: 'Which city has the highest average order value for completed orders?',
    referenceSql: "SELECT c.city, ROUND(AVG(s.total_amount), 2) AS avg_order_value FROM ai_customers c JOIN ai_sales s ON s.customer_id = c.id WHERE s.status = 'completed' GROUP BY c.city ORDER BY avg_order_value DESC LIMIT 1",
  },
  {
    id: 24,
    question: 'Show total units sold and revenue by product category.',
    referenceSql: "SELECT p.category, SUM(si.quantity)::int AS units_sold, ROUND(SUM(si.line_total), 2) AS total_revenue FROM ai_products p JOIN ai_sale_items si ON si.product_id = p.id JOIN ai_sales s ON s.id = si.sale_id WHERE s.status = 'completed' GROUP BY p.category ORDER BY total_revenue DESC",
  },
  {
    id: 25,
    question: 'Show total units sold and revenue by brand.',
    referenceSql: "SELECT p.brand, SUM(si.quantity)::int AS units_sold, ROUND(SUM(si.line_total), 2) AS total_revenue FROM ai_products p JOIN ai_sale_items si ON si.product_id = p.id JOIN ai_sales s ON s.id = si.sale_id WHERE s.status = 'completed' AND p.brand IS NOT NULL GROUP BY p.brand ORDER BY total_revenue DESC",
  },
  {
    id: 26,
    question: 'Which brand generated the highest completed revenue?',
    referenceSql: "SELECT p.brand, ROUND(SUM(si.line_total), 2) AS total_revenue FROM ai_products p JOIN ai_sale_items si ON si.product_id = p.id JOIN ai_sales s ON s.id = si.sale_id WHERE s.status = 'completed' AND p.brand IS NOT NULL GROUP BY p.brand ORDER BY total_revenue DESC LIMIT 1",
  },
  {
    id: 27,
    question: 'Which top 3 products sold the most total units?',
    referenceSql: "SELECT p.product_name, SUM(si.quantity)::int AS units_sold FROM ai_products p JOIN ai_sale_items si ON si.product_id = p.id JOIN ai_sales s ON s.id = si.sale_id WHERE s.status = 'completed' GROUP BY p.id, p.product_name ORDER BY units_sold DESC LIMIT 3",
  },
  {
    id: 28,
    question: 'Which products have never had a completed sale?',
    referenceSql: "SELECT p.sku, p.product_name, p.category FROM ai_products p LEFT JOIN ai_sale_items si ON si.product_id = p.id LEFT JOIN ai_sales s ON s.id = si.sale_id AND s.status = 'completed' WHERE s.id IS NULL ORDER BY p.product_name ASC",
  },
  {
    id: 29,
    question: 'Which customers have no completed orders?',
    referenceSql: "SELECT c.customer_code, c.customer_name, c.city FROM ai_customers c LEFT JOIN ai_sales s ON s.customer_id = c.id AND s.status = 'completed' WHERE s.id IS NULL ORDER BY c.customer_name ASC",
  },
  {
    id: 30,
    question: 'Which products did customers in Pune purchase and how much did they spend on each?',
    referenceSql: "SELECT p.product_name, SUM(si.quantity)::int AS units_sold, ROUND(SUM(si.line_total), 2) AS total_revenue FROM ai_sale_items si JOIN ai_sales s ON s.id = si.sale_id JOIN ai_customers c ON c.id = s.customer_id JOIN ai_products p ON p.id = si.product_id WHERE s.status = 'completed' AND LOWER(c.city) = 'pune' GROUP BY p.id, p.product_name ORDER BY total_revenue DESC",
  },
  {
    id: 31,
    question: 'Compare completed revenue for Cloud Infrastructure vs Enterprise Software.',
    referenceSql: "SELECT p.category, ROUND(SUM(si.line_total), 2) AS total_revenue FROM ai_products p JOIN ai_sale_items si ON si.product_id = p.id JOIN ai_sales s ON s.id = si.sale_id WHERE s.status = 'completed' AND LOWER(p.category) IN ('cloud infrastructure', 'enterprise software') GROUP BY p.category ORDER BY total_revenue DESC",
  },
  {
    id: 32,
    question: 'What was total revenue from Tata brand products in Q3 2026 (July to September 2026)?',
    referenceSql: "SELECT ROUND(COALESCE(SUM(si.line_total), 0), 2) AS total_revenue FROM ai_sale_items si JOIN ai_sales s ON s.id = si.sale_id JOIN ai_products p ON p.id = si.product_id WHERE s.status = 'completed' AND LOWER(p.brand) = 'tata' AND s.sale_date >= '2026-07-01' AND s.sale_date < '2026-10-01'",
  },
  {
    id: 33,
    question: 'How many distinct customers bought Cloud Infrastructure products?',
    referenceSql: "SELECT COUNT(DISTINCT s.customer_id)::int AS customer_count FROM ai_sales s JOIN ai_sale_items si ON si.sale_id = s.id JOIN ai_products p ON p.id = si.product_id WHERE s.status = 'completed' AND LOWER(p.category) = 'cloud infrastructure'",
  },
  {
    id: 34,
    question: 'What is the median completed order total?',
    referenceSql: "SELECT ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_amount)::numeric, 2) AS median_amount FROM ai_sales WHERE status = 'completed'",
  },
  {
    id: 35,
    question: 'List completed orders between 2026-07-01 and 2026-09-30 sorted by date.',
    referenceSql: "SELECT s.id, c.customer_name, s.sale_date, s.total_amount FROM ai_sales s JOIN ai_customers c ON s.customer_id = c.id WHERE s.status = 'completed' AND s.sale_date >= '2026-07-01' AND s.sale_date <= '2026-09-30' ORDER BY s.sale_date ASC, s.id ASC",
  },
  {
    id: 36,
    question: 'What is the average number of line items per completed sale?',
    referenceSql: "WITH counts AS (SELECT s.id, COUNT(si.id) AS item_cnt FROM ai_sales s LEFT JOIN ai_sale_items si ON si.sale_id = s.id WHERE s.status = 'completed' GROUP BY s.id) SELECT ROUND(AVG(item_cnt), 2) AS avg_items_per_sale FROM counts",
  },
  {
    id: 37,
    question: 'Rank customers by completed spend with their city and rank number.',
    referenceSql: "SELECT c.customer_name, c.city, ROUND(SUM(s.total_amount), 2) AS total_spent, RANK() OVER (ORDER BY SUM(s.total_amount) DESC) AS spend_rank FROM ai_customers c JOIN ai_sales s ON s.customer_id = c.id WHERE s.status = 'completed' GROUP BY c.id, c.customer_name, c.city ORDER BY spend_rank ASC",
  },
  {
    id: 38,
    question: 'Which product categories had sales in Hyderabad?',
    referenceSql: "SELECT p.category, ROUND(SUM(si.line_total), 2) AS total_revenue FROM ai_sale_items si JOIN ai_sales s ON s.id = si.sale_id JOIN ai_customers c ON c.id = s.customer_id JOIN ai_products p ON p.id = si.product_id WHERE s.status = 'completed' AND LOWER(c.city) = 'hyderabad' GROUP BY p.category ORDER BY total_revenue DESC",
  },
  {
    id: 39,
    question: 'What is the total stock value (stock_quantity * unit_price) of all active products?',
    referenceSql: 'SELECT ROUND(COALESCE(SUM(stock_quantity * unit_price), 0), 2) AS total_stock_value FROM ai_products WHERE is_active = true',
  },
  {
    id: 40,
    question: 'Show each customer with their count of completed orders and lifetime spend, including customers with zero orders.',
    referenceSql: "SELECT c.customer_name, c.city, COUNT(s.id)::int AS order_count, ROUND(COALESCE(SUM(s.total_amount), 0), 2) AS lifetime_spend FROM ai_customers c LEFT JOIN ai_sales s ON s.customer_id = c.id AND s.status = 'completed' GROUP BY c.id, c.customer_name, c.city ORDER BY lifetime_spend DESC, c.customer_name ASC",
  },
];

function normalizeValue(val) {
  if (val === null || val === undefined) return '';
  if (val instanceof Date) return val.toISOString().split('T')[0];
  if (typeof val === 'number') return Number(val.toFixed(2));
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}T/.test(str)) return str.split('T')[0];
  if (/^-?\d+(\.\d+)?$/.test(str)) return Number(parseFloat(str).toFixed(2));
  return str.toLowerCase();
}

function rowSignature(row) {
  return Object.values(row)
    .map(normalizeValue)
    .sort((a, b) => String(a).localeCompare(String(b)))
    .join('|');
}

function compareResults(expectedRows, actualRows) {
  if (!Array.isArray(actualRows)) return { pass: false, reason: 'Actual rows missing' };
  if (expectedRows.length !== actualRows.length) {
    return { pass: false, reason: `Row count mismatch: expected ${expectedRows.length}, got ${actualRows.length}` };
  }
  if (expectedRows.length === 0) return { pass: true };

  // Compare multi-row or scalar results as normalized sorted value bags
  const expSigs = expectedRows.map(rowSignature).sort();
  const actSigs = actualRows.map(rowSignature).sort();

  for (let i = 0; i < expSigs.length; i++) {
    // Allow subset match when actual query adds extra informative columns (e.g. id or sku)
    const expVals = expectedRows.map((r) => Object.values(r).map(normalizeValue));
    const actVals = actualRows.map((r) => Object.values(r).map(normalizeValue));
    if (expSigs[i] !== actSigs[i]) {
      const matchedSubset = expVals.every((ev) =>
        actVals.some((av) => ev.every((v) => av.includes(v)))
      );
      if (!matchedSubset) {
        return {
          pass: false,
          reason: `Value mismatch (expected sample: ${expSigs[0]}, got sample: ${actSigs[0]})`,
        };
      }
      return { pass: true };
    }
  }
  return { pass: true };
}

async function runEval() {
  const apiKey = process.env.GEMINI_API_KEY || config.ai?.geminiApiKey;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
    console.error('❌ GEMINI_API_KEY is not configured. Set GEMINI_API_KEY and AI_DYNAMIC_SQL=true to run ai_eval.');
    process.exit(1);
  }

  process.env.AI_DYNAMIC_SQL = 'true';
  console.log(`Running AI SQL Evaluation (${EVAL_CASES.length} questions) using model: ${process.env.GEMINI_MODEL || config.ai?.geminiModel || 'gemini-2.5-flash'}`);
  console.log('--------------------------------------------------------------------------------');

  let passed = 0;

  try {
    for (const tc of EVAL_CASES) {
      let expectedRows = [];
      try {
        const refRes = await queryAiReadonly(tc.referenceSql);
        expectedRows = refRes.rows || [];
      } catch (refErr) {
        console.log(`[FAIL] #${tc.id} "${tc.question}" -> Reference SQL error: ${refErr.message}`);
        continue;
      }

      try {
        const aiRes = await aiSqlGeneratorService.processDynamicQuery(tc.question, []);
        if (!aiRes || !aiRes.success) {
          console.log(`[FAIL] #${tc.id} "${tc.question}" -> AI error: ${aiRes?.error || 'Unknown'}`);
          continue;
        }
        if (aiRes.notAboutData || aiRes.isClarification) {
          console.log(`[FAIL] #${tc.id} "${tc.question}" -> Unexpected ${aiRes.isClarification ? 'clarification' : 'not_about_data'}: ${aiRes.answer}`);
          continue;
        }

        const cmp = compareResults(expectedRows, aiRes.rows || []);
        if (cmp.pass) {
          passed++;
          console.log(`[PASS] #${tc.id} "${tc.question}" (${aiRes.rows.length} rows)`);
        } else {
          console.log(`[FAIL] #${tc.id} "${tc.question}" -> ${cmp.reason}`);
          console.log(`       AI SQL: ${aiRes.generatedSql}`);
        }
      } catch (err) {
        console.log(`[FAIL] #${tc.id} "${tc.question}" -> Exception: ${err.message}`);
      }
    }
  } finally {
    const pct = ((passed / EVAL_CASES.length) * 100).toFixed(1);
    console.log('--------------------------------------------------------------------------------');
    console.log(`Evaluation Accuracy: ${passed}/${EVAL_CASES.length} (${pct}%)`);
    await aiPool.end().catch(() => {});
    await pool.end().catch(() => {});
  }
}

if (require.main === module) {
  runEval();
}

module.exports = { EVAL_CASES, compareResults };

