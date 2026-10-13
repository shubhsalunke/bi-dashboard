const Joi = require('joi');

const dashboardFilterSchema = {
  query: Joi.object({
    startDate: Joi.date().iso().allow(''),
    endDate: Joi.date().iso().allow(''),
  }),
};

const salesReportFilterSchema = {
  query: Joi.object({
    startDate: Joi.date().iso().allow(''),
    endDate: Joi.date().iso().allow(''),
    city: Joi.string().allow('').trim(),
    category: Joi.string().allow('').trim(),
    customerId: Joi.number().integer().positive().allow(null, ''),
  }),
};

module.exports = {
  dashboardFilterSchema,
  salesReportFilterSchema,
};
