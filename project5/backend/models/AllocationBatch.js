const mongoose = require('mongoose');
const { ALLOCATION_STATUS, ASSIGNMENT_TYPE } = require('../config/constants');

const allocationEntrySchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    studentUsn: { type: String, trim: true, default: '' },
    studentName: { type: String, trim: true, default: '' },
    studentSection: { type: String, trim: true, default: '' },
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mentor',
      required: true,
    },
    mentorName: { type: String, trim: true, default: '' },
    previousMentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mentor',
      default: null,
    },
    previousMentorName: { type: String, trim: true, default: '' },
    assignmentType: {
      type: String,
      enum: Object.values(ASSIGNMENT_TYPE),
      default: ASSIGNMENT_TYPE.AUTOMATIC,
    },
  },
  { _id: false }
);

const allocationBatchSchema = new mongoose.Schema(
  {
    department: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    batch: {
      type: String,
      required: true,
      trim: true,
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
    },
    academicYear: {
      type: String,
      trim: true,
      default: '',
    },
    allocatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    allocatedByName: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: Object.values(ALLOCATION_STATUS),
      default: ALLOCATION_STATUS.CONFIRMED,
      index: true,
    },
    summary: {
      totalStudentsInBatch: { type: Number, default: 0 },
      studentsAllocated: { type: Number, default: 0 },
      studentsUnallocated: { type: Number, default: 0 },
      capacityShortage: { type: Number, default: 0 },
      mentorsInvolved: { type: Number, default: 0 },
      autoAssigned: { type: Number, default: 0 },
      manualAssigned: { type: Number, default: 0 },
    },
    allocations: [allocationEntrySchema],
    confirmedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

allocationBatchSchema.index({ department: 1, batch: 1, semester: 1 });
allocationBatchSchema.index({ allocatedBy: 1, status: 1 });

allocationBatchSchema.virtual('totalStudentsAllocated').get(function () {
  return this.summary?.studentsAllocated || this.allocations?.length || 0;
});
allocationBatchSchema.set('toJSON', { virtuals: true });
allocationBatchSchema.set('toObject', { virtuals: true });

const AllocationBatch = mongoose.model('AllocationBatch', allocationBatchSchema);
module.exports = AllocationBatch;
