const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { User, Student, Mentor, StudentRecord, StaffRecord, AllocationBatch } = require('../models');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../utils/tokenUtils');
const emailService = require('./emailService');
const AuditService = require('./auditService');
const AppError = require('../utils/AppError');
const { ROLES, AUDIT_ACTIONS } = require('../config/constants');

class AuthService {
  /**
   * Register a new user and create their respective role profile
   */
  static async register(data, actor = null) {
    const {
      name,
      email,
      password,
      role,
      department,
      phone,
      usn,
      semester,
      section,
      batch,
      admissionYear,
      academicYear,
      entryType,
      program,
      status,
      parentDetails,
      parentName,
      parentEmail,
      parentRelation,
      mentorId,
      employeeId,
      designation,
      studentUsn,
      relation,
    } = data;

    // Check if user email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new AppError('An account with this email address already exists', 400);
    }

    // Role specific uniqueness checks
    if (role === ROLES.STUDENT) {
      if (!usn) throw new AppError('USN is required for student registration', 400);
      const existingUsn = await Student.findOne({ usn: usn.toUpperCase() });
      if (existingUsn) throw new AppError(`Student with USN ${usn.toUpperCase()} already exists`, 400);
    } else if (role === ROLES.MENTOR) {
      if (!employeeId) throw new AppError('Employee ID is required for mentor registration', 400);
      const existingEmp = await Mentor.findOne({ employeeId: employeeId.toUpperCase() });
      if (existingEmp) throw new AppError(`Mentor with Employee ID ${employeeId.toUpperCase()} already exists`, 400);
    }

