const { verifyAccessToken } = require('../utils/jwt');
const { query } = require('../config/db');
const { ApiError } = require('./errorHandler');

/**
 * Role Definitions and Permission Matrix:
 * - 'admin': Full access to all endpoints (users, customers, products, sales, reports, audit logs).
 * - 'manager': Can view and manage customers, products, sales, and view reports. Cannot delete customers or manage users.
 * - 'analyst': Read-only access to customers, products, sales, dashboard, and reports.
 */
const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  ANALYST: 'analyst',
};

/**
 * Authentication Middleware
 * Validates JWT Access Token and checks user active status in PostgreSQL
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(ApiError.unauthorized('Authentication token is missing or invalid format. Expected "Bearer <token>"'));
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(ApiError.unauthorized('Token has expired. Please refresh your token.'));
      }
      return next(ApiError.unauthorized('Invalid authentication token.'));
    }

    // Verify user still exists in database and is active
    const userRes = await query(
      'SELECT id, name, email, role, is_active FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userRes.rowCount === 0) {
      return next(ApiError.unauthorized('User associated with this token no longer exists.'));
    }

    const user = userRes.rows[0];
    if (!user.is_active) {
      return next(ApiError.forbidden('User account has been deactivated. Please contact an administrator.'));
    }

    // Attach user to request (never contains password_hash)
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Role-Based Authorization Middleware
 * @param  {...string} allowedRoles
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access forbidden: User role '${req.user.role}' is not authorized to perform this action. Required: [${allowedRoles.join(', ')}]`
        )
      );
    }

    next();
  };
};

module.exports = {
  ROLES,
  authenticate,
  authorize,
};
