const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/auth.controller');
const { validate } = require('../middleware/validate');
const { loginSchema, refreshSchema } = require('../validation/auth.validation');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.LOGIN_RATE_LIMIT_MAX) || (process.env.NODE_ENV === 'test' ? 500 : 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many login attempts from this IP, please try again later.',
    },
  },
});

const refreshRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.REFRESH_RATE_LIMIT_MAX) || (process.env.NODE_ENV === 'test' ? 500 : 60),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many token refresh attempts, please try again later.',
    },
  },
});

router.post('/login', loginRateLimiter, validate(loginSchema), authController.login);
router.post('/refresh', refreshRateLimiter, validate(refreshSchema), authController.refresh);
router.get('/me', authenticate, authController.me);

module.exports = router;
