const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../config/constants');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      required: [true, 'User role is required'],
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    avatarDocumentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', default: null },
    department: {
      type: String,
      trim: true,
      index: true,
      default: 'General',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    // Institution-controlled activation
    isActivated: {
      type: Boolean,
      default: false,
      index: true,
    },
    activatedAt: {
      type: Date,
      default: null,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    twoFactorSecret: {
      type: String,
      select: false,
    },
    isTwoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    loginAttempts: {
      type: Number,
      required: true,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
    lastLogin: {
      type: Date,
    },
    // Embedded quick-access profile references
    studentProfile: {
      usn: String,
      semester: Number,
      section: String,
    },
    parentProfile: {
      studentUsn: String,
      relation: String,
    },
    // Used for MENTOR, MENTORING_COORDINATOR, HOD, EXAM_COORDINATOR, TPO
    staffProfile: {
      employeeId: String,
      designation: String,
    },
    // Legacy field — kept for backward compatibility
    mentorProfile: {
      employeeId: String,
      designation: String,
    },
    // New profile fields (editable by user)
    bio: { type: String, default: '' },
    visibility: {
      type: String,
      enum: ['private', 'institution', 'mentor', 'placement'],
      default: 'institution',
    },
    skills: [{
      name: { type: String, required: true },
      proficiency: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      },
    }],
    social: {
      linkedIn: String,
      gitHub: String,
      portfolio: String,
      personalWebsite: String,
      googleScholar: String,
      other: [{ platform: String, url: String }],
    },
    education: [{
      qualification: String,
      institution: String,
      field: String,
      startYear: Number,
      endYear: Number,
      grade: String,
      description: String,
    }],
    experience: [{
      organization: String,
      role: String,
      startDate: Date,
      endDate: Date,
      currentlyWorking: Boolean,
      description: String,
    }],
    projects: [{
      title: String,
      description: String,
      technologies: [String],
      role: String,
      startDate: Date,
      endDate: Date,
      projectUrl: String,
      repoUrl: String,
      demoUrl: String,
    }],
    certifications: [{
      name: String,
      issuer: String,
      issueDate: Date,
      expiryDate: Date,
      credentialId: String,
      credentialUrl: String,
      description: String,
      documentRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
    }],
    additionalInfo: [{
      category: String,
      title: String,
      value: String,
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    }],
    resumeReference: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.virtual('fullName')
  .get(function () {
    return this.name;
  })
  .set(function (v) {
    this.name = v;
  });

// Compound indexes
userSchema.index({ role: 1, department: 1 });
userSchema.index({ email: 1, isActive: 1 });
userSchema.index({ role: 1, isActivated: 1 });

// Pre-save password hashing hook
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if account is currently locked
userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Increment login attempts & lock account if limit reached
userSchema.methods.incLoginAttempts = async function (maxAttempts = 5, lockTimeMinutes = 15) {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }
  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked()) {
    updates.$set = { lockUntil: new Date(Date.now() + lockTimeMinutes * 60 * 1000) };
  }
  return this.updateOne(updates);
};

// Reset login attempts after successful login
userSchema.methods.resetLoginAttempts = async function () {
  return this.updateOne({
    $set: { loginAttempts: 0, lastLogin: new Date() },
    $unset: { lockUntil: 1 },
  });
};

const User = mongoose.model('User', userSchema);
module.exports = User;
