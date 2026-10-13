const config = require('../config/env');
const { ApiError } = require('../middleware/errorHandler');

class AiProviderService {
  /**
   * Generate an executive explanation grounded strictly in the returned business data
   */
  async generateExplanation(question, reportData) {
    const provider = process.env.AI_PROVIDER || config.ai?.provider || 'openai';

    // If intent was security blocked
    if (reportData.intent === 'SECURITY_BLOCKED') {
      return reportData.error || 'Arbitrary database modification commands are prohibited.';
    }

    // If intent was unsupported
    if (reportData.intent === 'UNSUPPORTED') {
      return (
        "I specialize in analyzing business intelligence data from verified live business records. " +
        "Your question does not match a supported reporting operation. Here are examples of questions you can ask:\n" +
        "• What were total sales last month?\n" +
        "• Show the top 10 customers by sales\n" +
        "• Which product generated the highest revenue?\n" +
        "• Compare this month with the previous month\n" +
        "• Give me city-wise sales for the last three months\n" +
        "• Summarize business performance for the current quarter\n" +
        "• Which customers have reduced their purchases?"
      );
    }

    // If provider is Gemini
    if (provider === 'gemini') {
      return this.callGemini(question, reportData);
    }

    // If provider is OpenAI
    if (provider === 'openai') {
      return this.callOpenAi(question, reportData);
    }

    // Mock Provider (Deterministic ground-truth generation)
    return this.generateMockExplanation(question, reportData);
  }

  /**
   * Call Google Gemini API (gemini-2.5-flash)
   */
  async callGemini(question, reportData) {
    const apiKey = process.env.GEMINI_API_KEY !== undefined ? process.env.GEMINI_API_KEY : config.ai?.geminiApiKey;
    if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
      throw new ApiError(
        503,
        'Gemini API key is not configured. Please set GEMINI_API_KEY in the environment variables to enable live AI responses.',
        'AI_NOT_CONFIGURED'
      );
    }

    const systemInstruction = `You are OmniIntel BI, an executive business intelligence AI assistant.
Answer the user's question concisely using ONLY the provided verified business records below.
Rules:
1. Ground every claim directly in the provided dataset. Never fabricate or hallucinate numbers, dates, customers, or products not in the dataset.
2. Present exact figures with currency symbols where appropriate.
3. Be professional, direct, executive-ready, and concise (under 4 sentences).
4. Do not include markdown code fences in your response.`;

    const userPrompt = `User Question: "${question}"

Verified Database Report: "${reportData.reportTitle || 'Business Data'}"
Summary Metrics: ${JSON.stringify(reportData.summaryMetrics || {})}
Data Rows:
${JSON.stringify(reportData.rows?.slice(0, 15) || [], null, 2)}

Provide a concise, executive-level explanation grounded entirely in this data:`;

