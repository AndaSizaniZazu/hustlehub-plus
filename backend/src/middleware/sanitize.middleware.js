// Removes keys starting with "$" or containing "." to block NoSQL operator injection.
// Replaces express-mongo-sanitize, which is incompatible with Express 5.
const clean = (obj) => {
  if (obj && typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else {
        clean(obj[key]);
      }
    }
  }
  return obj;
};

const sanitize = (req, res, next) => {
  clean(req.body);
  next();
};

module.exports = sanitize;
