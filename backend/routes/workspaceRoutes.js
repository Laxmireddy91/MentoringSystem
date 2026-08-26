import express from "express";
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
  allowRoles("mentor", "hod", "principal");


/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function gradeFromTotal(total) {
  if (total >= 90) return "A+";
  if (total >= 80) return "A";
  if (total >= 70) return "B+";
  if (total >= 60) return "B";
  if (total >= 50) return "C";
  return "F";
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
          "name email phone department designation semester usn"
        )
        .lean();

    if (mentorUsers.length) {
      const mentor =
        mentorUsers[0];

      profiles.mentor = {
        name: mentor.name,
        email: mentor.email,
        phone: mentor.phone || "",
        department:
          mentor.department || "",
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
          "name email phone department designation semester usn"
        )
        .lean();

    if (mentorUser) {
      profiles.mentor = {
        name: mentorUser.name,
        email: mentorUser.email,
        phone:
          mentorUser.phone || "",
        department:
          mentorUser.department || "",
        designation:
          mentorUser.designation ||
          "Mentor",
        semester:
          mentorUser.semester || "",
        usn:
          mentorUser.usn || "",
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
                "name email phone department designation semester usn"
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
        students =
          await Student.find({
            mentor: user.name,
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


router.delete(
  "/students/:id",
  allowRoles(
    "hod",
    "principal"
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
  roleCanManageAcademic,
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
    "principal"
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
    "principal"
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
    "principal"
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
    "principal"
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
    "principal"
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
    "principal"
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
    "principal"
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