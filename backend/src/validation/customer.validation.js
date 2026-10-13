const Joi = require('joi');

const listCustomersSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow('').trim(),
    city: Joi.string().allow('').trim(),
    status: Joi.string().valid('active', 'inactive', '').default(''),
    sortBy: Joi.string().valid('id', 'customer_code', 'customer_name', 'email', 'city', 'status', 'created_at').default('created_at'),
    sortOrder: Joi.string().valid('asc', 'desc', 'ASC', 'DESC').default('desc'),
    startDate: Joi.date().iso().allow(''),
    endDate: Joi.date().iso().allow(''),
  }),
};

const customerIdSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
};

const createCustomerSchema = {
  body: Joi.object({
    customer_code: Joi.string().trim().max(50).required().messages({
      'any.required': 'Customer code is required',
    }),
    customer_name: Joi.string().trim().max(150).required().messages({
      'any.required': 'Customer name is required',
    }),
    email: Joi.string().email({ tlds: { allow: false } }).trim().max(255).required().messages({
      'string.email': 'A valid customer email is required',
      'any.required': 'Email is required',
    }),
    phone: Joi.string().trim().max(50).allow(null, ''),
    city: Joi.string().trim().max(100).required().messages({
      'any.required': 'City is required',
    }),
    status: Joi.string().valid('active', 'inactive').default('active'),
  }),
};

const updateCustomerSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    customer_code: Joi.string().trim().max(50),
    customer_name: Joi.string().trim().max(150),
    email: Joi.string().email({ tlds: { allow: false } }).trim().max(255),
    phone: Joi.string().trim().max(50).allow(null, ''),
    city: Joi.string().trim().max(100),
    status: Joi.string().valid('active', 'inactive'),
  }).min(1),
};

module.exports = {
  listCustomersSchema,
  customerIdSchema,
  createCustomerSchema,
  updateCustomerSchema,
};
