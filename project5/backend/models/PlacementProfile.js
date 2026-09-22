const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, required: true },
    description: { type: String, trim: true, default: '' },
    techStack: { type: [String], default: [] },
    url: { type: String, trim: true, default: '' },
  },
  { _id: true }
);

const internshipSchema = new mongoose.Schema(
  {
    company: { type: String, trim: true, required: true },
    role: { type: String, trim: true, default: '' },
    duration: { type: String, trim: true, default: '' }, // e.g. "Jun 2024 – Aug 2024"
    description: { type: String, trim: true, default: '' },
    // Reference to Document Vault entry — avoids duplicate uploads
    certificateDocumentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      default: null,
    },
  },
  { _id: true }
);

const certificationSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, required: true },
    issuer: { type: String, trim: true, default: '' },
    date: { type: Date, default: null },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      default: null,
    },
  },
  { _id: true }
);

const placementProfileSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      unique: true,
      index: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    // Reference to Document Vault resume — no duplicate file uploads
    resumeDocumentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      default: null,
    },
    linkedIn: {
      type: String,
      trim: true,
      default: '',
      validate: {
        validator: (v) => !v || /^https?:\/\/(www\.)?linkedin\.com\//.test(v),
        message: 'Please provide a valid LinkedIn URL',
      },
    },
    gitHub: {
      type: String,
      trim: true,
      default: '',
      validate: {
        validator: (v) => !v || /^https?:\/\/(www\.)?github\.com\//.test(v),
        message: 'Please provide a valid GitHub URL',
      },
    },
    portfolio: {
      type: String,
      trim: true,
      default: '',
      validate: {
        validator: (v) => !v || /^https?:\/\//.test(v),
        message: 'Please provide a valid URL',
      },
    },
    projects: [projectSchema],
    internships: [internshipSchema],
    certifications: [certificationSchema],
    // Cached from Student.academics for quick eligibility checks
    // Updated whenever CIE marks are recalculated
    cgpaCache: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
    backlogsCache: {
      type: Number,
      default: 0,
      min: 0,
    },
    cacheUpdatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const PlacementProfile = mongoose.model('PlacementProfile', placementProfileSchema);
module.exports = PlacementProfile;
