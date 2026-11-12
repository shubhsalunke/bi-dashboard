const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { query } = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');
const { logAudit } = require('../utils/auditLogger');

const USER_COLUMNS =
  'id, name, email, role, phone, department, is_active, last_login_at, created_at, updated_at';

const SORT_COLUMNS = {
  name: 'name',
  email: 'email',
  role: 'role',
  department: "COALESCE(department, '')",
  is_active: 'is_active',
  last_login_at: 'last_login_at',
  created_at: 'created_at',
};

const normalizeOptionalText = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
};

const generateTemporaryPassword = (length = 14) => {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const special = '!@#$%^&*_-+=';
  const all = upper + lower + digits + special;

  const chars = [
    upper[crypto.randomInt(upper.length)],
    lower[crypto.randomInt(lower.length)],
    digits[crypto.randomInt(digits.length)],
    special[crypto.randomInt(special.length)],
  ];

  for (let i = chars.length; i < length; i += 1) {
    chars.push(all[crypto.randomInt(all.length)]);
  }

  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(i + 1);
    const tmp = chars[i];
    chars[i] = chars[j];
    chars[j] = tmp;
  }

  return chars.join('');
};

class UserService {
  /**
   * Enforce self-protection and last-active-admin safety guards
   */
  async assertAdminSafety({
    targetUser,
    adminId,
    isDeactivating = false,
    isDemoting = false,
    isDeleting = false,
  }) {
    if (Number(targetUser.id) === Number(adminId)) {
      if (isDeleting) {
        throw ApiError.badRequest('You cannot delete your own account.');
      }
      if (isDeactivating) {
        throw ApiError.badRequest('You cannot deactivate your own account.');
      }
      if (isDemoting) {
        throw ApiError.badRequest('You cannot change your own role away from Administrator.');
      }
    }

    const isCurrentlyActiveAdmin =
      targetUser.role === 'admin' && Boolean(targetUser.is_active);

    if (isCurrentlyActiveAdmin && (isDeleting || isDeactivating || isDemoting)) {
      const otherAdminsRes = await query(
        "SELECT COUNT(*)::int AS count FROM users WHERE role = 'admin' AND is_active = true AND id != $1",
        [targetUser.id]
      );
      const remainingAdmins = otherAdminsRes.rows[0]?.count || 0;
      if (remainingAdmins === 0) {
        if (isDeleting) {
          throw ApiError.badRequest('Cannot delete the last active Administrator.');
        }
        if (isDeactivating) {
          throw ApiError.badRequest('Cannot deactivate the last active Administrator.');
        }
        if (isDemoting) {
          throw ApiError.badRequest('Cannot demote the last active Administrator.');
        }
      }
    }
  }

