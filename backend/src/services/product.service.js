const { query } = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');
const { logAudit } = require('../utils/auditLogger');

class ProductService {
  /**
   * Retrieve products with pagination, search, category filter, brand filter, stock status, and price range
   */
  async getProducts({
    page = 1,
    limit = 10,
    search = '',
    category = '',
    brand = '',
    isActive = '',
    stockStatus = '',
    stock_status = '',
    minPrice = null,
    min_price = null,
    maxPrice = null,
    max_price = null,
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
        LOWER(p.category) LIKE $${values.length} OR
        LOWER(p.sku) LIKE $${values.length} OR
        LOWER(COALESCE(p.brand, '')) LIKE $${values.length}
      )`);
    }

    if (category && category.trim() !== '') {
      values.push(category.trim());
      conditions.push(`p.category = $${values.length}`);
    }

    if (brand && brand.trim() !== '') {
      values.push(brand.trim());
      conditions.push(`p.brand = $${values.length}`);
    }

    if (isActive === 'true') {
      conditions.push('p.is_active = true');
    } else if (isActive === 'false') {
      conditions.push('p.is_active = false');
    }

    // Stock status filter: low uses reorder_level dynamically
    const stockFilter = (stock_status || stockStatus || '').toLowerCase().trim();
    if (stockFilter === 'low') {
      conditions.push('p.stock_quantity > 0 AND p.stock_quantity <= p.reorder_level');
    } else if (stockFilter === 'out_of_stock' || stockFilter === 'out of stock') {
      conditions.push('p.stock_quantity = 0');
    } else if (stockFilter === 'in_stock') {
      conditions.push('p.stock_quantity > p.reorder_level');
    }

    // Price range filters
    const minVal = min_price !== undefined && min_price !== '' && min_price !== null ? min_price : minPrice;
    const maxVal = max_price !== undefined && max_price !== '' && max_price !== null ? max_price : maxPrice;

    if (minVal !== undefined && minVal !== '' && minVal !== null && !isNaN(Number(minVal))) {
      values.push(Number(minVal));
      conditions.push(`p.unit_price >= $${values.length}`);
    }

    if (maxVal !== undefined && maxVal !== '' && maxVal !== null && !isNaN(Number(maxVal))) {
      values.push(Number(maxVal));
      conditions.push(`p.unit_price <= $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const allowedSort = {
      id: 'p.id',
      sku: 'p.sku',
      product_name: 'p.product_name',
      category: 'p.category',
      brand: 'p.brand',
      unit_price: 'p.unit_price',
      cost_price: 'p.cost_price',
      stock_quantity: 'p.stock_quantity',
      reorder_level: 'p.reorder_level',
      gst_percent: 'p.gst_percent',
      units_sold: 'units_sold',
      total_revenue: 'total_revenue',
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
        p.sku,
        p.product_name,
        p.category,
        p.brand,
        p.supplier,
        p.unit,
        p.unit_price,
        p.cost_price,
        p.stock_quantity,
        p.gst_percent,
        p.reorder_level,
        p.warranty_months,
        p.description,
        p.is_active,
        p.created_at,
        p.updated_at,
        COALESCE(sales_agg.units_sold, 0)::int AS units_sold,
        COALESCE(sales_agg.total_revenue, 0)::numeric(14,2) AS total_revenue,
        COUNT(p.id) OVER() AS total_count
      FROM products p
      LEFT JOIN (
        SELECT 
          si.product_id,
          COALESCE(SUM(si.quantity), 0)::int AS units_sold,
          COALESCE(SUM(si.line_total), 0)::numeric(14,2) AS total_revenue
        FROM sale_items si
        JOIN sales s ON s.id = si.sale_id AND s.status = 'completed'
        GROUP BY si.product_id
      ) sales_agg ON sales_agg.product_id = p.id
      ${whereClause}
      ORDER BY ${sortCol} ${sortDir}
      LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder};
    `;

    const res = await query(sql, values);
    const total = res.rowCount > 0 ? parseInt(res.rows[0].total_count, 10) : 0;
    const items = res.rows.map(({ total_count, ...prod }) => ({
      ...prod,
      unit_price: parseFloat(prod.unit_price),
      cost_price: prod.cost_price !== null ? parseFloat(prod.cost_price) : null,
      stock_quantity: parseInt(prod.stock_quantity, 10),
      gst_percent: parseFloat(prod.gst_percent),
      reorder_level: parseInt(prod.reorder_level, 10),
      warranty_months: prod.warranty_months !== null ? parseInt(prod.warranty_months, 10) : null,
      units_sold: parseInt(prod.units_sold, 10),
      total_revenue: parseFloat(prod.total_revenue),
    }));

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
      `SELECT id, sku, product_name, category, brand, supplier, unit, unit_price, cost_price, stock_quantity, gst_percent, reorder_level, warranty_months, description, is_active, created_at, updated_at
       FROM products WHERE id = $1`,
      [id]
    );

    if (res.rowCount === 0) {
      throw ApiError.notFound(`Product with ID ${id} not found`);
    }

    const prod = res.rows[0];
    return {
      ...prod,
      unit_price: parseFloat(prod.unit_price),
      cost_price: prod.cost_price !== null ? parseFloat(prod.cost_price) : null,
      stock_quantity: parseInt(prod.stock_quantity, 10),
      gst_percent: parseFloat(prod.gst_percent),
      reorder_level: parseInt(prod.reorder_level, 10),
      warranty_months: prod.warranty_months !== null ? parseInt(prod.warranty_months, 10) : null,
    };
  }

  /**
   * Get product details with margin, price with GST, sales metrics, and last 5 sales
   */
  async getProductDetails(id) {
    const prodRes = await query(
      `SELECT id, sku, product_name, category, brand, supplier, unit, unit_price, cost_price, stock_quantity, gst_percent, reorder_level, warranty_months, description, is_active, created_at, updated_at
       FROM products WHERE id = $1`,
      [id]
    );

    if (prodRes.rowCount === 0) {
      throw ApiError.notFound(`Product with ID ${id} not found`);
    }

    const product = prodRes.rows[0];
    const unitPrice = parseFloat(product.unit_price);
    const costPrice = product.cost_price !== null ? parseFloat(product.cost_price) : null;
    const gstPercent = parseFloat(product.gst_percent || 18);
    const priceWithGst = Number((unitPrice * (1 + gstPercent / 100)).toFixed(2));

    // Aggregates from completed sales only
    const aggRes = await query(
      `SELECT 
        COALESCE(SUM(si.quantity), 0)::int AS units_sold,
        COALESCE(SUM(si.line_total), 0)::numeric(14,2) AS total_revenue
       FROM sale_items si
       JOIN sales s ON s.id = si.sale_id AND s.status = 'completed'
       WHERE si.product_id = $1`,
      [id]
    );

    const unitsSold = parseInt(aggRes.rows[0].units_sold, 10);
    const totalRevenue = parseFloat(aggRes.rows[0].total_revenue);

    // Margin %: (unit_price - cost_price) / unit_price * 100, only if cost_price is set
    let margin = null;
    if (costPrice !== null && unitPrice > 0) {
      margin = Number((((unitPrice - costPrice) / unitPrice) * 100).toFixed(2));
    }

    // Last 5 sales (date, customer, quantity, amount)
    const salesRes = await query(
      `SELECT 
        s.id AS sale_id,
        s.sale_date,
        c.customer_name,
        si.quantity,
        si.line_total AS amount
       FROM sale_items si
       JOIN sales s ON s.id = si.sale_id
       JOIN customers c ON c.id = s.customer_id
       WHERE si.product_id = $1 AND s.status = 'completed'
       ORDER BY s.sale_date DESC, s.id DESC
       LIMIT 5`,
      [id]
    );

    return {
      ...product,
      unit_price: unitPrice,
      cost_price: costPrice,
      stock_quantity: parseInt(product.stock_quantity, 10),
      gst_percent: gstPercent,
      reorder_level: parseInt(product.reorder_level, 10),
      warranty_months: product.warranty_months !== null ? parseInt(product.warranty_months, 10) : null,
      price_with_gst: priceWithGst,
      margin,
      units_sold: unitsSold,
      total_revenue: totalRevenue,
      recent_sales: salesRes.rows.map((row) => ({
        sale_id: row.sale_id,
        sale_date: row.sale_date,
        customer_name: row.customer_name,
        quantity: parseInt(row.quantity, 10),
        amount: parseFloat(row.amount),
      })),
    };
  }

  /**
   * Create a new product
   */
  async createProduct(data, userId, userEmail) {
    let sku = data.sku ? data.sku.trim() : null;
    if (sku) {
      const existing = await query('SELECT id FROM products WHERE LOWER(sku) = LOWER($1)', [sku]);
      if (existing.rowCount > 0) {
        throw ApiError.conflict(`Product with SKU '${sku}' already exists`);
      }
    } else {
      const maxIdRes = await query('SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM products');
      sku = `PRD-${String(maxIdRes.rows[0].next_id).padStart(3, '0')}`;
    }

    const insertSql = `
      INSERT INTO products (
        sku,
        product_name,
        category,
        brand,
        supplier,
        unit,
        unit_price,
        cost_price,
        stock_quantity,
        gst_percent,
        reorder_level,
        warranty_months,
        description,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id, sku, product_name, category, brand, supplier, unit, unit_price, cost_price, stock_quantity, gst_percent, reorder_level, warranty_months, description, is_active, created_at;
    `;

    try {
      const res = await query(insertSql, [
        sku,
        data.product_name.trim(),
        data.category.trim(),
        data.brand !== undefined && data.brand !== null ? data.brand.trim() : null,
        data.supplier !== undefined && data.supplier !== null ? data.supplier.trim() : null,
        data.unit !== undefined && data.unit !== null && data.unit.trim() !== '' ? data.unit.trim() : 'per unit',
        data.unit_price,
        data.cost_price !== undefined ? data.cost_price : null,
        data.stock_quantity !== undefined ? data.stock_quantity : 0,
        data.gst_percent !== undefined ? data.gst_percent : 18,
        data.reorder_level !== undefined ? data.reorder_level : 10,
        data.warranty_months !== undefined ? data.warranty_months : null,
        data.description !== undefined ? data.description : null,
        data.is_active !== undefined ? data.is_active : true,
      ]);

      const newProd = res.rows[0];

      await logAudit({
        userId,
        userEmail,
        action: 'PRODUCT_CREATED',
        entity: 'PRODUCT',
        entityId: newProd.id,
        details: { product_name: newProd.product_name, sku: newProd.sku, unit_price: newProd.unit_price },
      });

      return {
        ...newProd,
        unit_price: parseFloat(newProd.unit_price),
        cost_price: newProd.cost_price !== null ? parseFloat(newProd.cost_price) : null,
        stock_quantity: parseInt(newProd.stock_quantity, 10),
        gst_percent: parseFloat(newProd.gst_percent),
        reorder_level: parseInt(newProd.reorder_level, 10),
        warranty_months: newProd.warranty_months !== null ? parseInt(newProd.warranty_months, 10) : null,
      };
    } catch (err) {
      if (err.code === '23505') {
        throw ApiError.conflict(`Product with SKU '${sku}' already exists`);
      }
      throw err;
    }
  }

  /**
   * Update existing product
   */
  async updateProduct(id, data, userId, userEmail) {
    const existing = await query('SELECT id, sku FROM products WHERE id = $1', [id]);
    if (existing.rowCount === 0) {
      throw ApiError.notFound(`Product with ID ${id} not found`);
    }

    if (data.sku !== undefined && data.sku !== null && data.sku.trim() !== '') {
      const sku = data.sku.trim();
      const existingSku = await query(
        'SELECT id FROM products WHERE LOWER(sku) = LOWER($1) AND id != $2',
        [sku, id]
      );
      if (existingSku.rowCount > 0) {
        throw ApiError.conflict(`Product with SKU '${sku}' already exists`);
      }
    }

    const updates = [];
    const values = [];

    if (data.sku !== undefined) {
      values.push(data.sku ? data.sku.trim() : null);
      updates.push(`sku = $${values.length}`);
    }
    if (data.product_name !== undefined) {
      values.push(data.product_name.trim());
      updates.push(`product_name = $${values.length}`);
    }
    if (data.category !== undefined) {
      values.push(data.category.trim());
      updates.push(`category = $${values.length}`);
    }
    if (data.brand !== undefined) {
      values.push(data.brand ? data.brand.trim() : null);
      updates.push(`brand = $${values.length}`);
    }
    if (data.supplier !== undefined) {
      values.push(data.supplier ? data.supplier.trim() : null);
      updates.push(`supplier = $${values.length}`);
    }
    if (data.unit !== undefined) {
      values.push(data.unit ? data.unit.trim() : 'per unit');
      updates.push(`unit = $${values.length}`);
    }
    if (data.unit_price !== undefined) {
      values.push(data.unit_price);
      updates.push(`unit_price = $${values.length}`);
    }
    if (data.cost_price !== undefined) {
      values.push(data.cost_price);
      updates.push(`cost_price = $${values.length}`);
    }
    if (data.stock_quantity !== undefined) {
      values.push(data.stock_quantity);
      updates.push(`stock_quantity = $${values.length}`);
    }
    if (data.gst_percent !== undefined) {
      values.push(data.gst_percent);
      updates.push(`gst_percent = $${values.length}`);
    }
    if (data.reorder_level !== undefined) {
      values.push(data.reorder_level);
      updates.push(`reorder_level = $${values.length}`);
    }
    if (data.warranty_months !== undefined) {
      values.push(data.warranty_months);
      updates.push(`warranty_months = $${values.length}`);
    }
    if (data.description !== undefined) {
      values.push(data.description);
      updates.push(`description = $${values.length}`);
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
      RETURNING id, sku, product_name, category, brand, supplier, unit, unit_price, cost_price, stock_quantity, gst_percent, reorder_level, warranty_months, description, is_active, created_at, updated_at;
    `;

    try {
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

      return {
        ...updated,
        unit_price: parseFloat(updated.unit_price),
        cost_price: updated.cost_price !== null ? parseFloat(updated.cost_price) : null,
        stock_quantity: parseInt(updated.stock_quantity, 10),
        gst_percent: parseFloat(updated.gst_percent),
        reorder_level: parseInt(updated.reorder_level, 10),
        warranty_months: updated.warranty_months !== null ? parseInt(updated.warranty_months, 10) : null,
      };
    } catch (err) {
      if (err.code === '23505') {
        throw ApiError.conflict(`Product with SKU '${data.sku}' already exists`);
      }
      throw err;
    }
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
      'UPDATE products SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
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
