const { query } = require('../config/db');

/**
 * Record an audit log entry in PostgreSQL
 * @param {Object} options
 * @param {number|null} options.userId
 * @param {string|null} options.userEmail
 * @param {string} options.action
 * @param {string} options.entity
 * @param {number|null} options.entityId
 * @param {Object|null} options.details
 * @param {string|null} options.ipAddress
 */
const logAudit = async ({ userId = null, userEmail = null, action, entity, entityId = null, details = null, ipAddress = null }) => {
  try {
    await query(
      `INSERT INTO audit_logs (user_id, user_email, action, entity, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, userEmail, action, entity, entityId, details ? JSON.stringify(details) : null, ipAddress]
    );
  } catch (err) {
    // Non-fatal, log to stderr
    console.error('[Audit Logger Error]: Failed to write audit log:', err.message);
  }
};

module.exports = { logAudit };
