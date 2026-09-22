const { verifyAccessToken } = require('../utils/tokenUtils');
const { User } = require('../models');
const ApiResponse = require('../utils/apiResponse');

const authenticate = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return ApiResponse.unauthorized(res, 'Authentication token missing');
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return ApiResponse.unauthorized(res, 'Authentication token expired');
      }
      return ApiResponse.unauthorized(res, 'Invalid authentication token');
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return ApiResponse.unauthorized(res, 'User account no longer exists');
    }

    if (!user.isActive) {
      return ApiResponse.forbidden(res, 'Account has been deactivated. Please contact the administrator.');
    }

    if (user.isLocked()) {
      return ApiResponse.forbidden(res, 'Account is temporarily locked due to failed login attempts. Please try again later.');
    }

    req.user = user;
    next();
  } catch (error) {
    return ApiResponse.unauthorized(res, error.message || 'Authentication failed');
  }
};

module.exports = {
  authenticate,
};
