const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const env = require('./config/env');
const logger = require('./config/logger');
const connectDB = require('./config/db');
const { initSocket } = require('./services/socketService');
const { startCronJobs } = require('./jobs/cronJobs');

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with CORS
const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.indexOf(origin) !== -1 || env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      return callback(new Error('Socket.IO CORS Error'));
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Initialize Socket Auth and Handlers
initSocket(io);

// Attach IO instance to app for use in controllers
app.set('io', io);

// Connect to MongoDB
connectDB();

// Start Background Cron Workers
if (env.NODE_ENV !== 'test') {
  startCronJobs();
}

// Start Server
const PORT = env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`🚀 Smart Mentoring System Backend running on port ${PORT} in ${env.NODE_ENV} mode`);
  logger.info(`📡 Healthcheck available at: http://localhost:${PORT}/api/health`);
});

// Handle Unhandled Promise Rejections
process.on('unhandledRejection', (err) => {
  logger.error(`❌ Unhandled Rejection: ${err.message}`, { stack: err.stack });
});

// Handle Uncaught Exceptions
process.on('uncaughtException', (err) => {
  logger.error(`❌ Uncaught Exception: ${err.message}`, { stack: err.stack });
  process.exit(1);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  logger.info('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated.');
  });
});

module.exports = { server, app, io };
