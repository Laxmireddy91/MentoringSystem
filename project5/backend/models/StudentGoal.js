const mongoose = require('mongoose');
const { GOAL_STATUS } = require('../config/constants');

const milestoneSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  completedAt: Date,
});

const studentGoalSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Goal title is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['academic', 'skill', 'career', 'personal'],
      default: 'academic',
      index: true,
    },
    targetValue: {
      type: Number,
      required: true,
    },
    currentValue: {
      type: Number,
      default: 0,
    },
    unit: {
      type: String,
      default: '%',
    },
    deadline: {
      type: Date,
      required: [true, 'Goal deadline is required'],
    },
    status: {
      type: String,
      enum: Object.values(GOAL_STATUS),
      default: GOAL_STATUS.ON_TRACK,
      index: true,
    },
    notes: {
      type: String,
      default: '',
    },
    milestones: [milestoneSchema],
  },
  {
    timestamps: true,
  }
);

studentGoalSchema.index({ studentId: 1, status: 1, deadline: 1 });

const StudentGoal = mongoose.model('StudentGoal', studentGoalSchema);
module.exports = StudentGoal;
