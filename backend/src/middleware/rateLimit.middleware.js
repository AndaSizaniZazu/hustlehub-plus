const rateLimit = require('express-rate-limit');
const { logger, requestMeta } = require('../utils/logger');

const tooMany = { message: 'Too many requests, please try again later' };

// log every blocked request so brute-force and flooding show up in security.log
const logged = (name) => (req, res, next, options) => {
  logger.warn('ratelimit.exceeded', { ...requestMeta(req), limiter: name });
  res.status(options.statusCode).json(options.message);
};

const globalLimiter = rateLimit({
  handler: logged('global'),
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: tooMany,
});

const loginLimiter = rateLimit({
  handler: logged('login'),
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT) || 5,
  skipSuccessfulRequests: true, // only failed logins count toward brute-force
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: tooMany,
});

const registerLimiter = rateLimit({
  handler: logged('register'),
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: tooMany,
});

const bookingLimiter = rateLimit({
  handler: logged('booking'),
  windowMs: 10 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: tooMany,
});

module.exports = { globalLimiter, loginLimiter, registerLimiter, bookingLimiter };