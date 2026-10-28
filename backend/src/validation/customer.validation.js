const Joi = require('joi');

const listCustomersSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow('').trim().max(100),
    city: Joi.string().allow('').trim().max(100),
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
      'string.max': 'Customer code must not exceed 50 characters',
      'any.required': 'Customer code is required',
    }),
    customer_name: Joi.string().trim().max(100).required().messages({
      'string.max': 'Customer name must not exceed 100 characters',
      'any.required': 'Customer name is required',
    }),
    email: Joi.string().trim().email({ tlds: { allow: false } }).max(254).required().messages({
      'string.email': 'A valid customer email is required',
      'string.max': 'Email must not exceed 254 characters',
      'any.required': 'Email is required',
    }),
    phone: Joi.string().trim().pattern(/^\d{10}$/).allow(null, '').messages({
      'string.pattern.base': 'Phone must be exactly 10 digits (digits only)',
    }),
    city: Joi.string().trim().max(100).required().messages({
      'string.max': 'City must not exceed 100 characters',
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
    customer_code: Joi.string().trim().max(50).messages({
      'string.max': 'Customer code must not exceed 50 characters',
    }),
    customer_name: Joi.string().trim().max(100).messages({
      'string.max': 'Customer name must not exceed 100 characters',
    }),
    email: Joi.string().trim().email({ tlds: { allow: false } }).max(254).messages({
      'string.email': 'A valid customer email is required',
      'string.max': 'Email must not exceed 254 characters',
    }),
    phone: Joi.string().trim().pattern(/^\d{10}$/).allow(null, '').messages({
      'string.pattern.base': 'Phone must be exactly 10 digits (digits only)',
    }),
    city: Joi.string().trim().max(100).messages({
      'string.max': 'City must not exceed 100 characters',
    }),
    status: Joi.string().valid('active', 'inactive'),
  }).min(1),
};

module.exports = {
  listCustomersSchema,
  customerIdSchema,
  createCustomerSchema,
  updateCustomerSchema,
};
