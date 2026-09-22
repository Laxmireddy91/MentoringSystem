const mongoose = require('mongoose');

/**
 * StudentRecord — institutional pre-registration record for students
 * Created by HOD before a student activates their account.
 * Also stores parentEmail for parent account activation.
 * Students and parents NEVER choose their own role.
 */
const studentRecordSchema = new mongoose.Schema(
  {
    usn: {
      type: String,
      required: [true, 'USN is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Student institutional email is required'],
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
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    batch: {
      type: String,
      trim: true,
      default: '',
    },
    semester: {
      type: Number,
      min: 1,
      max: 8,
      default: 1,
    },
    section: {
      type: String,
      trim: true,
      default: 'A',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    // Parent email for parent activation — institution registers this
    parentEmail: {
      type: String,
      lowercase: true,
      trim: true,
      default: '',
    },
    parentName: {
      type: String,
      trim: true,
      default: '',
    },
    parentRelation: {
      type: String,
      trim: true,
      default: 'Guardian',
    },
    // Student activation status
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
    // Parent activation status (separate from student activation)
    parentActivated: {
      type: Boolean,
      default: false,
    },
    parentActivatedAt: {
      type: Date,
      default: null,
    },
    parentActivatedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mentor',
      default: null,
      index: true,
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

studentRecordSchema.index({ usn: 1, email: 1 });
studentRecordSchema.index({ department: 1, batch: 1, semester: 1 });
studentRecordSchema.index({ parentEmail: 1 });

const StudentRecord = mongoose.model('StudentRecord', studentRecordSchema);
module.exports = StudentRecord;
