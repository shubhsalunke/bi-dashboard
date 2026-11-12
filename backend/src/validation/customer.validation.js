const Joi = require('joi');

const CUSTOMER_INDUSTRIES = [
  'IT Services',
  'Finance',
  'Healthcare',
  'Retail',
  'Manufacturing',
  'Education',
  'Other',
];

const CUSTOMER_TYPES = ['Large Business', 'Small Business', 'Startup', 'Individual'];

const CUSTOMER_STATUSES = ['active', 'inactive', 'on_hold', 'prospect', 'churned'];

const INDIAN_STATES = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const extendedCustomerFields = {
  industry: Joi.string()
    .valid(...CUSTOMER_INDUSTRIES)
    .allow(null, '')
    .messages({
      'any.only': `Industry must be one of: ${CUSTOMER_INDUSTRIES.join(', ')}`,
    }),
  customer_type: Joi.string()
    .valid(...CUSTOMER_TYPES)
    .allow(null, '')
    .messages({
      'any.only': `Customer type must be one of: ${CUSTOMER_TYPES.join(', ')}`,
    }),
  contact_person: Joi.string().trim().max(100).allow(null, '').messages({
    'string.max': 'Contact person name must not exceed 100 characters',
  }),
  state: Joi.string()
    .valid(...INDIAN_STATES)
    .allow(null, '')
    .messages({
      'any.only': 'State must be a valid Indian state or union territory',
    }),
  gst_number: Joi.string()
    .trim()
    .uppercase()
    .pattern(GSTIN_REGEX)
    .allow(null, '')
    .messages({
      'string.pattern.base': 'GST number must be a valid 15-character GSTIN (e.g. 27AAACA1234A1Z5)',
    }),
  address: Joi.string().trim().max(500).allow(null, '').messages({
    'string.max': 'Address must not exceed 500 characters',
  }),
  notes: Joi.string().trim().max(1000).allow(null, '').messages({
    'string.max': 'Notes must not exceed 1000 characters',
  }),
};

const listCustomersSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow('').trim().max(100),
    city: Joi.string().allow('').trim().max(100),
    industry: Joi.string()
      .valid(...CUSTOMER_INDUSTRIES, '')
      .default('')
      .messages({
        'any.only': `Industry filter must be one of: ${CUSTOMER_INDUSTRIES.join(', ')}`,
      }),
    customer_type: Joi.string()
      .valid(...CUSTOMER_TYPES, '')
      .default('')
      .messages({
        'any.only': `Customer type filter must be one of: ${CUSTOMER_TYPES.join(', ')}`,
      }),
    status: Joi.string()
      .valid(...CUSTOMER_STATUSES, '')
      .default('')
      .messages({
        'any.only': `Status filter must be one of: ${CUSTOMER_STATUSES.join(', ')}`,
      }),
    sortBy: Joi.string()
      .valid(
        'id',
        'customer_code',
        'customer_name',
        'email',
        'city',
        'state',
        'industry',
        'customer_type',
        'contact_person',
        'status',
        'created_at'
      )
      .default('created_at'),
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
    status: Joi.string()
      .valid(...CUSTOMER_STATUSES)
      .default('active')
      .messages({
        'any.only': `Status must be one of: ${CUSTOMER_STATUSES.join(', ')}`,
      }),
    ...extendedCustomerFields,
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
    status: Joi.string()
      .valid(...CUSTOMER_STATUSES)
      .messages({
        'any.only': `Status must be one of: ${CUSTOMER_STATUSES.join(', ')}`,
      }),
    ...extendedCustomerFields,
  }).min(1),
};

module.exports = {
  CUSTOMER_INDUSTRIES,
  CUSTOMER_TYPES,
  CUSTOMER_STATUSES,
  INDIAN_STATES,
  GSTIN_REGEX,
  listCustomersSchema,
  customerIdSchema,
  createCustomerSchema,
  updateCustomerSchema,
};
