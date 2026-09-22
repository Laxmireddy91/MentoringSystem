const { Student, Session, Notification } = require('../models');
const AppError = require('../utils/AppError');
const { calculateCumulativeCGPA } = require('../utils/academicCalculations');

class ParentService {
  /**
   * Get linked child profile, academic progression, mentor details, and risk summary
   */
  static async getChildProfile(parentUserId) {
    const student = await Student.findOne({ parentUserId })
      .populate('userId', 'name email phone avatar department')
      .populate({
        path: 'mentorId',
        populate: { path: 'userId', select: 'name email phone avatar designation department' },
      });

    if (!student) {
      throw new AppError('No student is linked to this parent account. Please contact college administration.', 404);
    }

    const { cgpa, totalActiveBacklogs, totalEarnedCredits, semesters } = calculateCumulativeCGPA(student.academics);

    // Fetch mentoring sessions summary
    const sessions = await Session.find({
      studentId: student._id,
      status: 'completed',
    })
      .populate({ path: 'mentorId', populate: { path: 'userId', select: 'name email designation' } })
      .sort({ startTime: -1 })
      .limit(10);

    // Fetch notifications related to ward
    const notifications = await Notification.find({ recipientId: parentUserId })
      .sort({ createdAt: -1 })
      .limit(10);
    // Fetch attendance records for ward
    const Attendance = require('../models/Attendance');
    const attendanceRecords = await Attendance.find({ studentId: student._id }).sort({ semester: -1 });
    let totalClasses = 0;
    let classesAttended = 0;
    attendanceRecords.forEach((a) => {
      totalClasses += a.totalClasses || 0;
      classesAttended += a.classesAttended || 0;
    });
    const overallPercentage = totalClasses > 0 ? Math.round((classesAttended / totalClasses) * 100 * 10) / 10 : 0;

    return {
      student,
      summary: {
        cgpa,
        totalActiveBacklogs,
        totalEarnedCredits,
        riskLevel: student.riskProfile?.riskLevel || 'Low',
        riskScore: student.riskProfile?.riskScore || 0,
        riskReasons: student.riskProfile?.reasons || [],
        riskRecommendations: student.riskProfile?.recommendations || [],
      },
      semesters,
      attendance: {
        totalClasses,
        classesAttended,
        overallPercentage,
        records: attendanceRecords,
        hasRecords: attendanceRecords.length > 0,
      },
      completedSessions: sessions,
      notifications,
    };
  }

  /**
   * Get child's detailed academic progression for a specific semester
   */
  static async getChildSemesterMarks(parentUserId, semesterNumber) {
    const student = await Student.findOne({ parentUserId });
    if (!student) throw new AppError('Linked student not found', 404);

    const semNum = Number(semesterNumber);
    const sem = student.academics.find((s) => s.semesterNumber === semNum);

    if (!sem) {
      throw new AppError(`No records found for Semester ${semNum}`, 404);
    }

    return {
      usn: student.usn,
      semesterNumber: semNum,
      sgpa: sem.sgpa,
      totalCredits: sem.totalCredits,
      backlogsCount: sem.backlogsCount,
      subjects: sem.subjects,
    };
  }
}

module.exports = ParentService;
