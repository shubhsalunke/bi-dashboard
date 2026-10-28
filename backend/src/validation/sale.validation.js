const Joi = require('joi');

const createSaleSchema = {
  body: Joi.object({
    customer_id: Joi.number().integer().positive().required().messages({
      'any.required': 'Customer ID is required',
    }),
    sale_date: Joi.date().iso().allow(null),
    status: Joi.string().valid('completed', 'pending', 'cancelled').default('completed'),
    discount: Joi.number().min(0).max(100).default(0).messages({
      'number.min': 'Discount must be at least 0',
      'number.max': 'Discount cannot exceed 100',
    }),
    items: Joi.array()
      .min(1)
      .items(
        Joi.object({
          product_id: Joi.number().integer().positive().required().messages({
            'any.required': 'Product ID is required for each sale item',
          }),
          quantity: Joi.number().integer().min(1).max(100000).required().messages({
            'number.min': 'Quantity must be at least 1',
            'number.max': 'Quantity cannot exceed 100,000',
            'number.integer': 'Quantity must be a whole number',
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
