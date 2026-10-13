const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');
const { logAudit } = require('../utils/auditLogger');

class UserService {
  async getUsers() {
    const res = await query(
      `SELECT id, name, email, role, is_active, created_at, updated_at
       FROM users
       ORDER BY id ASC`
    );
    return res.rows;
  }

  async getUserById(id) {
    const res = await query(
      `SELECT id, name, email, role, is_active, created_at, updated_at
       FROM users WHERE id = $1`,
      [id]
    );
    if (res.rowCount === 0) {
      throw ApiError.notFound(`User with ID ${id} not found`);
    }
    return res.rows[0];
  }

  async createUser({ name, email, password, role, is_active = true }, adminId, adminEmail) {
    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rowCount > 0) {
      throw ApiError.conflict(`User with email '${email}' already exists`);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const insertSql = `
      INSERT INTO users (name, email, password_hash, role, is_active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email, role, is_active, created_at;
    `;
    const res = await query(insertSql, [
      name.trim(),
      email.toLowerCase().trim(),
      passwordHash,
      role,
      is_active,
    ]);
    const newUser = res.rows[0];

    await logAudit({
      userId: adminId,
      userEmail: adminEmail,
      action: 'USER_CREATED',
      entity: 'USER',
      entityId: newUser.id,
      details: { email: newUser.email, role: newUser.role },
    });

    return newUser;
  }

  async updateUser(id, data, adminId, adminEmail) {
    const existing = await query('SELECT id, email FROM users WHERE id = $1', [id]);
    if (existing.rowCount === 0) {
      throw ApiError.notFound(`User with ID ${id} not found`);
    }

    if (data.email) {
      const emailCheck = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [
        data.email.toLowerCase().trim(),
        id,
      ]);
      if (emailCheck.rowCount > 0) {
        throw ApiError.conflict(`Email '${data.email}' is already in use by another account`);
      }
    }

    const updates = [];
    const values = [];

    if (data.name !== undefined) {
      values.push(data.name.trim());
      updates.push(`name = $${values.length}`);
    }
    if (data.email !== undefined) {
      values.push(data.email.toLowerCase().trim());
      updates.push(`email = $${values.length}`);
    }
    if (data.role !== undefined) {
      values.push(data.role);
      updates.push(`role = $${values.length}`);
    }
    if (data.is_active !== undefined) {
      values.push(data.is_active);
      updates.push(`is_active = $${values.length}`);
    }
    if (data.password) {
      const hash = await bcrypt.hash(data.password, 10);
      values.push(hash);
      updates.push(`password_hash = $${values.length}`);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const updateSql = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${values.length}
      RETURNING id, name, email, role, is_active, created_at, updated_at;
    `;
    const res = await query(updateSql, values);
    const updated = res.rows[0];

    await logAudit({
      userId: adminId,
      userEmail: adminEmail,
      action: 'USER_UPDATED',
      entity: 'USER',
      entityId: id,
      details: { updatedFields: Object.keys(data) },
    });

    return updated;
  }

  async deleteUser(id, adminId, adminEmail) {
    if (parseInt(id, 10) === parseInt(adminId, 10)) {
      throw ApiError.badRequest('Administrators cannot delete or deactivate their own active account');
    }

    const existing = await query('SELECT id, name, email FROM users WHERE id = $1', [id]);
    if (existing.rowCount === 0) {
      throw ApiError.notFound(`User with ID ${id} not found`);
    }

    // Soft deactivate
    await query("UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1", [id]);

    await logAudit({
      userId: adminId,
      userEmail: adminEmail,
      action: 'USER_DEACTIVATED',
      entity: 'USER',
      entityId: id,
      details: { email: existing.rows[0].email },
    });

    return {
      success: true,
      message: `User '${existing.rows[0].name}' deactivated successfully.`,
    };
  }

  async getAuditLogs({ page = 1, limit = 50 }) {
    const offset = (page - 1) * limit;
    const res = await query(
      `SELECT id, user_id, user_email, action, entity, entity_id, details, ip_address, created_at,
              COUNT(id) OVER() AS total_count
       FROM audit_logs
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const total = res.rowCount > 0 ? parseInt(res.rows[0].total_count, 10) : 0;
    const items = res.rows.map(({ total_count, ...log }) => log);

    return {
      logs: items,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}

module.exports = new UserService();
