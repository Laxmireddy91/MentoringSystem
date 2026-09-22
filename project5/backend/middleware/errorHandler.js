const logger = require('../config/logger');
const env = require('../config/env');
const ApiResponse = require('../utils/apiResponse');

const errorHandler = (err, req, res, _next) => {
  logger.error(`Error: ${err.message}`, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    return ApiResponse.badRequest(res, `Invalid resource ID format for '${err.path}'`);
  }

  // Handle Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return ApiResponse.conflict(res, `A record with this ${field} already exists.`);
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return ApiResponse.badRequest(res, 'Validation error occurred', errors);
  }

  // Handle Zod Validation Error
  if (err.name === 'ZodError') {
    const errors = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    return ApiResponse.badRequest(res, 'Request validation failed', errors);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.unauthorized(res, 'Invalid authentication token');
  }

  if (err.name === 'TokenExpiredError') {
    return ApiResponse.unauthorized(res, 'Authentication token has expired');
  }

  const statusCode = err.statusCode || 500;
  const message = env.NODE_ENV === 'production' && statusCode === 500
    ? 'Internal server error. Please try again later.'
    : err.message || 'Internal server error';

  return ApiResponse.error(res, message, statusCode);
};

module.exports = errorHandler;
