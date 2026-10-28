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
  }),
};

const refreshSchema = {
  body: Joi.object({
    refreshToken: Joi.string().required().messages({
      'any.required': 'Refresh token is required',
    }),
  }),
};

module.exports = {
  loginSchema,
  refreshSchema,
};
