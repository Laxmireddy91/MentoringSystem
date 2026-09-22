import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  title: { type: String, required: true },
  department: { type: String, required: true },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, enum: ['performance', 'allocation', 'risk', 'leaderboard'], required: true },
  filters: { type: mongoose.Schema.Types.Mixed, default: {} },
  fileUrl: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'ready', 'failed'], default: 'pending' },
}, { timestamps: true });

export default mongoose.model('Report', reportSchema);
