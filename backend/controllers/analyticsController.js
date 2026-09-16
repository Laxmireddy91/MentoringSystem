import Student from "../models/Student.js";
import Mentor from "../models/Mentor.js";
import User from "../models/User.js";
import { calculateSubjectTotal } from "../utils/academicCalculations.js";

export async function getAnalytics(req, res, next) {
  try {
    const studentQuery =
      req.user.role === "hod"
        ? {
            dept: req.user.department,
          }
        : {};

    const mentorQuery =
      req.user.role === "hod"
        ? {
            department: req.user.department,
          }
        : {};

    /*
    |--------------------------------------------------------------------------
    | STUDENTS
    |--------------------------------------------------------------------------
    */

    const students = await Student.find(
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
            department: req.user.department,
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

    for (const student of students) {
      byDept[student.dept] ??= [];

      byDept[student.dept].push(student);
    }

    /*
    |--------------------------------------------------------------------------
    | DEPARTMENT ANALYTICS
    |--------------------------------------------------------------------------
    */

    const departments =
      Object.entries(byDept).map(
        ([name, rows]) => ({
          name,

          students: rows.length,

          performance:
  rows.length
    ? Math.round(
        rows.reduce(
          (sum, row) => {
            const subjectTotals = (row.subjects || []).map(
              (subject) => calculateSubjectTotal(subject)
            );

            const studentAverage = subjectTotals.length
              ? subjectTotals.reduce((a, b) => a + b, 0) /
                subjectTotals.length
              : 0;

            return sum + studentAverage;
          },
          0
        ) / rows.length
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
        students.reduce((sum, student) => {
          const subjectTotals = (student.subjects || []).map(
            (subject) => calculateSubjectTotal(subject)
          );

          const studentAverage = subjectTotals.length
            ? subjectTotals.reduce((a, b) => a + b, 0) /
              subjectTotals.length
            : 0;

          return sum + studentAverage;
        }, 0) / students.length
      )
    : 0;
    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return res.json({
      departments,

      faculty: users,

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