const app = require('./app');
const config = require('./config/env');
const { pool, checkHealth } = require('./config/db');

async function startServer() {
  console.log('==================================================');
  console.log('🚀 Starting AI-Powered Business Intelligence API');
  console.log('==================================================');

  // Verify database connectivity prior to listening
  try {
    const health = await checkHealth();
    if (health.status !== 'healthy') {
      console.error('❌ Critical: Database connection failed during startup:', health.error);
      process.exit(1);
    }
    console.log(`✅ Database connected: ${health.database} on ${config.db.host}:${config.db.port}`);
  } catch (err) {
    console.error('❌ Critical: Failed to reach PostgreSQL:', err.message);
    process.exit(1);
  }

  const server = app.listen(config.port, () => {
    console.log(`✅ Server listening on port ${config.port} (Environment: ${config.env})`);
    console.log(`📡 Health Check URL: http://localhost:${config.port}/api/health`);
    console.log('==================================================');
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
    server.close(async () => {
      console.log('🔒 HTTP server closed');
      try {
        await pool.end();
        console.log('📦 Database pool closed');
      } catch (err) {
        console.error('Error closing database pool:', err);
      }
      process.exit(0);
    });

    // Force exit after 10 seconds if graceful shutdown takes too long
    setTimeout(() => {
      console.error('⚠️ Forcefully terminating process after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    console.error('⚠️ Unhandled Promise Rejection:', reason);
  });

  process.on('uncaughtException', (err) => {
    console.error('🔥 Uncaught Exception:', err);
    process.exit(1);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
