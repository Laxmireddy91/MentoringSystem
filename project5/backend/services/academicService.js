const { Student, PerformanceSnapshot, Notification } = require('../models');
const {
  calculateSubjectMarks,
  calculateSemesterSGPA,
  calculateCumulativeCGPA,
  evaluateBadges,
} = require('../utils/academicCalculations');
const AuditService = require('./auditService');
const AppError = require('../utils/AppError');
const { AUDIT_ACTIONS, NOTIFICATION_CATEGORIES } = require('../config/constants');

class AcademicService {
  /**
   * Update or insert marks for a given student's semester
   */
  static async updateStudentMarks({ studentId, semesterNumber, subjects, updatedByUser, reason = 'Academic assessment mark update' }) {
    const student = await Student.findById(studentId).populate('userId', 'name email');
    if (!student) {
      throw new AppError('Student record not found', 404);
    }

    const semNum = Number(semesterNumber);
    let semesterIndex = student.academics.findIndex((s) => s.semesterNumber === semNum);

    // If semester does not exist yet in student academics array, initialize it
    if (semesterIndex === -1) {
      student.academics.push({
        semesterNumber: semNum,
        sgpa: 0,
        cgpa: 0,
        totalCredits: 0,
        backlogsCount: 0,
        subjects: [],
      });
      semesterIndex = student.academics.length - 1;
    }

    const targetSemester = student.academics[semesterIndex];
    const existingSubjectsMap = new Map();
    targetSemester.subjects.forEach((subj) => {
      existingSubjectsMap.set(subj.subjectCode.toUpperCase(), subj);
    });

    const snapshotsToCreate = [];
    const updatedSubjectsList = [];

    // Process each subject with single source of truth calculations
    for (const newSubj of subjects) {
      const code = newSubj.subjectCode.toUpperCase();
      const existing = existingSubjectsMap.get(code);

      const calculated = calculateSubjectMarks(newSubj);

      const subjectData = {
        subjectCode: code,
        subjectName: newSubj.subjectName || (existing ? existing.subjectName : 'Subject'),
        credits: calculated.credits,
        cie1: calculated.cie1,
        cie2: calculated.cie2,
        cie3: calculated.cie3,
        finalMarks: calculated.finalMarks,
        totalMarks: calculated.totalMarks,
        percentage: calculated.percentage,
        grade: calculated.grade,
        gradePoint: calculated.gradePoint,
        result: calculated.result,
        isBacklog: calculated.isBacklog,
      };

      updatedSubjectsList.push(subjectData);

      // Snapshot audit creation
      snapshotsToCreate.push({
        studentId: student._id,
        semesterNumber: semNum,
        subjectCode: code,
        subjectName: subjectData.subjectName,
        previousMarks: existing
          ? {
              cie1: existing.cie1,
              cie2: existing.cie2,
              cie3: existing.cie3,
              finalMarks: existing.finalMarks,
              totalMarks: existing.totalMarks,
              grade: existing.grade,
            }
          : { cie1: 0, cie2: 0, cie3: 0, finalMarks: 0, totalMarks: 0, grade: 'F' },
        newMarks: {
          cie1: calculated.cie1,
          cie2: calculated.cie2,
          cie3: calculated.cie3,
          finalMarks: calculated.finalMarks,
          totalMarks: calculated.totalMarks,
          grade: calculated.grade,
        },
        updatedBy: updatedByUser._id,
        reason,
        timestamp: new Date(),
      });
    }

    // Merge or overwrite subjects in target semester (non-destructive upsert)
    const updatedCodes = new Set(updatedSubjectsList.map((s) => s.subjectCode.toUpperCase()));
    const preservedSubjects = targetSemester.subjects.filter(
      (s) => !updatedCodes.has(s.subjectCode.toUpperCase())
    );
    targetSemester.subjects = [...preservedSubjects, ...updatedSubjectsList];

    // Recalculate Semester SGPA
    const semCalc = calculateSemesterSGPA(targetSemester.subjects);
    targetSemester.sgpa = semCalc.sgpa;
    targetSemester.totalCredits = semCalc.totalCredits;
    targetSemester.backlogsCount = semCalc.backlogsCount;

    // Recalculate Cumulative CGPA across all student semesters
    const cumulative = calculateCumulativeCGPA(student.academics);
    student.academics = cumulative.semesters;

    // Evaluate badges
    student.badges = evaluateBadges({
      academics: student.academics,
    });

    await student.save();

    // Persist all performance snapshots
    if (snapshotsToCreate.length > 0) {
      await PerformanceSnapshot.insertMany(snapshotsToCreate);
    }

    // Record system AuditLog
    await AuditService.logAction({
      actorId: updatedByUser._id,
      actorRole: updatedByUser.role,
      actorName: updatedByUser.name,
      action: AUDIT_ACTIONS.MARKS_UPDATED,
      entity: 'Student',
      entityId: student._id,
      newValue: { semesterNumber: semNum, sgpa: semCalc.sgpa, cgpa: cumulative.cgpa },
      description: `Marks updated for student ${student.usn} in Semester ${semNum}`,
    });

    // Notify student about marks update
    await Notification.create({
      recipientId: student.userId._id || student.userId,
      senderId: updatedByUser._id,
      title: 'Academic Marks Updated',
      message: `Your marks and SGPA for Semester ${semNum} have been updated by ${updatedByUser.name}. Current SGPA: ${semCalc.sgpa}`,
      category: NOTIFICATION_CATEGORIES.ACADEMIC,
      link: '/student/academics',
    });

    // If parent is linked, notify parent as well
    if (student.parentUserId) {
      await Notification.create({
        recipientId: student.parentUserId,
        senderId: updatedByUser._id,
        title: 'Ward Academic Assessment Updated',
        message: `Academic performance for ${student.usn} has been updated for Semester ${semNum}. SGPA: ${semCalc.sgpa}`,
        category: NOTIFICATION_CATEGORIES.ACADEMIC,
        link: '/parent/academics',
      });
    }

    return {
      student,
      semester: targetSemester,
      cgpa: cumulative.cgpa,
      totalActiveBacklogs: cumulative.totalActiveBacklogs,
    };
  }

