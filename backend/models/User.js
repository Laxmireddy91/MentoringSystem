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

    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, default: null },
    emailVerificationExpires: { type: Date, default: null },

    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },

    passwordResetToken: { type: String, default: null },
    passwordResetExpires: { type: Date, default: null },

    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorCodeHash: { type: String, default: null },
    twoFactorExpires: { type: Date, default: null },
    twoFactorAttempts: { type: Number, default: 0 },

    refreshTokenHash: { type: String, default: null },
    refreshTokenExpires: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;