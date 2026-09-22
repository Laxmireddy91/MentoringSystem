import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  due: { type: String, default: '' },
  owner: { type: String, default: '' },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  done: { type: Boolean, default: false },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Department-level oversight fields
  department: { type: String, default: '' },
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mentor', default: null },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: null },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  isTemplate: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Task', taskSchema);