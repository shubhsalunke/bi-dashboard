const aiService = require('../services/ai.service');
const aiHistoryService = require('../services/aiHistory.service');

const getClientIp = (req) =>
  req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || null;

class AiController {
  async ask(req, res, next) {
    try {
      const { question, history = [], conversationId = null } = req.body;
      const result = await aiService.askQuestion(
        question,
        req.user,
        getClientIp(req),
        history,
        { conversationId }
      );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Stream response tokens over SSE (Server-Sent Events)
   */
  async askStream(req, res, next) {
    let aborted = false;
    req.on('close', () => {
      aborted = true;
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders();
    }

    const sendEvent = (event, payload) => {
      if (aborted || res.writableEnded) return;
      res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
    };

    try {
      const { question, history = [], conversationId = null } = req.body;
      sendEvent('status', { stage: 'analyzing', message: 'Analyzing your question...' });

      const result = await aiService.askQuestion(
        question,
        req.user,
        getClientIp(req),
        history,
        { conversationId }
      );

      if (aborted) return res.end();

      const fullText = String(result.answer || '');
      const tokens = fullText.split(/(\s+)/);
      const chunkSize = 4;

      for (let i = 0; i < tokens.length; i += chunkSize) {
        if (aborted) return res.end();
        const piece = tokens.slice(i, i + chunkSize).join('');
        if (piece) {
          sendEvent('chunk', { text: piece });
        }
      }

      sendEvent('done', result);
      return res.end();
    } catch (err) {
      if (!aborted && !res.writableEnded) {
        sendEvent('error', {
          code: err.code || 'INTERNAL_ERROR',
          message: err.message || 'Failed to process query.',
        });
        return res.end();
      }
      return undefined;
    }
  }

  async generateInsights(req, res, next) {
    try {
      const { conversationId = null, language = 'en' } = req.body || {};
      const result = await aiService.generateInsights(req.user, getClientIp(req), {
        conversationId,
        language,
      });
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getSuggestions(req, res, next) {
    try {
      const topics = await aiHistoryService.getDynamicSuggestions();
      return res.status(200).json({
        success: true,
        data: topics,
      });
    } catch (err) {
      next(err);
    }
  }

  async listConversations(req, res, next) {
    try {
      const conversations = await aiHistoryService.listConversations(req.user.id);
      return res.status(200).json({
        success: true,
        data: conversations,
      });
    } catch (err) {
      next(err);
    }
  }

  async createConversation(req, res, next) {
    try {
      const conversation = await aiHistoryService.createConversation(
        req.user.id,
        req.body.title
      );
      return res.status(201).json({
        success: true,
        data: conversation,
      });
    } catch (err) {
      next(err);
    }
  }

  async renameConversation(req, res, next) {
    try {
      const updated = await aiHistoryService.renameConversation(
        req.user.id,
        Number(req.params.id),
        req.body.title
      );
      return res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteConversation(req, res, next) {
    try {
      const deleted = await aiHistoryService.deleteConversation(
        req.user.id,
        Number(req.params.id)
      );
      return res.status(200).json({
        success: true,
        data: deleted,
      });
    } catch (err) {
      next(err);
    }
  }

  async clearAllConversations(req, res, next) {
    try {
      const result = await aiHistoryService.clearAllConversations(req.user.id);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getConversationMessages(req, res, next) {
    try {
      const result = await aiHistoryService.getConversationMessages(
        req.user,
        Number(req.params.id)
      );
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async submitFeedback(req, res, next) {
    try {
      const result = await aiHistoryService.submitFeedback(req.user.id, req.body);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async listPinnedWidgets(req, res, next) {
    try {
      const widgets = await aiHistoryService.listPinnedWidgets(req.user.id);
      return res.status(200).json({
        success: true,
        data: widgets,
      });
    } catch (err) {
      next(err);
    }
  }

  async pinWidget(req, res, next) {
    try {
      const widget = await aiHistoryService.pinWidget(req.user.id, req.body);
      return res.status(201).json({
        success: true,
        data: widget,
      });
    } catch (err) {
      next(err);
    }
  }

  async unpinWidget(req, res, next) {
    try {
      const deleted = await aiHistoryService.unpinWidget(
        req.user.id,
        Number(req.params.id)
      );
      return res.status(200).json({
        success: true,
        data: deleted,
      });
    } catch (err) {
      next(err);
    }
  }

  async getSqlAuditLogs(req, res, next) {
    try {
      const { page, limit } = req.query;
      const result = await aiHistoryService.getSqlAuditLogs(page, limit);
      return res.status(200).json({
        success: true,
        data: result.logs,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AiController();
