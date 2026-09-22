const morgan = require('morgan');
const logger = require('../config/logger');

const stream = {
  write: (message) => logger.http(message.trim()),
};

const requestLogger = morgan(
  ':remote-addr - :method :url HTTP/:http-version :status :res[content-length] - :response-time ms',
  { stream }
);

module.exports = requestLogger;
