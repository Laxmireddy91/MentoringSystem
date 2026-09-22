const mongoose = require('mongoose');

const criticalRuleSchema = new mongoose.Schema({
  ruleName: {
    type: String,
    required: true,
  },
  condition: {
    type: String,
    required: true,
  },
  scoreMultiplier: {
    type: Number,
    default: 1.2,
  },
  description: String,
});

const riskSettingsSchema = new mongoose.Schema(
  {
    department: {
      type: String,
      default: 'ALL',
      unique: true,
      trim: true,
      index: true,
    },
    cieThresholdPercentage: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    backlogThresholdCount: {
      type: Number,
      default: 2,
      min: 0,
      max: 10,
    },
    weights: {
      cie: { type: Number, default: 0.40, min: 0, max: 1 },
      backlogs: { type: Number, default: 0.40, min: 0, max: 1 },
      trend: { type: Number, default: 0.20, min: 0, max: 1 },
    },
    criticalRules: [criticalRuleSchema],
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

const RiskSettings = mongoose.model('RiskSettings', riskSettingsSchema);
module.exports = RiskSettings;
