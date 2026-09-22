const mongoose = require('mongoose');

const loginActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      default: 'unknown',
    },
    ipAddress: {
      type: String,
      default: 'unknown',
    },
    userAgent: {
      type: String,
      default: '',
    },
    device: {
      type: String,
      default: 'Desktop',
    },
    browser: {
      type: String,
      default: 'Unknown Browser',
    },
    os: {
      type: String,
      default: 'Unknown OS',
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'locked'],
      required: true,
      index: true,
    },
    failureReason: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

loginActivitySchema.index({ userId: 1, timestamp: -1 });
loginActivitySchema.index({ email: 1, status: 1, timestamp: -1 });

const LoginActivity = mongoose.model('LoginActivity', loginActivitySchema);
module.exports = LoginActivity;
