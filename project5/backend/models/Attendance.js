const mongoose = require('mongoose');

/**
 * Attendance — separate collection (single source of truth)
 * Imported by HOD via Excel. Never manually edited by mentors.
 * Academic Attention score is based on CIE + backlogs only.
 * Attendance is a separate monitoring signal displayed independently.
 */
const attendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    usn: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    subjectCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    subjectName: {
      type: String,
      trim: true,
      default: '',
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
      index: true,
    },
    academicYear: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    totalClasses: {
      type: Number,
      required: true,
      min: 0,
    },
    classesAttended: {
      type: Number,
      required: true,
      min: 0,
    },
    attendancePercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    importedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    importBatchId: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: one record per student per subject per semester per academic year
attendanceSchema.index(
  { studentId: 1, subjectCode: 1, semester: 1, academicYear: 1 },
  { unique: true }
);
attendanceSchema.index({ usn: 1, semester: 1, academicYear: 1 });
attendanceSchema.index({ importBatchId: 1 });

// Pre-save: compute attendance percentage
attendanceSchema.pre('save', function (next) {
  if (this.totalClasses > 0) {
    this.attendancePercentage = Math.round((this.classesAttended / this.totalClasses) * 100 * 10) / 10;
  } else {
    this.attendancePercentage = 0;
  }
  // Clamp attended to total
  if (this.classesAttended > this.totalClasses) {
    this.classesAttended = this.totalClasses;
    this.attendancePercentage = 100;
  }
  next();
});

const Attendance = mongoose.model('Attendance', attendanceSchema);
module.exports = Attendance;
