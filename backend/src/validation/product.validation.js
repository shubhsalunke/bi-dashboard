const Joi = require('joi');

const listProductsSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow('').trim(),
    category: Joi.string().allow('').trim(),
    isActive: Joi.string().valid('true', 'false', 'all', '').default(''),
    sortBy: Joi.string().valid('id', 'product_name', 'category', 'unit_price', 'created_at').default('product_name'),
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
    product_name: Joi.string().trim().max(150).required().messages({
      'any.required': 'Product name is required',
    }),
    category: Joi.string().trim().max(100).required().messages({
      'any.required': 'Product category is required',
    }),
    unit_price: Joi.number().positive().precision(2).required().messages({
      'number.positive': 'Unit price must be greater than zero',
      'any.required': 'Unit price is required',
    }),
    is_active: Joi.boolean().default(true),
  }),
};

const updateProductSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    product_name: Joi.string().trim().max(150),
    category: Joi.string().trim().max(100),
    unit_price: Joi.number().positive().precision(2),
    is_active: Joi.boolean(),
  }).min(1),
};

module.exports = {
  listProductsSchema,
  productIdSchema,
  createProductSchema,
  updateProductSchema,
};
