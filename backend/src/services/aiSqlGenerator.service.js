const { Parser } = require('node-sql-parser');
const { queryAiReadonly } = require('../config/db');
const config = require('../config/env');
const { ApiError } = require('../middleware/errorHandler');

const ALLOWED_VIEWS = ['ai_customers', 'ai_products', 'ai_sales', 'ai_sale_items'];

const ALLOWED_FUNCTIONS = new Set([
  'count', 'sum', 'avg', 'min', 'max',
  'round', 'coalesce', 'nullif', 'greatest', 'least', 'abs', 'floor', 'ceil',
  'lower', 'upper', 'trim', 'substr', 'substring', 'concat', 'length', 'replace',
  'to_char', 'to_date', 'date_trunc', 'date_part', 'extract', 'now', 'current_date',
  'current_timestamp', 'age'
]);

class AiSqlGeneratorService {
  constructor() {
    this.parser = new Parser();
  }

  /**
   * Validate SQL before execution using AST parser
   * 1. Exactly one statement
   * 2. SELECT or WITH...SELECT only
   * 3. Only the 4 allowed views (and defined CTEs); reject other tables/schemas/catalogs
   * 4. Allow-listed functions only
   * 5. Append LIMIT 100 if missing; cap to 100 if > 100
   */
  validateSql(sql) {
    if (!sql || typeof sql !== 'string' || sql.trim().length === 0) {
      throw new Error('Empty SQL string provided.');
    }

    let ast;
    try {
      ast = this.parser.astify(sql, { database: 'postgresql' });
    } catch (err) {
      throw new Error(`SQL syntax error: ${err.message}`);
    }

    // 1. Exactly one statement
    if (Array.isArray(ast)) {
      if (ast.length !== 1) {
        throw new Error('Multiple SQL statements are not permitted.');
      }
      ast = ast[0];
    }

    // 2. SELECT or WITH...SELECT only
    if (!ast || ast.type !== 'select') {
      throw new Error('Only SELECT statements are permitted.');
    }

    // Collect CTE names if WITH clause is present
    const cteNames = new Set(
      (ast.with || []).map((w) => {
        const nameVal = w.name?.value || w.name || '';
        return String(nameVal).toLowerCase();
      })
    );

    // 3. Allowed views check
    let tableList;
    try {
      tableList = this.parser.tableList(sql, { database: 'postgresql' });
    } catch (err) {
      throw new Error(`Failed to extract tables: ${err.message}`);
    }

    if (!tableList || tableList.length === 0) {
      // Must reference at least one allowed view
      throw new Error('Query must reference at least one allowed view.');
    }

    for (const item of tableList) {
      const parts = item.split('::');
      const action = parts[0]?.toLowerCase();
      const schema = parts[1]?.toLowerCase();
      const table = parts[2]?.toLowerCase();

      if (action !== 'select') {
        throw new Error(`Unauthorized SQL operation '${action}'. Only SELECT is permitted.`);
      }

      if (schema && schema !== 'null' && schema !== 'public') {
        throw new Error(`Access to schema '${schema}' is prohibited.`);
      }

      if (!ALLOWED_VIEWS.includes(table) && !cteNames.has(table)) {
        throw new Error(`Access to table or view '${table}' is strictly prohibited.`);
      }
    }

    // 4. Function allow-list check
    this.checkFunctions(ast);

    // 5. Enforce LIMIT <= 100
    if (!ast.limit || !ast.limit.value || ast.limit.value.length === 0) {
      ast.limit = {
        seperator: '',
        value: [{ type: 'number', value: 100 }],
      };
    } else {
      const limitVal = ast.limit.value[0];
      if (limitVal && limitVal.type === 'number' && limitVal.value > 100) {
        limitVal.value = 100;
      }
    }

    return this.parser.sqlify(ast, { database: 'postgresql' });
  }

  /**
   * Recursively verify all function calls in AST against allowed functions
   */
  checkFunctions(node) {
    if (!node || typeof node !== 'object') return;

    if (node.type === 'function') {
      let fnName = '';
      if (typeof node.name === 'string') {
        fnName = node.name;
      } else if (node.name?.name && Array.isArray(node.name.name)) {
        fnName = node.name.name.map((p) => p.value).join('.');
      } else if (node.name?.value) {
        fnName = node.name.value;
      }
      fnName = fnName.toLowerCase();

      // Check if function is pg_sleep or other unauthorized function
      if (!ALLOWED_FUNCTIONS.has(fnName)) {
        throw new Error(`Function '${fnName}' is not permitted.`);
      }
    }

    for (const key of Object.keys(node)) {
      if (Array.isArray(node[key])) {
        node[key].forEach((child) => this.checkFunctions(child));
      } else if (typeof node[key] === 'object' && node[key] !== null) {
        this.checkFunctions(node[key]);
      }
    }
  }

  /**
   * Call Gemini API with system instructions
   */
  async callGemini(prompt, systemInstruction) {
    const apiKey = process.env.GEMINI_API_KEY || config.ai?.geminiApiKey;
    if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
      throw new ApiError(
        503,
        'Gemini API key is not configured. Please set GEMINI_API_KEY in .env.',
        'AI_NOT_CONFIGURED'
      );
    }

