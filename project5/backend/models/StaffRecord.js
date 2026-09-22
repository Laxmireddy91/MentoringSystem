const mongoose = require('mongoose');
const { ROLES } = require('../config/constants');

// Staff roles eligible for StaffRecord-based activation
const STAFF_ROLES = [
  ROLES.MENTOR,
  ROLES.MENTORING_COORDINATOR,
  ROLES.HOD,
  ROLES.EXAM_COORDINATOR,
  ROLES.TPO,
];

/**
 * StaffRecord — institutional pre-registration record
 * Created by HOD or Mentoring Coordinator before staff member activates their account.
 * The role stored here is the ONLY source of truth for role assignment.
 * Staff member can NEVER choose or change their own role.
 */
const staffRecordSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    role: {
      type: String,
      enum: STAFF_ROLES,
      required: [true, 'Role is required'],
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    designation: {
      type: String,
      trim: true,
      default: 'Faculty',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    isActivated: {
      type: Boolean,
      default: false,
      index: true,
    },
    activatedAt: {
      type: Date,
      default: null,
    },
    activatedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

staffRecordSchema.index({ employeeId: 1, email: 1 });
staffRecordSchema.index({ role: 1, department: 1 });

const StaffRecord = mongoose.model('StaffRecord', staffRecordSchema);
module.exports = StaffRecord;
