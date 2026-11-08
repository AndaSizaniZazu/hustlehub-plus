const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logger, requestMeta } = require('../utils/logger');

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('auth.token_missing', requestMeta(req));
    return res.status(401).json({ message: 'Not authorized' });
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    logger.warn('auth.token_invalid', { ...requestMeta(req), reason: err.name });
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  try {
    // a token is only valid while its version matches the user's current one,
    // so logout (which bumps tokenVersion) revokes it before it expires
    const user = await User.findById(decoded.id).select('role tokenVersion');
    if (!user || user.tokenVersion !== decoded.tv) {
      logger.warn('auth.token_revoked', { ...requestMeta(req), userId: decoded.id });
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    req.user = { id: decoded.id, role: user.role };
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = protect;
