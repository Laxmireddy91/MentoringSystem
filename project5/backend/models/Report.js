const mongoose = require('mongoose');
const { REPORT_TYPES } = require('../config/constants');

const reportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Report title is required'],
      trim: true,
    },
    reportType: {
      type: String,
      enum: Object.values(REPORT_TYPES),
      required: [true, 'Report type is required'],
      index: true,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Generating user ID is required'],
      index: true,
    },
    department: {
      type: String,
      trim: true,
      default: 'ALL',
      index: true,
    },
    semester: {
      type: Number,
      default: null,
    },
    filters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    fileUrl: {
      type: String,
      default: '',
    },
    fileType: {
      type: String,
      enum: ['pdf', 'excel', 'csv', 'json'],
      default: 'pdf',
    },
    summary: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

reportSchema.index({ reportType: 1, department: 1, createdAt: -1 });

const Report = mongoose.model('Report', reportSchema);
module.exports = Report;
