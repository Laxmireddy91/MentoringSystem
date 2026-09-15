import mongoose from "mongoose";

const schema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  action: { type: String, required: true, trim: true },
  targetType: { type: String, required: true, trim: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, default: null },
  description: { type: String, required: true, trim: true, maxlength: 1000 },
  ipAddress: { type: String, default: "" },
}, { timestamps: true });

export default mongoose.model("AuditLog", schema);
