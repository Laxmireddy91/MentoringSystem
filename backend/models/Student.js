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
    /* -------------------------------------------------------
       BASIC INFORMATION
    ------------------------------------------------------- */

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


    /* -------------------------------------------------------
       OVERALL MARKS
       Attendance has been completely removed.
    ------------------------------------------------------- */

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


    /* -------------------------------------------------------
       CONTACT
    ------------------------------------------------------- */

    phone: {
      type: String,
      default: "",
      trim: true,
    },


    /* -------------------------------------------------------
       SUBJECTS
    ------------------------------------------------------- */

    subjects: {
      type: [subjectSchema],
      default: [],
    },


    /* -------------------------------------------------------
       MARK UPDATE INFORMATION
    ------------------------------------------------------- */

    marksUpdatedBy: {
      type: String,
      default: "",
    },

    marksUpdatedAt: {
      type: Date,
    },


    /* -------------------------------------------------------
       LINK WITH USER
    ------------------------------------------------------- */

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


/* =========================================================
   EXPORT
========================================================= */

export default mongoose.model(
  "Student",
  studentSchema
);