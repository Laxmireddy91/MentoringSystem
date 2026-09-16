import express from "express";
import Student from "../models/Student.js";
import Mentor from "../models/Mentor.js";
import {
  createSession,
  updateSession,
  deleteSession,
} from "../controllers/sessionController.js";

import {
  markNotificationAsRead,
} from "../controllers/notificationController.js";

import {
  getAnalytics,
} from "../controllers/analyticsController.js";

import {
  updateProfile,
} from "../controllers/profileController.js";

import {
  getDashboard,
} from "../controllers/dashboardController.js";

import MentoringBooking from "../models/MentoringBooking.js";
import Session from "../models/Session.js";
import Notification from "../models/Notification.js";
import Task from "../models/Task.js";
import User from "../models/User.js";

import { protect, allowRoles } from "../middleware/auth.js";

import {
  createTask,
  updateTask,
  deleteTask,
} from "../controllers/taskController.js";

import {
  createStudent,
  updateStudent,
  updatePerformanceReport,
  deleteAchievement,
  deleteStudent,
  updateStudentSubjects,
  getStudentAchievements,
  addStudentAchievement,
} from "../controllers/studentController.js";

import {
  createMentor,
  updateMentor,
  deleteMentor,
} from "../controllers/mentorController.js";

const router = express.Router();

router.use(protect);

const getId = (req) => req.params.id;

const roleCanManageAcademic =
  allowRoles("mentor", "hod");


/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function normalizeMentorship(records = []) {
  return records.slice(0, 6).map((record) => ({
    date: String(record?.date || ""),
    code: String(record?.code || ""),
    details: String(record?.details || ""),
    actionTaken: String(record?.actionTaken || ""),
    studentSigned: Boolean(record?.studentSigned),
    mentorSigned: Boolean(record?.mentorSigned),
  }));
}

function normalizeBacklogs(records = []) {
  return records.slice(0, 20).map((record) => ({
    courseName: String(record?.courseName || ""),
    yearOfPass: String(record?.yearOfPass || ""),
    extMarks: String(record?.extMarks || ""),
    remarks: String(record?.remarks || ""),
  }));
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
  return path.basename(String(name)).replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function canAccessStudent(req, student) {
  if (!student) return false;

  if (req.user.role === "mentor" || req.user.role === "hod") {
    return true;
  }

  if (req.user.role === "student") {
    if (student.user && String(student.user) === String(req.user._id)) {
      return true;
    }
    if (req.user.usn && student.usn && req.user.usn === student.usn) {
      return true;
    }
  }

  return false;
}

async function editAcademicRecord(req, res, next) {
  if (req.user.role === "mentor" || req.user.role === "hod") {
    return next();
  }

  if (req.user.role !== "student") {
    return res.status(403).json({ message: "You do not have permission to edit academic records" });
  }

  const student = await Student.findById(getId(req));
  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }

  const ownsRecord =
    (student.user && String(student.user) === String(req.user._id)) ||
    (req.user.usn && student.usn && req.user.usn === student.usn);

  if (!ownsRecord) {
    return res.status(403).json({ message: "You can edit only your own academic record" });
  }

  return next();
}


/*
|--------------------------------------------------------------------------
| CLEAN STUDENT PAYLOAD
|--------------------------------------------------------------------------
|
| Attendance has intentionally been removed.
|
*/

