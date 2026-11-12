const Joi = require('joi');
const {
  CUSTOMER_INDUSTRIES,
  CUSTOMER_TYPES,
  CUSTOMER_STATUSES,
  INDIAN_STATES,
} = require('./customer.validation');

const REPORT_PRESETS = [
  'all',
  '7d',
  '30d',
  '90d',
  'this_month',
  'last_month',
  'this_quarter',
  'this_fy',
];

const REPORT_GRANULARITIES = ['monthly', 'weekly'];

const dashboardFilterSchema = {
  query: Joi.object({
    startDate: Joi.date().iso().allow('').messages({
      'date.format': 'startDate must be a valid ISO date (YYYY-MM-DD)',
    }),
    endDate: Joi.date().iso().allow('').messages({
      'date.format': 'endDate must be a valid ISO date (YYYY-MM-DD)',
    }),
    preset: Joi.string()
      .valid(...REPORT_PRESETS, '')
      .default('')
      .messages({
        'any.only': `preset must be one of: ${REPORT_PRESETS.join(', ')}`,
      }),
    city: Joi.string().allow('').trim().max(100).messages({
      'string.max': 'city filter must not exceed 100 characters',
    }),
    category: Joi.string().allow('').trim().max(100).messages({
      'string.max': 'category filter must not exceed 100 characters',
    }),
    brand: Joi.string().allow('').trim().max(60).messages({
      'string.max': 'brand filter must not exceed 60 characters',
    }),
    industry: Joi.string()
      .valid(...CUSTOMER_INDUSTRIES, '')
      .default('')
      .messages({
        'any.only': `industry must be one of: ${CUSTOMER_INDUSTRIES.join(', ')}`,
      }),
    customer_type: Joi.string()
      .valid(...CUSTOMER_TYPES, '')
      .default('')
      .messages({
        'any.only': `customer_type must be one of: ${CUSTOMER_TYPES.join(', ')}`,
      }),
    granularity: Joi.string()
      .valid(...REPORT_GRANULARITIES)
      .default('monthly')
      .messages({
        'any.only': `granularity must be one of: ${REPORT_GRANULARITIES.join(', ')}`,
      }),
    recentSalesStatus: Joi.string()
      .valid('completed', 'pending', 'cancelled', '')
      .default('')
      .messages({
        'any.only': 'recentSalesStatus must be one of: completed, pending, cancelled',
      }),
    topProductsSort: Joi.string()
      .valid('revenue', 'units')
      .default('revenue')
      .messages({
        'any.only': 'topProductsSort must be one of: revenue, units',
      }),
    topProductsLimit: Joi.number()
      .integer()
      .valid(5, 10)
      .default(5)
      .messages({
        'any.only': 'topProductsLimit must be 5 or 10',
      }),
    topCustomersSort: Joi.string()
      .valid('spent', 'orders')
      .default('spent')
      .messages({
        'any.only': 'topCustomersSort must be one of: spent, orders',
      }),
    topCustomersLimit: Joi.number()
      .integer()
      .valid(5, 10)
      .default(5)
      .messages({
        'any.only': 'topCustomersLimit must be 5 or 10',
      }),
  }).custom((obj, helpers) => {
    if (obj.startDate && obj.endDate && new Date(obj.startDate) > new Date(obj.endDate)) {
      return helpers.message('startDate must not be after endDate');
    }
    return obj;
  }),
};

const salesReportFilterSchema = {
  query: Joi.object({
    startDate: Joi.date().iso().allow('').messages({
      'date.format': 'startDate must be a valid ISO date (YYYY-MM-DD)',
    }),
    endDate: Joi.date().iso().allow('').messages({
      'date.format': 'endDate must be a valid ISO date (YYYY-MM-DD)',
    }),
    preset: Joi.string()
      .valid(...REPORT_PRESETS, '')
      .default('')
      .messages({
        'any.only': `preset must be one of: ${REPORT_PRESETS.join(', ')}`,
      }),
    city: Joi.string().allow('').trim().max(100).messages({
      'string.max': 'city filter must not exceed 100 characters',
    }),
    category: Joi.string().allow('').trim().max(100).messages({
      'string.max': 'category filter must not exceed 100 characters',
    }),
    brand: Joi.string().allow('').trim().max(60).messages({
      'string.max': 'brand filter must not exceed 60 characters',
    }),
    industry: Joi.string()
      .valid(...CUSTOMER_INDUSTRIES, '')
      .default('')
      .messages({
        'any.only': `industry must be one of: ${CUSTOMER_INDUSTRIES.join(', ')}`,
      }),
    customer_type: Joi.string()
      .valid(...CUSTOMER_TYPES, '')
      .default('')
      .messages({
        'any.only': `customer_type must be one of: ${CUSTOMER_TYPES.join(', ')}`,
      }),
    state: Joi.string()
      .valid(...INDIAN_STATES, '')
      .default('')
      .messages({
        'any.only': 'state must be a valid Indian state or union territory',
      }),
    status: Joi.string()
      .valid(...CUSTOMER_STATUSES, '')
      .default('')
      .messages({
        'any.only': `status must be one of: ${CUSTOMER_STATUSES.join(', ')}`,
      }),
    customerId: Joi.number().integer().positive().allow(null, '').messages({
      'number.base': 'customerId must be a valid positive integer',
    }),
    granularity: Joi.string()
      .valid(...REPORT_GRANULARITIES)
      .default('monthly')
      .messages({
        'any.only': `granularity must be one of: ${REPORT_GRANULARITIES.join(', ')}`,
      }),
  }).custom((obj, helpers) => {
    if (obj.startDate && obj.endDate && new Date(obj.startDate) > new Date(obj.endDate)) {
      return helpers.message('startDate must not be after endDate');
    }
    return obj;
  }),
};

module.exports = {
  REPORT_PRESETS,
  REPORT_GRANULARITIES,
  dashboardFilterSchema,
  salesReportFilterSchema,
};
