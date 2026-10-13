const { ApiError } = require('./errorHandler');

/**
 * Request validation middleware using Joi
 * @param {Object} schema - Object with optional { body, query, params } Joi schemas
 */
const validate = (schema) => {
  return (req, res, next) => {
    const locations = ['body', 'query', 'params'];
    const errors = [];

    for (const loc of locations) {
      if (schema[loc]) {
        const { error, value } = schema[loc].validate(req[loc], {
          abortEarly: false,
          stripUnknown: true,
        });

        if (error) {
          error.details.forEach((item) => {
            errors.push({
              field: `${loc}.${item.path.join('.')}`,
              message: item.message.replace(/"/g, ''),
            });
          });
        } else {
          // Replace with sanitized/stripped value
          req[loc] = value;
        }
      }
    }

    if (errors.length > 0) {
      return next(ApiError.badRequest('Request validation failed', errors));
    }

    next();
  };
};

module.exports = { validate };
