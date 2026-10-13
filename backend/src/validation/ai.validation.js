const Joi = require('joi');

const askAiSchema = {
  body: Joi.object({
    question: Joi.string()
      .trim()
      .min(3)
      .max(500)
      .required()
      .messages({
        'string.base': 'Question must be a string of characters',
        'string.empty': 'Please provide a business question',
        'string.min': 'Question must be at least 3 characters long',
        'string.max': 'Question cannot exceed 500 characters',
        'any.required': 'Question field is required',
      }),
  }),
};

module.exports = {
  askAiSchema,
};
