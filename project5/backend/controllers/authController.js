const AuthService = require('../services/authService');
const { LoginActivity, Student, Mentor } = require('../models');
const ApiResponse = require('../utils/apiResponse');
const { setRefreshTokenCookie, clearRefreshTokenCookie } = require('../utils/tokenUtils');

class AuthController {
  static async register(req, res, next) {
    try {
      const result = await AuthService.register(req.body, req.user);
      setRefreshTokenCookie(res, result.refreshToken);
      return ApiResponse.created(
        res,
        {
          user: result.user,
          profile: result.roleProfile,
          token: result.token,
        },
        'Registration successful'
      );
    } catch (err) {
      next(err);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password, twoFactorCode } = req.body;
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] || '';

      const result = await AuthService.login({
        identifier: email,
        password,
        twoFactorCode,
        ipAddress,
        userAgent,
      });

      if (result.requires2FA) {
        return ApiResponse.success(res, result, '2FA verification required', 200);
      }

      setRefreshTokenCookie(res, result.refreshToken);
      return ApiResponse.success(
        res,
        {
          user: result.user,
          profile: result.profile,
          token: result.token,
        },
        'Login successful'
      );
    } catch (err) {
      next(err);
    }
  }

  static async refreshToken(req, res, next) {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      const result = await AuthService.refreshToken(refreshToken);
      setRefreshTokenCookie(res, result.refreshToken);
      return ApiResponse.success(res, { token: result.token, user: result.user }, 'Token refreshed');
    } catch (err) {
      next(err);
    }
  }

  static async logout(req, res, next) {
    try {
      clearRefreshTokenCookie(res);
      return ApiResponse.success(res, null, 'Logged out successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getMe(req, res, next) {
    try {
      const user = req.user;
      let profile = null;

      if (user.role === 'student') {
        profile = await Student.findOne({ userId: user._id }).populate({
          path: 'mentorId',
          populate: { path: 'userId', select: 'name email phone avatar department' },
        });
      } else if (user.role === 'mentor') {
        profile = await Mentor.findOne({ userId: user._id });
      }

      return ApiResponse.success(res, { user, profile }, 'User profile retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async forgotPassword(req, res, next) {
    try {
      const result = await AuthService.forgotPassword(req.body.email);
      return ApiResponse.success(res, result, result.message);
    } catch (err) {
      next(err);
    }
  }

  static async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;
      const result = await AuthService.resetPassword(token, newPassword);
      return ApiResponse.success(res, null, result.message);
    } catch (err) {
      next(err);
    }
  }

  static async verifyEmail(req, res, next) {
    try {
      const token = req.params.token || req.body.token || req.query.token;
      const result = await AuthService.verifyEmail(token);
      return ApiResponse.success(res, result, result.message);
    } catch (err) {
      next(err);
    }
  }

  static async resendVerification(req, res, next) {
    try {
      const result = await AuthService.resendEmailVerification(req.user._id);
      return ApiResponse.success(res, null, result.message);
    } catch (err) {
      next(err);
    }
  }

  static async setup2FA(req, res, next) {
    try {
      const result = await AuthService.setup2FA(req.user._id);
      return ApiResponse.success(res, result, '2FA setup initiated');
    } catch (err) {
      next(err);
    }
  }

  static async verify2FA(req, res, next) {
    try {
      const result = await AuthService.verify2FA(req.user._id, req.body.code);
      return ApiResponse.success(res, null, result.message);
    } catch (err) {
      next(err);
    }
  }

  static async disable2FA(req, res, next) {
    try {
      const result = await AuthService.disable2FA(req.user._id, req.body.password);
      return ApiResponse.success(res, null, result.message);
    } catch (err) {
      next(err);
    }
  }

  static async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await AuthService.changePassword(req.user._id, currentPassword, newPassword);
      return ApiResponse.success(res, null, result.message);
    } catch (err) {
      next(err);
    }
  }

  static async activateStudentAccount(req, res, next) {
    try {
      const { usn, email, password } = req.body;
      if (!usn || !email || !password) return ApiResponse.badRequest(res, 'USN, email and password are required');
      if (password.length < 8) return ApiResponse.badRequest(res, 'Password must be at least 8 characters');
      const result = await AuthService.activateStudentAccount({ usn, email, password });
      return ApiResponse.created(res, result, 'Student account activated successfully');
    } catch (err) { next(err); }
  }

  static async activateStaffAccount(req, res, next) {
    try {
      const { employeeId, email, password } = req.body;
      if (!employeeId || !email || !password) return ApiResponse.badRequest(res, 'Employee ID, email and password are required');
      if (password.length < 8) return ApiResponse.badRequest(res, 'Password must be at least 8 characters');
      const result = await AuthService.activateStaffAccount({ employeeId, email, password });
      return ApiResponse.created(res, result, 'Staff account activated successfully');
    } catch (err) { next(err); }
  }

  static async activateParentAccount(req, res, next) {
    try {
      const { studentUsn, parentEmail, password } = req.body;
      if (!studentUsn || !parentEmail || !password) return ApiResponse.badRequest(res, 'Student USN, parent email and password are required');
      if (password.length < 8) return ApiResponse.badRequest(res, 'Password must be at least 8 characters');
      const result = await AuthService.activateParentAccount({ studentUsn, parentEmail, password });
      return ApiResponse.created(res, result, 'Parent account activated successfully');
    } catch (err) { next(err); }
  }

  static async getLoginActivity(req, res, next) {
    try {
      const activities = await LoginActivity.find({ userId: req.user._id })
        .sort({ timestamp: -1 })
        .limit(20);
      return ApiResponse.success(res, activities, 'Recent login activity');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AuthController;
