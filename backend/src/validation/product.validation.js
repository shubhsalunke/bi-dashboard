const Joi = require('joi');

const maxTwoDecimals = (value, helpers) => {
  if (value !== undefined && value !== null) {
    const str = String(value);
    if (str.includes('.') && str.split('.')[1].length > 2) {
      return helpers.message(`${helpers.state.path.join('.')} cannot have more than 2 decimal places`);
    }
  }
  return value;
};

const listProductsSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow('').trim().max(100),
    category: Joi.string().allow('').trim().max(100),
    brand: Joi.string().allow('').trim().max(100),
    isActive: Joi.string().valid('true', 'false', 'all', '').default(''),
    stockStatus: Joi.string().valid('all', 'low', 'out_of_stock', 'out of stock', 'in_stock', '').default(''),
    stock_status: Joi.string().valid('all', 'low', 'out_of_stock', 'out of stock', 'in_stock', '').default(''),
    minPrice: Joi.number().min(0).max(10000000).allow(null, ''),
    min_price: Joi.number().min(0).max(10000000).allow(null, ''),
    maxPrice: Joi.number().min(0).max(10000000).allow(null, ''),
    max_price: Joi.number().min(0).max(10000000).allow(null, ''),
    sortBy: Joi.string()
      .valid(
        'id',
        'sku',
        'product_name',
        'category',
        'brand',
        'unit_price',
        'cost_price',
        'stock_quantity',
        'reorder_level',
        'gst_percent',
        'units_sold',
        'total_revenue',
        'created_at'
      )
      .default('product_name'),
    sortOrder: Joi.string().valid('asc', 'desc', 'ASC', 'DESC').default('asc'),
  }),
};

const productIdSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
};

const createProductSchema = {
  body: Joi.object({
    sku: Joi.string()
      .trim()
      .max(30)
      .pattern(/^[A-Za-z0-9-]+$/)
      .allow('', null)
      .messages({
        'string.max': 'Product Code must not exceed 30 characters',
        'string.pattern.base': 'Product Code must contain only letters, numbers, and hyphens',
      }),
    product_name: Joi.string().trim().max(150).required().messages({
      'string.max': 'Product name must not exceed 150 characters',
      'any.required': 'Product name is required',
    }),
    category: Joi.string().trim().max(100).required().messages({
      'string.max': 'Category must not exceed 100 characters',
      'any.required': 'Product category is required',
    }),
    brand: Joi.string().trim().max(60).allow('', null).messages({
      'string.max': 'Brand must not exceed 60 characters',
    }),
    supplier: Joi.string().trim().max(100).allow('', null).messages({
      'string.max': 'Supplier must not exceed 100 characters',
    }),
    unit: Joi.string().trim().max(30).default('per unit').messages({
      'string.max': 'Unit must not exceed 30 characters',
    }),
    unit_price: Joi.number().min(0.01).max(10000000).custom(maxTwoDecimals).required().messages({
      'number.min': 'Unit price must be at least ₹0.01',
      'number.max': 'Unit price cannot exceed ₹10,000,000 (1 crore)',
      'any.required': 'Unit price is required',
    }),
    cost_price: Joi.number().min(0).max(10000000).custom(maxTwoDecimals).allow(null).messages({
      'number.min': 'Cost price must not be negative',
      'number.max': 'Cost price cannot exceed ₹10,000,000',
    }),
    stock_quantity: Joi.number().integer().min(0).max(1000000).default(0).messages({
      'number.min': 'Stock must be a whole number >= 0',
      'number.max': 'Stock quantity cannot exceed 1,000,000',
      'number.integer': 'Stock must be a whole number',
    }),
    gst_percent: Joi.number().min(0).max(28).custom(maxTwoDecimals).default(18).messages({
      'number.min': 'GST percent cannot be negative',
      'number.max': 'GST percent cannot exceed 28',
    }),
    reorder_level: Joi.number().integer().min(0).max(1000000).default(10).messages({
      'number.min': 'Reorder level must be >= 0',
      'number.max': 'Reorder level cannot exceed 1,000,000',
      'number.integer': 'Reorder level must be a whole number',
    }),
    warranty_months: Joi.number().integer().min(0).max(120).allow(null).messages({
      'number.min': 'Warranty months must be >= 0',
      'number.max': 'Warranty months cannot exceed 120',
      'number.integer': 'Warranty months must be a whole number',
    }),
    description: Joi.string().max(1000).allow('', null).messages({
      'string.max': 'Description must not exceed 1000 characters',
    }),
    is_active: Joi.boolean().default(true),
  }).custom((obj, helpers) => {
    if (obj.cost_price !== undefined && obj.cost_price !== null && obj.unit_price !== undefined) {
      if (Number(obj.cost_price) > Number(obj.unit_price)) {
        return helpers.message('Cost price must not be greater than unit price');
      }
    }
    return obj;
  }),
};

const updateProductSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    sku: Joi.string()
      .trim()
      .max(30)
      .pattern(/^[A-Za-z0-9-]+$/)
      .allow('', null)
      .messages({
        'string.max': 'Product Code must not exceed 30 characters',
        'string.pattern.base': 'Product Code must contain only letters, numbers, and hyphens',
      }),
    product_name: Joi.string().trim().max(150).messages({
      'string.max': 'Product name must not exceed 150 characters',
    }),
    category: Joi.string().trim().max(100).messages({
      'string.max': 'Category must not exceed 100 characters',
    }),
    brand: Joi.string().trim().max(60).allow('', null).messages({
      'string.max': 'Brand must not exceed 60 characters',
    }),
    supplier: Joi.string().trim().max(100).allow('', null).messages({
      'string.max': 'Supplier must not exceed 100 characters',
    }),
    unit: Joi.string().trim().max(30).messages({
      'string.max': 'Unit must not exceed 30 characters',
    }),
    unit_price: Joi.number().min(0.01).max(10000000).custom(maxTwoDecimals).messages({
      'number.min': 'Unit price must be at least ₹0.01',
      'number.max': 'Unit price cannot exceed ₹10,000,000 (1 crore)',
    }),
    cost_price: Joi.number().min(0).max(10000000).custom(maxTwoDecimals).allow(null).messages({
      'number.min': 'Cost price must not be negative',
      'number.max': 'Cost price cannot exceed ₹10,000,000',
    }),
    stock_quantity: Joi.number().integer().min(0).max(1000000).messages({
      'number.min': 'Stock must be a whole number >= 0',
      'number.max': 'Stock quantity cannot exceed 1,000,000',
      'number.integer': 'Stock must be a whole number >= 0',
    }),
    gst_percent: Joi.number().min(0).max(28).custom(maxTwoDecimals).messages({
      'number.min': 'GST percent cannot be negative',
      'number.max': 'GST percent cannot exceed 28',
    }),
    reorder_level: Joi.number().integer().min(0).max(1000000).messages({
      'number.min': 'Reorder level must be >= 0',
      'number.max': 'Reorder level cannot exceed 1,000,000',
      'number.integer': 'Reorder level must be a whole number',
    }),
    warranty_months: Joi.number().integer().min(0).max(120).allow(null).messages({
      'number.min': 'Warranty months must be >= 0',
      'number.max': 'Warranty months cannot exceed 120',
      'number.integer': 'Warranty months must be a whole number',
    }),
    description: Joi.string().max(1000).allow('', null).messages({
      'string.max': 'Description must not exceed 1000 characters',
    }),
    is_active: Joi.boolean(),
  }).min(1).custom((obj, helpers) => {
    if (obj.cost_price !== undefined && obj.cost_price !== null && obj.unit_price !== undefined) {
      if (Number(obj.cost_price) > Number(obj.unit_price)) {
        return helpers.message('Cost price must not be greater than unit price');
      }
    }
    return obj;
  }),
};

module.exports = {
  listProductsSchema,
  productIdSchema,
  createProductSchema,
  updateProductSchema,
};
