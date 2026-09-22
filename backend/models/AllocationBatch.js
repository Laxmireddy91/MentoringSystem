import mongoose from 'mongoose';

const allocationBatchSchema = new mongoose.Schema({
  status: { type: String, enum: ['draft', 'confirmed', 'cancelled'], default: 'draft' },
  department: { type: String, required: true },
  academicYear: { type: String, default: '' },
  rules: {
    maxMenteesPerMentor: { type: Number, default: 20 },
    matchByDept: { type: Boolean, default: true },
    evenDistribution: { type: Boolean, default: true },
  },
  allocations: [{
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mentor' },
    mentorName: String,
    studentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    studentCount: { type: Number, default: 0 },
  }],
  unallocatedStudentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  totalStudents: { type: Number, default: 0 },
  totalMentors: { type: Number, default: 0 },
  computedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  confirmedAt: Date,
  reassignments: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    fromMentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mentor' },
    toMentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mentor' },
    reason: { type: String, default: '' },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

export default mongoose.model('AllocationBatch', allocationBatchSchema);
