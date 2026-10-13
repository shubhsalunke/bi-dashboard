const express = require('express');
const rateLimit = require('express-rate-limit');
const aiController = require('../controllers/ai.controller');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { askAiSchema } = require('../validation/ai.validation');

const router = express.Router();

// Specific rate limit for AI queries: 30 requests per 15 minutes per IP
const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AI_RATE_LIMIT_MAX) || 100,
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

router.use(authenticate);

router.post('/ask', aiRateLimiter, validate(askAiSchema), aiController.ask);

module.exports = router;