    // Create Base User (active account)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role,
      department,
      phone: phone || '',
      isActive: true,
      isActivated: true,
      activatedAt: new Date(),
      isEmailVerified: true,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    });

    let roleProfile = null;

    // Create Role Profile
    if (role === ROLES.STUDENT) {
      let parsedAdmissionYear = admissionYear ? Number(admissionYear) : null;
      if (!parsedAdmissionYear && batch) {
        const match = String(batch).match(/\d{4}/);
        if (match) parsedAdmissionYear = Number(match[0]);
      }
      if (!parsedAdmissionYear) {
        parsedAdmissionYear = new Date().getFullYear();
      }

      const finalBatch = batch ? String(batch).trim() : `${parsedAdmissionYear}-${parsedAdmissionYear + 4}`;
      const finalEntryType = entryType ? String(entryType).toUpperCase() : (Number(semester) === 3 ? 'LATERAL' : 'REGULAR');
      const finalStatus = status ? String(status).toUpperCase() : 'ACTIVE';
      const finalAcademicYear = academicYear || '2025-2026';
      const finalProgram = program || 'B.E.';
      const finalSemester = Number(semester) || (finalEntryType === 'LATERAL' ? 3 : 1);
      const finalSection = section ? String(section).trim().toUpperCase() : 'A';

      roleProfile = await Student.create({
        userId: user._id,
        usn: usn.toUpperCase(),
        department: department || 'General',
        program: finalProgram,
        admissionYear: parsedAdmissionYear,
        academicYear: finalAcademicYear,
        entryType: finalEntryType,
        status: finalStatus,
        semester: finalSemester,
        section: finalSection,
        batch: finalBatch,
        mentorId: mentorId || null,
        parentDetails: parentDetails || {
          fatherName: parentName || '',
          guardianEmail: parentEmail || '',
          guardianRelationship: parentRelation || 'Guardian',
        },
      });

      user.studentProfile = { usn: usn.toUpperCase(), semester: finalSemester, section: finalSection };
      await user.save();

      // Create or synchronize StudentRecord for institutional records
      try {
        let studentRecord = await StudentRecord.findOne({ usn: usn.toUpperCase() });
        if (!studentRecord) {
          await StudentRecord.create({
            usn: usn.toUpperCase(),
            email: email.toLowerCase(),
            name,
            department: department || 'General',
            batch: finalBatch,
            semester: finalSemester,
            section: finalSection,
            phone: phone || '',
            parentEmail: (parentEmail || parentDetails?.guardianEmail || '').toLowerCase(),
            parentName: parentName || parentDetails?.fatherName || '',
            parentRelation: parentRelation || parentDetails?.guardianRelationship || 'Guardian',
            isActivated: true,
            activatedAt: new Date(),
            activatedUserId: user._id,
            createdBy: actor ? actor._id : user._id,
          });
        } else {
          studentRecord.isActivated = true;
          studentRecord.activatedAt = new Date();
          studentRecord.activatedUserId = user._id;
          await studentRecord.save();
        }
      } catch (_recErr) {
        // Silently continue if record creation has duplicate warning
      }
    } else if (role === ROLES.MENTOR) {
      roleProfile = await Mentor.create({
        userId: user._id,
        employeeId: employeeId.toUpperCase(),
        department,
        designation: designation || 'Assistant Professor',
        isActive: true,
      });
      user.mentorProfile = { employeeId: employeeId.toUpperCase(), designation: designation || 'Assistant Professor' };
      user.staffProfile = { employeeId: employeeId.toUpperCase(), designation: designation || 'Assistant Professor' };
      await user.save();
    } else if (role === ROLES.PARENT) {
      user.parentProfile = { studentUsn: studentUsn ? studentUsn.toUpperCase() : '', relation: relation || 'Guardian' };
      await user.save();
      if (studentUsn) {
        const student = await Student.findOne({ usn: studentUsn.toUpperCase() });
        if (student) {
          student.parentUserId = user._id;
          await student.save();
        }
      }
    }

    // Send verification email
    await emailService.sendVerificationEmail(user.email, verificationToken);

    // Audit log
    await AuditService.logAction({
      actorId: actor ? actor._id : user._id,
      actorRole: actor ? actor.role : user.role,
      actorName: actor ? actor.name : user.name,
      action: `${role.toUpperCase()}_REGISTERED`,
      entity: 'User',
      entityId: user._id,
      newValue: { email: user.email, role: user.role, department: user.department },
      description: `New ${role} registered: ${user.name} (${user.email})`,
    });

    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    return { user, roleProfile, token, refreshToken };
  }

  /**
   * Login user with Email or USN/Employee ID, verify credentials, enforce lockout and 2FA
   */
  static async login({ identifier, password, twoFactorCode, ipAddress, userAgent }) {
    let user = null;

    // 1. Check if identifier is email
    if (identifier.includes('@')) {
      user = await User.findOne({ email: identifier.toLowerCase() }).select('+password +twoFactorSecret');
    } else {
      // 2. Lookup via Student USN or Mentor Employee ID
      const upper = identifier.toUpperCase();
      const student = await Student.findOne({ usn: upper });
      if (student) {
        user = await User.findById(student.userId).select('+password +twoFactorSecret');
      } else {
        const mentor = await Mentor.findOne({ employeeId: upper });
        if (mentor) {
          user = await User.findById(mentor.userId).select('+password +twoFactorSecret');
        }
      }
    }

    if (!user) {
      await AuditService.logLoginActivity({
        email: identifier,
        ipAddress,
        userAgent,
        status: 'failed',
        failureReason: 'User not found',
      });
      throw new AppError('Invalid credentials', 400);
    }

    // Check if account is locked
    if (user.isLocked()) {
      const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
      await AuditService.logLoginActivity({
        userId: user._id,
        email: user.email,
        role: user.role,
        ipAddress,
        userAgent,
        status: 'locked',
        failureReason: `Account locked for ${remainingMinutes} more minutes`,
      });
      throw new AppError(`Account is temporarily locked due to too many failed attempts. Try again in ${remainingMinutes} minutes.`, 429);
    }

    // Check if account is active
    if (!user.isActive) {
      throw new AppError('Account has been deactivated. Please contact the administrator.', 403);
    }

    // Compare Password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incLoginAttempts();
      await AuditService.logLoginActivity({
        userId: user._id,
        email: user.email,
        role: user.role,
        ipAddress,
        userAgent,
        status: 'failed',
        failureReason: 'Invalid password',
      });
      throw new AppError('Invalid credentials', 400);
    }

    // 2FA Verification if enabled
    if (user.isTwoFactorEnabled) {
      if (!twoFactorCode) {
        return {
          requires2FA: true,
          email: user.email,
          message: '2FA authentication code required',
        };
      }
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorCode,
        window: 1,
      });
      if (!verified) {
        await AuditService.logLoginActivity({
          userId: user._id,
          email: user.email,
          role: user.role,
          ipAddress,
          userAgent,
          status: 'failed',
          failureReason: 'Invalid 2FA code',
        });
        throw new AppError('Invalid two-factor authentication code', 400);
      }
    }

    // Reset login attempts on success
    await user.resetLoginAttempts();

    // Log successful login
    await AuditService.logLoginActivity({
      userId: user._id,
      email: user.email,
      role: user.role,
      ipAddress,
      userAgent,
      status: 'success',
    });

    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Fetch populated profile details
    let profile = null;
    if (user.role === ROLES.STUDENT) {
      profile = await Student.findOne({ userId: user._id }).populate('mentorId');
    } else if (user.role === ROLES.MENTOR) {
      profile = await Mentor.findOne({ userId: user._id });
    }

    // Remove sensitive fields
    user.password = undefined;
    user.twoFactorSecret = undefined;

    return { user, profile, token, refreshToken };
  }

  /**
   * Issue new access token using valid refresh token
   */
  static async refreshToken(refreshToken) {
    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400);
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      throw new AppError('User no longer exists or is inactive', 401);
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    return { token: newAccessToken, refreshToken: newRefreshToken, user };
  }

  /**
   * Request password reset token and send email
   */
  static async forgotPassword(email) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return { message: 'If this email exists in our system, a password reset link has been sent.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    await emailService.sendPasswordResetEmail(user.email, resetToken);

    return { message: 'If this email exists in our system, a password reset link has been sent.' };
  }

  /**
   * Verify email with token
   */
  static async verifyEmail(token) {
    if (!token) {
      throw new AppError('Verification token is required', 400);
    }

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new AppError('Email verification token is invalid or has expired', 400);
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return { message: 'Email verified successfully', isEmailVerified: true };
  }

  /**
   * Resend verification email
   */
  static async resendEmailVerification(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    if (user.isEmailVerified) {
      return { message: 'Email is already verified' };
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    await emailService.sendVerificationEmail(user.email, verificationToken);

    return { message: 'Verification email has been sent' };
  }

  /**
   * Reset user password using token
   */
  static async resetPassword(token, newPassword) {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new AppError('Password reset token is invalid or has expired', 400);
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    await AuditService.logAction({
      actorId: user._id,
      actorRole: user.role,
      actorName: user.name,
      action: AUDIT_ACTIONS.PASSWORD_RESET,
      entity: 'User',
      entityId: user._id,
      description: `Password reset successfully for ${user.email}`,
    });

    return { message: 'Password has been reset successfully. You can now login with your new password.' };
  }

  /**
   * Setup 2FA: Generate QR Code & Secret
   */
  static async setup2FA(userId) {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    const secret = speakeasy.generateSecret({
      name: `MentorConnect (${user.email})`,
      issuer: 'MentorConnect Academic',
    });

    user.twoFactorSecret = secret.base32;
    await user.save();

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCodeUrl,
    };
  }

  /**
   * Verify and Enable 2FA
   */
  static async verify2FA(userId, code) {
    const user = await User.findById(userId).select('+twoFactorSecret');
    if (!user || !user.twoFactorSecret) {
      throw new AppError('2FA has not been initiated for this account', 400);
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!verified) {
      throw new AppError('Invalid 2FA verification code', 400);
    }

    user.isTwoFactorEnabled = true;
    await user.save();

    return { message: 'Two-factor authentication has been enabled successfully' };
  }

  /**
   * Disable 2FA
   */
  static async disable2FA(userId, password) {
    const user = await User.findById(userId).select('+password');
    if (!user) throw new AppError('User not found', 404);

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Incorrect password. Cannot disable 2FA.', 400);
    }

    user.isTwoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    await user.save();

    return { message: 'Two-factor authentication disabled' };
  }

  /**
   * Change Password
   */
  static async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');
    if (!user) throw new AppError('User not found', 404);

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new AppError('Current password is incorrect', 400);
    }

    user.password = newPassword;
    await user.save();

    return { message: 'Password changed successfully' };
  }

  static async activateStudentAccount({ usn, email, password }) {
    const record = await StudentRecord.findOne({
      usn: usn.toUpperCase(),
      email: email.toLowerCase(),
      isActivated: false
    });

    if (!record) {
      throw new AppError('No matching institutional student record found, or account already activated', 400);
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new AppError('An account with this email address already exists', 400);
    }

    const user = await User.create({
      name: record.name,
      email: email.toLowerCase(),
      password,
      role: ROLES.STUDENT,
      department: record.department,
      phone: record.phone || '',
      isActivated: true,
      activatedAt: new Date(),
      isEmailVerified: true
    });

    const student = await Student.create({
      userId: user._id,
      usn: record.usn,
      department: record.department,
      semester: record.semester,
      section: record.section,
      batch: record.batch,
      mentorId: record.mentorId || null
    });

    user.studentProfile = { usn: record.usn, semester: record.semester, section: record.section };
    await user.save();

    record.isActivated = true;
    record.activatedAt = new Date();
    record.activatedUserId = user._id;
    await record.save();

    await AuditService.logAction({
      actorId: user._id,
      actorRole: user.role,
      actorName: user.name,
      action: 'ACCOUNT_ACTIVATED',
      entity: 'StudentRecord',
      entityId: record._id,
      description: `Student account activated: ${user.email}`
    });

    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    return { user, token, refreshToken };
  }

  static async activateStaffAccount({ employeeId, email, password }) {
    const record = await StaffRecord.findOne({
      employeeId: employeeId.toUpperCase(),
      email: email.toLowerCase(),
      isActivated: false
    });

    if (!record) {
      throw new AppError('No matching institutional staff record found, or account already activated', 400);
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    let user;

    if (existingUser) {
      if (existingUser.isActivated) {
        throw new AppError('An account with this email address is already activated. Please log in directly.', 400);
      }
      user = existingUser;
      user.name = record.name || user.name;
      user.password = password; // Pre-save hook hashes password
      user.role = record.role;
      user.department = record.department;
      user.phone = record.phone || user.phone || '';
      user.isActivated = true;
      user.isActive = true;
      user.activatedAt = new Date();
      user.isEmailVerified = true;
    } else {
      user = await User.create({
        name: record.name,
        email: email.toLowerCase(),
        password,
        role: record.role,
        department: record.department,
        phone: record.phone || '',
        isActivated: true,
        activatedAt: new Date(),
        isEmailVerified: true
      });
    }

    if (record.role === ROLES.MENTOR) {
      let mentor = await Mentor.findOne({
        $or: [{ employeeId: record.employeeId }, { userId: user._id }]
      });
      if (!mentor) {
        mentor = await Mentor.create({
          userId: user._id,
          employeeId: record.employeeId,
          department: record.department,
          designation: record.designation
        });
      } else {
        mentor.userId = user._id;
        mentor.employeeId = record.employeeId;
        mentor.department = record.department;
        mentor.designation = record.designation;
        mentor.isActive = true;
        await mentor.save();
      }
      user.mentorProfile = { employeeId: record.employeeId, designation: record.designation };
      user.staffProfile = { employeeId: record.employeeId, designation: record.designation };
    } else {
      user.staffProfile = { employeeId: record.employeeId, designation: record.designation };
    }
    await user.save();

    record.isActivated = true;
    record.activatedAt = new Date();
    record.activatedUserId = user._id;
    await record.save();

    await AuditService.logAction({
      actorId: user._id,
      actorRole: user.role,
      actorName: user.name,
      action: 'ACCOUNT_ACTIVATED',
      entity: 'StaffRecord',
      entityId: record._id,
      description: `Staff account activated: ${user.email}`
    });

    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    return { user, token, refreshToken };
  }

  static async activateParentAccount({ studentUsn, parentEmail, password }) {
    const record = await StudentRecord.findOne({
      usn: studentUsn.toUpperCase(),
      parentEmail: parentEmail.toLowerCase(),
      parentActivated: false
    });

    if (!record) {
      throw new AppError('No matching institutional parent record found, or account already activated', 400);
    }

    const existingUser = await User.findOne({ email: parentEmail.toLowerCase() });
    if (existingUser) {
      throw new AppError('An account with this email address already exists', 400);
    }

    const user = await User.create({
      name: record.parentName || 'Parent',
      email: parentEmail.toLowerCase(),
      password,
      role: ROLES.PARENT,
      isActivated: true,
      activatedAt: new Date(),
      isEmailVerified: true
    });

    user.parentProfile = { studentUsn: record.usn, relation: record.parentRelation };
    await user.save();

    const student = await Student.findOne({ usn: record.usn });
    if (student) {
      student.parentUserId = user._id;
      await student.save();
    }

    record.parentActivated = true;
    record.parentActivatedAt = new Date();
    record.parentActivatedUserId = user._id;
    await record.save();

    await AuditService.logAction({
      actorId: user._id,
      actorRole: user.role,
      actorName: user.name,
      action: 'ACCOUNT_ACTIVATED',
      entity: 'StudentRecord',
      entityId: record._id,
      description: `Parent account activated for student USN ${record.usn}`
    });

    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    return { user, token, refreshToken };
  }
}

module.exports = AuthService;
