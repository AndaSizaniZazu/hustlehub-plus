const fs = require('fs');
const path = require('path');
const winston = require('winston');

// JSON lines with a timestamp, so logs can be searched or shipped to a log platform.
// Never pass passwords, password hashes or tokens into the logger.
const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, '..', '..', 'logs');
const isTest = process.env.NODE_ENV === 'test';

const transports = [
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production'
      ? winston.format.json()
      : winston.format.combine(winston.format.colorize(), winston.format.simple()),
  }),
];

if (!isTest) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
  transports.push(
    new winston.transports.File({ filename: path.join(LOG_DIR, 'app.log'), maxsize: 5 * 1024 * 1024, maxFiles: 5 }),
    new winston.transports.File({ filename: path.join(LOG_DIR, 'error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(LOG_DIR, 'security.log'), level: 'warn' })
  );
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'http',
  silent: isTest,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'hustlehub-api' },
  transports,
});

// common request context for every event: who, from where, which request
const requestMeta = (req) => ({
  requestId: req.id,
  ip: req.ip,
  userId: req.user?.id,
  method: req.method,
  path: req.originalUrl,
});

module.exports = { logger, requestMeta };
