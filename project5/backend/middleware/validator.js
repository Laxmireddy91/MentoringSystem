const ApiResponse = require('../utils/apiResponse');

const validate = (schema, source = 'body') => (req, res, next) => {
  try {
    const dataToValidate = req[source];
    const parsed = schema.parse(dataToValidate);
    req[source] = parsed; // assign back parsed and sanitized data
    next();
  } catch (error) {
    if (error.errors) {
      const errors = error.errors.map((e) => {
        const path = e.path.join('.');
        return path ? `${path}: ${e.message}` : e.message;
      });
      return ApiResponse.badRequest(res, 'Validation error', errors);
    }
    return ApiResponse.badRequest(res, error.message);
  }
};

module.exports = validate;
