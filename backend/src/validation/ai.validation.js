const Joi = require('joi');

const historyItemSchema = Joi.object({
  question: Joi.string().trim().min(1).max(500).required(),
  answer: Joi.string().trim().min(1).max(600).required(),
});

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
    history: Joi.array()
      .items(historyItemSchema)
      .max(3)
      .optional()
      .default([]),
    conversationId: Joi.number().integer().positive().allow(null).optional(),
  }),
};

const conversationIdParamSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
};

const createConversationSchema = {
  body: Joi.object({
    title: Joi.string().trim().min(1).max(150).optional().default('New Conversation'),
  }),
};

const renameConversationSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    title: Joi.string().trim().min(1).max(150).required().messages({
      'any.required': 'Conversation title is required',
      'string.empty': 'Conversation title cannot be empty',
    }),
  }),
};

const feedbackSchema = {
  body: Joi.object({
    messageId: Joi.number().integer().positive().required(),
    rating: Joi.string().valid('up', 'down').required(),
    comment: Joi.string().trim().max(500).allow('', null).optional(),
  }),
};

const pinWidgetSchema = {
  body: Joi.object({
    title: Joi.string().trim().min(1).max(150).required(),
    question: Joi.string().trim().min(1).max(500).required(),
    sql: Joi.string().max(5000).allow('', null).optional(),
    chartType: Joi.string().valid('bar', 'line', 'donut', 'table').required(),
    chartConfig: Joi.object().unknown(true).allow(null).optional(),
    columns: Joi.array().items(Joi.object().unknown(true)).default([]),
    rows: Joi.array().items(Joi.object().unknown(true)).max(50).default([]),
  }),
};

const insightsSchema = {
  body: Joi.object({
    conversationId: Joi.number().integer().positive().allow(null).optional(),
    language: Joi.string().valid('en', 'hi', 'hinglish').optional().default('en'),
  }),
};

const sqlLogsQuerySchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

module.exports = {
  askAiSchema,
  conversationIdParamSchema,
  createConversationSchema,
  renameConversationSchema,
  feedbackSchema,
  pinWidgetSchema,
  insightsSchema,
  sqlLogsQuerySchema,
};
