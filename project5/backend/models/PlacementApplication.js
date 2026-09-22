const mongoose = require('mongoose');
const { PLACEMENT_APPLICATION_STATUS } = require('../config/constants');

const eligibilityReasonSchema = new mongoose.Schema(
  {
    field: { type: String },
    label: { type: String },
    required: { type: mongoose.Schema.Types.Mixed },
    actual: { type: mongoose.Schema.Types.Mixed },
    passed: { type: Boolean },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: Object.values(PLACEMENT_APPLICATION_STATUS),
    },
    updatedAt: { type: Date, default: Date.now },
    remarks: { type: String, trim: true, default: '' },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { _id: false }
);

const placementApplicationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    driveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlacementDrive',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(PLACEMENT_APPLICATION_STATUS),
      default: PLACEMENT_APPLICATION_STATUS.APPLIED,
      index: true,
    },
    // Snapshot of eligibility at the time of application (deterministic)
    eligibilitySnapshot: {
      eligible: { type: Boolean, default: false },
      cgpa: { type: Number },
      backlogs: { type: Number },
      department: { type: String },
      skills: { type: [String], default: [] },
      reasons: { type: [eligibilityReasonSchema], default: [] },
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    statusHistory: [statusHistorySchema],
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate applications
placementApplicationSchema.index({ studentId: 1, driveId: 1 }, { unique: true });
placementApplicationSchema.index({ driveId: 1, status: 1 });

const PlacementApplication = mongoose.model('PlacementApplication', placementApplicationSchema);
module.exports = PlacementApplication;
