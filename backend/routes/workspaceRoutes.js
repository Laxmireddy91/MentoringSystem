import express from "express";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import Student from "../models/Student.js";
import Mentor from "../models/Mentor.js";
import Session from "../models/Session.js";
import Notification from "../models/Notification.js";
import Task from "../models/Task.js";
import Report from "../models/Report.js";
import User from "../models/User.js";
import { protect, allowRoles } from "../middleware/auth.js";

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

function gradeFromTotal(total) {
  if (total <= 0) return "";
  return total >= 40 ? "Pass" : "Fail";
}

function normalizeSubjects(subjects = []) {
  return subjects.map((subject) => {
    const cie1 = Number(subject?.cie1 || 0);
    const cie2 = Number(subject?.cie2 || 0);
    const cie3 = Number(subject?.cie3 || 0);
    const beforeRvSee = Number(subject?.beforeRvSee || 0);
    const afterRvSee = Number(subject?.afterRvSee || 0);
    const finalMark = Number(subject?.final || 0);
    const set = Number(subject?.set || 0);

    const calculatedTotal = Math.round(
      (cie1 + cie2 + cie3 + finalMark + set) / 5
    );

    const enteredTotal = Number(subject?.total);
    const total = Number.isFinite(enteredTotal)
      ? enteredTotal
      : calculatedTotal;

    const enteredGrade = String(subject?.grade || "").trim();
    const normalizedGrade = ["Pass", "Fail"].includes(enteredGrade)
      ? enteredGrade
      : gradeFromTotal(total);

    return {
      _id: subject?._id,
      code: String(subject?.code || "").trim(),
      subject: String(subject?.subject || "Subject").trim(),
      cie1,
      cie2,
      cie3,
      beforeRvSee,
      afterRvSee,
      final: finalMark,
      set,
      total,
      grade: normalizedGrade,
    };
  });
}

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
    "mentor",
    "cie1",
    "cie2",
    "cie3",
    "final",
    "set",
    "total",
    "grade",
    "backlog",
    "phone",
    "subjects",
    "marksUpdatedBy",
    "marksUpdatedAt",
    "sgpa",
    "cgpa",
    "onlineCoursesAttended",
    "totalMarks",
    "percentage",
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
    payload.usn = String(
      payload.usn
    )
      .trim()
      .toUpperCase();
  }

  if (payload.name) {
    payload.name = String(
      payload.name
    ).trim();
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

  const mentorNames = [
    ...new Set(
      visibleStudents
        .map(
          (student) =>
            student.mentor
        )
        .filter(Boolean)
    ),
  ];

  if (mentorNames.length) {
    const mentorUsers =
      await User.find({
        role: "mentor",
        name: {
          $in: mentorNames,
        },
      })
        .select(
  "_id name email phone department designation semester usn"
)
        .lean();

    if (mentorUsers.length) {
      const mentor =
        mentorUsers[0];

   profiles.mentor = {
  id: mentor._id.toString(),
  user: mentor._id.toString(),

  name: mentor.name,
  email: mentor.email,
  phone: mentor.phone || "",
  department: mentor.department || "",
  designation:
    mentor.designation ||
    "Mentor",
  semester:
    mentor.semester || "",
  usn: mentor.usn || "",
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
    mentorUser.designation ||
    "Mentor",
  semester:
    mentorUser.semester || "",
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
  async (req, res, next) => {
    try {
      const user = req.user;

      let students;


      /*
      |--------------------------------------------------------------------------
      | STUDENTS
      |--------------------------------------------------------------------------
      */

      if (user.role === "student") {
        students =
          await Student.find({
            user: user._id,
          }).lean();

        /*
         * Support older records where
         * User reference was not set.
         */
        if (
          !students.length &&
          user.usn
        ) {
          students =
            await Student.find({
              usn: user.usn,
            }).lean();
        }
      } else if (
        user.role === "mentor"
      ) {
        // Match students to the signed-in mentor using the mentor name
        // as well as the linked Mentor profile. This keeps document access
        // working even when older student records stored a slightly
        // different mentor label.
        const mentorProfile =
          await Mentor.findOne({
            $or: [
              { user: user._id },
              { email: user.email },
              { name: user.name },
            ],
          })
            .select("_id name email")
            .lean();

        const mentorNames = [
          user.name,
          mentorProfile?.name,
        ].filter(Boolean);

        const mentorQuery = [
          { mentor: { $in: mentorNames } },
        ];

        if (mentorProfile?._id) {
          mentorQuery.push({ mentorId: mentorProfile._id });
        }

        // Some existing records use mentorId while newer records use the
        // mentor name, so support both forms.
        students =
          await Student.find({
            $or: mentorQuery,
          }).lean();
      } else if (
        user.role === "hod"
      ) {
        students =
          await Student.find({
            dept: user.department,
          }).lean();
      } else {
        students =
          await Student.find().lean();
      }


      /*
      |--------------------------------------------------------------------------
      | MENTORS
      |--------------------------------------------------------------------------
      */

      let mentors;

      if (user.role === "student") {
        const mentorNames =
          students
            .map(
              (student) =>
                student.mentor
            )
            .filter(Boolean);

        mentors =
          mentorNames.length
            ? await Mentor.find({
                name: {
                  $in: mentorNames,
                },
              }).lean()
            : [];
      } else if (
        user.role === "mentor"
      ) {
        mentors =
          await Mentor.find({
            $or: [
              {
                user: user._id,
              },
              {
                name: user.name,
              },
            ],
          }).lean();
      } else if (
        user.role === "hod"
      ) {
        const departmentMentors =
          await User.find({
            role: "mentor",
            department:
              user.department,
          }).select("_id");

        mentors =
          await Mentor.find({
            $or: [
              {
                user: {
                  $in:
                    departmentMentors.map(
                      (x) => x._id
                    ),
                },
              },
              {
                name: {
                  $in:
                    students
                      .map(
                        (x) =>
                          x.mentor
                      )
                      .filter(Boolean),
                },
              },
            ],
          }).lean();
      } else {
        mentors =
          await Mentor.find().lean();
      }


      /*
      |--------------------------------------------------------------------------
      | SESSIONS
      |--------------------------------------------------------------------------
      */

      const sessions =
        await Session.find({
          $or: [
            {
              createdBy:
                user._id,
            },
            {
              createdBy: null,
            },
          ],
        })
          .sort({
            date: 1,
            time: 1,
          })
          .lean();


      /*
      |--------------------------------------------------------------------------
      | NOTIFICATIONS
      |--------------------------------------------------------------------------
      */

      const notifications =
        await Notification.find({
          $or: [
            {
              user: user._id,
            },
            {
              user: null,
            },
          ],
        })
          .sort({
            createdAt: -1,
          })
          .lean();


      /*
      |--------------------------------------------------------------------------
      | TASKS
      |--------------------------------------------------------------------------
      */

      const tasks =
        await Task.find({
          $or: [
            {
              user: user._id,
            },
            {
              user: null,
            },
          ],
        })
          .sort({
            due: 1,
          })
          .lean();


      /*
      |--------------------------------------------------------------------------
      | REPORTS
      |--------------------------------------------------------------------------
      */

      const reports =
        await Report.find()
          .sort({
            date: -1,
            createdAt: -1,
          })
          .lean();


      /*
      |--------------------------------------------------------------------------
      | PROFILES
      |--------------------------------------------------------------------------
      */

      const profiles =
        await buildProfiles(
          user,
          students
        );


      /*
      |--------------------------------------------------------------------------
      | MAP STUDENTS
      |--------------------------------------------------------------------------
      */

      const mappedStudents =
        students.map(
          (student) => ({
            ...student,
            id: student._id.toString(),
          })
        );


      /*
      |--------------------------------------------------------------------------
      | MAP MENTORS
      |--------------------------------------------------------------------------
      */

      const mappedMentors =
        mentors.map(
          (mentor) => ({
            ...mentor,
            id: mentor._id.toString(),
            mentorId:
              mentor.mentorId,
          })
        );


      /*
      |--------------------------------------------------------------------------
      | STATISTICS
      |--------------------------------------------------------------------------
      |
      | Attendance has been completely removed.
      |
      */

      const stats = {
        students:
          students.length,

        mentors:
          mentors.filter(
            (mentor) =>
              mentor.status ===
              "Active"
          ).length,

        performance:
          students.length
            ? Math.round(
                students.reduce(
                  (
                    sum,
                    student
                  ) =>
                    sum +
                    Number(
                      student.total ||
                        0
                    ),
                  0
                ) /
                  students.length
              )
            : 0,

        backlog:
          students.reduce(
            (
              sum,
              student
            ) =>
              sum +
              Number(
                student.backlog ||
                  0
              ),
            0
          ),

        sessions:
          sessions.length,

        tasks:
          tasks.length,

        notifications:
          notifications.length,
      };


      /*
      |--------------------------------------------------------------------------
      | RESPONSE
      |--------------------------------------------------------------------------
      */

      return res.json({
        students:
          mappedStudents,

        mentors:
          mappedMentors,

        sessions:
          sessions.map(
            (session) => ({
              ...session,
              id: session._id.toString(),
            })
          ),

        notifications:
          notifications.map(
            (notification) => ({
              ...notification,
              id:
                notification._id.toString(),
            })
          ),

        reports:
          reports.map(
            (report) => ({
              ...report,
              id:
                report._id.toString(),
            })
          ),

        tasks:
          tasks.map(
            (task) => ({
              ...task,
              id:
                task._id.toString(),
            })
          ),

        profiles,

        stats,
      });
    } catch (error) {
      next(error);
    }
  }
);


/*
|--------------------------------------------------------------------------
| PROFILE
|--------------------------------------------------------------------------
*/

router.put(
  "/profiles/:role",
  async (
    req,
    res,
    next
  ) => {
    try {
      if (
        req.params.role !==
        req.user.role
      ) {
        return res
          .status(403)
          .json({
            message:
              "You can only update your own profile",
          });
      }

      const allowed = [
        "name",
        "email",
        "phone",
        "department",
        "designation",
        "semester",
        "usn",
      ];

      const patch = {};

      for (
        const key of allowed
      ) {
        if (
          req.body[key] !==
          undefined
        ) {
          patch[key] =
            req.body[key];
        }
      }

      if (patch.email) {
        patch.email =
          patch.email
            .trim()
            .toLowerCase();

        const duplicate =
          await User.findOne({
            email: patch.email,
            _id: {
              $ne:
                req.user._id,
            },
          });

        if (duplicate) {
          return res
            .status(409)
            .json({
              message:
                "Email is already in use",
            });
        }
      }

      if (patch.usn) {
        patch.usn =
          patch.usn
            .trim()
            .toUpperCase();
      }

      const updatedUser =
        await User.findByIdAndUpdate(
          req.user._id,
          patch,
          {
            new: true,
            runValidators: true,
          }
        ).select("-password");

      if (!updatedUser) {
        return res
          .status(404)
          .json({
            message:
              "User not found",
          });
      }


      /*
      |--------------------------------------------------------------------------
      | UPDATE STUDENT PROFILE
      |--------------------------------------------------------------------------
      */

      if (
        req.user.role ===
        "student"
      ) {
        await Student.findOneAndUpdate(
          {
            user:
              req.user._id,
          },
          {
            $set: {
              name:
                updatedUser.name,
              usn:
                updatedUser.usn,
              phone:
                updatedUser.phone,
              dept:
                updatedUser.department,
            },
          }
        );
      }


      /*
      |--------------------------------------------------------------------------
      | UPDATE MENTOR PROFILE
      |--------------------------------------------------------------------------
      */

      if (
        req.user.role ===
        "mentor"
      ) {
        await Mentor.findOneAndUpdate(
          {
            user:
              req.user._id,
          },
          {
            $set: {
              name:
                updatedUser.name,
              email:
                updatedUser.email,
            },
          }
        );
      }

      return res.json({
        success: true,
        user:
          updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }
);


/*
|--------------------------------------------------------------------------
| STUDENTS
|--------------------------------------------------------------------------
*/

router.post(
  "/students",
  roleCanManageAcademic,
  async (
    req,
    res,
    next
  ) => {
    try {
      const payload =
        cleanStudentPayload(
          req.body
        );

      if (
        !payload.name ||
        !payload.usn
      ) {
        return res
          .status(400)
          .json({
            message:
              "Student name and USN are required",
          });
      }

      const existing =
        await Student.findOne({
          usn: payload.usn,
        });

      if (existing) {
        return res
          .status(409)
          .json({
            message:
              "USN already exists",
          });
      }

      if (
        req.user.role ===
        "mentor"
      ) {
        payload.mentor =
          req.user.name;
      }

      const student =
        await Student.create(
          payload
        );

      return res
        .status(201)
        .json({
          ...student.toObject(),
          id:
            student._id.toString(),
        });
    } catch (error) {
      next(error);
    }
  }
);


router.put(
  "/students/:id",
  roleCanManageAcademic,
  async (
    req,
    res,
    next
  ) => {
    try {
      const payload =
        cleanStudentPayload(
          req.body
        );

      if (
        req.user.role ===
        "mentor"
      ) {
        payload.mentor =
          req.user.name;
      }

      const student =
        await Student.findByIdAndUpdate(
          getId(req),
          payload,
          {
            new: true,
            runValidators: true,
          }
        );

        if (saved?.user) {
  await Notification.create({
    title: "Academic Marks Updated",
    text: `Your academic marks have been updated by ${req.user.name}.`,
    type: "academic",
    user: saved.user,
  });
}

      if (!student) {
        return res
          .status(404)
          .json({
            message:
              "Student not found",
          });
      }

      return res.json({
        ...student.toObject(),
        id:
          student._id.toString(),
      });
    } catch (error) {
      next(error);
    }
  }
);


/*
|--------------------------------------------------------------------------
| DIGITAL PERFORMANCE REPORT
|--------------------------------------------------------------------------
*/

router.put(
  "/students/:id/performance-report",
  editAcademicRecord,
  async (req, res, next) => {
    try {
      const student = await Student.findById(getId(req));

      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      const requestedUsn = String(req.body.usn ?? student.usn ?? "").trim().toUpperCase();
      if (requestedUsn && requestedUsn !== String(student.usn || "").toUpperCase()) {
        const duplicateUsn = await Student.findOne({
          usn: requestedUsn,
          _id: { $ne: student._id },
        }).lean();
        if (duplicateUsn) {
          return res.status(409).json({ message: "USN already belongs to another student" });
        }
      }

      const normalizedSubjects = normalizeSubjects(
        Array.isArray(req.body.subjects) ? req.body.subjects : []
      );

      const average = normalizedSubjects.length
        ? Math.round(
            normalizedSubjects.reduce((sum, item) => sum + item.total, 0) /
              normalizedSubjects.length
          )
        : 0;

      const normalizedBacklogs = normalizeBacklogs(
        Array.isArray(req.body.backlogRecords)
          ? req.body.backlogRecords
          : []
      );

      const rawTotalMarks = req.body.totalMarks;
      const enteredTotalMarks =
        rawTotalMarks === "" || rawTotalMarks === null || rawTotalMarks === undefined
          ? NaN
          : Number(rawTotalMarks);
      const totalMarks = Number.isFinite(enteredTotalMarks)
        ? enteredTotalMarks
        : normalizedSubjects.reduce((sum, item) => sum + Number(item.total || 0), 0);

      const rawPercentage = req.body.percentage;
      const enteredPercentage =
        rawPercentage === "" || rawPercentage === null || rawPercentage === undefined
          ? NaN
          : Number(rawPercentage);
      const percentage = Number.isFinite(enteredPercentage)
        ? enteredPercentage
        : normalizedSubjects.length
          ? Number(((totalMarks / (normalizedSubjects.length * 100)) * 100).toFixed(2))
          : 0;

      const updates = {
        name: String(req.body.name ?? student.name).trim(),
        usn: requestedUsn,
        dept: String(req.body.dept ?? student.dept ?? "").trim(),
        year: String(req.body.year ?? student.year ?? "").trim(),
        mentor: String(req.body.mentor ?? student.mentor ?? "").trim(),
        subjects: normalizedSubjects,
        total: average,
        totalMarks,
        percentage,
        grade: gradeFromTotal(average),
        backlog: normalizedBacklogs.filter(
          (record) => record.courseName.trim()
        ).length,
        mentorshipRecords: normalizeMentorship(
          Array.isArray(req.body.mentorshipRecords)
            ? req.body.mentorshipRecords
            : []
        ),
        backlogRecords: normalizedBacklogs,
        sgpa: Number(req.body.sgpa || 0),
        cgpa: Number(req.body.cgpa || 0),
        onlineCoursesAttended: req.body.onlineCoursesAttended === true || req.body.onlineCoursesAttended === "yes" ? 1 : 0,
        marksUpdatedBy: req.user.name,
        marksUpdatedAt: new Date(),
      };

      const saved = await Student.findByIdAndUpdate(
        getId(req),
        { $set: updates },
        { new: true, runValidators: true }
      );

      // Create notification for the student
if (saved?.user) {
  await Notification.create({
    title: "Academic Marks Updated",
    text: `Your academic marks have been updated by ${req.user.name}.`,
    type: "academic",
    user: saved.user,
  });
}

      return res.json({
        ...saved.toObject(),
        id: saved._id.toString(),
      });
    } catch (error) {
      next(error);
    }
  }
);


/*
|--------------------------------------------------------------------------
| ACHIEVEMENT DOCUMENT UPLOAD
|--------------------------------------------------------------------------
*/

router.get(
  "/students/:id/achievements",
  async (req, res, next) => {
    try {
      const student = await Student.findById(getId(req)).lean();

      if (!(await canAccessStudent(req, student))) {
        return res.status(403).json({
          message: "You cannot view this student's documents",
        });
      }

      if (!student) {
        return res.status(404).json({
          message: "Student not found",
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
);


router.post(
  "/students/:id/achievements",
  async (req, res, next) => {
    try {
      const student = await Student.findById(getId(req));

      if (!(await canAccessStudent(req, student))) {
        return res.status(403).json({ message: "You cannot update this student's achievements" });
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
        return res.status(400).json({ message: "Achievement title is required" });
      }

      if (!fileData || !String(fileData).includes(",")) {
        return res.status(400).json({ message: "Certificate or document is required" });
      }

      if (!achievementMimeTypes.has(String(mimeType))) {
        return res.status(400).json({ message: "Unsupported document type" });
      }

      const base64 = String(fileData).split(",", 2)[1];
      const buffer = Buffer.from(base64, "base64");

      if (!buffer.length) {
        return res.status(400).json({ message: "Uploaded document is empty" });
      }

      if (buffer.length > MAX_ACHIEVEMENT_FILE_BYTES) {
        return res.status(400).json({ message: "Document must be 3 MB or smaller" });
      }

      const uploadDir = path.join(process.cwd(), "uploads", "achievements");
      await fs.mkdir(uploadDir, { recursive: true });

      const safeName = safeAchievementFileName(fileName || "document");
      const storedName = `${Date.now()}-${randomUUID()}-${safeName}`;
      const destination = path.join(uploadDir, storedName);

      await fs.writeFile(destination, buffer);

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

      const achievement = student.achievements[student.achievements.length - 1];

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
);


router.delete(
  "/students/:id/achievements/:achievementId",
  async (req, res, next) => {
    try {
      const student = await Student.findById(getId(req));

      if (!(await canAccessStudent(req, student))) {
        return res.status(403).json({ message: "You cannot modify this student's achievements" });
      }

      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      const achievement = student.achievements.id(req.params.achievementId);

      if (!achievement) {
        return res.status(404).json({ message: "Achievement not found" });
      }

      if (achievement.filePath) {
        const relative = String(achievement.filePath).replace(/^\/+/, "");
        const diskPath = path.join(process.cwd(), relative);
        try {
          await fs.unlink(diskPath);
        } catch {
          // File may already be missing; remove the metadata anyway.
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
);


router.delete(
  "/students/:id",
  allowRoles(
    "hod",
   
  ),
  async (
    req,
    res,
    next
  ) => {
    try {
      const student =
        await Student.findByIdAndDelete(
          getId(req)
        );

      if (!student) {
        return res
          .status(404)
          .json({
            message:
              "Student not found",
          });
      }

      return res.json({
        success: true,
        message:
          "Student deleted",
      });
    } catch (error) {
      next(error);
    }
  }
);


/*
|--------------------------------------------------------------------------
| SUBJECTS / MARKS
|--------------------------------------------------------------------------
*/

router.put(
  "/students/:id/subjects",
  editAcademicRecord,
  async (
    req,
    res,
    next
  ) => {
    try {
      const subjects =
        Array.isArray(
          req.body.subjects
        )
          ? req.body.subjects
          : [];

      const normalizedSubjects =
        subjects.map(
          (subject) => {
            const cie1 =
              Number(
                subject.cie1 ||
                  0
              );

            const cie2 =
              Number(
                subject.cie2 ||
                  0
              );

            const cie3 =
              Number(
                subject.cie3 ||
                  0
              );

            const final =
              Number(
                subject.final ||
                  0
              );

            const set =
              Number(
                subject.set ||
                  0
              );

            const total =
              Math.round(
                (cie1 +
                  cie2 +
                  cie3 +
                  final +
                  set) /
                  5
              );

            return {
              _id:
                subject._id,

              subject:
                subject.subject ||
                "Subject",

              cie1,
              cie2,
              cie3,
              final,
              set,
              total,

              grade:
                gradeFromTotal(
                  total
                ),
            };
          }
        );

      const average =
        normalizedSubjects.length
          ? Math.round(
              normalizedSubjects.reduce(
                (
                  sum,
                  subject
                ) =>
                  sum +
                  subject.total,
                0
              ) /
                normalizedSubjects.length
            )
          : 0;

      const student =
        await Student.findByIdAndUpdate(
          getId(req),
          {
            $set: {
              subjects:
                normalizedSubjects,

              total:
                average,

              grade:
                gradeFromTotal(
                  average
                ),

              marksUpdatedBy:
                req.user.name,

              marksUpdatedAt:
                new Date(),
            },
          },
          {
            new: true,
            runValidators: true,
          }
        );

      if (!student) {
        return res
          .status(404)
          .json({
            message:
              "Student not found",
          });
      }

      return res.json({
        ...student.toObject(),
        id:
          student._id.toString(),
      });
    } catch (error) {
      next(error);
    }
  }
);


/*
|--------------------------------------------------------------------------
| MENTORS
|--------------------------------------------------------------------------
*/

router.post(
  "/mentors",
  allowRoles(
    "hod",
   
  ),
  async (
    req,
    res,
    next
  ) => {
    try {
      const payload =
        cleanMentorPayload(
          req.body
        );

      const mentor =
        await Mentor.create({
          ...payload,

          mentorId:
            payload.mentorId ||
            `M${Date.now()
              .toString()
              .slice(-6)}`,
        });

      return res
        .status(201)
        .json({
          ...mentor.toObject(),
          id:
            mentor._id.toString(),
        });
    } catch (error) {
      next(error);
    }
  }
);


router.put(
  "/mentors/:id",
  allowRoles(
    "hod",
  
  ),
  async (
    req,
    res,
    next
  ) => {
    try {
      const payload =
        cleanMentorPayload(
          req.body
        );

      const mentor =
        await Mentor.findByIdAndUpdate(
          getId(req),
          payload,
          {
            new: true,
            runValidators: true,
          }
        );

      if (!mentor) {
        return res
          .status(404)
          .json({
            message:
              "Mentor not found",
          });
      }

      return res.json({
        ...mentor.toObject(),
        id:
          mentor._id.toString(),
      });
    } catch (error) {
      next(error);
    }
  }
);


router.delete(
  "/mentors/:id",
  allowRoles(
    "hod",
  
  ),
  async (
    req,
    res,
    next
  ) => {
    try {
      const mentor =
        await Mentor.findByIdAndDelete(
          getId(req)
        );

      if (!mentor) {
        return res
          .status(404)
          .json({
            message:
              "Mentor not found",
          });
      }

      return res.json({
        success: true,
        message:
          "Mentor deleted",
      });
    } catch (error) {
      next(error);
    }
  }
);


/*
|--------------------------------------------------------------------------
| SESSIONS
|--------------------------------------------------------------------------
*/

router.post(
  "/sessions",
  allowRoles(
    "mentor",
    "hod",
    
  ),
  async (
    req,
    res,
    next
  ) => {
    try {
      const {
        title,
        date,
        time,
        owner,
        status,
      } = req.body;

      if (!title || !date) {
        return res
          .status(400)
          .json({
            message:
              "Session title and date are required",
          });
      }

      const session =
        await Session.create({
          title,
          date,
          time: time || "",
          owner:
            owner ||
            req.user.name,
          status:
            status ||
            "Scheduled",
          createdBy:
            req.user._id,
        });


       // Create notification for a newly scheduled session
await Notification.create({
  title: "New Mentoring Session",
  text: `A mentoring session "${session.title}" has been scheduled for ${session.date}.`,
  type: "session",
  user: null,
}); 

      return res
        .status(201)
        .json({
          ...session.toObject(),
          id:
            session._id.toString(),
        });
    } catch (error) {
      next(error);
    }
  }
);


router.put(
  "/sessions/:id",
  allowRoles(
    "mentor",
    "hod",
   
  ),
  async (
    req,
    res,
    next
  ) => {
    try {
      const session =
        await Session.findByIdAndUpdate(
          getId(req),
          {
            title:
              req.body.title,

            date:
              req.body.date,

            time:
              req.body.time,

            owner:
              req.body.owner,

            status:
              req.body.status,
          },
          {
            new: true,
            runValidators: true,
          }
        );

      if (!session) {
        return res
          .status(404)
          .json({
            message:
              "Session not found",
          });
      }

      return res.json({
        ...session.toObject(),
        id:
          session._id.toString(),
      });
    } catch (error) {
      next(error);
    }
  }
);


router.delete(
  "/sessions/:id",
  allowRoles(
    "mentor",
    "hod",
    
  ),
  async (
    req,
    res,
    next
  ) => {
    try {
      const session =
        await Session.findByIdAndDelete(
          getId(req)
        );

      if (!session) {
        return res
          .status(404)
          .json({
            message:
              "Session not found",
          });
      }

      return res.json({
        success: true,
        message:
          "Session cancelled",
      });
    } catch (error) {
      next(error);
    }
  }
);


/*
|--------------------------------------------------------------------------
| NOTIFICATIONS
|--------------------------------------------------------------------------
*/

router.put(
  "/notifications/:id/read",
  async (
    req,
    res,
    next
  ) => {
    try {
      const notification =
        await Notification.findOneAndUpdate(
          {
            _id: getId(req),

            $or: [
              {
                user:
                  req.user._id,
              },
              {
                user: null,
              },
            ],
          },
          {
            read: true,
          },
          {
            new: true,
          }
        );

      if (!notification) {
        return res
          .status(404)
          .json({
            message:
              "Notification not found",
          });
      }

      return res.json(
        notification
      );
    } catch (error) {
      next(error);
    }
  }
);


/*
|--------------------------------------------------------------------------
| TASKS
|--------------------------------------------------------------------------
*/

router.post(
  "/tasks",
  async (
    req,
    res,
    next
  ) => {
    try {
      const {
        title,
        due,
        owner,
        priority,
        done,
      } = req.body;

      if (!title) {
        return res
          .status(400)
          .json({
            message:
              "Task title is required",
          });
      }

      const task =
        await Task.create({
          title,

          due:
            due || "",

          owner:
            owner ||
            req.user.name,

          priority:
            priority ||
            "Medium",

          done:
            Boolean(done),

          user:
            req.user._id,
        });

      return res
        .status(201)
        .json({
          ...task.toObject(),
          id:
            task._id.toString(),
        });
    } catch (error) {
      next(error);
    }
  }
);


router.put(
  "/tasks/:id",
  async (
    req,
    res,
    next
  ) => {
    try {
      const task =
        await Task.findOneAndUpdate(
          {
            _id: getId(req),
            user:
              req.user._id,
          },
          {
            title:
              req.body.title,

            due:
              req.body.due,

            owner:
              req.body.owner,

            priority:
              req.body.priority,

            done:
              req.body.done,
          },
          {
            new: true,
            runValidators: true,
          }
        );

      if (!task) {
        return res
          .status(404)
          .json({
            message:
              "Task not found",
          });
      }

      return res.json({
        ...task.toObject(),
        id:
          task._id.toString(),
      });
    } catch (error) {
      next(error);
    }
  }
);


router.delete(
  "/tasks/:id",
  async (
    req,
    res,
    next
  ) => {
    try {
      const task =
        await Task.findOneAndDelete({
          _id: getId(req),
          user:
            req.user._id,
        });

      if (!task) {
        return res
          .status(404)
          .json({
            message:
              "Task not found",
          });
      }

      return res.json({
        success: true,
        message:
          "Task deleted",
      });
    } catch (error) {
      next(error);
    }
  }
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
  allowRoles(
    "hod",
    
  ),
  async (
    req,
    res,
    next
  ) => {
    try {
      const studentQuery =
        req.user.role === "hod"
          ? {
              dept:
                req.user.department,
            }
          : {};

      const mentorQuery =
        req.user.role === "hod"
          ? {
              department:
                req.user.department,
            }
          : {};


      /*
      |--------------------------------------------------------------------------
      | STUDENTS
      |--------------------------------------------------------------------------
      */

      const students =
        await Student.find(
          studentQuery
        ).lean();


      /*
      |--------------------------------------------------------------------------
      | FACULTY
      |--------------------------------------------------------------------------
      */

      const users =
        req.user.role === "hod"
          ? await User.find({
              role: "mentor",
              department:
                req.user.department,
            }).lean()
          : await User.find({
              role: "mentor",
            }).lean();


      /*
      |--------------------------------------------------------------------------
      | GROUP BY DEPARTMENT
      |--------------------------------------------------------------------------
      */

      const byDept = {};

      for (
        const student of students
      ) {
        byDept[
          student.dept
        ] ??= [];

        byDept[
          student.dept
        ].push(student);
      }


      /*
      |--------------------------------------------------------------------------
      | DEPARTMENT ANALYTICS
      |--------------------------------------------------------------------------
      */

      const departments =
        Object.entries(
          byDept
        ).map(
          ([name, rows]) => ({
            name,

            students:
              rows.length,

            performance:
              rows.length
                ? Math.round(
                    rows.reduce(
                      (
                        sum,
                        row
                      ) =>
                        sum +
                        Number(
                          row.total ||
                            0
                        ),
                      0
                    ) /
                      rows.length
                  )
                : 0,
          })
        );


      /*
      |--------------------------------------------------------------------------
      | SUMMARY
      |--------------------------------------------------------------------------
      */

      const averagePerformance =
        students.length
          ? Math.round(
              students.reduce(
                (
                  sum,
                  student
                ) =>
                  sum +
                  Number(
                    student.total ||
                      0
                  ),
                0
              ) /
                students.length
            )
          : 0;


      /*
      |--------------------------------------------------------------------------
      | RESPONSE
      |--------------------------------------------------------------------------
      */

      return res.json({
        departments,

        faculty:
          users,

        mentors:
          await Mentor.find(
            mentorQuery
          ).lean(),

        summary: {
          students:
            students.length,

          mentors:
            users.length,

          averagePerformance,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);


export default router;