const mongoose = require('mongoose');
const { DOCUMENT_CATEGORIES, DOCUMENT_VISIBILITY, DOCUMENT_STATUS } = require('../config/constants');

const documentVersionSchema = new mongoose.Schema(
  {
    versionNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    storagePath: {
      type: String,
      required: true,
      select: false, // Never expose file system path in API responses
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { _id: true }
);

/**
 * Document Vault
 * Files are stored on disk (uploads/documents/).
 * MongoDB stores metadata and path only — no file content, no base64.
 * All downloads served via authenticated API route, never public static URL.
 */
const documentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: Object.values(DOCUMENT_CATEGORIES),
      required: true,
      index: true,
    },
    documentType: {
      type: String,
      trim: true,
      required: true,
    },
    title: {
      type: String,
      trim: true,
      required: true,
    },
    semester: {
      type: Number,
      min: 1,
      max: 8,
      default: null,
      index: true,
    },
    academicYear: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    currentVersion: {
      type: Number,
      default: 1,
      min: 1,
    },
    // Full version history — files on disk, paths stored here
    versions: [documentVersionSchema],
    status: {
      type: String,
      enum: Object.values(DOCUMENT_STATUS),
      default: DOCUMENT_STATUS.ACTIVE,
      index: true,
    },
    visibility: {
      type: String,
      enum: Object.values(DOCUMENT_VISIBILITY),
      default: DOCUMENT_VISIBILITY.MENTOR_VISIBLE,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

documentSchema.index({ studentId: 1, category: 1, status: 1 });
documentSchema.index({ studentId: 1, semester: 1, academicYear: 1 });
documentSchema.index({ studentId: 1, documentType: 1 });

const Document = mongoose.model('Document', documentSchema);
module.exports = Document;
