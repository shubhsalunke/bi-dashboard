const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { generateTokens, verifyRefreshToken } = require('../utils/jwt');
const { ApiError } = require('../middleware/errorHandler');
const { logAudit } = require('../utils/auditLogger');

class AuthService {
  /**
   * Authenticate user credentials and return JWT tokens
   */
  async login(email, password, ipAddress = null) {
    const userRes = await query(
      'SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (userRes.rowCount === 0) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const user = userRes.rows[0];

    // Check if account is active
    if (!user.is_active) {
      throw ApiError.forbidden('Your account has been deactivated. Please contact an administrator.');
    }

    // Verify bcrypt password hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Generate tokens
    const tokens = generateTokens(user);

    // Audit log login
    await logAudit({
      userId: user.id,
      userEmail: user.email,
      action: 'USER_LOGIN',
      entity: 'USER',
      entityId: user.id,
      details: { role: user.role },
      ipAddress,
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
      throw ApiError.forbidden('User account has been deactivated.');
    }

    const tokens = generateTokens(user);

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
   * Retrieve current user profile
   */
  async getCurrentUser(userId) {
    const userRes = await query(
      'SELECT id, name, email, role, is_active, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (userRes.rowCount === 0) {
      throw ApiError.notFound('User not found');
    }

    return userRes.rows[0];
  }
}

module.exports = new AuthService();
