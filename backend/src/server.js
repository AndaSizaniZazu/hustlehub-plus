require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const https = require('https');
const fs = require('fs');
const path = require('path');

const connectDB = require('./config/db');
const sanitize = require('./middleware/sanitize.middleware');
const { globalLimiter } = require('./middleware/rateLimit.middleware');

const app = express();

// --- Core middleware ---
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
app.use(globalLimiter);
app.use(express.json({ limit: '10kb' }));
app.use(sanitize); // must come after express.json()

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

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
  console.error(err.stack); // server-side only, never sent to client
  res.status(err.status || 500).json({ message: 'Something went wrong' });
});

// --- Start server over HTTPS ---
const PORT = process.env.PORT || 5000;

const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, '..', 'certs', 'localhost-key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '..', 'certs', 'localhost.pem')),
};

const start = async () => {
  await connectDB();
  https.createServer(sslOptions, app).listen(PORT, () => {
    console.log(`Server running on https://localhost:${PORT}`);
  });
};

start();
