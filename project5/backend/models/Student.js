const mongoose = require('mongoose');
const { RISK_LEVELS, ENTRY_TYPE, STUDENT_STATUS } = require('../config/constants');

const subjectSchema = new mongoose.Schema({
  subjectCode: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
  },
  subjectName: {
    type: String,
    required: true,
    trim: true,
  },
  credits: {
    type: Number,
    required: true,
    default: 3,
    min: 1,
    max: 10,
  },
  cie1: {
    type: Number,
    default: 0,
    min: 0,
    max: 50,
  },
  cie2: {
    type: Number,
    default: 0,
    min: 0,
    max: 50,
  },
  cie3: {
    type: Number,
    default: 0,
    min: 0,
    max: 50,
  },
  finalMarks: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  totalMarks: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  percentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  grade: {
    type: String,
    default: 'F',
  },
  gradePoint: {
    type: Number,
    default: 0,
    min: 0,
    max: 10,
  },
  result: {
    type: String,
    enum: ['PASS', 'FAIL'],
    default: 'PASS',
  },
  isBacklog: {
    type: Boolean,
    default: false,
  },
});

const semesterSchema = new mongoose.Schema({
  semesterNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 8,
  },
  sgpa: {
    type: Number,
    default: 0,
    min: 0,
    max: 10,
  },
  cgpa: {
    type: Number,
    default: 0,
    min: 0,
    max: 10,
  },
  totalCredits: {
    type: Number,
    default: 0,
  },
  backlogsCount: {
    type: Number,
    default: 0,
  },
  subjects: [subjectSchema],
});

const riskProfileSchema = new mongoose.Schema({
  riskLevel: {
    type: String,
    enum: Object.values(RISK_LEVELS),
    default: RISK_LEVELS.LOW,
    index: true,
  },
  riskScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  reasons: {
    type: [String],
    default: [],
  },
  recommendations: {
    type: [String],
    default: [],
  },
  lastEvaluatedAt: {
    type: Date,
    default: Date.now,
  },
});

const mentorshipRecordSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now,
  },
  mentorName: {
    type: String,
    trim: true,
    default: '',
  },
  type: {
    type: String,
    trim: true,
    default: 'General Mentoring',
  },
  notes: {
    type: String,
    trim: true,
    default: '',
  },
  outcome: {
    type: String,
    trim: true,
    default: '',
  },
  actionTaken: {
    type: String,
    trim: true,
    default: '',
  },
  studentSigned: {
    type: Boolean,
    default: false,
  },
  mentorSigned: {
    type: Boolean,
    default: false,
  },
});

const backlogRecordSchema = new mongoose.Schema({
  semester: {
    type: Number,
    min: 1,
    max: 8,
    default: 1,
  },
  subject: {
    type: String,
    trim: true,
    default: '',
  },
  subjectCode: {
    type: String,
    uppercase: true,
    trim: true,
    default: '',
  },
  status: {
    type: String,
    enum: ['Active', 'Cleared', 'Under Review'],
    default: 'Active',
  },
  attempts: {
    type: Number,
    default: 1,
    min: 1,
  },
  clearedDate: {
    type: Date,
    default: null,
  },
  remarks: {
    type: String,
    trim: true,
    default: '',
  },
});

const onlineCourseSchema = new mongoose.Schema({
  courseName: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true,
  },
  platform: {
    type: String,
    trim: true,
    default: 'NPTEL',
  },
  completionDate: {
    type: Date,
    default: null,
  },
  certificateUrl: {
    type: String,
    trim: true,
    default: '',
  },
  status: {
    type: String,
    enum: ['Completed', 'In Progress', 'Enrolled'],
    default: 'Completed',
  },
});

const mentorHistorySchema = new mongoose.Schema(
  {
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mentor',
      required: true,
    },
    mentorName: {
      type: String,
      trim: true,
      default: '',
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    unassignedAt: {
      type: Date,
      default: null,
    },
    academicYear: {
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
    reason: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: false }
);

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    usn: {
      type: String,
      required: [true, 'USN is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
      index: true,
    },
    program: {
      type: String,
      trim: true,
      default: 'B.E.',
    },
    admissionYear: {
      type: Number,
      default: () => new Date().getFullYear(),
      index: true,
    },
    academicYear: {
      type: String,
      trim: true,
      default: '2025-2026',
    },
    entryType: {
      type: String,
      enum: Object.values(ENTRY_TYPE || { REGULAR: 'REGULAR', LATERAL: 'LATERAL' }),
      default: 'REGULAR',
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(STUDENT_STATUS || { ACTIVE: 'ACTIVE', GRADUATED: 'GRADUATED', INACTIVE: 'INACTIVE', DROPPED: 'DROPPED' }),
      default: 'ACTIVE',
      index: true,
    },
    semester: {
      type: Number,
      required: [true, 'Current semester is required'],
      min: 1,
      max: 8,
      index: true,
    },
    section: {
      type: String,
      trim: true,
      default: 'A',
    },
    batch: {
      type: String,
      trim: true,
      default: '2022-2026',
    },
    // Strict ObjectId relationship to Mentor model
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mentor',
      index: true,
      default: null,
    },
    mentorHistory: {
      type: [mentorHistorySchema],
      default: [],
    },
    parentUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null,
    },
    parentDetails: {
      fatherName: { type: String, trim: true, default: '' },
      motherName: { type: String, trim: true, default: '' },
      guardianRelationship: { type: String, trim: true, default: '' },
      guardianPhone: { type: String, trim: true, default: '' },
      guardianEmail: { type: String, trim: true, default: '' },
      emergencyContact: {
        name: { type: String, trim: true, default: '' },
        relationship: { type: String, trim: true, default: '' },
        phone: { type: String, trim: true, default: '' },
        email: { type: String, trim: true, default: '' },
      },
    },
    academics: [semesterSchema],
    mentorshipRecords: {
      type: [mentorshipRecordSchema],
      default: [],
    },
    backlogRecords: {
      type: [backlogRecordSchema],
      default: [],
    },
    onlineCoursesAttended: {
      type: [onlineCourseSchema],
      default: [],
    },
    riskProfile: {
      type: riskProfileSchema,
      default: () => ({}),
    },
    badges: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for high-speed querying and analytics
studentSchema.index({ mentorId: 1, 'riskProfile.riskLevel': 1 });
studentSchema.index({ department: 1, semester: 1, section: 1 });
studentSchema.index({ usn: 1, department: 1 });
studentSchema.index({ 'riskProfile.riskScore': -1 });
studentSchema.index({ department: 1, admissionYear: 1, status: 1 });
studentSchema.index({ status: 1, mentorId: 1 });
studentSchema.index({ admissionYear: 1, batch: 1, entryType: 1 });

const Student = mongoose.model('Student', studentSchema);
module.exports = Student;
