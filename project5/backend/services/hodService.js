const { User, Student, Mentor, AuditLog, StudentRecord } = require('../models');
const AppError = require('../utils/AppError');
const AuditService = require('./auditService');
const { calculateCumulativeCGPA } = require('../utils/academicCalculations');
const { AUDIT_ACTIONS } = require('../config/constants');

class HodService {
  /**
   * Get Department-level Analytics & Summary Metrics
   */
  static async getDepartmentAnalytics(department = 'ALL') {
    const studentQuery = department === 'ALL' ? {} : { department };
    const mentorQuery = department === 'ALL' ? {} : { department };

    const students = await Student.find(studentQuery).populate('userId', 'name email isActive');
    const mentors = await Mentor.find(mentorQuery).populate('userId', 'name email isActive');

    const totalStudents = students.length;
    const totalMentors = mentors.length;

    let totalCGPA = 0;
    let studentsWithCGPA = 0;
    let totalBacklogs = 0;
    let unassignedStudentsCount = 0;
    let studentsNeedingAttentionCount = 0;

    const riskCounts = { Low: 0, Medium: 0, High: 0, Critical: 0 };
    const semesterDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 };

    students.forEach((s) => {
      if (!s.mentorId) unassignedStudentsCount++;

      const risk = s.riskProfile?.riskLevel || 'Low';
      riskCounts[risk] = (riskCounts[risk] || 0) + 1;

      if (s.semester && semesterDistribution[s.semester] !== undefined) {
        semesterDistribution[s.semester]++;
      }

      const { cgpa, totalActiveBacklogs } = calculateCumulativeCGPA(s.academics);
      if (cgpa > 0) {
        totalCGPA += cgpa;
        studentsWithCGPA++;
      }
      totalBacklogs += totalActiveBacklogs;

      // Strict Academic Attention (CIE < 25 and Backlogs > 0 ONLY)
      let hasLowCie = false;
      const currentSem = s.academics?.find((sem) => sem.semesterNumber === s.semester);
      if (currentSem?.subjects?.length > 0) {
        let totalCie = 0;
        let count = 0;
        currentSem.subjects.forEach((subj) => {
          const tests = [subj.cie1 || 0, subj.cie2 || 0, subj.cie3 || 0].sort((a, b) => b - a);
          const best2Avg = tests.length >= 2 ? (tests[0] + tests[1]) / 2 : tests[0] || 0;
          totalCie += best2Avg;
          count++;
        });
        if (count > 0 && totalCie / count < 25) {
          hasLowCie = true;
        }
      }

      if (totalActiveBacklogs > 0 || hasLowCie) {
        studentsNeedingAttentionCount++;
      }
    });

    const averageCGPA = studentsWithCGPA > 0 ? Math.round((totalCGPA / studentsWithCGPA) * 100) / 100 : 0;

    // Attendance shortage count (strictly independent signal)
    const Attendance = require('../models/Attendance');
    const studentIds = students.map((s) => s._id);
    const lowAttendanceStudentIds = await Attendance.distinct('studentId', {
      studentId: { $in: studentIds },
      attendancePercentage: { $lt: 75 },
    });
    const lowAttendanceCount = lowAttendanceStudentIds.length;

    // Mentor workload mapping
    const mentorWorkload = await Promise.all(
      mentors.map(async (m) => {
        const menteeCount = await Student.countDocuments({ mentorId: m._id });
        return {
          mentorId: m._id,
          name: m.userId?.name || 'Faculty',
          email: m.userId?.email,
          designation: m.designation,
          department: m.department,
          menteeCount,
          maxMentees: m.maxMentees || 30,
          ratingAverage: m.ratingAverage,
          utilizationPercentage: Math.round((menteeCount / (m.maxMentees || 30)) * 100),
        };
      })
    );

