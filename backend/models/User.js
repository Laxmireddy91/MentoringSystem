import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: [
        "student",
        "mentor",
        "hod",
       
      ],
      required: true,
    },

    department: {
      type: String,
      default: "Computer Science & Engineering",
      trim: true,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    usn: {
      type: String,
      default: "",
      uppercase: true,
      trim: true,
    },

    designation: {
      type: String,
      default: "",
      trim: true,
    },

    semester: {
      type: String,
      default: "",
      trim: true,
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;