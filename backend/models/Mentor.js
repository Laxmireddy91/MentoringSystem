import mongoose from "mongoose";

const mentorSchema = new mongoose.Schema(
  {
    mentorId: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    students: {
      type: Number,
      default: 0,
    },

    performance: {
      type: Number,
      default: 0,
    },

    lastActive: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      default: "Active",
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
    },

    availability: [
  {
    day: {
      type: String,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
    },

    startTime: {
      type: String,
      default: "",
    },

    endTime: {
      type: String,
      default: "",
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
],

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "Mentor",
  mentorSchema
);