    // Calculate per-semester stats & performance
    const semStats = {};
    for (let sem = 1; sem <= 8; sem++) {
      semStats[sem] = { count: 0, totalCgpa: 0, totalStudentsWithCgpa: 0, passedCount: 0, totalInSem: 0, totalSgpa: 0 };
    }

    const studentRanks = [];
    const subjectStats = new Map();

    students.forEach((s) => {
      const { cgpa } = calculateCumulativeCGPA(s.academics);
      const semNum = s.semester || 1;

      if (semStats[semNum]) {
        semStats[semNum].count++;
        if (cgpa > 0) {
          semStats[semNum].totalCgpa += cgpa;
          semStats[semNum].totalStudentsWithCgpa++;
        }
      }

      // Check current semester academic performance
      const currentSem = s.academics?.find((sem) => sem.semesterNumber === semNum);
      if (currentSem) {
        if (semStats[semNum]) {
          semStats[semNum].totalInSem++;
          if (currentSem.sgpa) semStats[semNum].totalSgpa += currentSem.sgpa;
          if (!currentSem.subjects || currentSem.subjects.every(sub => (sub.grade !== 'F' && sub.finalMarks >= 40))) {
            semStats[semNum].passedCount++;
          }
        }
      }

      // Track all subjects across all semesters for challenging subjects
      if (s.academics && Array.isArray(s.academics)) {
        s.academics.forEach((sem) => {
          if (sem.subjects && Array.isArray(sem.subjects)) {
            sem.subjects.forEach((sub) => {
              const code = (sub.subjectCode || '').trim().toUpperCase();
              if (code) {
                if (!subjectStats.has(code)) {
                  subjectStats.set(code, { code, name: sub.subjectName || code, total: 0, failed: 0 });
                }
                const stat = subjectStats.get(code);
                stat.total++;
                if (sub.grade === 'F' || (sub.finalMarks !== undefined && sub.finalMarks < 40)) {
                  stat.failed++;
                }
              }
            });
          }
        });
      }

      studentRanks.push({
        name: s.userId?.name || 'Student',
        usn: s.usn,
        cgpa: cgpa || 0,
        semester: semNum,
      });
    });

    const semDistArray = [];
    const semPerfArray = [];
    for (let sem = 1; sem <= 8; sem++) {
      const st = semStats[sem];
      if (st.count > 0) {
        const avgCgpa = st.totalStudentsWithCgpa > 0 ? Math.round((st.totalCgpa / st.totalStudentsWithCgpa) * 10) / 10 : 0;
        const passRate = st.totalInSem > 0 ? Math.round((st.passedCount / st.totalInSem) * 100) : 100;
        const avgSGPA = st.totalInSem > 0 ? Math.round((st.totalSgpa / st.totalInSem) * 10) / 10 : avgCgpa;

        semDistArray.push({
          semester: `Sem ${sem}`,
          count: st.count,
          avgCgpa,
        });

        semPerfArray.push({
          semester: `Sem ${sem}`,
          passRate,
          avgSGPA,
        });
      }
    }

    studentRanks.sort((a, b) => b.cgpa - a.cgpa);
    const topStudents = studentRanks.slice(0, 5);

    const challengingSubjects = Array.from(subjectStats.values())
      .filter(s => s.total > 0)
      .map(s => ({
        code: s.code,
        name: s.name,
        failRate: Math.round((s.failed / s.total) * 100),
      }))
      .sort((a, b) => b.failRate - a.failRate)
      .slice(0, 4);

