const crypto = require('crypto');

// Gives every request an id that appears in all its log lines and in the
// X-Request-Id response header, so a user's error report can be traced in the logs.
const requestId = (req, res, next) => {
  req.id = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
};

module.exports = requestId;
