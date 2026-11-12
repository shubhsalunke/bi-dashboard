const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const config = require('../config/env');
const { query } = require('../config/db');
const { generateTokens, verifyRefreshToken } = require('../utils/jwt');
const { ApiError } = require('../middleware/errorHandler');
const { logAudit } = require('../utils/auditLogger');
const mailer = require('../utils/mailer');

// Pre-computed bcrypt hash used when email is not found so timing stays uniform
const DUMMY_PASSWORD_HASH =
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

class AuthService {
  /**
   * Track failed login attempt by (email, ipAddress) and enforce temporary lockout
   */
  async recordFailedAttempt(normalizedEmail, clientIp, userId = null) {
    const maxFailed = config.authSecurity.maxFailedAttempts || 5;
    const lockoutMinutes = config.authSecurity.lockoutMinutes || 15;

    const existingRes = await query(
      `SELECT id, failed_count, first_failed_at, locked_until
       FROM login_attempts
       WHERE email = $1 AND ip_address = $2`,
      [normalizedEmail, clientIp]
    );

    let nextCount = 1;
    let lockedUntil = null;

    if (existingRes.rowCount === 0) {
      if (nextCount >= maxFailed) {
        lockedUntil = new Date(Date.now() + lockoutMinutes * 60 * 1000);
      }
      await query(
        `INSERT INTO login_attempts (email, ip_address, failed_count, first_failed_at, last_attempt_at, locked_until)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $4)`,
        [normalizedEmail, clientIp, nextCount, lockedUntil]
      );
    } else {
      const row = existingRes.rows[0];
      const windowCutoff = Date.now() - lockoutMinutes * 60 * 1000;
      const firstFailedMs = row.first_failed_at ? new Date(row.first_failed_at).getTime() : 0;
      const windowExpired = firstFailedMs < windowCutoff;

      if (windowExpired) {
        nextCount = 1;
        lockedUntil = nextCount >= maxFailed ? new Date(Date.now() + lockoutMinutes * 60 * 1000) : null;
        await query(
          `UPDATE login_attempts
           SET failed_count = $1, first_failed_at = CURRENT_TIMESTAMP, last_attempt_at = CURRENT_TIMESTAMP, locked_until = $2
           WHERE id = $3`,
          [nextCount, lockedUntil, row.id]
        );
      } else {
        nextCount = (row.failed_count || 0) + 1;
        lockedUntil =
          nextCount >= maxFailed
            ? new Date(Date.now() + lockoutMinutes * 60 * 1000)
            : row.locked_until;
        await query(
          `UPDATE login_attempts
           SET failed_count = $1, last_attempt_at = CURRENT_TIMESTAMP, locked_until = $2
           WHERE id = $3`,
          [nextCount, lockedUntil, row.id]
        );
      }
    }

    if (userId) {
      await query(
        `UPDATE users
         SET failed_login_attempts = $1, locked_until = $2
         WHERE id = $3`,
        [nextCount, lockedUntil, userId]
      );
    }

    return { failedCount: nextCount, lockedUntil };
  }

  /**
   * Clear failed login tracking after successful authentication
   */
  async clearFailedAttempts(normalizedEmail, clientIp, userId) {
    await query(
      'DELETE FROM login_attempts WHERE email = $1 AND ip_address = $2',
      [normalizedEmail, clientIp]
    );
    if (userId) {
      await query(
        `UPDATE users
         SET last_login_at = CURRENT_TIMESTAMP,
             failed_login_attempts = 0,
             locked_until = NULL
         WHERE id = $1`,
        [userId]
      );
    }
  }

