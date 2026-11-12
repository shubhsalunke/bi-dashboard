const aiReportingService = require('./aiReporting.service');
const aiProviderService = require('./aiProvider.service');
const aiSqlGeneratorService = require('./aiSqlGenerator.service');
const aiAnalyticsService = require('./aiAnalytics.service');
const aiHistoryService = require('./aiHistory.service');
const { logAudit } = require('../utils/auditLogger');
const config = require('../config/env');

class AiService {
  /**
   * Process a natural language question through the secure reporting workflow
   */
  async askQuestion(question, user, ipAddress = null, history = [], options = {}) {
    const startTime = Date.now();
    const trimmedQuestion = question.trim();
    const safeHistory = Array.isArray(history) ? history.slice(-3) : [];
    const isAdmin = user?.role === 'admin';
    const lang = aiAnalyticsService.detectLanguage(trimmedQuestion);
    const conversationId = options?.conversationId ? Number(options.conversationId) : null;
    const persistHistory = options?.persistHistory !== false;

    const finalizeAndPersist = async (payload, auditAction = 'AI_QUERY_ASKED') => {
      const durationMs = payload.durationMs ?? Date.now() - startTime;
      const rowCount = payload.rowCount ?? (Array.isArray(payload.rows) ? payload.rows.length : 0);
      const rawSql = payload._rawSql || payload.sql || null;

      await logAudit({
        userId: user.id,
        userEmail: user.email,
        action: auditAction,
        entity: 'AI_ASSISTANT',
        entityId: null,
        details: {
          question: trimmedQuestion,
          sql: rawSql,
          rowCount,
          durationMs,
          intent: payload.intent,
          reportTitle: payload.reportTitle,
          assumptions: payload.assumptions || null,
          provider: payload.provider || config.ai.provider,
        },
        ipAddress,
      });

      let savedIds = { conversationId: null, messageId: null };
      if (persistHistory && user?.id) {
        try {
          savedIds = await aiHistoryService.saveExchange({
            user,
            conversationId,
            question: trimmedQuestion,
            responsePayload: { ...payload, _rawSql: rawSql, durationMs, rowCount },
          });
        } catch {
          // Non-fatal if history persistence fails
        }
      }

      const { _rawSql, ...publicPayload } = payload;
      return {
        ...publicPayload,
        sql: isAdmin ? rawSql : null,
        durationMs,
        rowCount,
        conversationId: savedIds.conversationId,
        messageId: savedIds.messageId,
      };
    };

    // 1. Classify intent & check security guardrails first
    const intentData = await aiReportingService.classifyIntent(trimmedQuestion);

    if (intentData.intent === 'SECURITY_BLOCKED' || intentData.intent === 'GREETING') {
      const reportData = {
        intent: intentData.intent,
        error: intentData.error,
        suggestions: intentData.suggestions,
        reportTitle: intentData.intent === 'GREETING' ? 'Smart BI Assistant' : 'Security Policy Notice',
        columns: [],
        rows: [],
      };
      const answer = await aiProviderService.generateExplanation(trimmedQuestion, reportData);

      return finalizeAndPersist({
        question: trimmedQuestion,
        intent: reportData.intent,
        answer,
        reportTitle: reportData.reportTitle,
        columns: [],
        rows: [],
        dateRange: null,
        summaryMetrics: {},
        chartConfig: null,
        suggestions: intentData.suggestions || null,
        followUps:
          intentData.intent === 'GREETING'
            ? [
                'What were total sales last month?',
                'Show the top 10 customers by sales.',
                'Predict next month revenue',
              ]
            : [],
        relatedQuestions: [],
        provider: config.ai.provider,
      });
    }

    // 2. Deterministic Code-Computed Forecast Route (marked clearly as an estimate)
    if (aiAnalyticsService.isForecastQuestion(trimmedQuestion)) {
      try {
        const forecast = await aiAnalyticsService.generateForecast(trimmedQuestion);
        return finalizeAndPersist(
          {
            question: trimmedQuestion,
            ...forecast,
            dateRange: null,
            suggestions: null,
            provider: 'analytics_engine',
          },
          'AI_FORECAST_QUERY'
        );
      } catch (err) {
        // Fall through cleanly if forecast fails unexpectedly
      }
    }

    // 3. Dynamic SQL path (main path for data questions when AI_DYNAMIC_SQL is enabled)
    const isDynamicEnabled =
      (process.env.AI_DYNAMIC_SQL === 'true' || config.ai?.dynamicSql) &&
      Boolean(process.env.GEMINI_API_KEY || config.ai?.geminiApiKey || process.env.NODE_ENV === 'test');

    const shouldUseFixedIntentDirectly =
      safeHistory.length === 0 &&
      intentData.intent !== 'UNSUPPORTED' &&
      intentData.exactMatch === true;

    if (isDynamicEnabled && !shouldUseFixedIntentDirectly) {
      const dynamicResult = await aiSqlGeneratorService.processDynamicQuery(trimmedQuestion, safeHistory);
      if (dynamicResult && dynamicResult.success) {
        const resultIntent = dynamicResult.notAboutData
          ? 'NOT_ABOUT_DATA'
          : dynamicResult.isClarification
          ? 'CLARIFICATION'
          : 'DYNAMIC_SQL';

        return finalizeAndPersist(
          {
            question: trimmedQuestion,
            intent: resultIntent,
            answer: dynamicResult.answer,
            reportTitle: dynamicResult.reportTitle || 'Dynamic Query Results',
            columns: dynamicResult.columns || [],
            rows: dynamicResult.rows || [],
            dateRange: null,
            summaryMetrics: dynamicResult.summaryMetrics || {},
            chartConfig: dynamicResult.chartConfig || null,
            followUps: dynamicResult.followUps || [],
            relatedQuestions: dynamicResult.relatedQuestions || [],
            suggestions:
              dynamicResult.relatedQuestions && dynamicResult.relatedQuestions.length > 0
                ? dynamicResult.relatedQuestions
                : null,
            _rawSql: dynamicResult.generatedSql || null,
            assumptions: dynamicResult.assumptions || null,
            isClarification: Boolean(dynamicResult.isClarification),
            durationMs: dynamicResult.durationMs,
            rowCount: dynamicResult.rowCount,
            provider: 'gemini',
          },
          'AI_DYNAMIC_SQL_QUERY'
        );
      }
    }

    // 4. Fallback / Fixed keyword intent flow -> UNSUPPORTED guidance
    let reportData = null;
    let answer = '';

    if (intentData.intent === 'UNSUPPORTED') {
      reportData = {
        intent: 'UNSUPPORTED',
        suggestions: intentData.suggestions,
        reportTitle: 'Supported Queries Guidance',
        columns: [],
        rows: [],
      };
      answer = await aiProviderService.generateExplanation(trimmedQuestion, reportData);
    } else {
      reportData = await aiReportingService.executeReportingOperation(intentData);
      answer = await aiProviderService.generateExplanation(trimmedQuestion, reportData);
    }

    const chartConfig = aiAnalyticsService.inferChartConfig(reportData.columns, reportData.rows);
    const followObj = aiAnalyticsService.buildFollowUpsAndRelated({
      columns: reportData.columns || [],
      rows: reportData.rows || [],
      language: lang,
      intent: reportData.intent,
    });

    const formattedDateAssumption = reportData.dateRange
      ? `Date range: ${reportData.dateRange.start} to ${reportData.dateRange.end} (Completed orders only for recognized revenue)`
      : 'Completed orders only for recognized revenue unless specified otherwise';

    return finalizeAndPersist({
      question: trimmedQuestion,
      intent: reportData.intent,
      answer,
      reportTitle: reportData.reportTitle,
      columns: reportData.columns || [],
      rows: reportData.rows || [],
      dateRange: reportData.dateRange || null,
      summaryMetrics: reportData.summaryMetrics || {},
      chartConfig,
      assumptions: formattedDateAssumption,
      followUps: followObj.followUps,
      relatedQuestions: followObj.relatedQuestions,
      suggestions: intentData.suggestions || null,
      provider: config.ai.provider,
    });
  }

