const mongoose = require('mongoose');

const marksSnapshotSchema = new mongoose.Schema({
  cie1: { type: Number, default: 0 },
  cie2: { type: Number, default: 0 },
  cie3: { type: Number, default: 0 },
  finalMarks: { type: Number, default: 0 },
  totalMarks: { type: Number, default: 0 },
  grade: { type: String, default: 'F' },
});

const performanceSnapshotSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student ID is required'],
      index: true,
    },
    semesterNumber: {
      type: Number,
      required: true,
    },
    subjectCode: {
      type: String,
      required: true,
      uppercase: true,
    },
    subjectName: {
      type: String,
      required: true,
    },
    previousMarks: {
      type: marksSnapshotSchema,
      required: true,
    },
    newMarks: {
      type: marksSnapshotSchema,
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reason: {
      type: String,
      default: 'Routine academic mark entry/revision',
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

performanceSnapshotSchema.index({ studentId: 1, semesterNumber: 1, subjectCode: 1, timestamp: -1 });

const PerformanceSnapshot = mongoose.model('PerformanceSnapshot', performanceSnapshotSchema);
module.exports = PerformanceSnapshot;
