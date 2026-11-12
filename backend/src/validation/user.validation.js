const Joi = require('joi');

const PHONE_REGEX = /^[+]?[\d\s()-]{7,20}$/;

const listUsersSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(500).default(50),
    search: Joi.string().trim().max(100).allow('').default(''),
    role: Joi.string().valid('admin', 'manager', 'analyst', 'all', '').default(''),
    status: Joi.string().valid('active', 'inactive', 'all', '').default(''),
    sortBy: Joi.string()
      .valid('name', 'email', 'role', 'department', 'is_active', 'last_login_at', 'created_at')
      .default('created_at'),
    sortOrder: Joi.string().valid('asc', 'desc', 'ASC', 'DESC').default('desc'),
  }),
};

const createUserSchema = {
  body: Joi.object({
    name: Joi.string().trim().min(1).max(100).required().messages({
      'string.empty': 'Name is required',
      'string.max': 'Name must not exceed 100 characters',
      'any.required': 'Name is required',
    }),
    email: Joi.string().trim().email({ tlds: { allow: false } }).max(254).required().messages({
      'string.empty': 'Email is required',
      'string.email': 'A valid email is required',
      'string.max': 'Email must not exceed 254 characters',
      'any.required': 'Email is required',
    }),
    password: Joi.string().min(6).max(128).required().messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 6 characters long',
      'string.max': 'Password must not exceed 128 characters',
      'any.required': 'Password is required',
    }),
    role: Joi.string().valid('admin', 'manager', 'analyst').required().messages({
      'any.only': 'Role must be admin, manager, or analyst',
      'any.required': 'Role is required',
    }),
    phone: Joi.string()
      .trim()
      .max(30)
      .pattern(PHONE_REGEX)
      .allow('', null)
      .optional()
      .messages({
        'string.pattern.base': 'Phone number must be 7-20 characters (digits, spaces, +, -, parentheses)',
        'string.max': 'Phone must not exceed 30 characters',
      }),
    department: Joi.string().trim().max(100).allow('', null).optional().messages({
      'string.max': 'Department must not exceed 100 characters',
    }),
    is_active: Joi.boolean().default(true),
  }),
};

const updateUserSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    name: Joi.string().trim().min(1).max(100).messages({
      'string.empty': 'Name cannot be empty',
      'string.max': 'Name must not exceed 100 characters',
    }),
    email: Joi.string().trim().email({ tlds: { allow: false } }).max(254).messages({
      'string.empty': 'Email cannot be empty',
      'string.email': 'A valid email is required',
      'string.max': 'Email must not exceed 254 characters',
    }),
    password: Joi.string().min(6).max(128).allow('', null).messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.max': 'Password must not exceed 128 characters',
    }),
    role: Joi.string().valid('admin', 'manager', 'analyst').messages({
      'any.only': 'Role must be admin, manager, or analyst',
    }),
    phone: Joi.string()
      .trim()
      .max(30)
      .pattern(PHONE_REGEX)
      .allow('', null)
      .messages({
        'string.pattern.base': 'Phone number must be 7-20 characters (digits, spaces, +, -, parentheses)',
        'string.max': 'Phone must not exceed 30 characters',
      }),
    department: Joi.string().trim().max(100).allow('', null).messages({
      'string.max': 'Department must not exceed 100 characters',
    }),
    is_active: Joi.boolean(),
  }).min(1),
};

const updateUserStatusSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    is_active: Joi.boolean().required().messages({
      'any.required': 'is_active is required',
    }),
  }),
};

const userIdSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
};

const resetRequestIdSchema = {
  params: Joi.object({
    requestId: Joi.number().integer().positive().required(),
  }),
};

const userActivitySchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

const auditLogsQuerySchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

module.exports = {
  listUsersSchema,
  createUserSchema,
  updateUserSchema,
  updateUserStatusSchema,
  userIdSchema,
  resetRequestIdSchema,
  userActivitySchema,
  auditLogsQuerySchema,
};
