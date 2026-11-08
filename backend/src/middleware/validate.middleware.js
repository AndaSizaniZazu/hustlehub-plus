const { validationResult } = require('express-validator');
const { logger, requestMeta } = require('../utils/logger');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const fields = errors.array().map((e) => ({ field: e.path, message: e.msg }));
    // field names only, never the submitted values (they may contain passwords)
    logger.warn('validation.failed', { ...requestMeta(req), fields: fields.map((f) => f.field) });
    return res.status(400).json({
      message: 'Validation failed',
      errors: fields,
    });
  }
  next();
};

module.exports = validate;
