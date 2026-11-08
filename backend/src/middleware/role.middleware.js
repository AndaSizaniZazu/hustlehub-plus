const { logger, requestMeta } = require('../utils/logger');

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    logger.warn('access.denied_role', { ...requestMeta(req), role: req.user?.role, required: roles });
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};

module.exports = authorize;
