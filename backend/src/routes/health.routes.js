const express = require('express');
const { checkHealth } = require('../config/db');
const packageJson = require('../../package.json');

const router = express.Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: System and database health check
 *     tags: [System]
 *     responses:
 *       200:
 *         description: System and database are healthy
 *       503:
 *         description: Service or database is unhealthy
 */
router.get('/', async (req, res) => {
  const dbHealth = await checkHealth();
  const isHealthy = dbHealth.status === 'healthy';

  const healthPayload = {
    success: isHealthy,
    status: isHealthy ? 'UP' : 'DOWN',
    timestamp: new Date().toISOString(),
    service: packageJson.name,
    version: packageJson.version,
    uptimeSeconds: Math.floor(process.uptime()),
    database: dbHealth,
    memory: {
      rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
    },
  };

  return res.status(isHealthy ? 200 : 503).json(healthPayload);
});

module.exports = router;
