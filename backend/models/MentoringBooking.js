import mongoose from "mongoose";

const mentoringBookingSchema = new mongoose.Schema(
  {
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mentor",
      required: true,
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    date: {
      type: String,
      required: true,
    },

    time: {
      type: String,
      required: true,
    },

    title: {
      type: String,
      default: "Mentoring Session",
      trim: true,
    },

    status: {
      type: String,
      enum: ["Booked", "Completed", "Cancelled"],
      default: "Booked",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "MentoringBooking",
  mentoringBookingSchema
);