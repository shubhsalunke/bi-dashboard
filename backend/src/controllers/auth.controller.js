const authService = require('../services/auth.service');

const getClientIp = (req) =>
  req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';

const getUserAgent = (req) => req.get('user-agent') || null;

class AuthController {
  async login(req, res, next) {
    try {
      const { email, password, rememberMe } = req.body;
      const result = await authService.login(email, password, {
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        rememberMe: Boolean(rememberMe),
      });

      res.status(200).json({
        success: true,
        message: 'Authentication successful',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refresh(refreshToken);

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const result = await authService.requestPasswordReset(email, {
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  }

  async resetPasswordWithToken(req, res, next) {
    try {
      const { token, password } = req.body;
      const result = await authService.resetPasswordWithToken(token, password, {
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  }

  async me(req, res, next) {
    try {
      const user = await authService.getCurrentUser(req.user.id);

      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
