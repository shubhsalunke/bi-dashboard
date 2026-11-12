const { query, queryAiReadonly } = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');

class AiHistoryService {
  /**
   * List conversations belonging to the current user
   */
  async listConversations(userId) {
    const res = await query(
      `SELECT c.id, c.title, c.created_at, c.updated_at,
              (SELECT COUNT(*)::int FROM ai_messages m WHERE m.conversation_id = c.id) AS message_count
       FROM ai_conversations c
       WHERE c.user_id = $1
       ORDER BY c.updated_at DESC, c.id DESC
       LIMIT 50`,
      [userId]
    );
    return res.rows;
  }

  /**
   * Create a new conversation
   */
  async createConversation(userId, title = 'New Conversation') {
    const cleanTitle = String(title || 'New Conversation').trim().slice(0, 150) || 'New Conversation';
    const res = await query(
      `INSERT INTO ai_conversations (user_id, title)
       VALUES ($1, $2)
       RETURNING id, title, created_at, updated_at`,
      [userId, cleanTitle]
    );
    return { ...res.rows[0], message_count: 0 };
  }

  /**
   * Ensure conversation belongs to user
   */
  async assertConversationOwner(userId, conversationId) {
    const res = await query(
      'SELECT id, user_id, title, created_at, updated_at FROM ai_conversations WHERE id = $1',
      [conversationId]
    );
    if (res.rowCount === 0) {
      throw ApiError.notFound('Conversation not found.');
    }
    if (Number(res.rows[0].user_id) !== Number(userId)) {
      throw ApiError.forbidden('You do not have access to this conversation.');
    }
    return res.rows[0];
  }