    return {
      department,
      summary: {
        totalStudents,
        totalMentors,
        averageDepartmentCgpa: averageCGPA.toFixed(2),
        totalBacklogs,
        criticalRiskCount: riskCounts.Critical || 0,
        highRiskCount: riskCounts.High || 0,
        unassignedStudentsCount,
        studentsNeedingAttentionCount,
        lowAttendanceCount,
      },
      metrics: {
        totalStudents,
        totalMentors,
        averageCGPA,
        totalBacklogs,
        unassignedStudentsCount,
        studentsNeedingAttentionCount,
        lowAttendanceCount,
        riskCounts,
        semesterDistribution,
      },
      riskDistribution: {
        low: riskCounts.Low || 0,
        medium: riskCounts.Medium || 0,
        high: riskCounts.High || 0,
        critical: riskCounts.Critical || 0,
      },
      semesterDistribution: semDistArray,
      semesterPerformance: semPerfArray,
      topStudents,
      challengingSubjects,
      mentorWorkload,
    };
  }

  /**
   * Assign multiple students to a mentor
   */
  static async assignMentees({ studentIds, mentorId, hodUser }) {
    const mentor = await Mentor.findById(mentorId).populate('userId', 'name email department isActive');
    if (!mentor) {
      throw new AppError('Mentor not found', 404);
    }
    if (mentor.isActive === false || mentor.userId?.isActive === false) {
      throw new AppError('Target mentor is currently inactive and cannot receive students', 400);
    }

    const currentCount = await Student.countDocuments({ mentorId: mentor._id });
    if (currentCount + studentIds.length > (mentor.maxMentees || 30)) {
      throw new AppError(
        `Assignment exceeds mentor capacity. Current: ${currentCount}, Adding: ${studentIds.length}, Max: ${mentor.maxMentees || 30}`,
        400
      );
    }

    const result = await Student.updateMany(
      { _id: { $in: studentIds } },
      { $set: { mentorId: mentor._id } }
    );

    // Also update any StudentRecord with these IDs if pre-registered
    await StudentRecord.updateMany(
      { _id: { $in: studentIds } },
      { $set: { mentorId: mentor._id } }
    );

    await AuditService.logAction({
      actorId: hodUser._id,
      actorRole: hodUser.role,
      actorName: hodUser.name,
      action: AUDIT_ACTIONS.MENTOR_ASSIGNED,
      entity: 'Student',
      newValue: { mentorId: mentor._id, mentorName: mentor.userId?.name, studentCount: studentIds.length },
      description: `Assigned ${studentIds.length} students to Mentor ${mentor.userId?.name}`,
    });

    return {
      success: true,
      modifiedCount: result.modifiedCount,
      mentorName: mentor.userId?.name,
    };
  }

  /**
   * Reassign or unassign a single student's mentor
   */
  static async reassignStudentMentor(studentId, mentorId, hodUser) {
    let student = await Student.findById(studentId).populate('userId', 'name email department');
    let studentRecord = null;

    if (!student) {
      studentRecord = await StudentRecord.findById(studentId);
      if (!studentRecord) {
        throw new AppError('Student record not found', 404);
      }
    }

    // If student is graduated or inactive, cannot reassign mentor
    if (student && (student.status === 'GRADUATED' || student.status === 'INACTIVE')) {
      throw new AppError('Cannot reassign mentor for a graduated or inactive student', 400);
    }

    let mentor = null;
    const isUnassign = !mentorId || mentorId === 'unassign' || mentorId === 'none';

    if (!isUnassign) {
      mentor = await Mentor.findById(mentorId).populate('userId', 'name email department isActive');
      if (!mentor) {
        throw new AppError('Mentor not found', 404);
      }

      // Check mentor active status
      if (mentor.isActive === false || mentor.userId?.isActive === false) {
        throw new AppError('Target mentor is currently inactive and cannot receive students', 400);
      }

      // Department compatibility check (if departments exist and neither is 'ALL')
      const targetDept = student ? student.department : studentRecord.department;
      if (
        mentor.department &&
        targetDept &&
        mentor.department !== 'ALL' &&
        targetDept !== 'ALL' &&
        mentor.department !== targetDept
      ) {
        throw new AppError(
          `Cannot assign mentor from department "${mentor.department}" to student in department "${targetDept}"`,
          400
        );
      }

      // Capacity check
      const currentCount = await Student.countDocuments({
        mentorId: mentor._id,
        ...(student ? { _id: { $ne: student._id } } : {}),
      });

      if (currentCount >= (mentor.maxMentees || 30)) {
        throw new AppError(
          `Mentor ${mentor.userId?.name || ''} has reached maximum capacity (${mentor.maxMentees || 30})`,
          400
        );
      }
    }

    if (student) {
      const previousMentorId = student.mentorId;
      student.mentorId = mentor ? mentor._id : null;

      // Maintain mentorHistory
      if (!Array.isArray(student.mentorHistory)) {
        student.mentorHistory = [];
      }

      student.mentorHistory.forEach((h) => {
        if (!h.unassignedAt) {
          h.unassignedAt = new Date();
        }
      });

      if (mentor) {
        student.mentorHistory.push({
          mentorId: mentor._id,
          mentorName: mentor.userId?.name || 'Faculty',
          assignedAt: new Date(),
          academicYear: student.academicYear || '',
          semester: student.semester || 1,
          reason: 'Allocated by HOD',
        });
      }

      await student.save();

      await AuditService.logAction({
        actorId: hodUser._id,
        actorRole: hodUser.role,
        actorName: hodUser.name,
        action: AUDIT_ACTIONS.MENTOR_ASSIGNED,
        entity: 'Student',
        entityId: student._id,
        oldValue: { mentorId: previousMentorId },
        newValue: {
          mentorId: mentor ? mentor._id : null,
          mentorName: mentor?.userId?.name || 'Unassigned',
        },
        description: `Reassigned mentor for student ${student.usn} (${student.userId?.name || ''}) to ${mentor?.userId?.name || 'Unassigned'}`,
      });

      // Notify Student and Mentor
      try {
        const { Notification } = require('../models');
        const { NOTIFICATION_CATEGORIES } = require('../config/constants');
        if (student.userId?._id) {
          await Notification.create({
            recipientId: student.userId._id,
            senderId: hodUser._id,
            title: mentor ? 'Mentor Assigned' : 'Mentor Unassigned',
            message: mentor
              ? `You have been assigned to faculty mentor ${mentor.userId?.name || 'Faculty'}.`
              : 'Your faculty mentor assignment has been removed.',
            category: NOTIFICATION_CATEGORIES?.SYSTEM || 'SYSTEM',
            link: '/student/overview',
          });
        }
        if (mentor && mentor.userId?._id) {
          await Notification.create({
            recipientId: mentor.userId._id,
            senderId: hodUser._id,
            title: 'New Mentee Assigned',
            message: `Student ${student.userId?.name || student.usn} has been assigned to your mentorship list.`,
            category: NOTIFICATION_CATEGORIES?.SYSTEM || 'SYSTEM',
            link: '/mentor/overview',
          });
        }
      } catch (notifErr) {
        // Notification failure non-blocking
      }

      const populated = await student.populate([
        { path: 'userId', select: 'name email phone avatar department isActive' },
        { path: 'mentorId', populate: { path: 'userId', select: 'name email phone avatar' } },
      ]);

      const mentorObj = populated.mentorId
        ? {
            _id: populated.mentorId._id,
            id: populated.mentorId._id,
            name: populated.mentorId.userId?.name || populated.mentorId.name || 'Faculty Mentor',
            email: populated.mentorId.userId?.email || populated.mentorId.email || '',
            employeeId: populated.mentorId.employeeId || '',
            department: populated.mentorId.department || '',
            designation: populated.mentorId.designation || 'Faculty',
          }
        : null;

      return {
        ...populated.toObject(),
        name: populated.userId?.name || populated.name || '',
        email: populated.userId?.email || populated.email || '',
        phone: populated.userId?.phone || populated.phone || '',
        currentSemester: populated.semester,
        mentorId: mentorObj,
        mentor: mentorObj,
        isActivated: true,
        status: populated.status,
      };
    } else if (studentRecord) {
      const previousMentorId = studentRecord.mentorId;
      studentRecord.mentorId = mentor ? mentor._id : null;
      await studentRecord.save();

      await AuditService.logAction({
        actorId: hodUser._id,
        actorRole: hodUser.role,
        actorName: hodUser.name,
        action: AUDIT_ACTIONS.MENTOR_ASSIGNED,
        entity: 'StudentRecord',
        entityId: studentRecord._id,
        oldValue: { mentorId: previousMentorId },
        newValue: {
          mentorId: mentor ? mentor._id : null,
          mentorName: mentor?.userId?.name || 'Unassigned',
        },
        description: `Pre-assigned mentor for student record ${studentRecord.usn} (${studentRecord.name}) to ${mentor?.userId?.name || 'Unassigned'}`,
      });

      const mentorObj = mentor
        ? {
            _id: mentor._id,
            id: mentor._id,
            name: mentor.userId?.name || 'Faculty Mentor',
            email: mentor.userId?.email || '',
            employeeId: mentor.employeeId || '',
            department: mentor.department || '',
            designation: mentor.designation || 'Faculty',
          }
        : null;

      return {
        _id: studentRecord._id,
        usn: studentRecord.usn,
        name: studentRecord.name,
        email: studentRecord.email,
        department: studentRecord.department,
        batch: studentRecord.batch,
        semester: studentRecord.semester,
        currentSemester: studentRecord.semester,
        section: studentRecord.section,
        phone: studentRecord.phone || '',
        parentEmail: studentRecord.parentEmail || '',
        parentName: studentRecord.parentName || '',
        parentRelation: studentRecord.parentRelation || 'Guardian',
        mentorId: mentorObj,
        mentor: mentorObj,
        cgpa: 0,
        computedCGPA: 0,
        totalBacklogs: 0,
        computedBacklogs: 0,
        riskCategory: 'Low',
        isActivated: false,
        status: 'PRE_REGISTERED',
      };
    }
  }

  /**
   * Unlock user account that was locked due to login attempts
   */
  static async unlockUserAccount(userId, hodUser) {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User account not found', 404);

    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    await AuditService.logAction({
      actorId: hodUser._id,
      actorRole: hodUser.role,
      actorName: hodUser.name,
      action: AUDIT_ACTIONS.ACCOUNT_RECOVERED,
      entity: 'User',
      entityId: user._id,
      description: `Account unlocked by HOD for ${user.email}`,
    });

    return { message: `Account for ${user.email} has been unlocked successfully.` };
  }

  /**
   * Get department leaderboard
   */
  static async getLeaderboard(department = 'ALL', limit = 10) {
    const query = department === 'ALL' ? {} : { department };
    const students = await Student.find(query).populate('userId', 'name email avatar department').lean();

    const enhanced = students.map((s) => {
      const { cgpa, totalActiveBacklogs } = calculateCumulativeCGPA(s.academics);
      return {
        _id: s._id,
        usn: s.usn,
        name: s.userId?.name,
        avatar: s.userId?.avatar,
        department: s.department,
        semester: s.semester,
        cgpa,
        totalBacklogs: totalActiveBacklogs,
        badgesCount: s.badges?.length || 0,
      };
    });

    // Top performers by CGPA
    enhanced.sort((a, b) => b.cgpa - a.cgpa);

    return enhanced.slice(0, Number(limit));
  }

  /**
   * Get paginated audit logs
   */
  static async getAuditLogs({ page = 1, limit = 50, action = '', entity = '' }) {
    const query = {};
    if (action) query.action = action;
    if (entity) query.entity = entity;

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const logs = await AuditLog.find(query).sort({ timestamp: -1 }).skip(skip).limit(limitNum);
    const total = await AuditLog.countDocuments(query);

    return {
      logs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    };
  }

  /**
   * Get all students for HOD directory — returns both activated Students and pre-registered StudentRecords
   */
  static async getAllStudents(queryParams = {}) {
    const {
      page = 1,
      limit = 20,
      search = '',
      department = '',
      semester = '',
      mentorId = '',
      riskLevel = '',
      admissionYear = '',
      batch = '',
      entryType = '',
      status = '',
      academicYear = '',
      section = '',
    } = queryParams;

    // 1. Build query for activated Student documents
    const studentQuery = {};
    if (department && department !== 'ALL') studentQuery.department = department;
    if (semester) studentQuery.semester = Number(semester);
    if (mentorId) studentQuery.mentorId = mentorId;
    if (riskLevel) studentQuery['riskProfile.riskLevel'] = riskLevel;
    if (admissionYear) studentQuery.admissionYear = Number(admissionYear);
    if (batch) studentQuery.batch = batch;
    if (entryType) studentQuery.entryType = entryType.toUpperCase();
    if (academicYear) studentQuery.academicYear = academicYear;
    if (section) studentQuery.section = section.toUpperCase();
    if (status) studentQuery.status = status.toUpperCase();

    // If status filter is specifically 'PRE_REGISTERED', no active Student documents match
    let students = [];
    if (!status || status.toUpperCase() !== 'PRE_REGISTERED') {
      students = await Student.find(studentQuery)
        .populate('userId', 'name email phone avatar isActive')
        .populate({ path: 'mentorId', populate: { path: 'userId', select: 'name email' } })
        .lean();
    }

    // Format activated students to ensure all expected directory fields exist
    const activatedList = students.map((st) => {
      const { cgpa, totalActiveBacklogs } = calculateCumulativeCGPA(st.academics);
      const mentorObj = st.mentorId
        ? {
            _id: st.mentorId._id,
            id: st.mentorId._id,
            name: st.mentorId.userId?.name || st.mentorId.name || 'Faculty Mentor',
            email: st.mentorId.userId?.email || st.mentorId.email || '',
            employeeId: st.mentorId.employeeId || '',
            department: st.mentorId.department || '',
            designation: st.mentorId.designation || 'Faculty',
          }
        : null;

      return {
        ...st,
        name: st.userId?.name || st.name || '',
        email: st.userId?.email || st.email || '',
        phone: st.userId?.phone || st.phone || '',
        currentSemester: st.semester,
        mentorId: mentorObj,
        mentor: mentorObj,
        cgpa: cgpa || st.cgpa || 0,
        computedCGPA: cgpa,
        totalBacklogs: totalActiveBacklogs,
        computedBacklogs: totalActiveBacklogs,
        riskCategory: st.riskProfile?.riskLevel || 'Low',
        isActivated: true,
        status: st.status || 'ACTIVE',
      };
    });

    // 2. Build query for pre-registered (unactivated) StudentRecord documents
    let preRegisteredList = [];
    const includePreRegistered =
      (!status || ['PRE_REGISTERED', 'INACTIVE', 'ALL'].includes(status.toUpperCase())) &&
      !mentorId &&
      (!riskLevel || ['Low', 'Good', 'ALL'].includes(riskLevel)) &&
      (!entryType || entryType.toUpperCase() === 'REGULAR');

    if (includePreRegistered) {
      const recordQuery = { isActivated: false };
      if (department && department !== 'ALL') recordQuery.department = department;
      if (semester) recordQuery.semester = Number(semester);
      if (section) recordQuery.section = section.toUpperCase();
      if (batch) recordQuery.batch = batch;

      const records = await StudentRecord.find(recordQuery).populate({ path: 'mentorId', populate: { path: 'userId', select: 'name email' } }).lean();

      // Collect existing USNs and emails from activated students to avoid duplicates
      const existingUsns = new Set(activatedList.map((s) => s.usn?.toUpperCase()).filter(Boolean));
      const existingEmails = new Set(activatedList.map((s) => s.email?.toLowerCase()).filter(Boolean));

      preRegisteredList = records
        .filter((r) => {
          const u = r.usn?.toUpperCase();
          const e = r.email?.toLowerCase();
          if (existingUsns.has(u) || existingEmails.has(e)) return false;
          if (admissionYear) {
            const b = String(r.batch || '');
            const cYear = r.createdAt ? new Date(r.createdAt).getFullYear() : null;
            if (!b.includes(String(admissionYear)) && cYear !== Number(admissionYear)) {
              return false;
            }
          }
          return true;
        })
        .map((r) => ({
          _id: r._id,
          usn: r.usn,
          name: r.name,
          email: r.email,
          department: r.department,
          batch: r.batch,
          semester: r.semester,
          currentSemester: r.semester,
          section: r.section,
          phone: r.phone || '',
          parentEmail: r.parentEmail || '',
          parentName: r.parentName || '',
          parentRelation: r.parentRelation || 'Guardian',
          mentorId: r.mentorId
            ? {
                _id: r.mentorId._id,
                id: r.mentorId._id,
                name: r.mentorId.userId?.name || r.mentorId.name || 'Faculty Mentor',
                email: r.mentorId.userId?.email || r.mentorId.email || '',
                employeeId: r.mentorId.employeeId || '',
                department: r.mentorId.department || '',
                designation: r.mentorId.designation || 'Faculty',
              }
            : null,
          mentor: r.mentorId
            ? {
                _id: r.mentorId._id,
                id: r.mentorId._id,
                name: r.mentorId.userId?.name || r.mentorId.name || 'Faculty Mentor',
                email: r.mentorId.userId?.email || r.mentorId.email || '',
                employeeId: r.mentorId.employeeId || '',
                department: r.mentorId.department || '',
                designation: r.mentorId.designation || 'Faculty',
              }
            : null,
          cgpa: 0,
          computedCGPA: 0,
          totalBacklogs: 0,
          computedBacklogs: 0,
          riskCategory: 'Low',
          isActivated: false,
          status: 'PRE_REGISTERED',
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        }));
    }

    // 3. Combine both lists
    let combined = [...activatedList, ...preRegisteredList];

    // 4. Apply search filter if provided
    if (search) {
      const s = search.toLowerCase();
      combined = combined.filter((item) => {
        const name = (item.name || '').toLowerCase();
        const email = (item.email || '').toLowerCase();
        const usn = (item.usn || '').toLowerCase();
        const mentorName = (item.mentorId?.name || '').toLowerCase();
        return name.includes(s) || email.includes(s) || usn.includes(s) || mentorName.includes(s);
      });
    }

    // Sort by createdAt descending (newest first)
    combined.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    // 5. Paginate
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = combined.slice(startIndex, startIndex + limitNum);

    return {
      students: paginated,
      pagination: {
        total: combined.length,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(combined.length / limitNum) || 1,
      },
    };
  }

  static async createIndividualStudent(data, hodUser) {
    const {
      name,
      email,
      usn,
      department,
      batch,
      semester,
      section,
      phone,
      parentName,
      parentEmail,
      parentRelation,
    } = data;

    // Normalize values
    const normalizedUsn = String(usn || '').trim().toUpperCase();
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!name || !normalizedEmail || !normalizedUsn) {
      throw new AppError(
        'Name, institutional email, and USN are required',
        400
      );
    }

    // Check whether this USN is already pre-registered
    const existingRecordByUsn = await StudentRecord.findOne({
      usn: normalizedUsn,
    });

    if (existingRecordByUsn) {
      if (existingRecordByUsn.isActivated) {
        throw new AppError(
          `Student with USN ${normalizedUsn} has already activated their account`,
          400
        );
      }

      throw new AppError(
        `Student with USN ${normalizedUsn} is already pre-registered`,
        400
      );
    }

    // Check whether this USN already exists in Student
    const existingStudentByUsn = await Student.findOne({
      usn: normalizedUsn,
    });

    if (existingStudentByUsn) {
      throw new AppError(
        `Student with USN ${normalizedUsn} has already activated their account`,
        400
      );
    }

    // Check whether this institutional email is already pre-registered
    const existingRecordByEmail = await StudentRecord.findOne({
      email: normalizedEmail,
    });

    if (existingRecordByEmail) {
      if (existingRecordByEmail.isActivated) {
        throw new AppError(
          'An active student record with this email address already exists',
          400
        );
      }

      throw new AppError(
        'A student record with this email address is already pre-registered',
        400
      );
    }

    // Check whether this institutional email already exists in User
    const existingUserByEmail = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUserByEmail) {
      throw new AppError(
        'An active student record with this email address already exists',
        400
      );
    }

    // IMPORTANT:
    // Do NOT call AuthService.register() here.
    // That method creates an active User + Student account.
    //
    // Pre-registration should create ONLY the institutional StudentRecord.
    const studentRecord = await StudentRecord.create({
      usn: normalizedUsn,
      email: normalizedEmail,
      name: String(name).trim(),

      department: department || hodUser.department || 'CSE',

      batch: batch ? String(batch).trim() : '',

      semester: Number(semester) || 1,

      section: section
        ? String(section).trim().toUpperCase()
        : 'A',

      phone: phone ? String(phone).trim() : '',

      parentEmail: parentEmail
        ? String(parentEmail).trim().toLowerCase()
        : '',

      parentName: parentName
        ? String(parentName).trim()
        : '',

      parentRelation: parentRelation
        ? String(parentRelation).trim()
        : 'Guardian',

      // Account is NOT activated yet
      isActivated: false,
      activatedAt: null,
      activatedUserId: null,

      // Parent is also not activated yet
      parentActivated: false,
      parentActivatedAt: null,
      parentActivatedUserId: null,

      // HOD who created the institutional record
      createdBy: hodUser?._id || null,
    });

    return {
      student: null,
      studentRecord,
      user: null,
      token: null,
      message: `Student record created for USN ${normalizedUsn}. Account is pre-registered (inactive). The student can now activate their account via /activate.`,
    };
  }

  /**
   * Progress a student's semester or mark graduation while preserving admission cohort
   */
  static async progressStudentSemester(studentId, { semester, academicYear, status }, hodUser) {
    const student = await Student.findById(studentId).populate('userId', 'name email');
    if (!student) {
      throw new AppError('Student record not found', 404);
    }

    const previousData = {
      semester: student.semester,
      academicYear: student.academicYear,
      status: student.status,
    };

    if (semester !== undefined) {
      student.semester = Number(semester);
    }
    if (academicYear) {
      student.academicYear = academicYear;
    }
    if (status) {
      student.status = status;
    } else if (Number(student.semester) > 8) {
      student.status = 'GRADUATED';
    }

    await student.save();

    if (student.userId?._id) {
      await User.findByIdAndUpdate(student.userId._id, {
        'studentProfile.semester': student.semester,
      });
    }

    const action = student.status === 'GRADUATED' ? 'STUDENT_GRADUATED' : 'STUDENT_PROMOTED';

    await AuditService.logAction({
      actorId: hodUser._id,
      actorRole: hodUser.role,
      actorName: hodUser.name,
      action,
      entity: 'Student',
      entityId: student._id,
      oldValue: previousData,
      newValue: {
  semester: student.semester,
  academicYear: student.academicYear,
  status: student.status,
},
      description: `Student ${student.usn} (${student.userId?.name || ''}) progressed from Semester ${previousData.semester} (${previousData.academicYear || ''}) to Semester ${student.semester} (${student.academicYear}) - Status: ${student.status}`,
    });

    return student;
  }
}

module.exports = HodService;
