const mongoose = require('mongoose');
const { PLACEMENT_DRIVE_STATUS } = require('../config/constants');

const placementDriveSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      index: true,
    },
    role: {
      type: String,
      required: [true, 'Job role is required'],
      trim: true,
    },
    jobType: {
      type: String,
      enum: ['Full Time', 'Internship', 'Contract', 'Part Time'],
      default: 'Full Time',
    },
    ctc: {
      type: String, // String to allow ranges like "6-8 LPA"
      trim: true,
      default: '',
    },
    eligibleDepartments: {
      type: [String],
      default: [],
      index: true,
    },
    minCGPA: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
    maxBacklogs: {
      type: Number,
      default: 0,
      min: 0,
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    driveDate: {
      type: Date,
      default: null,
    },
    applicationDeadline: {
      type: Date,
      default: null,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: Object.values(PLACEMENT_DRIVE_STATUS),
      default: PLACEMENT_DRIVE_STATUS.UPCOMING,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

placementDriveSchema.index({ status: 1, applicationDeadline: 1 });
placementDriveSchema.index({ eligibleDepartments: 1, status: 1 });

const PlacementDrive = mongoose.model('PlacementDrive', placementDriveSchema);
module.exports = PlacementDrive;