  /**
   * Rename a conversation
   */
  async renameConversation(userId, conversationId, title) {
    await this.assertConversationOwner(userId, conversationId);
    const cleanTitle = String(title || '').trim().slice(0, 150);
    if (!cleanTitle) {
      throw ApiError.badRequest('Conversation title is required.');
    }
    const res = await query(
      `UPDATE ai_conversations
       SET title = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND user_id = $3
       RETURNING id, title, created_at, updated_at`,
      [cleanTitle, conversationId, userId]
    );
    return res.rows[0];
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(userId, conversationId) {
    await this.assertConversationOwner(userId, conversationId);
    await query('DELETE FROM ai_conversations WHERE id = $1 AND user_id = $2', [
      conversationId,
      userId,
    ]);
    return { id: Number(conversationId) };
  }

  /**
   * Delete all conversations belonging to the current user
   */
  async clearAllConversations(userId) {
    const res = await query('DELETE FROM ai_conversations WHERE user_id = $1', [userId]);
    return { deletedCount: res.rowCount || 0 };
  }

  /**
   * Load messages of a conversation (hides SQL for non-admins)
   */
  async getConversationMessages(user, conversationId) {
    const conv = await this.assertConversationOwner(user.id, conversationId);
    const isAdmin = user.role === 'admin';

    const res = await query(
      `SELECT m.id, m.conversation_id, m.role, m.content, m.intent, m.report_title,
              m.sql_query, m.assumptions, m.columns_json, m.rows_json,
              m.summary_metrics_json, m.chart_config_json, m.followups_json,
              m.duration_ms, m.row_count, m.is_error, m.is_clarification, m.created_at,
              f.rating AS feedback_rating
       FROM ai_messages m
       LEFT JOIN ai_feedback f ON f.message_id = m.id AND f.user_id = $2
       WHERE m.conversation_id = $1
       ORDER BY m.id ASC`,
      [conversationId, user.id]
    );

    const messages = res.rows.map((row) => ({
      id: row.id,
      conversationId: row.conversation_id,
      role: row.role,
      text: row.content,
      intent: row.intent,
      sql: isAdmin ? row.sql_query : null,
      assumptions: row.assumptions,
      isError: row.is_error,
      isClarification: row.is_clarification,
      feedback: row.feedback_rating || null,
      createdAt: row.created_at,
      report:
        row.role === 'assistant' && !row.is_error
          ? {
              intent: row.intent,
              answer: row.content,
              reportTitle: row.report_title,
              columns: row.columns_json || [],
              rows: row.rows_json || [],
              summaryMetrics: row.summary_metrics_json || {},
              chartConfig: row.chart_config_json || null,
              followUps: row.followups_json || [],
              sql: isAdmin ? row.sql_query : null,
              assumptions: row.assumptions,
              durationMs: row.duration_ms,
              rowCount: row.row_count,
              isClarification: row.is_clarification,
              messageId: row.id,
              conversationId: row.conversation_id,
            }
          : null,
    }));

    return { conversation: conv, messages };
  }

  /**
   * Persist a user question + assistant reply into a conversation (creating one if needed)
   */
  async saveExchange({ user, conversationId, question, responsePayload }) {
    let convId = conversationId ? Number(conversationId) : null;
    if (convId) {
      await this.assertConversationOwner(user.id, convId);
    } else {
      const autoTitle = String(question || 'New Conversation').trim().slice(0, 70) || 'New Conversation';
      const created = await this.createConversation(user.id, autoTitle);
      convId = created.id;
    }

    await query(
      `INSERT INTO ai_messages (conversation_id, role, content)
       VALUES ($1, 'user', $2)`,
      [convId, question]
    );

    const assistantRes = await query(
      `INSERT INTO ai_messages (
         conversation_id, role, content, intent, report_title, sql_query, assumptions,
         columns_json, rows_json, summary_metrics_json, chart_config_json, followups_json,
         duration_ms, row_count, is_error, is_clarification
       )
       VALUES ($1, 'assistant', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING id`,
      [
        convId,
        responsePayload.answer || '',
        responsePayload.intent || null,
        responsePayload.reportTitle || null,
        responsePayload._rawSql || responsePayload.sql || null,
        responsePayload.assumptions || null,
        JSON.stringify(responsePayload.columns || []),
        JSON.stringify((responsePayload.rows || []).slice(0, 200)),
        JSON.stringify(responsePayload.summaryMetrics || {}),
        responsePayload.chartConfig ? JSON.stringify(responsePayload.chartConfig) : null,
        JSON.stringify(responsePayload.followUps || []),
        responsePayload.durationMs ?? null,
        responsePayload.rowCount ?? (responsePayload.rows ? responsePayload.rows.length : 0),
        Boolean(responsePayload.isError),
        Boolean(responsePayload.isClarification),
      ]
    );

    await query(
      `UPDATE ai_conversations
       SET title = CASE WHEN title = 'New Conversation' THEN $1 ELSE title END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [String(question || 'New Conversation').trim().slice(0, 70), convId]
    );

    return {
      conversationId: convId,
      messageId: assistantRes.rows[0].id,
    };
  }

  /**
   * Save or update thumbs up / down feedback for an assistant message
   */
  async submitFeedback(userId, { messageId, rating, comment = null }) {
    const msgRes = await query(
      `SELECT m.id, m.sql_query, m.conversation_id, c.user_id,
              (SELECT u_msg.content FROM ai_messages u_msg
               WHERE u_msg.conversation_id = m.conversation_id AND u_msg.id < m.id AND u_msg.role = 'user'
               ORDER BY u_msg.id DESC LIMIT 1) AS user_question
       FROM ai_messages m
       JOIN ai_conversations c ON c.id = m.conversation_id
       WHERE m.id = $1`,
      [messageId]
    );

    if (msgRes.rowCount === 0) {
      throw ApiError.notFound('Message not found.');
    }
    const msg = msgRes.rows[0];
    if (Number(msg.user_id) !== Number(userId)) {
      throw ApiError.forbidden('You can only rate messages in your own conversations.');
    }

    const res = await query(
      `INSERT INTO ai_feedback (user_id, message_id, rating, comment, question, generated_sql)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, message_id)
       DO UPDATE SET rating = EXCLUDED.rating, comment = COALESCE(EXCLUDED.comment, ai_feedback.comment), created_at = CURRENT_TIMESTAMP
       RETURNING id, message_id, rating, comment, created_at`,
      [userId, messageId, rating, comment ? String(comment).trim().slice(0, 500) : null, msg.user_question, msg.sql_query]
    );

    return res.rows[0];
  }

  /**
   * Pinned dashboard widgets CRUD
   */
  async listPinnedWidgets(userId) {
    const res = await query(
      `SELECT id, title, question, chart_type, chart_config_json, columns_json, rows_json, created_at
       FROM ai_pinned_widgets
       WHERE user_id = $1
       ORDER BY created_at DESC, id DESC
       LIMIT 12`,
      [userId]
    );
    return res.rows.map((r) => ({
      id: r.id,
      title: r.title,
      question: r.question,
      chartType: r.chart_type,
      chartConfig: r.chart_config_json,
      columns: r.columns_json || [],
      rows: r.rows_json || [],
      createdAt: r.created_at,
    }));
  }

  async pinWidget(userId, data) {
    const res = await query(
      `INSERT INTO ai_pinned_widgets
         (user_id, title, question, sql_query, chart_type, chart_config_json, columns_json, rows_json)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, title, question, chart_type, chart_config_json, columns_json, rows_json, created_at`,
      [
        userId,
        String(data.title).trim().slice(0, 150),
        String(data.question).trim().slice(0, 500),
        data.sql || null,
        data.chartType || 'bar',
        data.chartConfig ? JSON.stringify(data.chartConfig) : null,
        JSON.stringify(data.columns || []),
        JSON.stringify((data.rows || []).slice(0, 50)),
      ]
    );
    const r = res.rows[0];
    return {
      id: r.id,
      title: r.title,
      question: r.question,
      chartType: r.chart_type,
      chartConfig: r.chart_config_json,
      columns: r.columns_json || [],
      rows: r.rows_json || [],
      createdAt: r.created_at,
    };
  }

  async unpinWidget(userId, widgetId) {
    const res = await query(
      'DELETE FROM ai_pinned_widgets WHERE id = $1 AND user_id = $2 RETURNING id',
      [widgetId, userId]
    );
    if (res.rowCount === 0) {
      throw ApiError.notFound('Pinned widget not found.');
    }
    return { id: Number(widgetId) };
  }

  /**
   * Generate dynamic topic-grouped sample questions based on live data availability
   */
  async getDynamicSuggestions() {
    let topCity = 'Pune';
    let topCategory = 'Cloud Infrastructure';
    let topBrand = 'Tata';
    let topIndustry = 'Finance';
    let lowStockCount = 0;

    try {
      const [cityRes, catRes, brandRes, indRes, stockRes] = await Promise.all([
        queryAiReadonly(
          `SELECT c.city FROM ai_customers c JOIN ai_sales s ON s.customer_id = c.id
           WHERE s.status = 'completed' AND c.city IS NOT NULL
           GROUP BY c.city ORDER BY SUM(s.total_amount) DESC LIMIT 1`
        ),
        queryAiReadonly(
          `SELECT p.category FROM ai_products p JOIN ai_sale_items si ON si.product_id = p.id
           JOIN ai_sales s ON s.id = si.sale_id
           WHERE s.status = 'completed' AND p.category IS NOT NULL
           GROUP BY p.category ORDER BY SUM(si.line_total) DESC LIMIT 1`
        ),
        queryAiReadonly(
          `SELECT DISTINCT brand FROM ai_products WHERE brand IS NOT NULL AND brand != '' ORDER BY brand LIMIT 1`
        ),
        queryAiReadonly(
          `SELECT DISTINCT industry FROM ai_customers WHERE industry IS NOT NULL AND industry != '' ORDER BY industry LIMIT 1`
        ),
        queryAiReadonly(
          `SELECT COUNT(*)::int AS cnt FROM ai_products WHERE is_active = true AND stock_quantity <= reorder_level`
        ),
      ]);

      if (cityRes.rows[0]?.city) topCity = cityRes.rows[0].city;
      if (catRes.rows[0]?.category) topCategory = catRes.rows[0].category;
      if (brandRes.rows[0]?.brand) topBrand = brandRes.rows[0].brand;
      if (indRes.rows[0]?.industry) topIndustry = indRes.rows[0].industry;
      lowStockCount = stockRes.rows[0]?.cnt || 0;
    } catch {
      // Fallback safely to defaults
    }

    return [
      {
        topic: 'Sales',
        questions: [
          'What were total sales last month?',
          `Give me city-wise sales for the last three months.`,
          'Summarize business performance for the current quarter.',
          'What is our total revenue in this financial year?',
        ],
      },
      {
        topic: 'Customers',
        questions: [
          'Show the top 10 customers by sales.',
          `Show completed revenue by industry and customer type (${topIndustry})`,
          'Which customers have reduced their purchases?',
          `Which products did customers in ${topCity} spend the most on?`,
        ],
      },
      {
        topic: 'Products',
        questions: [
          'Which product generated the highest revenue?',
          `Show revenue by ${topBrand} and ${topCategory}`,
          lowStockCount > 0
            ? `Which ${lowStockCount} active products are low on stock?`
            : 'Which products have never been sold?',
          'Show product list',
        ],
      },
      {
        topic: 'Trends',
        questions: [
          'Compare this month with the previous month.',
          'Show monthly revenue trend with growth percentage',
          'Predict next month revenue',
          'Pichle mahine total sales kitni hui?',
        ],
      },
    ];
  }

  /**
   * Admin-only AI SQL Audit Log
   */
  async getSqlAuditLogs(page = 1, limit = 20) {
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (safePage - 1) * safeLimit;

    const countRes = await query(
      "SELECT COUNT(*)::int AS total FROM audit_logs WHERE entity = 'AI_ASSISTANT'"
    );
    const total = countRes.rows[0]?.total || 0;

    const res = await query(
      `SELECT id, user_id, user_email, action, details, ip_address, created_at
       FROM audit_logs
       WHERE entity = 'AI_ASSISTANT'
       ORDER BY created_at DESC, id DESC
       LIMIT $1 OFFSET $2`,
      [safeLimit, offset]
    );

    return {
      logs: res.rows,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.max(1, Math.ceil(total / safeLimit)),
      },
    };
  }
}

module.exports = new AiHistoryService();

