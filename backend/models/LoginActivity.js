import mongoose from "mongoose";

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  loginAt: { type: Date, default: Date.now },
  ipAddress: { type: String, default: "" },
  userAgent: { type: String, default: "" },
  device: { type: String, default: "" },
  success: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model("LoginActivity", schema);