  /**
   * Get complete academic records for a student
   */
  static async getStudentAcademics(studentId) {
    const student = await Student.findById(studentId)
      .populate('userId', 'name email avatar phone')
      .populate({
        path: 'mentorId',
        populate: { path: 'userId', select: 'name email phone avatar designation' },
      });

    if (!student) {
      throw new AppError('Student record not found', 404);
    }

    const cumulative = calculateCumulativeCGPA(student.academics);

    // Fetch recent performance snapshots
    const snapshots = await PerformanceSnapshot.find({ studentId: student._id })
      .populate('updatedBy', 'name role')
      .sort({ timestamp: -1 })
      .limit(30);

    return {
      student,
      cgpa: cumulative.cgpa,
      totalEarnedCredits: cumulative.totalEarnedCredits,
      totalActiveBacklogs: cumulative.totalActiveBacklogs,
      semesters: cumulative.semesters,
      snapshots,
    };
  }

  /**
   * Visual progress timeline from CIE1 -> CIE2 -> CIE3 -> Final for a given semester
   */
  static async getSemesterTimeline(studentId, semesterNumber) {
    const student = await Student.findById(studentId);
    if (!student) throw new AppError('Student not found', 404);

    const semNum = Number(semesterNumber);
    const semester = student.academics.find((s) => s.semesterNumber === semNum);
    if (!semester) {
      return { semesterNumber: semNum, timeline: [] };
    }

    const timeline = semester.subjects.map((subj) => {
      const cie1 = subj.cie1 || 0;
      const cie2 = subj.cie2 || 0;
      const cie3 = subj.cie3 || 0;
      const finalMarks = subj.finalMarks || 0;

      // Calculate progression deltas
      const deltaCie1To2 = cie2 - cie1;
      const deltaCie2To3 = cie3 - cie2;
      const trend = deltaCie2To3 > 0 || deltaCie1To2 > 0 ? 'improving' : deltaCie2To3 < 0 ? 'declining' : 'steady';

      return {
        subjectCode: subj.subjectCode,
        subjectName: subj.subjectName,
        cie1,
        cie2,
        cie3,
        finalMarks,
        totalMarks: subj.totalMarks,
        grade: subj.grade,
        deltaCie1To2,
        deltaCie2To3,
        trend,
      };
    });

    return {
      semesterNumber: semNum,
      sgpa: semester.sgpa,
      backlogsCount: semester.backlogsCount,
      timeline,
    };
  }

  /**
   * Compare student's scores against anonymous department/class averages
   */
  static async getClassComparison(studentId, semesterNumber) {
    const student = await Student.findById(studentId);
    if (!student) throw new AppError('Student not found', 404);

    const semNum = Number(semesterNumber);
    const targetSemester = student.academics.find((s) => s.semesterNumber === semNum);

    if (!targetSemester) {
      throw new AppError(`No records found for Semester ${semNum}`, 404);
    }

    // Aggregate class average for all students in the same department and semester
    const cohortStudents = await Student.find({
      department: student.department,
      'academics.semesterNumber': semNum,
    });

    const subjectStats = {};
    let totalCohortSGPA = 0;
    let cohortStudentCount = 0;

    cohortStudents.forEach((cs) => {
      const sem = cs.academics.find((s) => s.semesterNumber === semNum);
      if (sem) {
        cohortStudentCount++;
        totalCohortSGPA += sem.sgpa || 0;
        sem.subjects.forEach((subj) => {
          if (!subjectStats[subj.subjectCode]) {
            subjectStats[subj.subjectCode] = { total: 0, count: 0, maxScore: 0, minScore: 100 };
          }
          subjectStats[subj.subjectCode].total += subj.totalMarks;
          subjectStats[subj.subjectCode].count += 1;
          subjectStats[subj.subjectCode].maxScore = Math.max(subjectStats[subj.subjectCode].maxScore, subj.totalMarks);
          subjectStats[subj.subjectCode].minScore = Math.min(subjectStats[subj.subjectCode].minScore, subj.totalMarks);
        });
      }
    });

    const classAverageSGPA = cohortStudentCount > 0 ? Math.round((totalCohortSGPA / cohortStudentCount) * 100) / 100 : 0;

    const subjectComparison = targetSemester.subjects.map((subj) => {
      const stats = subjectStats[subj.subjectCode] || { total: subj.totalMarks, count: 1, maxScore: subj.totalMarks, minScore: subj.totalMarks };
      const classAvgMarks = Math.round((stats.total / stats.count) * 10) / 10;
      const deviation = Math.round((subj.totalMarks - classAvgMarks) * 10) / 10;

      return {
        subjectCode: subj.subjectCode,
        subjectName: subj.subjectName,
        studentMarks: subj.totalMarks,
        classAverageMarks: classAvgMarks,
        highestMarks: stats.maxScore,
        lowestMarks: stats.minScore,
        deviation,
        percentile: stats.count > 1 ? Math.round(((stats.count - (stats.maxScore > subj.totalMarks ? 1 : 0)) / stats.count) * 100) : 100,
      };
    });

    return {
      department: student.department,
      semesterNumber: semNum,
      studentSGPA: targetSemester.sgpa,
      classAverageSGPA,
      cohortSize: cohortStudentCount,
      comparison: subjectComparison,
    };
  }
}

module.exports = AcademicService;
