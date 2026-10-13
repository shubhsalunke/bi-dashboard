class ApiError extends Error {
  constructor(statusCode, message, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details = null) {
    return new ApiError(400, message, 'BAD_REQUEST', details);
  }

  static unauthorized(message = 'Authentication required') {
    return new ApiError(401, message, 'UNAUTHORIZED');
  }

  static forbidden(message = 'Access forbidden: Insufficient permissions') {
    return new ApiError(403, message, 'FORBIDDEN');
  }

  static notFound(message = 'Requested resource not found') {
    return new ApiError(404, message, 'NOT_FOUND');
  }

  static conflict(message, details = null) {
    return new ApiError(409, message, 'CONFLICT', details);
  }

  static unprocessable(message, details = null) {
    return new ApiError(422, message, 'UNPROCESSABLE_ENTITY', details);
  }

  static tooManyRequests(message = 'Too many requests, please try again later') {
    return new ApiError(429, message, 'TOO_MANY_REQUESTS');
  }

  static internal(message = 'An unexpected server error occurred') {
    return new ApiError(500, message, 'INTERNAL_SERVER_ERROR');
  }
}

/**
 * 404 Not Found Catch-All Middleware
 */
const notFoundHandler = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

/**
 * Centralized Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'Internal server error';
  let details = err.details || null;

  // Handle PostgreSQL specific errors
  if (err.code === '23505') {
    // Unique violation
    statusCode = 409;
    code = 'UNIQUE_CONSTRAINT_VIOLATION';
    message = 'A record with the specified unique field already exists';
    details = { detail: err.detail };
  } else if (err.code === '23503') {
    // Foreign key violation
    statusCode = 400;
    code = 'FOREIGN_KEY_VIOLATION';
    message = 'Referenced entity does not exist or cannot be deleted due to existing dependencies';
    details = { detail: err.detail };
  } else if (err.code === '23514') {
    // Check constraint violation
    statusCode = 422;
    code = 'CHECK_CONSTRAINT_VIOLATION';
    message = 'Record violates database check constraints (e.g. invalid status or negative amount)';
    details = { detail: err.detail };
  }

  // Hide internal stack trace details in production
  if (process.env.NODE_ENV !== 'test' && statusCode === 500) {
    console.error(`[Unhandled Error] ${req.method} ${req.originalUrl}:`, err);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
      ...(process.env.NODE_ENV === 'development' && statusCode === 500 ? { stack: err.stack } : {}),
    },
  });
};

module.exports = {
  ApiError,
  notFoundHandler,
  errorHandler,
};
