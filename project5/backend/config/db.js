const mongoose = require('mongoose');
const logger = require('./logger');
const env = require('./env');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      autoIndex: true,
    });
    logger.info(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    logger.error(`❌ MongoDB Connection Error: ${error.message}`);
    if (env.NODE_ENV !== 'test') {
      logger.warn('⚠️ Server running without active MongoDB connection (check your DB service or config).');
    }
  }
};

module.exports = connectDB;
