require('dotenv').config();

const https = require('https');
const fs = require('fs');
const path = require('path');

const app = require('./app');
const connectDB = require('./config/db');
const { logger } = require('./utils/logger');

// fail fast instead of running with missing secrets (e.g. JWT signing with "undefined")
const missing = ['MONGO_URI', 'JWT_SECRET'].filter((name) => !process.env[name]);
if (missing.length) {
  logger.error('config.missing_env', { missing });
  process.exit(1);
}

// --- Start server over HTTPS ---
const PORT = process.env.PORT || 5000;
const CERT_DIR = process.env.CERT_DIR || path.join(__dirname, '..', 'certs');

const sslOptions = {
  key: fs.readFileSync(path.join(CERT_DIR, 'localhost-key.pem')),
  cert: fs.readFileSync(path.join(CERT_DIR, 'localhost.pem')),
};

process.on('unhandledRejection', (reason) => {
  logger.error('process.unhandledRejection', { error: reason?.message || String(reason), stack: reason?.stack });
});

process.on('uncaughtException', (err) => {
  logger.error('process.uncaughtException', { error: err.message, stack: err.stack });
  process.exit(1);
});

const start = async () => {
  await connectDB();
  https.createServer(sslOptions, app).listen(PORT, () => {
    logger.info('server.started', { port: Number(PORT), env: process.env.NODE_ENV });
  });
};

start();
