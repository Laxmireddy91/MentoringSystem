import mongoose from 'mongoose';

const riskSettingsSchema = new mongoose.Schema({
  department: { type: String, required: true, unique: true },
  cgpaThreshold: { type: Number, default: 6.0 },
  backlogThreshold: { type: Number, default: 2 },
  cieThreshold: { type: Number, default: 50 },
  attendanceThreshold: { type: Number, default: 75 },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model('RiskSettings', riskSettingsSchema);
