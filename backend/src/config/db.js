const { Pool } = require('pg');
const config = require('./env');

const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  user: config.db.user,
  password: config.db.password,
  max: config.db.poolMax,
  idleTimeoutMillis: config.db.idleTimeoutMs,
  connectionTimeoutMillis: config.db.connectionTimeoutMs,
});

pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Error]: Unexpected error on idle client', err);
});

/**
 * Execute a parameterized query with duration logging
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (config.env === 'development' && duration > 200) {
      console.warn(`[Slow Query] (${duration}ms): ${text.substring(0, 80)}...`);
    }
    return res;
  } catch (err) {
    console.error(`[DB Query Error]: ${err.message} | SQL: ${text.substring(0, 100)}...`);
    throw err;
  }
};

/**
 * Acquire a dedicated client for multi-statement transactions
 */
const getClient = async () => {
  const client = await pool.connect();
  return client;
};

/**
 * Health check helper returning database connectivity status, version, and pool metrics
 */
const checkHealth = async () => {
  try {
    const res = await query('SELECT NOW() as current_time, version() as version');
    return {
      status: 'healthy',
      database: config.db.database,
      serverTime: res.rows[0].current_time,
      version: res.rows[0].version,
      pool: {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount,
      },
    };
  } catch (err) {
    return {
      status: 'unhealthy',
      error: err.message,
    };
  }
};

/**
 * Second pool for ai_readonly role with 5000ms statement_timeout
 */
const aiPool = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  user: config.aiDb.user,
  password: config.aiDb.password,
  max: 10,
  idleTimeoutMillis: config.db.idleTimeoutMs,
  connectionTimeoutMillis: config.db.connectionTimeoutMs,
  statement_timeout: 5000,
});

aiPool.on('error', (err) => {
  console.error('[PostgreSQL AI Readonly Pool Error]: Unexpected error on idle client', err);
});

/**
 * Execute dynamic AI query with statement timeout using ai_readonly pool
 */
const queryAiReadonly = async (text, params) => {
  const start = Date.now();
  try {
    const res = await aiPool.query(text, params);
    const duration = Date.now() - start;
    if (config.env === 'development' && duration > 200) {
      console.warn(`[Slow AI Query] (${duration}ms): ${text.substring(0, 80)}...`);
    }
    return res;
  } catch (err) {
    console.error(`[AI DB Query Error]: ${err.message} | SQL: ${text.substring(0, 100)}...`);
    throw err;
  }
};

module.exports = {
  pool,
  aiPool,
  query,
  queryAiReadonly,
  getClient,
  checkHealth,
};
