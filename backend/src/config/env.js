const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from main root .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  apiPrefix: process.env.API_PREFIX || '/api',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'business_intelligence',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    poolMax: parseInt(process.env.DB_POOL_MAX || '20', 10),
    idleTimeoutMs: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000', 10),
    connectionTimeoutMs: parseInt(process.env.DB_CONNECTION_TIMEOUT_MS || '5000', 10),
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev_jwt_access_secret_key_antigravity_bi_2026_super_secure_32',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_jwt_refresh_secret_key_antigravity_bi_2026_super_secure_32',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '500', 10),
  },

  ai: {
    provider: process.env.NODE_ENV === 'test'
      ? (process.env.AI_PROVIDER || 'mock')
      : (process.env.AI_PROVIDER || 'gemini'),
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    timeoutMs: parseInt(process.env.AI_TIMEOUT_MS || '15000', 10),
    dynamicSql: process.env.AI_DYNAMIC_SQL === 'true',
  },

  aiDb: {
    user: process.env.AI_DB_USER || 'ai_readonly',
    password: process.env.AI_DB_PASSWORD || 'ai_readonly_password',
  },
};

module.exports = config;
