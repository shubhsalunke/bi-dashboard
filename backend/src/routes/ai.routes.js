const express = require('express');
const rateLimit = require('express-rate-limit');
const config = require('../config/env');
const aiController = require('../controllers/ai.controller');
const { authenticate, authorize, ROLES } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  askAiSchema,
  conversationIdParamSchema,
  createConversationSchema,
  renameConversationSchema,
  feedbackSchema,
  pinWidgetSchema,
  insightsSchema,
  sqlLogsQuerySchema,
} = require('../validation/ai.validation');

const router = express.Router();

// Per-IP window limiter
const aiIpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AI_RATE_LIMIT_MAX) || (process.env.NODE_ENV === 'test' ? 500 : 60),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many AI Assistant questions asked from this IP. Please wait a few moments before trying again.',
    },
  },
});

// Per-user limiter: 20 questions per minute
const aiUserRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:
    process.env.NODE_ENV === 'test'
      ? 500
      : Number(process.env.AI_USER_RATE_LIMIT_MAX) || config.ai?.userRateLimitMax || 20,
  keyGenerator: (req) => (req.user?.id ? `user:${req.user.id}` : req.ip),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Rate limit exceeded: maximum 20 AI questions per minute. Please wait briefly.',
    },
  },
});

router.use(authenticate);

// Core query & insights endpoints (Analyst, Manager, Administrator)
router.post('/ask', aiIpRateLimiter, aiUserRateLimiter, validate(askAiSchema), aiController.ask);
router.post('/ask/stream', aiIpRateLimiter, aiUserRateLimiter, validate(askAiSchema), aiController.askStream);
router.post('/insights', aiIpRateLimiter, aiUserRateLimiter, validate(insightsSchema), aiController.generateInsights);
router.get('/suggestions', aiController.getSuggestions);

// Persistent chat conversations
router.get('/conversations', aiController.listConversations);
router.post('/conversations', validate(createConversationSchema), aiController.createConversation);
router.delete('/conversations', aiController.clearAllConversations);
router.patch('/conversations/:id', validate(renameConversationSchema), aiController.renameConversation);
router.delete('/conversations/:id', validate(conversationIdParamSchema), aiController.deleteConversation);
router.get('/conversations/:id/messages', validate(conversationIdParamSchema), aiController.getConversationMessages);

// Answer feedback
router.post('/feedback', validate(feedbackSchema), aiController.submitFeedback);

// Pinned dashboard widgets
router.get('/pinned-widgets', aiController.listPinnedWidgets);
router.post('/pinned-widgets', validate(pinWidgetSchema), aiController.pinWidget);
router.delete('/pinned-widgets/:id', validate(conversationIdParamSchema), aiController.unpinWidget);

// SQL audit log strictly restricted to Administrator
router.get('/sql-logs', authorize(ROLES.ADMIN), validate(sqlLogsQuerySchema), aiController.getSqlAuditLogs);

module.exports = router;
