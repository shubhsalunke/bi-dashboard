const { getClient, query } = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');
const { logAudit } = require('../utils/auditLogger');

class SaleService {
  /**
   * Create a new sale with line items inside a transactional block
   * Strict validation: server calculates prices and totals; rollbacks on any failure
   */
  async createSale({ customer_id, sale_date = null, status = 'completed', items }, userId, userEmail) {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // 1. Validate customer exists and is active
      const customerRes = await client.query(
        'SELECT id, customer_name, status FROM customers WHERE id = $1',
        [customer_id]
      );

      if (customerRes.rowCount === 0) {
        throw ApiError.badRequest(`Customer with ID ${customer_id} does not exist`);
      }

      const customer = customerRes.rows[0];
      if (customer.status !== 'active') {
        throw ApiError.badRequest(
          `Cannot create sale for inactive customer '${customer.customer_name}' (ID: ${customer_id})`
        );
      }

      // 2. Validate and price each line item using authoritative database prices
      let totalAmount = 0;
      const validatedItems = [];

      for (const item of items) {
        if (!item.quantity || item.quantity <= 0) {
          throw ApiError.badRequest(`Invalid quantity ${item.quantity} for product ID ${item.product_id}`);
        }

        const prodRes = await client.query(
          'SELECT id, product_name, unit_price, is_active FROM products WHERE id = $1',
          [item.product_id]
        );

        if (prodRes.rowCount === 0) {
          throw ApiError.badRequest(`Product with ID ${item.product_id} does not exist`);
        }

        const product = prodRes.rows[0];
        if (!product.is_active) {
          throw ApiError.badRequest(
            `Cannot add discontinued/inactive product '${product.product_name}' (ID: ${item.product_id})`
          );
        }

        const unitPrice = parseFloat(product.unit_price);
        const lineTotal = +(item.quantity * unitPrice).toFixed(2);
        totalAmount += lineTotal;

        validatedItems.push({
          product_id: product.id,
          product_name: product.product_name,
          quantity: item.quantity,
          unit_price: unitPrice,
          line_total: lineTotal,
        });
      }

      totalAmount = +totalAmount.toFixed(2);

      // 3. Insert Sale Header
      const saleDateVal = sale_date || new Date().toISOString().split('T')[0];
      const saleInsertSql = `
        INSERT INTO sales (customer_id, sale_date, total_amount, status, created_by)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, customer_id, sale_date, total_amount, status, created_by, created_at;
      `;
      const saleRes = await client.query(saleInsertSql, [
        customer_id,
        saleDateVal,
        totalAmount,
        status,
        userId,
      ]);
      const sale = saleRes.rows[0];

      // 4. Insert Line Items
      const createdItems = [];
      const itemInsertSql = `
        INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, line_total)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, sale_id, product_id, quantity, unit_price, line_total;
      `;

      for (const item of validatedItems) {
        const itemRes = await client.query(itemInsertSql, [
          sale.id,
          item.product_id,
          item.quantity,
          item.unit_price,
          item.line_total,
        ]);
        createdItems.push({
          ...itemRes.rows[0],
          product_name: item.product_name,
        });
      }

      // 5. Commit transaction atomically
      await client.query('COMMIT');

      // Audit log creation
      await logAudit({
        userId,
        userEmail,
        action: 'SALE_CREATED',
        entity: 'SALE',
        entityId: sale.id,
        details: { customerId: customer_id, totalAmount, itemCount: createdItems.length },
      });

      return {
        ...sale,
        customer_name: customer.customer_name,
        items: createdItems,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Retrieve sales with server-side pagination and filters
   */
  async getSales({
    page = 1,
    limit = 10,
    customerId = null,
    status = '',
    startDate = null,
    endDate = null,
    sortBy = 'sale_date',
    sortOrder = 'desc',
  }) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];

    if (customerId) {
      values.push(customerId);
      conditions.push(`s.customer_id = $${values.length}`);
    }

    if (status && status.trim() !== '') {
      values.push(status.trim());
      conditions.push(`s.status = $${values.length}`);
    }

    if (startDate) {
      values.push(startDate);
      conditions.push(`s.sale_date >= $${values.length}`);
    }

    if (endDate) {
      values.push(endDate);
      conditions.push(`s.sale_date <= $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const allowedSort = {
      id: 's.id',
      sale_date: 's.sale_date',
      total_amount: 's.total_amount',
      status: 's.status',
      created_at: 's.created_at',
    };
    const sortCol = allowedSort[sortBy] || 's.sale_date';
    const sortDir = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    values.push(limit);
    const limitPlaceholder = `$${values.length}`;
    values.push(offset);
    const offsetPlaceholder = `$${values.length}`;

    const sql = `
      SELECT 
        s.id,
        s.customer_id,
        c.customer_name,
        c.customer_code,
        c.city,
        s.sale_date,
        s.total_amount,
        s.status,
        s.created_by,
        u.name AS created_by_name,
        s.created_at,
        COUNT(si.id) AS item_count,
        COUNT(s.id) OVER() AS total_count
      FROM sales s
      JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.created_by = u.id
      LEFT JOIN sale_items si ON s.id = si.sale_id
      ${whereClause}
      GROUP BY s.id, c.customer_name, c.customer_code, c.city, u.name
      ORDER BY ${sortCol} ${sortDir}, s.id DESC
      LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder};
    `;

    const res = await query(sql, values);
    const total = res.rowCount > 0 ? parseInt(res.rows[0].total_count, 10) : 0;
    const items = res.rows.map(({ total_count, ...sale }) => sale);

    return {
      sales: items,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get sale details by ID with line items
   */
  async getSaleById(id) {
    const saleSql = `
      SELECT 
        s.id,
        s.customer_id,
        c.customer_code,
        c.customer_name,
        c.email AS customer_email,
        c.city AS customer_city,
        s.sale_date,
        s.total_amount,
        s.status,
        s.created_by,
        u.name AS created_by_name,
        s.created_at
      FROM sales s
      JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.id = $1
    `;
    const saleRes = await query(saleSql, [id]);

    if (saleRes.rowCount === 0) {
      throw ApiError.notFound(`Sale with ID ${id} not found`);
    }

    const itemsSql = `
      SELECT 
        si.id,
        si.product_id,
        p.product_name,
        p.category,
        si.quantity,
        si.unit_price,
        si.line_total
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      WHERE si.sale_id = $1
      ORDER BY si.id ASC
    `;
    const itemsRes = await query(itemsSql, [id]);

    return {
      ...saleRes.rows[0],
      items: itemsRes.rows,
    };
  }
}

module.exports = new SaleService();
