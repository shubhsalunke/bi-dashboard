const Joi = require('joi');

const createSaleSchema = {
  body: Joi.object({
    customer_id: Joi.number().integer().positive().required().messages({
      'any.required': 'Customer ID is required',
    }),
    sale_date: Joi.date().iso().allow(null),
    status: Joi.string().valid('completed', 'pending', 'cancelled').default('completed'),
    items: Joi.array()
      .min(1)
      .items(
        Joi.object({
          product_id: Joi.number().integer().positive().required().messages({
            'any.required': 'Product ID is required for each sale item',
          }),
          quantity: Joi.number().integer().positive().required().messages({
            'number.positive': 'Quantity must be at least 1',
            'any.required': 'Quantity is required for each sale item',
          }),
        })
      )
      .required()
      .messages({
        'array.min': 'A sale must include at least one item',
        'any.required': 'Sale items are required',
      }),
  }),
};

const listSalesSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    customerId: Joi.number().integer().positive().allow(null, ''),
    status: Joi.string().valid('completed', 'pending', 'cancelled', '').default(''),
    startDate: Joi.date().iso().allow(''),
    endDate: Joi.date().iso().allow(''),
    sortBy: Joi.string().valid('id', 'sale_date', 'total_amount', 'status', 'created_at').default('sale_date'),
    sortOrder: Joi.string().valid('asc', 'desc', 'ASC', 'DESC').default('desc'),
  }),
};

const saleIdSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
};

module.exports = {
  createSaleSchema,
  listSalesSchema,
  saleIdSchema,
};