    const model = process.env.GEMINI_MODEL || config.ai?.geminiModel || 'gemini-2.5-flash';
    const timeoutMs = config.ai?.timeoutMs || 15000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: userPrompt }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 400,
            thinkingConfig: {
              thinkingBudget: 0,
            },
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 400 || response.status === 401 || response.status === 403) {
          const errBody = await response.text();
          throw new ApiError(401, `Invalid Gemini API key: ${errBody}`, 'AI_PROVIDER_AUTH_ERROR');
        }
        if (response.status === 429) {
          throw new ApiError(429, 'Gemini rate limit or quota exceeded. Please try again shortly.', 'AI_RATE_LIMIT');
        }
        const errBody = await response.text();
        throw new ApiError(response.status, `Gemini API returned an error: ${errBody}`, 'AI_PROVIDER_ERROR');
      }

      const json = await response.json();
      const content = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) {
        throw new ApiError(502, 'AI provider returned an empty response.', 'AI_EMPTY_RESPONSE');
      }

      return content.trim();
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new ApiError(504, `AI provider request timed out after ${timeoutMs}ms.`, 'AI_TIMEOUT');
      }
      if (err instanceof ApiError) {
        throw err;
      }
      throw new ApiError(500, `Failed to communicate with AI provider: ${err.message}`, 'AI_NETWORK_ERROR');
    }
  }

  /**
   * Call OpenAI Chat Completions API
   */
  async callOpenAi(question, reportData) {
    const apiKey = process.env.OPENAI_API_KEY !== undefined ? process.env.OPENAI_API_KEY : config.ai?.openaiApiKey;
    if (!apiKey || apiKey.trim() === '' || apiKey === 'your_openai_api_key_here') {
      throw new ApiError(
        503,
        'OpenAI API key is not configured. Please set OPENAI_API_KEY in the backend environment variables (backend/.env) to enable live AI responses.',
        'AI_NOT_CONFIGURED'
      );
    }

    const systemPrompt = `You are OmniIntel BI, an executive business intelligence AI assistant.
Answer the user's question concisely using ONLY the provided verified business records below.
Rules:
1. Never fabricate or hallucinate numbers, dates, customers, or products not in the dataset.
2. Present exact figures with currency symbols where appropriate.
3. Be professional, direct, and concise (under 4 sentences).
4. Do not include markdown code fences in your response.`;

    const userPrompt = `User Question: "${question}"

Verified Database Report: "${reportData.reportTitle || 'Business Data'}"
Summary Metrics: ${JSON.stringify(reportData.summaryMetrics || {})}
Data Rows:
${JSON.stringify(reportData.rows?.slice(0, 15) || [], null, 2)}

Provide a concise, executive-level explanation grounded entirely in this data:`;

    const timeoutMs = config.ai.timeoutMs || 15000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: config.ai.openaiModel || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.2,
          max_tokens: 400,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          throw new ApiError(401, 'Invalid OpenAI API key. Please check your credentials in backend/.env', 'AI_PROVIDER_AUTH_ERROR');
        }
        if (response.status === 429) {
          throw new ApiError(429, 'OpenAI rate limit or quota exceeded. Please try again shortly.', 'AI_RATE_LIMIT');
        }
        const errBody = await response.text();
        throw new ApiError(response.status, `OpenAI API returned an error: ${errBody}`, 'AI_PROVIDER_ERROR');
      }

      const json = await response.json();
      const content = json.choices?.[0]?.message?.content;
      if (!content) {
        throw new ApiError(502, 'AI provider returned an empty response.', 'AI_EMPTY_RESPONSE');
      }

      return content.trim();
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new ApiError(504, `AI provider request timed out after ${timeoutMs}ms.`, 'AI_TIMEOUT');
      }
      if (err instanceof ApiError) {
        throw err;
      }
      throw new ApiError(500, `Failed to communicate with AI provider: ${err.message}`, 'AI_NETWORK_ERROR');
    }
  }

  /**
   * Deterministic Ground-Truth Analysis Generator (Mock Mode / Offline Testing)
   */
  generateMockExplanation(question, reportData) {
    const { intent, summaryMetrics, rows, reportTitle } = reportData;

    switch (intent) {
      case 'TOTAL_SALES': {
        const rev = summaryMetrics.totalRevenue
          ? `$${summaryMetrics.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
          : '$0.00';
        const orders = summaryMetrics.totalOrders || 0;
        const avg = summaryMetrics.averageOrderValue
          ? `$${summaryMetrics.averageOrderValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
          : '$0.00';
        return `Based on verified business records, total revenue stands at ${rev} across ${orders} completed sales orders, with an average transaction value of ${avg}.`;
      }

      case 'TOP_CUSTOMERS': {
        if (!rows || rows.length === 0) {
          return 'No customer transactions found in the database records.';
        }
        const top = rows[0];
        const second = rows[1];
        let text = `The highest-spending customer is ${top.customer_name} (${top.customer_code}) with ${top.formatted_revenue} in sales across ${top.orders_count} orders.`;
        if (second) {
          text += ` In second place is ${second.customer_name} with ${second.formatted_revenue} across ${second.orders_count} orders.`;
        }
        return text;
      }

      case 'TOP_PRODUCTS': {
        if (!rows || rows.length === 0) {
          return 'No product sales recorded in the database.';
        }
        const top = rows[0];
        return `The leading revenue generator is "${top.product_name}" (${top.category}), delivering ${top.formatted_revenue} in revenue across ${top.units_sold} units sold.`;
      }

      case 'MOM_COMPARISON': {
        const growth = summaryMetrics.growthPercentage || '0%';
        const prev = `$${(summaryMetrics.previousRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        const curr = `$${(summaryMetrics.currentRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        return `Month-over-month sales review: Revenue changed by ${growth}, shifting from ${prev} in ${summaryMetrics.previousMonth} to ${curr} in ${summaryMetrics.currentMonth}.`;
      }

      case 'CITY_SALES': {
        if (!rows || rows.length === 0) {
          return 'No geographic sales records available.';
        }
        const top = rows[0];
        return `Regional performance highlights ${top.city} as the top geographic market, generating ${top.formatted_revenue} across ${top.orders_count} orders, with an average ticket of ${top.formatted_avg}.`;
      }

      case 'QUARTERLY_SUMMARY': {
        const rev = `$${(summaryMetrics.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        return `Executive quarterly summary: The business recorded ${rev} in completed revenue across ${summaryMetrics.totalOrders || 0} transactions. The top product was "${summaryMetrics.topProduct || 'N/A'}" and the highest grossing market was ${summaryMetrics.topCity || 'N/A'}.`;
      }

      case 'DECLINING_CUSTOMERS': {
        const count = summaryMetrics.decliningCount || 0;
        if (count === 0) {
          return 'No customer accounts currently show a downward trend in purchases.';
        }
        return `Analysis identified ${count} customer accounts with declining purchase activity. The most significant decrease was observed in ${summaryMetrics.mostImpactedCustomer}.`;
      }

      case 'GREETING': {
        return 'Hello! I am your AI Business Intelligence Assistant. I analyze live sales, customers, products, and revenue trends from your business database. What business insight would you like to explore today?';
      }

      case 'UNSUPPORTED': {
        return "I couldn't identify a specific reporting metric for that question. You can ask about total sales, top customers, revenue products, month-over-month growth, or city performance.";
      }

      default:
        return `Report "${reportTitle}" compiled from ${rows?.length || 0} verified database records.`;
    }
  }
}

module.exports = new AiProviderService();