  /**
   * Generate 5 automatic executive insights
   */
  async generateInsights(user, ipAddress = null, options = {}) {
    const startTime = Date.now();
    const isAdmin = user?.role === 'admin';
    const lang = options?.language || 'en';
    const conversationId = options?.conversationId ? Number(options.conversationId) : null;

    const insights = await aiAnalyticsService.generateFiveInsights(lang);
    const durationMs = Date.now() - startTime;

    await logAudit({
      userId: user.id,
      userEmail: user.email,
      action: 'AI_INSIGHTS_GENERATED',
      entity: 'AI_ASSISTANT',
      entityId: null,
      details: {
        question: 'Generate 5 key insights',
        sql: insights.sql,
        rowCount: insights.rowCount,
        durationMs,
        intent: 'INSIGHTS',
        reportTitle: insights.reportTitle,
        provider: 'analytics_engine',
      },
      ipAddress,
    });

    let savedIds = { conversationId: null, messageId: null };
    if (options?.persistHistory !== false && user?.id) {
      try {
        savedIds = await aiHistoryService.saveExchange({
          user,
          conversationId,
          question: 'Generate 5 key business insights',
          responsePayload: { ...insights, _rawSql: insights.sql, durationMs },
        });
      } catch {
        // Non-fatal
      }
    }

    return {
      question: 'Generate 5 key business insights',
      ...insights,
      sql: isAdmin ? insights.sql : null,
      durationMs,
      provider: 'analytics_engine',
      conversationId: savedIds.conversationId,
      messageId: savedIds.messageId,
    };
  }
}

module.exports = new AiService();
