const mongoose = require('mongoose');
const { SESSION_STATUS, SESSION_TYPES } = require('../config/constants');

const actionItemSchema = new mongoose.Schema({
  task: {
    type: String,
    required: true,
    trim: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  dueDate: Date,
});

const sessionSchema = new mongoose.Schema(
  {
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mentor',
      required: [true, 'Mentor ID is required'],
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Session title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    sessionType: {
      type: String,
      enum: Object.values(SESSION_TYPES),
      default: SESSION_TYPES.ACADEMIC,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(SESSION_STATUS),
      default: SESSION_STATUS.SCHEDULED,
      index: true,
    },
    startTime: {
      type: Date,
      required: [true, 'Session start time is required'],
      index: true,
    },
    endTime: {
      type: Date,
      required: [true, 'Session end time is required'],
      index: true,
    },
    meetingType: {
      type: String,
      enum: ['offline', 'online'],
      default: 'offline',
    },
    location: {
      type: String,
      default: 'Faculty Cabin',
    },
    meetingLink: {
      type: String,
      default: '',
    },
    agenda: {
      type: String,
      default: '',
    },
    mentorNotes: {
      type: String,
      default: '',
    },
    actionItems: [actionItemSchema],
    cancellationReason: {
      type: String,
      default: '',
    },
    feedbackId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Feedback',
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for fast calendar slot querying and collision detection
sessionSchema.index({ mentorId: 1, startTime: 1, endTime: 1 });
sessionSchema.index({ studentId: 1, startTime: 1 });
sessionSchema.index({ status: 1, startTime: 1 });

const Session = mongoose.model('Session', sessionSchema);
module.exports = Session;
