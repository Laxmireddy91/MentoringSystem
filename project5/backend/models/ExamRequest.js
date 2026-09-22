const mongoose = require('mongoose');
const { REQUEST_TYPES, REQUEST_STATUS } = require('../config/constants');

const attachedDocumentSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: false }
);

const timelineEntrySchema = new mongoose.Schema(
  {
    stage: {
      type: String,
      trim: true,
      required: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    actorName: {
      type: String,
      trim: true,
      default: '',
    },
    action: {
      type: String,
      trim: true,
      required: true,
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const decisionSchema = new mongoose.Schema(
  {
    decision: {
      type: String,
      enum: ['approved', 'rejected', 'clarification_needed'],
      default: null,
    },
    remarks: { type: String, trim: true, default: '' },
    decidedAt: { type: Date, default: null },
    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { _id: false }
);

const examRequestSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mentor',
      default: null,
      index: true,
    },
    requestType: {
      type: String,
      enum: Object.values(REQUEST_TYPES),
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      default: 'Permission Request',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    semester: {
      type: Number,
      min: 1,
      max: 8,
      default: null,
    },
    subjectCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
    },
    // Documents attached from student's Document Vault — no re-upload needed
    attachedDocuments: [attachedDocumentSchema],
    status: {
      type: String,
      enum: Object.values(REQUEST_STATUS),
      default: REQUEST_STATUS.SUBMITTED,
      index: true,
    },
    // Full timeline for visual display to student
    timeline: [timelineEntrySchema],
    // Stage-specific decisions
    mentorDecision: {
      type: decisionSchema,
      default: () => ({}),
    },
    coordinatorDecision: {
      type: decisionSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

examRequestSchema.index({ studentId: 1, status: 1 });
examRequestSchema.index({ status: 1, createdAt: -1 });

const ExamRequest = mongoose.model('ExamRequest', examRequestSchema);
module.exports = ExamRequest;
