import Student from "../models/Student.js";
import Mentor from "../models/Mentor.js";
import Session from "../models/Session.js";
import Notification from "../models/Notification.js";
import Task from "../models/Task.js";
import User from "../models/User.js";

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

async function buildProfiles(user, visibleStudents) {
  const profiles = {};

  const own = {
    name: user.name,
    usn: user.usn || "",
    email: user.email,
    phone: user.phone || "",
    department: user.department || "",
    designation: user.designation || user.role,
    semester: user.semester || "",
  };

  profiles[user.role] = own;

  /*
  |--------------------------------------------------------------------------
  | FIND MENTOR USING mentorId
  |--------------------------------------------------------------------------
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
    const mentorProfile = await Mentor.findOne({
      _id: mentorIds[0],
    }).lean();

    if (mentorProfile) {
      const mentorUser = mentorProfile.user
        ? await User.findById(mentorProfile.user)
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
    const mentorUser = await User.findOne({
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
      const studentUser = firstStudent.user
        ? await User.findById(firstStudent.user)
            .select(
              "_id name email phone department designation semester usn"
            )
            .lean()
        : null;

      profiles.student = studentUser
        ? {
            name: studentUser.name,

            usn:
              studentUser.usn ||
              firstStudent.usn ||
              "",

            email: studentUser.email,

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
            name: firstStudent.name,

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

            designation: "Student",

            semester: "",
          };
    }
  }

  return profiles;
}

export async function getDashboard(
  req,
  res,
  next
) {
  try {
    const user = req.user;

    let students;

    /*
    |--------------------------------------------------------------------------
    | STUDENTS
    |--------------------------------------------------------------------------
    */

    if (user.role === "student") {
      students = await Student.find({
        user: user._id,
      }).lean();

      if (!students.length && user.usn) {
        students = await Student.find({
          usn: user.usn,
        }).lean();
      }
    } else if (user.role === "mentor") {
      const mentorProfile =
        await Mentor.findOne({
          user: user._id,
        })
          .select("_id name email user")
          .lean();

      if (!mentorProfile) {
        return res.status(404).json({
          success: false,
          message: "Mentor profile not found",
        });
      }

      students = await Student.find({
        mentorId: mentorProfile._id,
      }).lean();
    } else if (user.role === "hod") {
      students = await Student.find({
        dept: user.department,
      }).lean();
    } else {
      students = await Student.find().lean();
    }

    /*
    |--------------------------------------------------------------------------
    | MENTORS
    |--------------------------------------------------------------------------
    */

    let mentors;

    if (user.role === "student") {
      const mentorIds = [
        ...new Set(
          students
            .map((student) =>
              student.mentorId
                ? String(student.mentorId)
                : null
            )
            .filter(Boolean)
        ),
      ];

      mentors = mentorIds.length
        ? await Mentor.find({
            _id: {
              $in: mentorIds,
            },
          }).lean()
        : [];
    } else if (user.role === "mentor") {
      mentors = await Mentor.find({
        user: user._id,
      }).lean();
    } else if (user.role === "hod") {
      const departmentMentors =
        await User.find({
          role: "mentor",
          department: user.department,
        }).select("_id");

      mentors = await Mentor.find({
        user: {
          $in: departmentMentors.map(
            (x) => x._id
          ),
        },
      }).lean();
    } else {
      mentors = await Mentor.find().lean();
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
            createdBy: user._id,
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
    */

    const stats = {
      students:
        students.length,

      mentors:
        mentors.filter(
          (mentor) =>
            mentor.status === "Active"
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
                    student.total || 0
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
              student.backlog || 0
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
            id:
              session._id.toString(),
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