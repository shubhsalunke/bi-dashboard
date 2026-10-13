const { query } = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');
const { logAudit } = require('../utils/auditLogger');

class CustomerService {
  /**
   * Retrieve paginated customers with combined filtering, search, and sorting
   */
  async getCustomers({
    page = 1,
    limit = 10,
    search = '',
    city = '',
    status = '',
    sortBy = 'created_at',
    sortOrder = 'desc',
    startDate = null,
    endDate = null,
  }) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];

    // Filter by search (name, code, or email)
    if (search && search.trim() !== '') {
      values.push(`%${search.trim().toLowerCase()}%`);
      conditions.push(`(
        LOWER(c.customer_name) LIKE $${values.length} OR 
        LOWER(c.customer_code) LIKE $${values.length} OR 
        LOWER(c.email) LIKE $${values.length}
      )`);
    }

    // Filter by city
    if (city && city.trim() !== '') {
      values.push(city.trim());
      conditions.push(`c.city = $${values.length}`);
    }

    // Filter by status
    if (status && status.trim() !== '') {
      values.push(status.trim());
      conditions.push(`c.status = $${values.length}`);
    }

    // Filter by created_at date range
    if (startDate) {
      values.push(startDate);
      conditions.push(`c.created_at >= $${values.length}`);
    }
    if (endDate) {
      values.push(endDate);
      conditions.push(`c.created_at <= $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validate safe sort columns
    const allowedSortColumns = {
      id: 'c.id',
      customer_code: 'c.customer_code',
      customer_name: 'c.customer_name',
      email: 'c.email',
      city: 'c.city',
      status: 'c.status',
      created_at: 'c.created_at',
    };
    const sortCol = allowedSortColumns[sortBy] || 'c.created_at';
    const sortDir = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Pagination query with total count window function
    values.push(limit);
    const limitPlaceholder = `$${values.length}`;
    values.push(offset);
    const offsetPlaceholder = `$${values.length}`;

    const sql = `
      SELECT 
        c.id,
        c.customer_code,
        c.customer_name,
        c.email,
        c.phone,
        c.city,
        c.status,
        c.created_at,
        c.updated_at,
        COUNT(c.id) OVER() AS total_count
      FROM customers c
      ${whereClause}
      ORDER BY ${sortCol} ${sortDir}
      LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder};
    `;

    const res = await query(sql, values);
    const total = res.rowCount > 0 ? parseInt(res.rows[0].total_count, 10) : 0;
    const items = res.rows.map(({ total_count, ...customer }) => customer);

    return {
      customers: items,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get single customer by ID with sales history and lifetime metrics
   */
  async getCustomerById(id) {
    const customerRes = await query(
      `SELECT id, customer_code, customer_name, email, phone, city, status, created_at, updated_at
       FROM customers WHERE id = $1`,
      [id]
    );

    if (customerRes.rowCount === 0) {
      throw ApiError.notFound(`Customer with ID ${id} not found`);
    }

    const customer = customerRes.rows[0];

    // Customer lifetime metrics
    const metricsRes = await query(
      `SELECT 
        COUNT(id) AS total_orders,
        COALESCE(SUM(total_amount), 0) AS total_revenue,
        COALESCE(ROUND(AVG(total_amount), 2), 0) AS average_order_value,
        MAX(sale_date) AS last_order_date
       FROM sales
       WHERE customer_id = $1 AND status = 'completed'`,
      [id]
    );

    // Recent 5 sales
    const salesRes = await query(
      `SELECT id, sale_date, total_amount, status, created_at
       FROM sales
       WHERE customer_id = $1
       ORDER BY sale_date DESC, id DESC
       LIMIT 5`,
      [id]
    );

    return {
      ...customer,
      metrics: metricsRes.rows[0],
      recentSales: salesRes.rows,
    };
  }

  /**
   * Create a new customer with conflict checking and audit log
   */
  async createCustomer(data, userId, userEmail) {
    // Check duplicate customer_code or email
    const conflictCheck = await query(
      'SELECT customer_code, email FROM customers WHERE customer_code = $1 OR email = $2',
      [data.customer_code.trim(), data.email.toLowerCase().trim()]
    );

    if (conflictCheck.rowCount > 0) {
      const match = conflictCheck.rows[0];
      if (match.customer_code === data.customer_code.trim()) {
        throw ApiError.conflict(`Customer with code '${data.customer_code}' already exists`);
      }
      if (match.email === data.email.toLowerCase().trim()) {
        throw ApiError.conflict(`Customer with email '${data.email}' already exists`);
      }
    }

    const insertSql = `
      INSERT INTO customers (customer_code, customer_name, email, phone, city, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, customer_code, customer_name, email, phone, city, status, created_at;
    `;
    const res = await query(insertSql, [
      data.customer_code.trim(),
      data.customer_name.trim(),
      data.email.toLowerCase().trim(),
      data.phone ? data.phone.trim() : null,
      data.city.trim(),
      data.status || 'active',
    ]);

    const newCustomer = res.rows[0];

    await logAudit({
      userId,
      userEmail,
      action: 'CUSTOMER_CREATED',
      entity: 'CUSTOMER',
      entityId: newCustomer.id,
      details: { customer_code: newCustomer.customer_code, customer_name: newCustomer.customer_name },
    });

    return newCustomer;
  }

  /**
   * Update existing customer
   */
  async updateCustomer(id, data, userId, userEmail) {
    const existing = await query('SELECT id, customer_code, email FROM customers WHERE id = $1', [id]);
    if (existing.rowCount === 0) {
      throw ApiError.notFound(`Customer with ID ${id} not found`);
    }

    // Check unique constraints if changing code or email
    if (data.customer_code || data.email) {
      const conflictCheck = await query(
        `SELECT id, customer_code, email FROM customers 
         WHERE (customer_code = $1 OR email = $2) AND id != $3`,
        [data.customer_code || '', data.email ? data.email.toLowerCase() : '', id]
      );
      if (conflictCheck.rowCount > 0) {
        throw ApiError.conflict('Customer code or email is already taken by another customer');
      }
    }

    const updates = [];
    const values = [];

    if (data.customer_code !== undefined) {
      values.push(data.customer_code.trim());
      updates.push(`customer_code = $${values.length}`);
    }
    if (data.customer_name !== undefined) {
      values.push(data.customer_name.trim());
      updates.push(`customer_name = $${values.length}`);
    }
    if (data.email !== undefined) {
      values.push(data.email.toLowerCase().trim());
      updates.push(`email = $${values.length}`);
    }
    if (data.phone !== undefined) {
      values.push(data.phone ? data.phone.trim() : null);
      updates.push(`phone = $${values.length}`);
    }
    if (data.city !== undefined) {
      values.push(data.city.trim());
      updates.push(`city = $${values.length}`);
    }
    if (data.status !== undefined) {
      values.push(data.status);
      updates.push(`status = $${values.length}`);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const updateSql = `
      UPDATE customers
      SET ${updates.join(', ')}
      WHERE id = $${values.length}
      RETURNING id, customer_code, customer_name, email, phone, city, status, created_at, updated_at;
    `;

    const res = await query(updateSql, values);
    const updatedCustomer = res.rows[0];

    await logAudit({
      userId,
      userEmail,
      action: 'CUSTOMER_UPDATED',
      entity: 'CUSTOMER',
      entityId: id,
      details: { updatedFields: Object.keys(data) },
    });

    return updatedCustomer;
  }

  /**
   * Delete or soft-deactivate customer
   */
  async deleteCustomer(id, userId, userEmail) {
    const existing = await query('SELECT id, customer_name, status FROM customers WHERE id = $1', [id]);
    if (existing.rowCount === 0) {
      throw ApiError.notFound(`Customer with ID ${id} not found`);
    }

    // Check if customer has associated sales records
    const salesCheck = await query('SELECT COUNT(id) FROM sales WHERE customer_id = $1', [id]);
    const salesCount = parseInt(salesCheck.rows[0].count, 10);

    if (salesCount > 0) {
      // Safe deactivation to preserve financial referential integrity
      await query(
        "UPDATE customers SET status = 'inactive', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
        [id]
      );

      await logAudit({
        userId,
        userEmail,
        action: 'CUSTOMER_DEACTIVATED',
        entity: 'CUSTOMER',
        entityId: id,
        details: { reason: 'Has active sales history, soft-deactivated', salesCount },
      });

      return {
        deactivated: true,
        hardDeleted: false,
        message: `Customer has ${salesCount} existing sales record(s). Safely changed status to inactive to preserve audit history.`,
      };
    }

    // No sales history, safe hard delete
    await query('DELETE FROM customers WHERE id = $1', [id]);

    await logAudit({
      userId,
      userEmail,
      action: 'CUSTOMER_DELETED',
      entity: 'CUSTOMER',
      entityId: id,
      details: { customerName: existing.rows[0].customer_name },
    });

    return {
      deactivated: false,
      hardDeleted: true,
      message: 'Customer successfully deleted from database.',
    };
  }
}

module.exports = new CustomerService();
