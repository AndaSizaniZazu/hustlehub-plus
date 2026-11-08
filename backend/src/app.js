const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const sanitize = require('./middleware/sanitize.middleware');
const requestId = require('./middleware/requestId.middleware');
const { globalLimiter } = require('./middleware/rateLimit.middleware');
const { logger, requestMeta } = require('./utils/logger');

const app = express();

// behind a reverse proxy (nginx in Docker) use the client IP from X-Forwarded-For,
// otherwise every user shares the proxy's IP and its rate-limit counters
if (process.env.TRUST_PROXY) {
  app.set('trust proxy', Number(process.env.TRUST_PROXY));
}

// --- Core middleware ---
app.use(requestId);
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
  })
);
app.use(cors({ origin: process.env.CLIENT_URL }));

// every request goes to the log as one line (method, path, status, time)
morgan.token('id', (req) => req.id);
app.use(
  morgan(':id :remote-addr :method :url :status :response-time ms', {
    stream: { write: (line) => logger.http(line.trim()) },
    skip: () => process.env.NODE_ENV === 'test',
  })
);

app.use(globalLimiter);
app.use(express.json({ limit: '10kb' }));
app.use(sanitize); // must come after express.json()

// --- Health check route ---
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// --- Routes ---
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/gigs', require('./routes/gig.routes'));
app.use('/api/bookings', require('./routes/booking.routes'));
app.use('/api/transactions', require('./routes/transaction.routes'));

// --- 404 handler (no matching route) ---
app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

// --- Central error handler (must be last) ---
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) {
    // full details stay server-side, never sent to the client
    logger.error('server.error', { ...requestMeta(req), status, error: err.message, stack: err.stack });
  } else {
    logger.warn('request.rejected', { ...requestMeta(req), status, error: err.type || err.message });
  }
  const message = status === 413 ? 'Payload too large' : 'Something went wrong';
  res.status(status).json({ message });
});

module.exports = app;
