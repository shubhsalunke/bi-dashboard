const aiReportingService = require('./aiReporting.service');
const aiProviderService = require('./aiProvider.service');
const aiSqlGeneratorService = require('./aiSqlGenerator.service');
const { logAudit } = require('../utils/auditLogger');
const config = require('../config/env');

class AiService {
  /**
   * Process a natural language question through the secure reporting workflow:
   * 1. Validate & Classify intent into approved reporting operations
   * 2. Execute parameterized query on PostgreSQL (no raw SQL execution)
   * 3. Send sanitized data to AI provider
   * 4. Return structured JSON report and audit the interaction
   */
  async askQuestion(question, user, ipAddress = null) {
    const trimmedQuestion = question.trim();

    // 1. Identify Intent (approved keyword intents are first choice)
    const intentData = await aiReportingService.classifyIntent(trimmedQuestion);

    // 2. Dynamic SQL path for UNSUPPORTED queries when AI_DYNAMIC_SQL is enabled
    const isDynamicEnabled =
      (process.env.AI_DYNAMIC_SQL === 'true' || config.ai?.dynamicSql) &&
      Boolean(process.env.GEMINI_API_KEY || config.ai?.geminiApiKey || process.env.NODE_ENV === 'test');

    if (intentData.intent === 'UNSUPPORTED' && isDynamicEnabled) {
      const dynamicResult = await aiSqlGeneratorService.processDynamicQuery(trimmedQuestion);
      if (dynamicResult && dynamicResult.success) {
        await logAudit({
          userId: user.id,
          userEmail: user.email,
          action: 'AI_DYNAMIC_SQL_QUERY',
          entity: 'AI_ASSISTANT',
          entityId: null,
          details: {
            question: trimmedQuestion,
            sql: dynamicResult.generatedSql,
            notAboutData: dynamicResult.notAboutData || false,
          },
          ipAddress,
        });

        return {
          question: trimmedQuestion,
          intent: dynamicResult.notAboutData ? 'NOT_ABOUT_DATA' : 'DYNAMIC_SQL',
          answer: dynamicResult.answer,
          reportTitle: dynamicResult.reportTitle || 'Dynamic Query Results',
          columns: dynamicResult.columns || [],
          rows: dynamicResult.rows || [],
          dateRange: null,
          summaryMetrics: dynamicResult.summaryMetrics || {},
          suggestions: null,
          provider: 'gemini',
        };
      }
    }

    let reportData = null;
    let answer = '';

    if (intentData.intent === 'SECURITY_BLOCKED' || intentData.intent === 'UNSUPPORTED' || intentData.intent === 'GREETING') {
      reportData = {
        intent: intentData.intent,
        error: intentData.error,
        suggestions: intentData.suggestions,
        reportTitle:
          intentData.intent === 'GREETING'
            ? 'Smart BI Assistant'
            : intentData.intent === 'SECURITY_BLOCKED'
            ? 'Security Policy Notice'
            : 'Supported Queries Guidance',
        columns: [],
        rows: [],
      };
      answer = await aiProviderService.generateExplanation(trimmedQuestion, reportData);
    } else {
      // 2. Fetch authorized data from PostgreSQL via parameterized queries
      reportData = await aiReportingService.executeReportingOperation(intentData);

      // 3. Generate natural language explanation grounded in real data
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
