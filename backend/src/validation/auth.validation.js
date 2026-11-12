const Joi = require('joi');

const loginSchema = {
  body: Joi.object({
    email: Joi.string()
      .trim()
      .email({ tlds: { allow: false } })
      .max(254)
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'string.max': 'Email must not exceed 254 characters',
        'any.required': 'Email is required',
      }),
    password: Joi.string().max(128).required().messages({
      'string.max': 'Password must not exceed 128 characters',
      'any.required': 'Password is required',
    }),
    rememberMe: Joi.boolean().default(false),
  }),
};

const refreshSchema = {
  body: Joi.object({
    refreshToken: Joi.string().required().messages({
      'any.required': 'Refresh token is required',
    }),
  }),
};

const forgotPasswordSchema = {
  body: Joi.object({
    email: Joi.string()
      .trim()
      .email({ tlds: { allow: false } })
      .max(254)
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'string.max': 'Email must not exceed 254 characters',
        'any.required': 'Email is required',
      }),
  }),
};

const resetPasswordWithTokenSchema = {
  body: Joi.object({
    token: Joi.string().trim().min(32).max(256).required().messages({
      'any.required': 'Reset token is required',
      'string.min': 'Invalid reset token',
    }),
    password: Joi.string().min(6).max(128).required().messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.max': 'Password must not exceed 128 characters',
      'any.required': 'Password is required',
    }),
  }),
};

module.exports = {
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordWithTokenSchema,
};