    const model = process.env.GEMINI_MODEL || config.ai?.geminiModel || 'gemini-2.5-flash';
    const timeoutMs = config.ai?.timeoutMs || 15000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const isBearerToken = apiKey.startsWith('AQ.') || apiKey.startsWith('ya29.');
      const url = isBearerToken
        ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
        : `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const headers = { 'Content-Type': 'application/json' };
      if (isBearerToken) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      } else {
        headers['x-goog-api-key'] = apiKey;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 500,
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text();
        throw new ApiError(response.status, `Gemini API error: ${errText}`, 'AI_PROVIDER_ERROR');
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return rawText.trim();
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new ApiError(504, `Gemini API timed out after ${timeoutMs}ms.`, 'AI_TIMEOUT');
      }
      throw err;
    }
  }

  /**
   * Ask Gemini to generate ONE SELECT query based on the 4 allowed views
   */
  async generateSql(question, previousError = null) {
    const systemInstruction = `You are a strict PostgreSQL database query generator.
Translate the user's question into ONE PostgreSQL SELECT query.

Allowed Database Schema:
- ai_customers (customer_code, customer_name, city, status, created_at)
- ai_products (id, product_name, category, unit_price, is_active)
- ai_sales (id, customer_id, sale_date, total_amount, status)
- ai_sale_items (id, sale_id, product_id, quantity, unit_price, line_total)

Strict Instructions:
1. Output JSON ONLY in this format:
{"sql": "SELECT ..."}
or if the question is not about the data in these views:
{"error": "not_about_data"}
2. Exactly ONE query. Only SELECT or WITH...SELECT.
3. Access ONLY the 4 views above. Never access any other table, schema, or system catalog.
4. Do NOT use functions like pg_sleep, pg_read_file, set_config, dblink.
5. Return raw JSON without markdown code fences.`;

    let prompt = `User Question: "${question}"`;
    if (previousError) {
      prompt += `\n\nPrevious attempt failed with error: "${previousError}". Please fix the query using only the 4 allowed views.`;
    }

    const responseText = await this.callGemini(prompt, systemInstruction);

    // Extract JSON
    const match = responseText.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error(`Gemini response is not valid JSON: ${responseText}`);
    }

    const result = JSON.parse(match[0]);
    return result;
  }

  /**
   * Generate short explanation grounded only in first 15 rows
   */
  async generateExplanation(question, rows) {
    const first15 = rows.slice(0, 15);
    const systemInstruction = `You are Smart BI, an executive business intelligence assistant.
Explain the database results concisely (under 3 sentences) grounded strictly in the provided data.
Rules:
1. Never hallucinate or invent numbers, customers, or products not in the dataset.
2. Present exact numbers and format currency where appropriate.
3. Do not include markdown code blocks.`;

    const prompt = `User Question: "${question}"
Data (first 15 rows):
${JSON.stringify(first15, null, 2)}

Provide a concise, direct explanation grounded only in these rows:`;

    try {
      return await this.callGemini(prompt, systemInstruction);
    } catch {
      // Graceful fallback to deterministic ground truth explanation
      return `Query completed successfully, returning ${rows.length} record${rows.length === 1 ? '' : 's'}.`;
    }
  }

  /**
   * Execute dynamic query flow:
   * 1. Ask Gemini for SQL
   * 2. If not_about_data -> return not about data message
   * 3. Validate SQL with parser
   * 4. Run with ai_readonly pool
   * 5. If DB fails, send error to Gemini once to fix
   * 6. Ground explanation in rows
   */
  async processDynamicQuery(question) {
    // 1. Generate initial SQL
    let geminiRes;
    try {
      geminiRes = await this.generateSql(question);
    } catch (err) {
      return { success: false, error: err.message };
    }

    if (geminiRes.error === 'not_about_data') {
      return {
        success: true,
        notAboutData: true,
        answer: 'I can only answer questions about the sales, customers and products in this system.',
        columns: [],
        rows: [],
        generatedSql: null,
      };
    }

    if (!geminiRes.sql) {
      return { success: false, error: 'No SQL generated' };
    }

    let sqlToExecute = geminiRes.sql;
    let queryResult = null;
    let validatedSql = null;

    // 2. Validate and attempt execution
    try {
      validatedSql = this.validateSql(sqlToExecute);
      queryResult = await queryAiReadonly(validatedSql);
    } catch (firstErr) {
      // Retry once by sending error to Gemini
      try {
        const retryRes = await this.generateSql(question, firstErr.message);
        if (retryRes.error === 'not_about_data') {
          return {
            success: true,
            notAboutData: true,
            answer: 'I can only answer questions about the sales, customers and products in this system.',
            columns: [],
            rows: [],
            generatedSql: null,
          };
        }

        if (retryRes.sql) {
          validatedSql = this.validateSql(retryRes.sql);
          queryResult = await queryAiReadonly(validatedSql);
        }
      } catch (retryErr) {
        return { success: false, error: retryErr.message };
      }
    }

    if (!queryResult) {
      return { success: false, error: 'Query execution failed' };
    }

    const rows = queryResult.rows || [];
    const columns = (queryResult.fields || []).map((f) => ({
      key: f.name,
      label: f.name
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' '),
    }));

    // Generate grounded explanation
    let explanation = '';
    try {
      explanation = await this.generateExplanation(question, rows);
    } catch {
      explanation = `Query returned ${rows.length} record${rows.length === 1 ? '' : 's'}.`;
    }

    return {
      success: true,
      answer: explanation,
      reportTitle: 'Dynamic Query Results',
      columns,
      rows,
      generatedSql: validatedSql,
      summaryMetrics: {
        rowsShown: rows.length,
      },
    };
  }
}

module.exports = new AiSqlGeneratorService();