  /**
   * Authenticate user credentials and return JWT tokens
   */
  async login(email, password, meta = {}) {
    const normalizedEmail = email.toLowerCase().trim();
    const options = typeof meta === 'string' ? { ipAddress: meta } : meta || {};
    const clientIp = String(options.ipAddress || 'unknown').slice(0, 64);
    const safeUserAgent = options.userAgent ? String(options.userAgent).slice(0, 500) : null;
    const rememberMe = Boolean(options.rememberMe);

    // 1. Check active lockout for (IP + email)
    const lockRes = await query(
      `SELECT locked_until
       FROM login_attempts
       WHERE email = $1 AND ip_address = $2`,
      [normalizedEmail, clientIp]
    );

    if (lockRes.rowCount > 0 && lockRes.rows[0].locked_until) {
      const lockUntilDate = new Date(lockRes.rows[0].locked_until);
      if (lockUntilDate > new Date()) {
        const remainingMinutes = Math.max(
          1,
          Math.ceil((lockUntilDate.getTime() - Date.now()) / 60000)
        );
        await logAudit({
          userId: null,
          userEmail: normalizedEmail,
          action: 'USER_LOGIN_FAILED',
          entity: 'USER',
          entityId: null,
          details: {
            reason: 'locked',
            remainingMinutes,
            userAgent: safeUserAgent,
          },
          ipAddress: clientIp,
        });
        throw ApiError.tooManyRequests(
          `Too many attempts, try again in ${remainingMinutes} ${
            remainingMinutes === 1 ? 'minute' : 'minutes'
          }`
        );
      }
    }

    // 2. Lookup user
    const userRes = await query(
      'SELECT id, name, email, password_hash, role, is_active FROM users WHERE LOWER(email) = LOWER($1)',
      [normalizedEmail]
    );

    if (userRes.rowCount === 0) {
      await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
      await this.recordFailedAttempt(normalizedEmail, clientIp, null);
      await logAudit({
        userId: null,
        userEmail: normalizedEmail,
        action: 'USER_LOGIN_FAILED',
        entity: 'USER',
        entityId: null,
        details: {
          reason: 'invalid_credentials',
          userAgent: safeUserAgent,
        },
        ipAddress: clientIp,
      });
      throw ApiError.unauthorized('Invalid email or password');
    }

    const user = userRes.rows[0];

    // 3. Verify bcrypt password hash BEFORE disclosing account status to prevent email enumeration
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      await this.recordFailedAttempt(normalizedEmail, clientIp, user.id);
      await logAudit({
        userId: user.id,
        userEmail: user.email,
        action: 'USER_LOGIN_FAILED',
        entity: 'USER',
        entityId: user.id,
        details: {
          reason: 'invalid_credentials',
          userAgent: safeUserAgent,
        },
        ipAddress: clientIp,
      });
      throw ApiError.unauthorized('Invalid email or password');
    }

    // 4. Reject inactive users with explicit message after verifying valid credentials
    if (!user.is_active) {
      await logAudit({
        userId: user.id,
        userEmail: user.email,
        action: 'USER_LOGIN_FAILED',
        entity: 'USER',
        entityId: user.id,
        details: {
          reason: 'account_deactivated',
          userAgent: safeUserAgent,
        },
        ipAddress: clientIp,
      });
      throw ApiError.forbidden('Your account is deactivated. Contact the administrator.');
    }

    // 5. Generate tokens & clear failed attempts
    const tokens = generateTokens(user, { rememberMe });
    await this.clearFailedAttempts(normalizedEmail, clientIp, user.id);

    // 6. Audit log successful login (never log password)
    await logAudit({
      userId: user.id,
      userEmail: user.email,
      action: 'USER_LOGIN',
      entity: 'USER',
      entityId: user.id,
      details: {
        role: user.role,
        rememberMe,
        userAgent: safeUserAgent,
      },
      ipAddress: clientIp,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }

  /**
   * Refresh JWT access token using a valid refresh token
   */
  async refresh(refreshToken) {
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw ApiError.unauthorized('Refresh token has expired. Please log in again.');
      }
      throw ApiError.unauthorized('Invalid refresh token.');
    }

    const userRes = await query(
      'SELECT id, name, email, role, is_active FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userRes.rowCount === 0) {
      throw ApiError.unauthorized('User not found.');
    }

    const user = userRes.rows[0];
    if (!user.is_active) {
      throw ApiError.forbidden('Your account is deactivated. Contact the administrator.');
    }

