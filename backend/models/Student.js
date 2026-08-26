import mongoose from "mongoose";

/* =========================================================
   SUBJECT MARKS
========================================================= */

const subjectSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      trim: true,
    },

    cie1: {
      type: Number,
      default: 0,
    },

    cie2: {
      type: Number,
      default: 0,
    },

    cie3: {
      type: Number,
      default: 0,
    },

    final: {
      type: Number,
      default: 0,
    },

    set: {
      type: Number,
      default: 0,
    },

    total: {
      type: Number,
      default: 0,
    },

    grade: {
      type: String,
      default: "",
    },
  },
  {
    _id: true,
  }
);

/* =========================================================
   STUDENT
========================================================= */

const studentSchema = new mongoose.Schema(
  {
    usn: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    dept: {
      type: String,
      default:
        "Computer Science & Engineering",
      trim: true,
    },

    year: {
      type: String,
      default: "3rd Year",
      trim: true,
    },

    mentor: {
      type: String,
      default: "",
      trim: true,
    },

    attendance: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    /* Overall marks */

    cie1: {
      type: Number,
      default: 0,
    },

    cie2: {
      type: Number,
      default: 0,
    },

    cie3: {
      type: Number,
      default: 0,
    },

    final: {
      type: Number,
      default: 0,
    },

    set: {
      type: Number,
      default: 0,
    },

    total: {
      type: Number,
      default: 0,
    },

    grade: {
      type: String,
      default: "",
    },

    backlog: {
      type: Number,
      default: 0,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    subjects: {
      type: [subjectSchema],
      default: [],
    },

    marksUpdatedBy: {
      type: String,
      default: "",
    },

    marksUpdatedAt: {
      type: Date,
    },

    /* Link with User */

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
  "Student",
  studentSchema
);