  /**
   * Get paginated, filtered, and sorted users
   */
  async getUsers(filters = {}) {
    const page = Math.max(1, parseInt(filters.page, 10) || 1);
    const limit = Math.min(500, Math.max(1, parseInt(filters.limit, 10) || 50));
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (filters.search && filters.search.trim()) {
      const searchPattern = `%${filters.search.trim()}%`;
      conditions.push(
        `(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR COALESCE(department, '') ILIKE $${paramIndex} OR COALESCE(phone, '') ILIKE $${paramIndex})`
      );
      params.push(searchPattern);
      paramIndex += 1;
    }

    if (filters.role && filters.role !== 'all') {
      conditions.push(`role = $${paramIndex}`);
      params.push(filters.role);
      paramIndex += 1;
    }

    if (filters.status && filters.status !== 'all') {
      conditions.push(`is_active = $${paramIndex}`);
      params.push(filters.status === 'active');
      paramIndex += 1;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sortExpr = SORT_COLUMNS[filters.sortBy] || 'created_at';
    const sortDir = String(filters.sortOrder || 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const nullsClause = sortExpr === 'last_login_at' ? ' NULLS LAST' : '';

    const countRes = await query(
      `SELECT COUNT(*)::int AS total FROM users ${whereClause}`,
      params
    );
    const total = countRes.rows[0]?.total || 0;

    const adminCountRes = await query(
      "SELECT COUNT(*)::int AS count FROM users WHERE role = 'admin' AND is_active = true"
    );
    const activeAdminCount = adminCountRes.rows[0]?.count || 0;

    const dataRes = await query(
      `SELECT ${USER_COLUMNS}
       FROM users
       ${whereClause}
       ORDER BY ${sortExpr} ${sortDir}${nullsClause}, id DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return {
      users: dataRes.rows,
      activeAdminCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  /**
   * Get single user by ID
   */
  async getUserById(id) {
    const res = await query(
      `SELECT ${USER_COLUMNS} FROM users WHERE id = $1`,
      [id]
    );
    if (res.rowCount === 0) {
      throw ApiError.notFound(`User with ID ${id} not found`);
    }
    return res.rows[0];
  }

  /**
   * Create new system user
   */
  async createUser(data, adminUser, ipAddress) {
    const normalizedEmail = data.email.trim().toLowerCase();
    const existing = await query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
      [normalizedEmail]
    );
    if (existing.rowCount > 0) {
      throw ApiError.conflict('A user with this email address already exists.');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const phone = normalizeOptionalText(data.phone) ?? null;
    const department = normalizeOptionalText(data.department) ?? null;
    const isActive = data.is_active !== undefined ? Boolean(data.is_active) : true;

    const res = await query(
      `INSERT INTO users (name, email, password_hash, role, phone, department, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING ${USER_COLUMNS}`,
      [data.name.trim(), normalizedEmail, passwordHash, data.role, phone, department, isActive]
    );

    const created = res.rows[0];

    await logAudit({
      userId: adminUser.id,
      userEmail: adminUser.email,
      action: 'USER_CREATED',
      entity: 'USER',
      entityId: created.id,
      details: {
        createdEmail: created.email,
        role: created.role,
        department: created.department,
        is_active: created.is_active,
      },
      ipAddress,
    });

    return created;
  }

  /**
   * Update user details, role, status, or password
   */
  async updateUser(id, data, adminUser, ipAddress) {
    const existingRes = await query(
      `SELECT ${USER_COLUMNS} FROM users WHERE id = $1`,
      [id]
    );
    if (existingRes.rowCount === 0) {
      throw ApiError.notFound(`User with ID ${id} not found`);
    }
    const existing = existingRes.rows[0];

    const isDeactivating = data.is_active === false && existing.is_active === true;
    const isDemoting = Boolean(data.role && existing.role === 'admin' && data.role !== 'admin');

    await this.assertAdminSafety({
      targetUser: existing,
      adminId: adminUser.id,
      isDeactivating,
      isDemoting,
    });

    if (data.email && data.email.trim().toLowerCase() !== existing.email.toLowerCase()) {
      const emailCheck = await query(
        'SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id != $2',
        [data.email.trim(), id]
      );
      if (emailCheck.rowCount > 0) {
        throw ApiError.conflict('A user with this email address already exists.');
      }
    }

    const fields = [];
    const values = [];
    let paramIndex = 1;
    const updatedProfileFields = [];

    if (data.name !== undefined) {
      const trimmedName = data.name.trim();
      if (trimmedName !== existing.name) updatedProfileFields.push('name');
      fields.push(`name = $${paramIndex++}`);
      values.push(trimmedName);
    }

    if (data.email !== undefined) {
      const normalizedEmail = data.email.trim().toLowerCase();
      if (normalizedEmail !== existing.email.toLowerCase()) updatedProfileFields.push('email');
      fields.push(`email = $${paramIndex++}`);
      values.push(normalizedEmail);
    }

    if (data.role !== undefined) {
      fields.push(`role = $${paramIndex++}`);
      values.push(data.role);
    }

    if (data.phone !== undefined) {
      const normalizedPhone = normalizeOptionalText(data.phone);
      if (normalizedPhone !== existing.phone) updatedProfileFields.push('phone');
      fields.push(`phone = $${paramIndex++}`);
      values.push(normalizedPhone);
    }

    if (data.department !== undefined) {
      const normalizedDepartment = normalizeOptionalText(data.department);
      if (normalizedDepartment !== existing.department) updatedProfileFields.push('department');
      fields.push(`department = $${paramIndex++}`);
      values.push(normalizedDepartment);
    }

    if (data.is_active !== undefined) {
      fields.push(`is_active = $${paramIndex++}`);
      values.push(Boolean(data.is_active));
    }

    const hasPasswordChange = Boolean(data.password && String(data.password).length > 0);
    if (hasPasswordChange) {
      const passwordHash = await bcrypt.hash(data.password, 12);
      fields.push(`password_hash = $${paramIndex++}`);
      values.push(passwordHash);
    }

    if (fields.length === 0) {
      return existing;
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const res = await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING ${USER_COLUMNS}`,
      values
    );

    const updated = res.rows[0];

    if (data.role && data.role !== existing.role) {
      await logAudit({
        userId: adminUser.id,
        userEmail: adminUser.email,
        action: 'USER_ROLE_CHANGED',
        entity: 'USER',
        entityId: updated.id,
        details: { previousRole: existing.role, newRole: updated.role },
        ipAddress,
      });
    }

    if (data.is_active !== undefined && Boolean(data.is_active) !== Boolean(existing.is_active)) {
      await logAudit({
        userId: adminUser.id,
        userEmail: adminUser.email,
        action: updated.is_active ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
        entity: 'USER',
        entityId: updated.id,
        details: { email: updated.email, previousStatus: existing.is_active, newStatus: updated.is_active },
        ipAddress,
      });
    }

    if (hasPasswordChange) {
      await logAudit({
        userId: adminUser.id,
        userEmail: adminUser.email,
        action: 'USER_PASSWORD_RESET',
        entity: 'USER',
        entityId: updated.id,
        details: { email: updated.email, method: 'edit_modal' },
        ipAddress,
      });
    }

    if (updatedProfileFields.length > 0) {
      await logAudit({
        userId: adminUser.id,
        userEmail: adminUser.email,
        action: 'USER_UPDATED',
        entity: 'USER',
        entityId: updated.id,
        details: { email: updated.email, updatedFields: updatedProfileFields },
        ipAddress,
      });
    }

    return updated;
  }

  /**
   * Toggle user active status (Activate / Deactivate)
   */
  async updateUserStatus(id, isActive, adminUser, ipAddress) {
    const existingRes = await query(
      `SELECT ${USER_COLUMNS} FROM users WHERE id = $1`,
      [id]
    );
    if (existingRes.rowCount === 0) {
      throw ApiError.notFound(`User with ID ${id} not found`);
    }
    const existing = existingRes.rows[0];

    const nextActive = Boolean(isActive);
    await this.assertAdminSafety({
      targetUser: existing,
      adminId: adminUser.id,
      isDeactivating: !nextActive && existing.is_active === true,
    });

    if (Boolean(existing.is_active) === nextActive) {
      return existing;
    }

    const res = await query(
      `UPDATE users
       SET is_active = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING ${USER_COLUMNS}`,
      [nextActive, id]
    );
    const updated = res.rows[0];

    await logAudit({
      userId: adminUser.id,
      userEmail: adminUser.email,
      action: nextActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      entity: 'USER',
      entityId: updated.id,
      details: { email: updated.email, previousStatus: existing.is_active, newStatus: nextActive },
      ipAddress,
    });

    return updated;
  }

  /**
   * Reset user password with generated temporary password
   */
  async resetPassword(id, adminUser, ipAddress) {
    const existingRes = await query(
      `SELECT ${USER_COLUMNS} FROM users WHERE id = $1`,
      [id]
    );
    if (existingRes.rowCount === 0) {
      throw ApiError.notFound(`User with ID ${id} not found`);
    }
    const existing = existingRes.rows[0];

    const temporaryPassword = generateTemporaryPassword(14);
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);

    const res = await query(
      `UPDATE users
       SET password_hash = $1,
           failed_login_attempts = 0,
           locked_until = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING ${USER_COLUMNS}`,
      [passwordHash, id]
    );
    const updated = res.rows[0];

    await query(
      `UPDATE password_reset_requests
       SET status = 'completed', resolved_by = $1, resolved_at = CURRENT_TIMESTAMP
       WHERE user_id = $2 AND status = 'pending'`,
      [adminUser.id, id]
    );

    await query('DELETE FROM login_attempts WHERE LOWER(email) = LOWER($1)', [updated.email]);

    await logAudit({
      userId: adminUser.id,
      userEmail: adminUser.email,
      action: 'USER_PASSWORD_RESET',
      entity: 'USER',
      entityId: updated.id,
      details: { email: updated.email, method: 'temporary_password' },
      ipAddress,
    });

    return {
      user: updated,
      temporaryPassword,
    };
  }

  /**
   * List pending password reset requests for Administrators
   */
  async getPasswordResetRequests() {
    await query(
      `UPDATE password_reset_requests
       SET status = 'expired'
       WHERE status = 'pending' AND expires_at <= CURRENT_TIMESTAMP`
    );

    const res = await query(
      `SELECT r.id, r.user_id, r.email, r.status, r.delivery_method, r.ip_address,
              r.expires_at, r.created_at,
              u.name AS user_name, u.role AS user_role, u.department AS user_department
       FROM password_reset_requests r
       JOIN users u ON u.id = r.user_id
       WHERE r.status = 'pending' AND r.expires_at > CURRENT_TIMESTAMP AND u.is_active = true
       ORDER BY r.created_at DESC`
    );

    return res.rows;
  }

  /**
   * Complete a pending password reset request by generating a temporary password
   */
  async completePasswordResetRequest(requestId, adminUser, ipAddress) {
    const reqRes = await query(
      `SELECT id, user_id, email, status, expires_at
       FROM password_reset_requests
       WHERE id = $1`,
      [requestId]
    );
    if (reqRes.rowCount === 0) {
      throw ApiError.notFound('Password reset request not found.');
    }

    const reqRow = reqRes.rows[0];
    if (reqRow.status !== 'pending' || new Date(reqRow.expires_at) <= new Date()) {
      throw ApiError.badRequest('This password reset request is no longer active or has expired.');
    }

    const resetResult = await this.resetPassword(reqRow.user_id, adminUser, ipAddress);

    return {
      ...resetResult,
      requestId: Number(requestId),
    };
  }

  /**
   * Dismiss a pending password reset request without resetting password
   */
  async dismissPasswordResetRequest(requestId, adminUser, ipAddress) {
    const res = await query(
      `UPDATE password_reset_requests
       SET status = 'dismissed', resolved_by = $1, resolved_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND status = 'pending'
       RETURNING id, user_id, email, status`,
      [adminUser.id, requestId]
    );
    if (res.rowCount === 0) {
      throw ApiError.notFound('Pending password reset request not found.');
    }

    const row = res.rows[0];
    await logAudit({
      userId: adminUser.id,
      userEmail: adminUser.email,
      action: 'PASSWORD_RESET_DISMISSED',
      entity: 'USER',
      entityId: row.user_id,
      details: { requestId: row.id, email: row.email },
      ipAddress,
    });

    return row;
  }

  /**
   * Permanently delete user (with self & last-active-admin protection)
   */
  async deleteUser(id, adminUser, ipAddress) {
    const existingRes = await query(
      `SELECT ${USER_COLUMNS} FROM users WHERE id = $1`,
      [id]
    );
    if (existingRes.rowCount === 0) {
      throw ApiError.notFound(`User with ID ${id} not found`);
    }
    const existing = existingRes.rows[0];

    await this.assertAdminSafety({
      targetUser: existing,
      adminId: adminUser.id,
      isDeleting: true,
    });

    try {
      await query('DELETE FROM users WHERE id = $1', [id]);
    } catch (err) {
      if (err.code === '23503') {
        throw ApiError.conflict(
          'Cannot delete user because they have associated sales records. Deactivate the account instead.'
        );
      }
      throw err;
    }

    await logAudit({
      userId: adminUser.id,
      userEmail: adminUser.email,
      action: 'USER_DELETED',
      entity: 'USER',
      entityId: Number(id),
      details: {
        deletedEmail: existing.email,
        deletedName: existing.name,
        deletedRole: existing.role,
      },
      ipAddress,
    });

    return { id: Number(id), email: existing.email, name: existing.name };
  }

  /**
   * Get per-user activity logs from audit_logs
   */
  async getUserActivityLogs(id, page = 1, limit = 20) {
    const user = await this.getUserById(id);

    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (safePage - 1) * safeLimit;

    const countRes = await query(
      "SELECT COUNT(*)::int AS total FROM audit_logs WHERE entity = 'USER' AND entity_id = $1",
      [id]
    );
    const total = countRes.rows[0]?.total || 0;

    const logsRes = await query(
      `SELECT id, user_id, user_email, action, entity, entity_id, details, ip_address, created_at
       FROM audit_logs
       WHERE entity = 'USER' AND entity_id = $1
       ORDER BY created_at DESC, id DESC
       LIMIT $2 OFFSET $3`,
      [id, safeLimit, offset]
    );

    return {
      user,
      logs: logsRes.rows,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.max(1, Math.ceil(total / safeLimit)),
      },
    };
  }

  /**
   * Get system-wide audit logs (Admin)
   */
  async getAuditLogs(page = 1, limit = 20) {
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (safePage - 1) * safeLimit;

    const countRes = await query('SELECT COUNT(*)::int AS total FROM audit_logs');
    const total = countRes.rows[0]?.total || 0;

    const logsRes = await query(
      `SELECT id, user_id, user_email, action, entity, entity_id, details, ip_address, created_at
       FROM audit_logs
       ORDER BY created_at DESC, id DESC
       LIMIT $1 OFFSET $2`,
      [safeLimit, offset]
    );

    return {
      logs: logsRes.rows,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.max(1, Math.ceil(total / safeLimit)),
      },
    };
  }
}

module.exports = new UserService();