    const tokens = generateTokens(user, { rememberMe: Boolean(decoded.rememberMe) });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }

  /**
   * Create a password reset request (30-min hashed token; sends SMTP email if configured, otherwise queues for Admin)
   */
  async requestPasswordReset(email, { ipAddress = null, userAgent = null } = {}) {
    const normalizedEmail = email.toLowerCase().trim();
    const clientIp = String(ipAddress || 'unknown').slice(0, 64);
    const safeUserAgent = userAgent ? String(userAgent).slice(0, 500) : null;
    const ttlMinutes = config.authSecurity.resetTokenTtlMinutes || 30;

    const userRes = await query(
      'SELECT id, name, email, is_active FROM users WHERE LOWER(email) = LOWER($1)',
      [normalizedEmail]
    );

    if (userRes.rowCount > 0 && userRes.rows[0].is_active) {
      const user = userRes.rows[0];
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      // Expire earlier pending requests for this user
      await query(
        `UPDATE password_reset_requests
         SET status = 'expired'
         WHERE user_id = $1 AND status = 'pending'`,
        [user.id]
      );

      let deliveryMethod = 'admin_queue';
      if (mailer.isSmtpConfigured()) {
        try {
          const resetUrl = `${config.frontendUrl.replace(/\/$/, '')}/login?resetToken=${rawToken}`;
          const sendRes = await mailer.sendPasswordResetEmail({
            to: user.email,
            name: user.name,
            resetUrl,
            expiresInMinutes: ttlMinutes,
          });
          if (sendRes?.sent) {
            deliveryMethod = 'smtp';
          }
        } catch (err) {
          console.error('[Mailer Error]: Failed to send password reset email:', err.message);
          deliveryMethod = 'admin_queue';
        }
      }

      const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
      await query(
        `INSERT INTO password_reset_requests
           (user_id, email, token_hash, status, delivery_method, ip_address, user_agent, expires_at)
         VALUES ($1, $2, $3, 'pending', $4, $5, $6, $7)`,
        [user.id, user.email, tokenHash, deliveryMethod, clientIp, safeUserAgent, expiresAt]
      );

      await logAudit({
        userId: user.id,
        userEmail: user.email,
        action: 'PASSWORD_RESET_REQUESTED',
        entity: 'USER',
        entityId: user.id,
        details: { deliveryMethod, userAgent: safeUserAgent },
        ipAddress: clientIp,
      });
    }

    // Always return identical message to prevent email enumeration
    return {
      message: 'If this email exists, the administrator has been notified',
    };
  }

  /**
   * Complete password reset via emailed token
   */
  async resetPasswordWithToken(token, newPassword, { ipAddress = null, userAgent = null } = {}) {
    const tokenHash = crypto.createHash('sha256').update(String(token).trim()).digest('hex');
    const clientIp = String(ipAddress || 'unknown').slice(0, 64);
    const safeUserAgent = userAgent ? String(userAgent).slice(0, 500) : null;

    const reqRes = await query(
      `SELECT r.id, r.user_id, r.email, u.is_active
       FROM password_reset_requests r
       JOIN users u ON u.id = r.user_id
       WHERE r.token_hash = $1
         AND r.status = 'pending'
         AND r.expires_at > CURRENT_TIMESTAMP`,
      [tokenHash]
    );

    if (reqRes.rowCount === 0) {
      throw ApiError.badRequest('Reset link is invalid or has expired.');
    }

    const reqRow = reqRes.rows[0];
    if (!reqRow.is_active) {
      throw ApiError.forbidden('Your account is deactivated. Contact the administrator.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await query(
      `UPDATE users
       SET password_hash = $1,
           failed_login_attempts = 0,
           locked_until = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [passwordHash, reqRow.user_id]
    );

    await query(
      `UPDATE password_reset_requests
       SET status = 'completed', resolved_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [reqRow.id]
    );

    await query('DELETE FROM login_attempts WHERE email = $1', [reqRow.email.toLowerCase()]);

    await logAudit({
      userId: reqRow.user_id,
      userEmail: reqRow.email,
      action: 'USER_PASSWORD_RESET',
      entity: 'USER',
      entityId: reqRow.user_id,
      details: { method: 'email_token', userAgent: safeUserAgent },
      ipAddress: clientIp,
    });

    return {
      message: 'Password has been reset successfully. Please sign in.',
    };
  }

  /**
   * Retrieve current user profile
   */
  async getCurrentUser(userId) {
    const userRes = await query(
      'SELECT id, name, email, role, phone, department, is_active, last_login_at, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (userRes.rowCount === 0) {
      throw ApiError.notFound('User not found');
    }

    return userRes.rows[0];
  }
}

module.exports = new AuthService();
