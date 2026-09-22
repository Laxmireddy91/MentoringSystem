const rateLimit = require('express-rate-limit');
const ApiResponse = require('../utils/apiResponse');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return ApiResponse.error(
      res,
      'Too many login attempts from this IP. Please try again after 15 minutes.',
      429
    );
  },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 15, // Limit each IP to 15 registrations per hour
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return ApiResponse.error(
      res,
      'Too many accounts created from this IP. Please try again after an hour.',
      429
    );
  },
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit password reset attempts to 5 per hour
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return ApiResponse.error(
      res,
      'Too many password reset attempts. Please try again later.',
      429
    );
  },
});

module.exports = {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
};
