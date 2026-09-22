import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  actorRole: String,
  action: { type: String, required: true },
  entityType: String,
  entityId: mongoose.Schema.Types.ObjectId,
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  department: String,
}, { timestamps: true });

export default mongoose.model('AuditLog', auditLogSchema);
