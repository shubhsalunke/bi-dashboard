const Joi = require('joi');

const createUserSchema = {
  body: Joi.object({
    name: Joi.string().trim().max(100).required().messages({
      'string.max': 'Name must not exceed 100 characters',
      'any.required': 'Name is required',
    }),
    email: Joi.string().trim().email({ tlds: { allow: false } }).max(254).required().messages({
      'string.email': 'A valid email is required',
      'string.max': 'Email must not exceed 254 characters',
      'any.required': 'Email is required',
    }),
    password: Joi.string().min(6).max(128).required().messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.max': 'Password must not exceed 128 characters',
      'any.required': 'Password is required',
    }),
    role: Joi.string().valid('admin', 'manager', 'analyst').required().messages({
      'any.only': 'Role must be admin, manager, or analyst',
      'any.required': 'Role is required',
    }),
    is_active: Joi.boolean().default(true),
  }),
};

const updateUserSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    name: Joi.string().trim().max(100).messages({
      'string.max': 'Name must not exceed 100 characters',
    }),
    email: Joi.string().trim().email({ tlds: { allow: false } }).max(254).messages({
      'string.email': 'A valid email is required',
      'string.max': 'Email must not exceed 254 characters',
    }),
    password: Joi.string().min(6).max(128).allow('').messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.max': 'Password must not exceed 128 characters',
    }),
    role: Joi.string().valid('admin', 'manager', 'analyst').messages({
      'any.only': 'Role must be admin, manager, or analyst',
    }),
    is_active: Joi.boolean(),
  }).min(1),
};

const userIdSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
};

module.exports = {
  createUserSchema,
  updateUserSchema,
  userIdSchema,
};
