const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./config/env');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const routes = require('./routes');
const { setupSwagger } = require('./config/swagger');

const app = express();

// Security headers
app.use(helmet());

// CORS configuration - allow all origins in development (including EC2 public IP)
app.use(
  cors({
    origin: (origin, callback) => {
      // In development or if no origin (e.g. mobile apps, curl), permit request
      if (config.env === 'development' || !origin) {
        return callback(null, true);
      }
      if (origin === config.corsOrigin || origin.includes('localhost') || origin.includes('16.171.63.136')) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Request logging (skip in test environment)
if (config.env !== 'test') {
  app.use(morgan('dev'));
}

// Global rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests from this IP, please try again later.',
    },
  },
});
app.use('/api/', limiter);

// Mount Swagger/OpenAPI UI at /api/docs
setupSwagger(app);

// Mount API routes under /api
app.use('/api', routes);

// Root informational endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'AI-Powered Business Intelligence API',
    status: 'online',
    health: '/api/health',
    docs: '/api/docs',
  });
});

// 404 catch-all
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

module.exports = app;
