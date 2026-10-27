const Joi = require('joi');

const listProductsSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow('').trim(),
    category: Joi.string().allow('').trim(),
    brand: Joi.string().allow('').trim(),
    isActive: Joi.string().valid('true', 'false', 'all', '').default(''),
    stockStatus: Joi.string().valid('all', 'low', 'out_of_stock', 'out of stock', 'in_stock', '').default(''),
    stock_status: Joi.string().valid('all', 'low', 'out_of_stock', 'out of stock', 'in_stock', '').default(''),
    minPrice: Joi.number().min(0).allow(null, ''),
    min_price: Joi.number().min(0).allow(null, ''),
    maxPrice: Joi.number().min(0).allow(null, ''),
    max_price: Joi.number().min(0).allow(null, ''),
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
    sku: Joi.string().trim().max(30).allow('', null),
    product_name: Joi.string().trim().max(150).required().messages({
      'any.required': 'Product name is required',
    }),
    category: Joi.string().trim().max(100).required().messages({
      'any.required': 'Product category is required',
    }),
    brand: Joi.string().trim().max(100).allow('', null),
    supplier: Joi.string().trim().max(150).allow('', null),
    unit: Joi.string().trim().max(30).default('per unit'),
    unit_price: Joi.number().positive().precision(2).required().messages({
      'number.positive': 'Unit price must be greater than zero',
      'any.required': 'Unit price is required',
    }),
    cost_price: Joi.number().min(0).precision(2).allow(null).messages({
      'number.min': 'Cost price must not be negative',
    }),
    stock_quantity: Joi.number().integer().min(0).default(0).messages({
      'number.min': 'Stock must be a whole number >= 0',
      'number.integer': 'Stock must be a whole number >= 0',
    }),
    gst_percent: Joi.number().min(0).max(28).precision(2).default(18).messages({
      'number.min': 'GST percent cannot be negative',
      'number.max': 'GST percent cannot exceed 28',
    }),
    reorder_level: Joi.number().integer().min(0).default(10).messages({
      'number.min': 'Reorder level must be >= 0',
      'number.integer': 'Reorder level must be a whole number',
    }),
    warranty_months: Joi.number().integer().min(0).allow(null).messages({
      'number.min': 'Warranty months must be >= 0',
      'number.integer': 'Warranty months must be a whole number',
    }),
    description: Joi.string().allow('', null),
    is_active: Joi.boolean().default(true),
  }),
};

const updateProductSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    sku: Joi.string().trim().max(30).allow('', null),
    product_name: Joi.string().trim().max(150),
    category: Joi.string().trim().max(100),
    brand: Joi.string().trim().max(100).allow('', null),
    supplier: Joi.string().trim().max(150).allow('', null),
    unit: Joi.string().trim().max(30),
    unit_price: Joi.number().positive().precision(2),
    cost_price: Joi.number().min(0).precision(2).allow(null).messages({
      'number.min': 'Cost price must not be negative',
    }),
    stock_quantity: Joi.number().integer().min(0).messages({
      'number.min': 'Stock must be a whole number >= 0',
      'number.integer': 'Stock must be a whole number >= 0',
    }),
    gst_percent: Joi.number().min(0).max(28).precision(2).messages({
      'number.min': 'GST percent cannot be negative',
      'number.max': 'GST percent cannot exceed 28',
    }),
    reorder_level: Joi.number().integer().min(0).messages({
      'number.min': 'Reorder level must be >= 0',
      'number.integer': 'Reorder level must be a whole number',
    }),
    warranty_months: Joi.number().integer().min(0).allow(null).messages({
      'number.min': 'Warranty months must be >= 0',
      'number.integer': 'Warranty months must be a whole number',
    }),
    description: Joi.string().allow('', null),
    is_active: Joi.boolean(),
  }).min(1),
};

module.exports = {
  listProductsSchema,
  productIdSchema,
  createProductSchema,
  updateProductSchema,
};
