/**
 * Standardized API Response Helper
 */
class ApiResponse {
  static success(res, data = null, message = 'Success', statusCode = 200, meta = null) {
    const payload = {
      success: true,
      message,
      data,
    };
    if (meta) payload.meta = meta;
    return res.status(statusCode).json(payload);
  }

  static created(res, data = null, message = 'Resource created successfully', meta = null) {
    return this.success(res, data, message, 201, meta);
  }

  static error(res, message = 'An error occurred', statusCode = 500, errors = null) {
    const payload = {
      success: false,
      message,
    };
    if (errors) payload.errors = errors;
    return res.status(statusCode).json(payload);
  }

  static badRequest(res, message = 'Invalid request', errors = null) {
    return this.error(res, message, 400, errors);
  }

  static unauthorized(res, message = 'Unauthorized access') {
    return this.error(res, message, 401);
  }

  static forbidden(res, message = 'Forbidden: insufficient permissions') {
    return this.error(res, message, 403);
  }

  static notFound(res, message = 'Resource not found') {
    return this.error(res, message, 404);
  }

  static conflict(res, message = 'Resource conflict') {
    return this.error(res, message, 409);
  }
}

module.exports = ApiResponse;
