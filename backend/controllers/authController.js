import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import Student from "../models/Student.js";
import Mentor from "../models/Mentor.js";

/* =========================================================
   CREATE JWT TOKEN
========================================================= */

const tokenFor = (user) => {
  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

/* =========================================================
   SAFE USER OBJECT
========================================================= */

const safeUser = (user) => {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department || "",
    phone: user.phone || "",
    usn: user.usn || "",
    designation: user.designation || "",
    semester: user.semester || "",
    active: user.active,
  };
};

/* =========================================================
   REGISTER
========================================================= */

export async function register(req, res) {
  let createdUser = null;

  try {
    console.log("\n=================================");
    console.log("📥 REGISTER REQUEST");
    console.log(req.body);
    console.log("=================================\n");

    const {
      name,
      email,
      password,
      role = "student",
      department,
      phone,
      usn,
      semester,
    } = req.body;

    /* -----------------------------------------------------
       VALIDATION
    ----------------------------------------------------- */

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 6 characters",
      });
    }

    const allowedRoles = [
      "student",
      "mentor",
      "hod",
      "principal",
    ];

    const normalizedRole = String(role)
      .trim()
      .toLowerCase();

    if (!allowedRoles.includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    /* -----------------------------------------------------
       NORMALIZE
    ----------------------------------------------------- */

    const normalizedName = name.trim();

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    const normalizedUSN = usn
      ? usn.trim().toUpperCase()
      : "";

    /* -----------------------------------------------------
       CHECK EMAIL
    ----------------------------------------------------- */

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    /* -----------------------------------------------------
       STUDENT USN CHECK
    ----------------------------------------------------- */

    if (normalizedRole === "student") {
      if (!normalizedUSN) {
        return res.status(400).json({
          success: false,
          message: "USN is required for students",
        });
      }

      const existingStudent =
        await Student.findOne({
          usn: normalizedUSN,
        });

      if (existingStudent) {
        return res.status(409).json({
          success: false,
          message:
            `USN ${normalizedUSN} is already registered`,
        });
      }
    }

    /* -----------------------------------------------------
       HASH PASSWORD
    ----------------------------------------------------- */

    const hashedPassword =
      await bcrypt.hash(password, 12);

    /* -----------------------------------------------------
       CREATE USER
    ----------------------------------------------------- */

    createdUser = await User.create({
      name: normalizedName,

      email: normalizedEmail,

      password: hashedPassword,

      role: normalizedRole,

      department:
        department ||
        "Computer Science & Engineering",

      phone: phone || "",

      usn: normalizedUSN,

      designation: normalizedRole,

      semester: semester || "",

      active: true,
    });

    console.log(
      "✅ USER CREATED:",
      createdUser._id.toString()
    );

    /* -----------------------------------------------------
       CREATE STUDENT PROFILE
    ----------------------------------------------------- */

    if (normalizedRole === "student") {
      const student =
        await Student.create({
          name: normalizedName,

          usn: normalizedUSN,

          dept:
            department ||
            "Computer Science & Engineering",

          year: "3rd Year",

          mentor: "",

          attendance: 0,

          phone: phone || "",

          subjects: [],

          cie1: 0,
          cie2: 0,
          cie3: 0,
          final: 0,
          set: 0,
          total: 0,
          grade: "",
          backlog: 0,

          marksUpdatedBy: "",

          user: createdUser._id,
        });

      console.log(
        "✅ STUDENT PROFILE CREATED:",
        student._id.toString()
      );
    }

    /* -----------------------------------------------------
       CREATE MENTOR PROFILE
    ----------------------------------------------------- */

    if (normalizedRole === "mentor") {
      const mentor =
        await Mentor.create({
          mentorId:
            `M${Date.now()
              .toString()
              .slice(-5)}`,

          name: normalizedName,

          students: 0,

          performance: 0,

          lastActive:
            new Date()
              .toISOString()
              .slice(0, 10),

          status: "Active",

          email: normalizedEmail,

          user: createdUser._id,
        });

      console.log(
        "✅ MENTOR PROFILE CREATED:",
        mentor._id.toString()
      );
    }

    /* -----------------------------------------------------
       CREATE TOKEN
    ----------------------------------------------------- */

    const token = tokenFor(createdUser);

    console.log(
      "🎉 REGISTRATION SUCCESS:",
      normalizedEmail
    );

    return res.status(201).json({
      success: true,

      message:
        "Registration successful",

      token,

      user: safeUser(createdUser),
    });
  } catch (error) {
    console.error(
      "\n================================="
    );

    console.error(
      "❌ REGISTRATION ERROR"
    );

    console.error(error);

    console.error(
      "=================================\n"
    );

    /* -----------------------------------------------------
       CLEANUP
    ----------------------------------------------------- */

    if (createdUser?._id) {
      try {
        await User.findByIdAndDelete(
          createdUser._id
        );

        console.log(
          "🧹 Incomplete user removed"
        );
      } catch (cleanupError) {
        console.error(
          "❌ Cleanup failed:",
          cleanupError
        );
      }
    }

    /* -----------------------------------------------------
       DUPLICATE KEY
    ----------------------------------------------------- */

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,

        message:
          "Email or USN already exists",

        details:
          error.keyValue || {},
      });
    }

    /* -----------------------------------------------------
       VALIDATION
    ----------------------------------------------------- */

    if (
      error.name ===
      "ValidationError"
    ) {
      const messages =
        Object.values(
          error.errors
        ).map(
          (err) => err.message
        );

      return res.status(400).json({
        success: false,

        message:
          messages.join(", "),
      });
    }

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Registration failed",
    });
  }
}

/* =========================================================
   LOGIN
========================================================= */

export async function login(req, res) {
  try {
    const {
      email,
      password,
      role,
    } = req.body;

    console.log("\n=================================");
    console.log("🔐 LOGIN REQUEST");
    console.log("Email:", email);
    console.log("Requested role:", role);
    console.log("=================================");

    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message:
          "Email, password and role are required",
      });
    }

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    const normalizedRole = role
      .trim()
      .toLowerCase();

    /* -----------------------------------------------------
       FIND USER
    ----------------------------------------------------- */

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      console.log(
        "❌ USER NOT FOUND"
      );

      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
      });
    }

    console.log(
      "Database role:",
      user.role
    );

    /* -----------------------------------------------------
       PASSWORD
    ----------------------------------------------------- */

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatch) {
      console.log(
        "❌ PASSWORD INCORRECT"
      );

      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
      });
    }

    /* -----------------------------------------------------
       ROLE
    ----------------------------------------------------- */

    if (
      user.role !== normalizedRole
    ) {
      console.log(
        `❌ ROLE MISMATCH: selected=${normalizedRole}, database=${user.role}`
      );

      return res.status(401).json({
        success: false,

        message:
          `This account is registered as ${user.role}. Please select the ${user.role} role.`,
      });
    }

    /* -----------------------------------------------------
       TOKEN
    ----------------------------------------------------- */

    const token = tokenFor(user);

    const responseUser =
      safeUser(user);

    console.log(
      "✅ LOGIN SUCCESS:",
      normalizedEmail
    );

    console.log(
      "Role:",
      responseUser.role
    );

    console.log(
      "=================================\n"
    );

    return res.status(200).json({
      success: true,

      message: "Login successful",

      token,

      user: responseUser,
    });
  } catch (error) {
    console.error(
      "❌ LOGIN ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Login failed",
    });
  }
}

/* =========================================================
   CURRENT USER
========================================================= */

export async function me(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message:
          "Not authenticated",
      });
    }

    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    console.error(
      "❌ ME ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to get current user",
    });
  }
}