function cleanStudentPayload(body = {}) {
  const allowed = [
    "usn",
    "name",
    "dept",
    "year",
    "mentorId",
    "section",
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
    if (body[key] !== undefined) {
      payload[key] = body[key];
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

  return payload;
}

/*
|--------------------------------------------------------------------------
| CLEAN MENTOR PAYLOAD
|--------------------------------------------------------------------------
*/

function cleanMentorPayload(body = {}) {
  const allowed = [
    "mentorId",
    "name",
    "students",
    "performance",
    "lastActive",
    "status",
    "email",
  ];

  const payload = {};

  for (const key of allowed) {
    if (body[key] !== undefined) {
      payload[key] = body[key];
    }
  }

  return payload;
}


/*
|--------------------------------------------------------------------------
| BUILD PROFILES
|--------------------------------------------------------------------------
*/

async function buildProfiles(
  user,
  visibleStudents
) {
  const profiles = {};

  const own = {
    name: user.name,
    usn: user.usn || "",
    email: user.email,
    phone: user.phone || "",
    department: user.department || "",
    designation:
      user.designation ||
      user.role,
    semester: user.semester || "",
  };

  profiles[user.role] = own;


  /*
  |--------------------------------------------------------------------------
  | FIND MENTOR
  |--------------------------------------------------------------------------
  */

/*
|--------------------------------------------------------------------------
| FIND MENTOR USING mentorId
|--------------------------------------------------------------------------
|
| Student.mentorId -> Mentor._id
|
| Do NOT use Student.mentor name matching.
|
*/

const mentorIds = [
  ...new Set(
    visibleStudents
      .map((student) =>
        student.mentorId
          ? String(student.mentorId)
          : null
      )
      .filter(Boolean)
  ),
];

if (mentorIds.length) {
  const mentorProfile =
    await Mentor.findOne({
      _id: mentorIds[0],
    }).lean();

  if (mentorProfile) {
    const mentorUser =
      mentorProfile.user
        ? await User.findById(
            mentorProfile.user
          )
            .select(
              "_id name email phone department designation semester usn"
            )
            .lean()
        : null;

    profiles.mentor = {
      id: mentorProfile._id.toString(),

      user:
        mentorUser?._id?.toString() ||
        mentorProfile.user?.toString() ||
        "",

      name:
        mentorUser?.name ||
        mentorProfile.name ||
        "",

      email:
        mentorUser?.email ||
        mentorProfile.email ||
        "",

      phone:
        mentorUser?.phone ||
        "",

      department:
        mentorUser?.department ||
        "",

      designation:
        mentorUser?.designation ||
        "Mentor",

      semester:
        mentorUser?.semester ||
        "",

      usn:
        mentorUser?.usn ||
        "",
    };
  }
}

  /*
  |--------------------------------------------------------------------------
  | FALLBACK MENTOR
  |--------------------------------------------------------------------------
  */

  if (!profiles.mentor) {
  const mentorUser =
    await User.findOne({
      role: "mentor",
    })
      .select(
        "_id name email phone department designation semester usn"
      )
      .lean();

  if (mentorUser) {
    profiles.mentor = {
      id: mentorUser._id.toString(),
      user: mentorUser._id.toString(),
      name: mentorUser.name,
      email: mentorUser.email,
      phone: mentorUser.phone || "",
      department: mentorUser.department || "",
      designation:
        mentorUser.designation || "Mentor",
      semester: mentorUser.semester || "",
      usn: mentorUser.usn || "",
    };
  }
}

  /*
  |--------------------------------------------------------------------------
  | FIND STUDENT
  |--------------------------------------------------------------------------
  */

  if (
    !profiles.student &&
    user.role !== "student"
  ) {
    const firstStudent =
      visibleStudents[0];

    if (firstStudent) {
      const studentUser =
        firstStudent.user
          ? await User.findById(
              firstStudent.user
            )
              .select(
                "_id name email phone department designation semester usn"
              )
              .lean()
          : null;

      profiles.student =
        studentUser
          ? {
              name:
                studentUser.name,
              usn:
                studentUser.usn ||
                firstStudent.usn ||
                "",
              email:
                studentUser.email,
              phone:
                studentUser.phone ||
                firstStudent.phone ||
                "",
              department:
                studentUser.department ||
                firstStudent.dept ||
                "",
              designation:
                studentUser.designation ||
                "Student",
              semester:
                studentUser.semester ||
                "",
            }
          : {
              name:
                firstStudent.name,
              usn:
                firstStudent.usn ||
                "",
              email: "",
              phone:
                firstStudent.phone ||
                "",
              department:
                firstStudent.dept ||
                "",
              designation:
                "Student",
              semester: "",
            };
    }
  }

  return profiles;
}


/*
|--------------------------------------------------------------------------
| DASHBOARD
|--------------------------------------------------------------------------
*/

router.get(
  "/dashboard",
  getDashboard
);


/*
|--------------------------------------------------------------------------
| PROFILE
|--------------------------------------------------------------------------
*/

router.put(
  "/profiles/:role",
  updateProfile
);


/*
|--------------------------------------------------------------------------
| STUDENTS
|--------------------------------------------------------------------------
*/

router.post(
  "/students",
  roleCanManageAcademic,
  createStudent
);

router.put(
  "/students/:id/performance-report",
  roleCanManageAcademic,
  updatePerformanceReport
);
/*
|--------------------------------------------------------------------------
| DIGITAL PERFORMANCE REPORT
|--------------------------------------------------------------------------
*/



/*
|--------------------------------------------------------------------------
| ACHIEVEMENT DOCUMENT UPLOAD
|--------------------------------------------------------------------------
*/

router.get(
  "/students/:id/achievements",
  getStudentAchievements
);


router.post(
  "/students/:id/achievements",
  addStudentAchievement
);


router.delete(
  "/students/:id/achievements/:achievementId",
  deleteAchievement
);

router.delete(
  "/students/:id",
  allowRoles("hod"),
  deleteStudent
);

/*
|--------------------------------------------------------------------------
| SUBJECTS / MARKS
|--------------------------------------------------------------------------
*/

router.put(
  "/students/:id/subjects",
  editAcademicRecord,
  updateStudentSubjects
);


/*
|--------------------------------------------------------------------------
| MENTORS
|--------------------------------------------------------------------------
*/

router.post(
  "/mentors",
  allowRoles("hod"),
  createMentor
);

router.put(
  "/mentors/:id",
  allowRoles("hod"),
  updateMentor
);


router.delete(
  "/mentors/:id",
  allowRoles("hod"),
  deleteMentor
);

/*
|--------------------------------------------------------------------------
| SESSIONS
|--------------------------------------------------------------------------
*/

router.post(
  "/sessions",
  allowRoles("mentor", "hod"),
  createSession
);

router.put(
  "/sessions/:id",
  allowRoles("mentor", "hod"),
  updateSession
);

router.delete(
  "/sessions/:id",
  allowRoles("mentor", "hod"),
  deleteSession
);

/*
|--------------------------------------------------------------------------
| NOTIFICATIONS
|--------------------------------------------------------------------------
*/

router.put(
  "/notifications/:id/read",
  markNotificationAsRead
);

/*
|--------------------------------------------------------------------------
| TASKS
|--------------------------------------------------------------------------
*/

router.post(
  "/tasks",
  createTask
);

router.put(
  "/tasks/:id",
  updateTask
);

router.delete(
  "/tasks/:id",
  deleteTask
);

/*
|--------------------------------------------------------------------------
| ANALYTICS
|--------------------------------------------------------------------------
|
| Attendance has been removed.
| Analytics now focuses on:
| - Students
| - Mentors
| - Performance
| - Departments
|--------------------------------------------------------------------------
*/

router.get(
  "/analytics",
  allowRoles("hod"),
  getAnalytics
);

/*
=========================================================
 MENTOR AVAILABILITY
=========================================================
*/

router.get(
  "/mentors/:mentorId/availability",
  async (req, res) => {
    try {
      const mentor = await Mentor.findById(req.params.mentorId).lean();

      if (!mentor) {
        return res.status(404).json({
          message: "Mentor not found",
        });
      }

      return res.json({
        availability: mentor.availability || [],
      });
    } catch (error) {
      console.error(
        "Get mentor availability error:",
        error
      );

      return res.status(500).json({
        message: "Failed to load mentor availability",
      });
    }
  }
);


router.put(
  "/mentors/:mentorId/availability",
  allowRoles("mentor", "hod"),
  async (req, res) => {
    try {
      const { availability } = req.body;

      if (!Array.isArray(availability)) {
        return res.status(400).json({
          message: "Availability must be an array",
        });
      }

      const cleanedAvailability = availability
        .map((item) => ({
          day: item.day,
          startTime: item.startTime || "",
          endTime: item.endTime || "",
          active: item.active !== false,
        }))
        .filter(
          (item) =>
            item.day &&
            item.startTime &&
            item.endTime
        );

      const mentor = await Mentor.findByIdAndUpdate(
        req.params.mentorId,
        {
          $set: {
            availability: cleanedAvailability,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!mentor) {
        return res.status(404).json({
          message: "Mentor not found",
        });
      }

      return res.json({
        message: "Availability saved successfully",
        availability: mentor.availability || [],
      });
    } catch (error) {
      console.error(
        "Save mentor availability error:",
        error
      );

      return res.status(500).json({
        message: "Failed to save availability",
      });
    }
  }
);
/*
=========================================================
 MENTORING SESSION BOOKING
=========================================================
*/

router.post(
  "/mentoring-bookings",
  allowRoles("student"),
  async (req, res) => {
    try {
      const {
        mentorId,
        date,
        time,
        title,
      } = req.body;

      if (!mentorId || !date || !time) {
        return res.status(400).json({
          message: "Mentor, date and time are required",
        });
      }

      const mentor = await Mentor.findById(mentorId);

      if (!mentor) {
        return res.status(404).json({
          message: "Mentor not found",
        });
      }

      const student = await Student.findOne({
        $or: [
          { user: req.user._id },
          { email: req.user.email },
        ],
      });

      if (!student) {
        return res.status(404).json({
          message: "Student profile not found",
        });
      }

      const existingBooking =
        await MentoringBooking.findOne({
          mentor: mentor._id,
          date,
          time,
          status: "Booked",
        });

      if (existingBooking) {
        return res.status(409).json({
          message:
            "This mentoring slot is already booked",
        });
      }

      const booking =
        await MentoringBooking.create({
          mentor: mentor._id,
          student: student._id,
          date,
          time,
          title:
            title?.trim() ||
            "Mentoring Session",
        });

      const populatedBooking =
        await MentoringBooking.findById(
          booking._id
        )
          .populate("mentor", "name mentorId")
          .populate("student", "name usn");

      return res.status(201).json({
        message: "Mentoring session booked successfully",
        booking: populatedBooking,
      });
    } catch (error) {
      console.error(
        "Create mentoring booking error:",
        error
      );

      return res.status(500).json({
        message: "Failed to book mentoring session",
      });
    }
  }
);

router.get(
  "/mentoring-bookings",
  async (req, res) => {
    try {
      let query = {};

      if (req.user.role === "student") {
        const student = await Student.findOne({
          $or: [
            { user: req.user._id },
            { email: req.user.email },
          ],
        });

        if (!student) {
          return res.json([]);
        }

        query.student = student._id;
      }

      if (req.user.role === "mentor") {
        const mentor = await Mentor.findOne({
          user: req.user._id,
        });

        if (!mentor) {
          return res.json([]);
        }

        query.mentor = mentor._id;
      }

      const bookings =
        await MentoringBooking.find(query)
          .populate("mentor", "name mentorId")
          .populate("student", "name usn")
          .sort({
            date: 1,
            time: 1,
          });

      return res.json(bookings);
    } catch (error) {
      console.error(
        "Get mentoring bookings error:",
        error
      );

      return res.status(500).json({
        message: "Failed to load mentoring bookings",
      });
    }
  }
);
export default router;