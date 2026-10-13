const { query } = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');
const { logAudit } = require('../utils/auditLogger');

class ProductService {
  /**
   * Retrieve products with pagination, search, category filter, and active state
   */
  async getProducts({
    page = 1,
    limit = 10,
    search = '',
    category = '',
    isActive = '',
    sortBy = 'product_name',
    sortOrder = 'asc',
  }) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];

    if (search && search.trim() !== '') {
      values.push(`%${search.trim().toLowerCase()}%`);
      conditions.push(`(
        LOWER(p.product_name) LIKE $${values.length} OR 
        LOWER(p.category) LIKE $${values.length}
      )`);
    }

    if (category && category.trim() !== '') {
      values.push(category.trim());
      conditions.push(`p.category = $${values.length}`);
    }

    if (isActive === 'true') {
      conditions.push('p.is_active = true');
    } else if (isActive === 'false') {
      conditions.push('p.is_active = false');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const allowedSort = {
      id: 'p.id',
      product_name: 'p.product_name',
      category: 'p.category',
      unit_price: 'p.unit_price',
      created_at: 'p.created_at',
    };
    const sortCol = allowedSort[sortBy] || 'p.product_name';
    const sortDir = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    values.push(limit);
    const limitPlaceholder = `$${values.length}`;
    values.push(offset);
    const offsetPlaceholder = `$${values.length}`;

    const sql = `
      SELECT 
        p.id,
        p.product_name,
        p.category,
        p.unit_price,
        p.is_active,
        p.created_at,
        p.updated_at,
        COUNT(p.id) OVER() AS total_count
      FROM products p
      ${whereClause}
      ORDER BY ${sortCol} ${sortDir}
      LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder};
    `;

    const res = await query(sql, values);
    const total = res.rowCount > 0 ? parseInt(res.rows[0].total_count, 10) : 0;
    const items = res.rows.map(({ total_count, ...prod }) => prod);

    return {
      products: items,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get single product by ID
   */
  async getProductById(id) {
    const res = await query(
      `SELECT id, product_name, category, unit_price, is_active, created_at, updated_at
       FROM products WHERE id = $1`,
      [id]
    );

    if (res.rowCount === 0) {
      throw ApiError.notFound(`Product with ID ${id} not found`);
    }

    return res.rows[0];
  }

  /**
   * Create a new product
   */
  async createProduct(data, userId, userEmail) {
    const insertSql = `
      INSERT INTO products (product_name, category, unit_price, is_active)
      VALUES ($1, $2, $3, $4)
      RETURNING id, product_name, category, unit_price, is_active, created_at;
    `;
    const res = await query(insertSql, [
      data.product_name.trim(),
      data.category.trim(),
      data.unit_price,
      data.is_active !== undefined ? data.is_active : true,
    ]);

    const newProd = res.rows[0];

    await logAudit({
      userId,
      userEmail,
      action: 'PRODUCT_CREATED',
      entity: 'PRODUCT',
      entityId: newProd.id,
      details: { product_name: newProd.product_name, unit_price: newProd.unit_price },
    });

    return newProd;
  }

  /**
   * Update existing product
   */
  async updateProduct(id, data, userId, userEmail) {
    const existing = await query('SELECT id FROM products WHERE id = $1', [id]);
    if (existing.rowCount === 0) {
      throw ApiError.notFound(`Product with ID ${id} not found`);
    }

    const updates = [];
    const values = [];

    if (data.product_name !== undefined) {
      values.push(data.product_name.trim());
      updates.push(`product_name = $${values.length}`);
    }
    if (data.category !== undefined) {
      values.push(data.category.trim());
      updates.push(`category = $${values.length}`);
    }
    if (data.unit_price !== undefined) {
      values.push(data.unit_price);
      updates.push(`unit_price = $${values.length}`);
    }
    if (data.is_active !== undefined) {
      values.push(data.is_active);
      updates.push(`is_active = $${values.length}`);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const sql = `
      UPDATE products
      SET ${updates.join(', ')}
      WHERE id = $${values.length}
      RETURNING id, product_name, category, unit_price, is_active, created_at, updated_at;
    `;

    const res = await query(sql, values);
    const updated = res.rows[0];

    await logAudit({
      userId,
      userEmail,
      action: 'PRODUCT_UPDATED',
      entity: 'PRODUCT',
      entityId: id,
      details: { updatedFields: Object.keys(data) },
    });

    return updated;
  }

  /**
   * Deactivate product (soft-delete)
   */
  async deleteProduct(id, userId, userEmail) {
    const existing = await query('SELECT id, product_name FROM products WHERE id = $1', [id]);
    if (existing.rowCount === 0) {
      throw ApiError.notFound(`Product with ID ${id} not found`);
    }

    await query(
      "UPDATE products SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [id]
    );

    await logAudit({
      userId,
      userEmail,
      action: 'PRODUCT_DEACTIVATED',
      entity: 'PRODUCT',
      entityId: id,
      details: { productName: existing.rows[0].product_name },
    });

    return {
      success: true,
      message: `Product '${existing.rows[0].product_name}' deactivated successfully.`,
    };
  }
}

module.exports = new ProductService();
