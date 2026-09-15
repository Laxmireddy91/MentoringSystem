import fs from "fs/promises";
import path from "path";

import Student from "../models/Student.js";
import Mentor from "../models/Mentor.js";
import { normalizeSubjects } from "../utils/academicCalculations.js";

async function canAccessStudent(req, student) {
  if (!student) return false;

  if (req.user.role === "mentor" || req.user.role === "hod") {
    return true;
  }

  if (req.user.role === "student") {
    if (
      student.user &&
      String(student.user) === String(req.user._id)
    ) {
      return true;
    }

    if (
      req.user.usn &&
      student.usn &&
      req.user.usn === student.usn
    ) {
      return true;
    }
  }

  return false;
}

const MAX_ACHIEVEMENT_FILE_BYTES = 3 * 1024 * 1024;

const achievementMimeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function safeAchievementFileName(name = "document") {
  return path.basename(String(name))
    .replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function getStudentAchievements(req, res, next) {
  try {
    const student = await Student.findById(req.params.id).lean();

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    if (!(await canAccessStudent(req, student))) {
      return res.status(403).json({
        message: "You cannot view this student's documents",
      });
    }

    return res.json({
      studentId: student._id.toString(),
      achievements: Array.isArray(student.achievements)
        ? student.achievements.map((item) => ({
            ...item,
            id: item._id?.toString(),
          }))
        : [],
    });
  } catch (error) {
    next(error);
  }
}

export async function addStudentAchievement(req, res, next) {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    if (!(await canAccessStudent(req, student))) {
      return res.status(403).json({
        message: "You cannot update this student's achievements",
      });
    }

    const {
      title = "",
      category = "",
      date = "",
      description = "",
      fileName = "",
      mimeType = "",
      fileData = "",
    } = req.body || {};

    if (!String(title).trim()) {
      return res.status(400).json({
        message: "Achievement title is required",
      });
    }

    if (!fileData || !String(fileData).includes(",")) {
      return res.status(400).json({
        message: "Certificate or document is required",
      });
    }

    if (!achievementMimeTypes.has(String(mimeType))) {
      return res.status(400).json({
        message: "Unsupported document type",
      });
    }

    const base64 = String(fileData).split(",", 2)[1];
    const buffer = Buffer.from(base64, "base64");

    if (!buffer.length) {
      return res.status(400).json({
        message: "Uploaded document is empty",
      });
    }

    if (buffer.length > MAX_ACHIEVEMENT_FILE_BYTES) {
      return res.status(400).json({
        message: "Document must be 3 MB or smaller",
      });
    }

    const uploadDir = path.join(
      process.cwd(),
      "uploads",
      "achievements"
    );

    await fs.mkdir(uploadDir, {
      recursive: true,
    });

    const safeName = safeAchievementFileName(
      fileName || "document"
    );

    const storedName =
      `${Date.now()}-${randomUUID()}-${safeName}`;

    const destination = path.join(
      uploadDir,
      storedName
    );

    await fs.writeFile(
      destination,
      buffer
    );

    student.achievements.push({
      title: String(title).trim(),
      category: String(category).trim(),
      date: String(date).trim(),
      description: String(description).trim(),
      fileName: safeName,
      filePath: `/uploads/achievements/${storedName}`,
      mimeType: String(mimeType),
      fileSize: buffer.length,
    });

    await student.save();

    const achievement =
      student.achievements[
        student.achievements.length - 1
      ];

    return res.status(201).json({
      ...student.toObject(),
      id: student._id.toString(),
      achievement: {
        ...achievement.toObject(),
        id: achievement._id.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createStudent(req, res, next) {
  try {
    const allowed = [
      "usn",
      "name",
      "dept",
      "year",
      "mentorId",
      "backlog",
      "phone",
      "subjects",
      "marksUpdatedBy",
      "marksUpdatedAt",
      "sgpa",
      "cgpa",
      "onlineCoursesAttended",
      "mentorshipRecords",
      "backlogRecords",
    ];

    const payload = {};

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        payload[key] = req.body[key];
      }
    }

    if (!payload.name || !payload.usn) {
      return res.status(400).json({
        message: "Name and USN are required",
      });
    }

    payload.usn = String(payload.usn)
      .trim()
      .toUpperCase();

    payload.name = String(payload.name).trim();

    // subjects[] is the single source of truth
    if (Array.isArray(payload.subjects)) {
      payload.subjects = normalizeSubjects(payload.subjects);

      const average = payload.subjects.length
        ? Math.round(
            payload.subjects.reduce(
              (sum, subject) =>
                sum + Number(subject.total || 0),
              0
            ) / payload.subjects.length
          )
        : 0;

      payload.total = average;

      payload.grade =
        average >= 40
          ? "Pass"
          : average > 0
            ? "Fail"
            : "";
    }

    // Check duplicate USN
    const existing = await Student.findOne({
      usn: payload.usn,
    });

    if (existing) {
      return res.status(409).json({
        message: "Student with this USN already exists",
      });
    }

    // Mentor can create only under their own Mentor profile
    if (req.user.role === "mentor") {
      const mentor = await Mentor.findOne({
        user: req.user._id,
      });

      if (!mentor) {
        return res.status(404).json({
          message: "Mentor profile not found",
        });
      }

      payload.mentorId = mentor._id;
    }

    const student = await Student.create(payload);

    return res.status(201).json({
      ...student.toObject(),
      id: student._id.toString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function updateStudent(req, res, next) {
  try {
    const studentId = req.params.id;

    const allowed = [
      "usn",
      "name",
      "dept",
      "year",
      "mentorId",
      "backlog",
      "phone",
      "subjects",
      "marksUpdatedBy",
      "marksUpdatedAt",
      "sgpa",
      "cgpa",
      "onlineCoursesAttended",
      "mentorshipRecords",
      "backlogRecords",
    ];

    const payload = {};

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        payload[key] = req.body[key];
      }
    }

    if (payload.usn) {
      payload.usn = String(payload.usn)
        .trim()
        .toUpperCase();
    }

    if (payload.name) {
      payload.name = String(payload.name).trim();
    }

    // subjects[] is the single source of truth
    if (Array.isArray(payload.subjects)) {
      payload.subjects = normalizeSubjects(payload.subjects);

      const average = payload.subjects.length
        ? Math.round(
            payload.subjects.reduce(
              (sum, subject) =>
                sum + Number(subject.total || 0),
              0
            ) / payload.subjects.length
          )
        : 0;

      payload.total = average;

      payload.grade =
        average >= 40
          ? "Pass"
          : average > 0
            ? "Fail"
            : "";
    }

    // Mentor can update only through their own Mentor profile
    if (req.user.role === "mentor") {
      const mentor = await Mentor.findOne({
        user: req.user._id,
      });

      if (!mentor) {
        return res.status(404).json({
          message: "Mentor profile not found",
        });
      }

      payload.mentorId = mentor._id;
    }

    const student = await Student.findByIdAndUpdate(
      studentId,
      payload,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    return res.json({
      ...student.toObject(),
      id: student._id.toString(),
    });
  } catch (error) {
    next(error);
  }
}
export async function updatePerformanceReport(req, res, next) {
  try {
    const studentId = req.params.id;

    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    if (!Array.isArray(student.subjects)) {
      return res.status(400).json({
        message: "Student subjects data is missing",
      });
    }

    // subjects[] is the single source of truth
    student.subjects = normalizeSubjects(student.subjects);

    const totalMarks = student.subjects.reduce(
      (sum, subject) =>
        sum + Number(subject.total || 0),
      0
    );

    const percentage = student.subjects.length
      ? Math.round(
          totalMarks / student.subjects.length
        )
      : 0;

    student.total = percentage;

    student.grade =
      percentage >= 40
        ? "Pass"
        : percentage > 0
          ? "Fail"
          : "";

    if (req.body.marksUpdatedBy !== undefined) {
      student.marksUpdatedBy = req.body.marksUpdatedBy;
    }

    student.marksUpdatedAt = new Date();

    await student.save();

    return res.json({
      ...student.toObject(),
      id: student._id.toString(),
      totalMarks,
      percentage,
    });
  } catch (error) {
    next(error);
  }
}
export async function deleteAchievement(req, res, next) {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    if (!(await canAccessStudent(req, student))) {
      return res.status(403).json({
        message: "You cannot modify this student's achievements",
      });
    }

    const achievement = student.achievements.id(
      req.params.achievementId
    );

    if (!achievement) {
      return res.status(404).json({
        message: "Achievement not found",
      });
    }

    if (achievement.filePath) {
      const relative = String(achievement.filePath).replace(
        /^[/\\]+/,
        ""
      );

      const diskPath = path.join(
        process.cwd(),
        relative
      );

      try {
        await fs.unlink(diskPath);
      } catch {
        // File may already be missing.
      }
    }

    achievement.deleteOne();

    await student.save();

    return res.json({
      ...student.toObject(),
      id: student._id.toString(),
    });
  } catch (error) {
    next(error);
  }
}
export async function deleteStudent(req, res, next) {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    return res.json({
      success: true,
      message: "Student deleted",
    });
  } catch (error) {
    next(error);
  }
}
export async function updateStudentSubjects(req, res, next) {
  try {
    const subjects = Array.isArray(req.body.subjects)
      ? req.body.subjects
      : [];

    const normalizedSubjects = normalizeSubjects(subjects);

    const average = normalizedSubjects.length
      ? Math.round(
          normalizedSubjects.reduce(
            (sum, subject) =>
              sum + Number(subject.total || 0),
            0
          ) / normalizedSubjects.length
        )
      : 0;

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          subjects: normalizedSubjects,
          total: average,
          grade:
            average >= 40
              ? "Pass"
              : average > 0
                ? "Fail"
                : "",
          marksUpdatedBy: req.user.name,
          marksUpdatedAt: new Date(),
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    return res.json({
      ...student.toObject(),
      id: student._id.toString(),
    });
  } catch (error) {
    next(error);
  }
}