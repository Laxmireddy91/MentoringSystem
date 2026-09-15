import mongoose from "mongoose";

/* =========================================================
   SUBJECT MARKS
========================================================= */

const subjectSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      default: "",
      trim: true,
    },

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

    beforeRvSee: {
      type: Number,
      default: 0,
    },

    afterRvSee: {
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

    totalMarks: {
      type: Number,
      default: 0,
    },

    percentage: {
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

year: { type: String, default: "3rd Year", trim: true },

section: {
  type: String,
  enum: ["A", "B", "C"],
  default: "A",
  uppercase: true,
  trim: true,
},
mentor: {
      type: String,
      default: "",
      trim: true,
    },

    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mentor",
      default: null,
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
   PARENT / GUARDIAN INFORMATION
------------------------------------------------------- */

parentName: {
  type: String,
  default: "",
  trim: true,
},

parentRelation: {
  type: String,
  default: "",
  trim: true,
},

parentPhone: {
  type: String,
  default: "",
  trim: true,
},

parentEmail: {
  type: String,
  default: "",
  lowercase: true,
  trim: true,
},

emergencyContact: {
  type: String,
  default: "",
  trim: true,
},

    /* -------------------------------------------------------
       SUBJECTS / PERFORMANCE REPORT
    ------------------------------------------------------- */

    subjects: {
      type: [subjectSchema],
      default: [],
    },

    mentorshipRecords: {
      type: [
        {
          date: { type: String, default: "" },
          code: { type: String, default: "" },
          details: { type: String, default: "" },
          actionTaken: { type: String, default: "" },
          studentSigned: { type: Boolean, default: false },
          mentorSigned: { type: Boolean, default: false },
        },
      ],
      default: [],
    },

    backlogRecords: {
      type: [
        {
          courseName: { type: String, default: "" },
          yearOfPass: { type: String, default: "" },
          extMarks: { type: String, default: "" },
          remarks: { type: String, default: "" },
        },
      ],
      default: [],
    },

    sgpa: {
      type: Number,
      default: 0,
    },

    cgpa: {
      type: Number,
      default: 0,
    },

    onlineCoursesAttended: {
      type: Number,
      default: 0,
    },

    achievements: {
      type: [
        {
          title: { type: String, default: "" },
          category: { type: String, default: "" },
          date: { type: String, default: "" },
          description: { type: String, default: "" },
          fileName: { type: String, default: "" },
          filePath: { type: String, default: "" },
          mimeType: { type: String, default: "" },
          fileSize: { type: Number, default: 0 },
        },
      ],
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