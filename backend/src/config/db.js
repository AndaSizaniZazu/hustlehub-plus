const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

const connectDB = async () => {
  try {
    mongoose.set('sanitizeFilter', true);
    await mongoose.connect(process.env.MONGO_URI);
    logger.info('db.connected');
  } catch (err) {
    logger.error('db.connection_failed', { error: err.message }); // server-side only
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => logger.warn('db.disconnected'));
mongoose.connection.on('reconnected', () => logger.info('db.reconnected'));

module.exports = connectDB;
