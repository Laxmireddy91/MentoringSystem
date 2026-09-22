const express = require('express');
const router = express.Router();

const AuthController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validator');
const {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  twoFactorVerifySchema,
} = require('../validators/authValidators');
const {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
} = require('../middleware/authLimiter');

// Public Auth Endpoints
router.post('/register', registerLimiter, validate(registerSchema), AuthController.register);
router.post('/login', loginLimiter, validate(loginSchema), AuthController.login);
router.post('/refresh', AuthController.refreshToken);
router.post('/logout', AuthController.logout);
router.post('/forgot-password', passwordResetLimiter, validate(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', passwordResetLimiter, validate(resetPasswordSchema), AuthController.resetPassword);
router.get('/verify-email/:token', AuthController.verifyEmail);
router.post('/verify-email', AuthController.verifyEmail);

router.post('/activate/student', registerLimiter, AuthController.activateStudentAccount);
router.post('/activate/staff', registerLimiter, AuthController.activateStaffAccount);
router.post('/activate/parent', registerLimiter, AuthController.activateParentAccount);

// Protected Auth Endpoints
router.get('/me', authenticate, AuthController.getMe);
router.post('/resend-verification', authenticate, AuthController.resendVerification);
router.post('/change-password', authenticate, validate(changePasswordSchema), AuthController.changePassword);
router.post('/2fa/setup', authenticate, AuthController.setup2FA);
router.post('/2fa/verify', authenticate, validate(twoFactorVerifySchema), AuthController.verify2FA);
router.post('/2fa/disable', authenticate, AuthController.disable2FA);
router.get('/login-activity', authenticate, AuthController.getLoginActivity);

module.exports = router;
