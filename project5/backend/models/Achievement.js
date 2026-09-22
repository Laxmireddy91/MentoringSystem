const mongoose = require('mongoose');
const { ACHIEVEMENT_CATEGORIES, ACHIEVEMENT_STATUS } = require('../config/constants');

const achievementFileSchema = new mongoose.Schema({
  url: { type: String, required: true },
  storagePath: { type: String, default: '' }, // disk path for secure serving
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  fileSize: { type: Number, required: true },
});

const verificationAnalysisSchema = new mongoose.Schema({
  extractedText: { type: String, default: '' },
  nameMatch: { type: Boolean, default: null },
  organizationDetected: { type: Boolean, default: null },
  eventDetected: { type: Boolean, default: null },
  dateDetected: { type: Boolean, default: null },
  certificateIdDetected: { type: Boolean, default: null },
  verificationUrlValid: { type: Boolean, default: null },
  duplicateCertificateId: { type: Boolean, default: null },
  extractionQuality: {
    type: String,
    enum: ['good', 'partial', 'unavailable'],
    default: 'unavailable',
  },
  assessment: {
    type: String,
    enum: ['indicators_verified', 'needs_manual_review', 'extraction_unavailable'],
    default: 'extraction_unavailable',
  },
  analysedAt: { type: Date, default: null },
  disclaimer: {
    type: String,
    default: 'This analysis is an assistance mechanism and is not proof of certificate authenticity. Final verification is performed by the authorized mentor.',
  },
}, { _id: false });

const achievementSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Achievement title is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: Object.values(ACHIEVEMENT_CATEGORIES),
      default: ACHIEVEMENT_CATEGORIES.OTHER,
      index: true,
    },
    // Review workflow status
    status: {
      type: String,
      enum: Object.values(ACHIEVEMENT_STATUS),
      default: ACHIEVEMENT_STATUS.PENDING,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    // Event details
    organization: {
      type: String,
      trim: true,
      default: '',
    },
    eventName: {
      type: String,
      trim: true,
      default: '',
    },
    eventDate: {
      type: Date,
      default: null,
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    issuer: {
      type: String,
      trim: true,
      default: '',
    },
    // Certificate identification
    certificateId: {
      type: String,
      trim: true,
      default: '',
    },
    verificationUrl: {
      type: String,
      trim: true,
      default: '',
    },
    // Linked Document Vault entry (optional — avoids duplicate uploads)
    certificateDocumentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      default: null,
    },
    // Legacy direct URL
    certificateUrl: {
      type: String,
      default: '',
    },
    files: [achievementFileSchema],
    // Mentor review
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewRemarks: {
      type: String,
      trim: true,
      default: '',
    },
    // Legacy verified field — kept for backward compat; use status === 'approved' instead
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verifiedAt: {
      type: Date,
    },
    // AI-assisted consistency analysis result
    verificationAnalysis: {
      type: verificationAnalysisSchema,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

achievementSchema.index({ studentId: 1, category: 1, status: 1 });
achievementSchema.index({ studentId: 1, isVerified: 1 });
achievementSchema.index({ certificateId: 1 }); // duplicate detection

const Achievement = mongoose.model('Achievement', achievementSchema);
module.exports = Achievement;
