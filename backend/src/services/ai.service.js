const aiReportingService = require('./aiReporting.service');
const aiProviderService = require('./aiProvider.service');
const aiSqlGeneratorService = require('./aiSqlGenerator.service');
const { logAudit } = require('../utils/auditLogger');
const config = require('../config/env');

class AiService {
  /**
   * Process a natural language question through the secure reporting workflow:
   * 1. Block SQL injection / write / DDL commands immediately
   * 2. Route greetings immediately
   * 3. Use dynamic text-to-SQL as the main path for data questions (unless the question
   *    cleanly matches a fixed keyword intent with no follow-up context or extra filters)
   * 4. If dynamic SQL fails, fall back to the fixed intent flow, then to friendly guidance
   */
  async askQuestion(question, user, ipAddress = null, history = []) {
    const trimmedQuestion = question.trim();
    const safeHistory = Array.isArray(history) ? history.slice(-3) : [];

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

      await logAudit({
        userId: user.id,
        userEmail: user.email,
        action: 'AI_QUERY_ASKED',
        entity: 'AI_ASSISTANT',
        entityId: null,
        details: {
          question: trimmedQuestion,
          intent: reportData.intent,
          reportTitle: reportData.reportTitle,
          provider: config.ai.provider,
        },
        ipAddress,
      });

      return {
        question: trimmedQuestion,
        intent: reportData.intent,
        answer,
        reportTitle: reportData.reportTitle,
        columns: [],
        rows: [],
        dateRange: null,
        summaryMetrics: {},
        suggestions: intentData.suggestions || null,
        provider: config.ai.provider,
      };
    }

    // 2. Dynamic SQL path (main path for data questions when AI_DYNAMIC_SQL is enabled)
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

        await logAudit({
          userId: user.id,
          userEmail: user.email,
          action: 'AI_DYNAMIC_SQL_QUERY',
          entity: 'AI_ASSISTANT',
          entityId: null,
          details: {
            question: trimmedQuestion,
            sql: dynamicResult.generatedSql,
            assumptions: dynamicResult.assumptions || null,
            notAboutData: dynamicResult.notAboutData || false,
            isClarification: dynamicResult.isClarification || false,
          },
          ipAddress,
        });

        return {
          question: trimmedQuestion,
          intent: resultIntent,
          answer: dynamicResult.answer,
          reportTitle: dynamicResult.reportTitle || 'Dynamic Query Results',
          columns: dynamicResult.columns || [],
          rows: dynamicResult.rows || [],
          dateRange: null,
          summaryMetrics: dynamicResult.summaryMetrics || {},
          suggestions: null,
          sql: dynamicResult.generatedSql || null,
          assumptions: dynamicResult.assumptions || null,
          isClarification: Boolean(dynamicResult.isClarification),
          provider: 'gemini',
        };
      }
    }

    // 3. Fallback / Fixed keyword intent flow -> UNSUPPORTED guidance
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

    // 4. Audit Log the query
    await logAudit({
      userId: user.id,
      userEmail: user.email,
      action: 'AI_QUERY_ASKED',
      entity: 'AI_ASSISTANT',
      entityId: null,
      details: {
        question: trimmedQuestion,
        intent: reportData.intent,
        reportTitle: reportData.reportTitle,
        provider: config.ai.provider,
      },
      ipAddress,
    });

    return {
      question: trimmedQuestion,
      intent: reportData.intent,
      answer,
      reportTitle: reportData.reportTitle,
      columns: reportData.columns || [],
      rows: reportData.rows || [],
      dateRange: reportData.dateRange || null,
      summaryMetrics: reportData.summaryMetrics || {},
      suggestions: intentData.suggestions || null,
      provider: config.ai.provider,
    };
  }
}

module.exports = new AiService();
