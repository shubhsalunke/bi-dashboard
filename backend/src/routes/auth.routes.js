const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/auth.controller');
const { validate } = require('../middleware/validate');
const {
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordWithTokenSchema,
} = require('../validation/auth.validation');
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
      message: 'Too many attempts, try again in 15 minutes',
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

const passwordResetRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.PASSWORD_RESET_RATE_LIMIT_MAX) || (process.env.NODE_ENV === 'test' ? 200 : 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many password reset requests, try again in 15 minutes',
    },
  },
});

router.post('/login', loginRateLimiter, validate(loginSchema), authController.login);
router.post('/refresh', refreshRateLimiter, validate(refreshSchema), authController.refresh);
router.post(
  '/forgot-password',
  passwordResetRateLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);
router.post(
  '/reset-password-token',
  passwordResetRateLimiter,
  validate(resetPasswordWithTokenSchema),
  authController.resetPasswordWithToken
);
router.get('/me', authenticate, authController.me);

module.exports = router;
