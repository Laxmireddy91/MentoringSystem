import mongoose from "mongoose";

const studentGoalSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    targetCIE: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    goal: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },

    currentCIE: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    status: {
      type: String,
      enum: ["On Track", "Needs Improvement", "Achieved"],
      default: "On Track",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("StudentGoal", studentGoalSchema);