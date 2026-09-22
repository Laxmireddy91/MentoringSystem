const { Student, Mentor, Session, Feedback, StudentGoal, Achievement } = require('../models');
const AppError = require('../utils/AppError');
const { calculateCumulativeCGPA } = require('../utils/academicCalculations');

class StudentService {
  /**
   * Get complete student profile with mentor info, academics, and risk summary
   */
  static async getProfileByUserId(userId) {
    const student = await Student.findOne({ userId })
      .populate('userId', 'name email phone avatar department isEmailVerified')
      .populate({
        path: 'mentorId',
        populate: { path: 'userId', select: 'name email phone avatar department' },
      });

    if (!student) {
      throw new AppError('Student profile not found for this account', 404);
    }

    const { cgpa, totalActiveBacklogs, totalEarnedCredits } = calculateCumulativeCGPA(student.academics);

    // Get counts
    const goalsCount = await StudentGoal.countDocuments({ studentId: student._id });
    const completedGoalsCount = await StudentGoal.countDocuments({ studentId: student._id, status: 'Achieved' });
    const achievementsCount = await Achievement.countDocuments({ studentId: student._id });
    const verifiedAchievementsCount = await Achievement.countDocuments({ studentId: student._id, isVerified: true });
    const pendingAchievementsCount = await Achievement.countDocuments({ studentId: student._id, status: 'pending' });
    const rejectedAchievementsCount = await Achievement.countDocuments({ studentId: student._id, status: 'rejected' });
    const sessionsCount = await Session.countDocuments({ studentId: student._id });

    return {
      student,
      summary: {
        cgpa,
        totalActiveBacklogs,
        totalEarnedCredits,
        goalsCount,
        completedGoalsCount,
        achievementsCount,
        verifiedAchievementsCount,
        pendingAchievementsCount,
        rejectedAchievementsCount,
        sessionsCount,
        riskLevel: student.riskProfile?.riskLevel || 'Low',
        riskScore: student.riskProfile?.riskScore || 0,
      },
    };
  }

  /**
   * Get sessions for student
   */
  static async getStudentSessions(studentId) {
    const sessions = await Session.find({ studentId })
      .populate({
        path: 'mentorId',
        populate: { path: 'userId', select: 'name email avatar designation' },
      })
      .populate('feedbackId')
      .sort({ startTime: -1 });

    return sessions;
  }

  /**
   * Submit feedback/rating for a completed session
   */
  static async submitSessionFeedback({ sessionId, studentUserId, rating, comment, aspects, isAnonymous }) {
    const student = await Student.findOne({ userId: studentUserId });
    if (!student) throw new AppError('Student profile not found', 404);

    const session = await Session.findById(sessionId);
    if (!session) throw new AppError('Mentoring session not found', 404);

    if (session.studentId.toString() !== student._id.toString()) {
      throw new AppError('Unauthorized: You can only rate your own mentoring sessions', 403);
    }

    if (session.status !== 'completed') {
      throw new AppError('Feedback can only be submitted for completed sessions', 400);
    }

    const existingFeedback = await Feedback.findOne({ sessionId: session._id });
    if (existingFeedback) {
      throw new AppError('Feedback has already been submitted for this session', 400);
    }

    const feedback = await Feedback.create({
      sessionId: session._id,
      mentorId: session.mentorId,
      studentId: student._id,
      rating: Number(rating),
      comment: comment || '',
      aspects: aspects || { punctuality: 5, helpfulness: 5, clarity: 5 },
      isAnonymous: !!isAnonymous,
    });

    session.feedbackId = feedback._id;
    await session.save();

    // Recalculate Mentor aggregated rating
    const mentorFeedbacks = await Feedback.find({ mentorId: session.mentorId });
    const totalRatings = mentorFeedbacks.length;
    const avgRating = totalRatings > 0
      ? Math.round((mentorFeedbacks.reduce((acc, curr) => acc + curr.rating, 0) / totalRatings) * 10) / 10
      : 0;

    await Mentor.findByIdAndUpdate(session.mentorId, {
      ratingAverage: avgRating,
      totalRatings,
    });

    return feedback;
  }

  /**
   * Add a mentorship interaction record (for Mentor/HOD)
   */
  static async addMentorshipRecord({ studentId, mentorName, date, type, notes, outcome, actionTaken, studentSigned, mentorSigned }) {
    const student = await Student.findById(studentId);
    if (!student) throw new AppError('Student record not found', 404);

    const newRecord = {
      date: date ? new Date(date) : new Date(),
      mentorName: mentorName || '',
      type: type || 'General Mentoring',
      notes: notes || '',
      outcome: outcome || '',
      actionTaken: actionTaken || '',
      studentSigned: Boolean(studentSigned),
      mentorSigned: Boolean(mentorSigned),
    };

    student.mentorshipRecords.push(newRecord);
    await student.save();

    return student.mentorshipRecords[student.mentorshipRecords.length - 1];
  }

  /**
   * Get all mentorship interaction records for a student
   */
  static async getMentorshipRecords(studentId) {
    const student = await Student.findById(studentId);
    if (!student) throw new AppError('Student record not found', 404);

    return student.mentorshipRecords || [];
  }

  /**
   * Add a backlog record
   */
  static async addBacklogRecord({ studentId, semester, subject, subjectCode, status, attempts, clearedDate, remarks }) {
    const student = await Student.findById(studentId);
    if (!student) throw new AppError('Student record not found', 404);

    const newRecord = {
      semester: Number(semester) || 1,
      subject: subject || '',
      subjectCode: (subjectCode || '').toUpperCase().trim(),
      status: status || 'Active',
      attempts: Number(attempts) || 1,
      clearedDate: clearedDate ? new Date(clearedDate) : null,
      remarks: remarks || '',
    };

    student.backlogRecords.push(newRecord);
    await student.save();

    return student.backlogRecords[student.backlogRecords.length - 1];
  }

  /**
   * Update a backlog record
   */
  static async updateBacklogRecord({ studentId, recordId, status, clearedDate, attempts, remarks }) {
    const student = await Student.findById(studentId);
    if (!student) throw new AppError('Student record not found', 404);

    const record = student.backlogRecords.id(recordId);
    if (!record) throw new AppError('Backlog record not found', 404);

    if (status !== undefined) record.status = status;
    if (clearedDate !== undefined) record.clearedDate = clearedDate ? new Date(clearedDate) : null;
    if (attempts !== undefined) record.attempts = Number(attempts);
    if (remarks !== undefined) record.remarks = remarks;

    await student.save();
    return record;
  }

  /**
   * Add an online course attended/completed by student
   */
  static async addOnlineCourse({ studentUserId, courseName, platform, completionDate, certificateUrl, status }) {
    const student = await Student.findOne({ userId: studentUserId });
    if (!student) throw new AppError('Student profile not found', 404);

    if (!courseName || !courseName.trim()) {
      throw new AppError('Course name is required', 400);
    }

    const newCourse = {
      courseName: courseName.trim(),
      platform: platform || 'NPTEL',
      completionDate: completionDate ? new Date(completionDate) : null,
      certificateUrl: certificateUrl || '',
      status: status || 'Completed',
    };

    student.onlineCoursesAttended.push(newCourse);
    await student.save();

    return student.onlineCoursesAttended[student.onlineCoursesAttended.length - 1];
  }

  /**
   * Delete an online course attended
   */
  static async deleteOnlineCourse({ studentUserId, courseId }) {
    const student = await Student.findOne({ userId: studentUserId });
    if (!student) throw new AppError('Student profile not found', 404);

    const course = student.onlineCoursesAttended.id(courseId);
    if (!course) throw new AppError('Course record not found', 404);

    course.deleteOne();
    await student.save();

    return { success: true, message: 'Online course record deleted' };
  }

  /**
   * Update emergency contact & parent contact info for student
   */
  static async updateEmergencyContact({ studentUserId, fatherName, motherName, guardianRelationship, guardianPhone, guardianEmail, emergencyContact }) {
    const student = await Student.findOne({ userId: studentUserId });
    if (!student) throw new AppError('Student profile not found', 404);

    if (!student.parentDetails) {
      student.parentDetails = {};
    }

    if (fatherName !== undefined) student.parentDetails.fatherName = fatherName;
    if (motherName !== undefined) student.parentDetails.motherName = motherName;
    if (guardianRelationship !== undefined) student.parentDetails.guardianRelationship = guardianRelationship;
    if (guardianPhone !== undefined) student.parentDetails.guardianPhone = guardianPhone;
    if (guardianEmail !== undefined) student.parentDetails.guardianEmail = guardianEmail;

    if (emergencyContact) {
      if (!student.parentDetails.emergencyContact) {
        student.parentDetails.emergencyContact = {};
      }
      if (emergencyContact.name !== undefined) student.parentDetails.emergencyContact.name = emergencyContact.name;
      if (emergencyContact.relationship !== undefined) student.parentDetails.emergencyContact.relationship = emergencyContact.relationship;
      if (emergencyContact.phone !== undefined) student.parentDetails.emergencyContact.phone = emergencyContact.phone;
      if (emergencyContact.email !== undefined) student.parentDetails.emergencyContact.email = emergencyContact.email;
    }

    await student.save();
    return student.parentDetails;
  }

  /**
   * Complete Student 360° Console View for Mentor / Institutional authority
   * Strict rule: Academic Attention is based ONLY on CIE + Backlogs.
   * Attendance is computed and returned as a separate independent monitoring signal.
   */
  static async getStudent360(studentId) {
    const student = await Student.findById(studentId)
      .populate('userId', 'name email phone avatar department isEmailVerified')
      .populate({
        path: 'mentorId',
        populate: { path: 'userId', select: 'name email phone avatar designation' },
      });

    if (!student) {
      throw new AppError('Student record not found', 404);
    }
    console.log('Student academics debug:', JSON.stringify(student.academics, null, 2));

    const { cgpa, totalActiveBacklogs: cgpaBacklogs, totalEarnedCredits } = calculateCumulativeCGPA(student.academics);

    // Include explicit backlog records stored on the student document (active only)
    const explicitBacklogs = (student.backlogRecords || []).filter((b) => b.status && b.status.toLowerCase() !== 'cleared').length;
// Academic Attention should consider ONLY ACTIVE backlogs (explicit records). Historical CGPA backlogs are not used here.
    const totalActiveBacklogs = explicitBacklogs;

    // Debug logging (can be removed later)
    console.log('Student360 Debug:', {
      studentId: student._id.toString(),
      cgpaBacklogs,
      explicitBacklogs,
      totalActiveBacklogs,
    });

    // 1. Calculate average CIE across current semester subjects
    const currentSem = student.academics.find((s) => s.semesterNumber === student.semester);
    let totalCieMarks = 0;
    let cieSubjectCount = 0;
    const lowCieSubjects = [];
    if (currentSem?.subjects?.length > 0) {
      currentSem.subjects.forEach((subj) => {
        const tests = [subj.cie1 || 0, subj.cie2 || 0, subj.cie3 || 0].sort((a, b) => b - a);
        const best2Avg = tests.length >= 2 ? (tests[0] + tests[1]) / 2 : tests[0] || 0;
        totalCieMarks += best2Avg;
        cieSubjectCount++;
        if (best2Avg < 25) {
          lowCieSubjects.push({
            subjectCode: subj.subjectCode,
            subjectName: subj.subjectName,
            cieAverage: Math.round(best2Avg * 10) / 10,
          });
        }
      });
    }
    const currentCieAverage = cieSubjectCount > 0 ? Math.round((totalCieMarks / cieSubjectCount) * 10) / 10 : 0;

    // 2. Strict Academic Attention Calculation (CIE + Backlogs ONLY - Attendance NEVER factored in)
    const attentionReasons = [];
    let needsAcademicAttention = false;

    if (totalActiveBacklogs > 0) {
      needsAcademicAttention = true;
      attentionReasons.push(`Has ${totalActiveBacklogs} active backlog subject(s) requiring clearance`);
    }

    if (cieSubjectCount > 0 && currentCieAverage < 25) {
      needsAcademicAttention = true;
      attentionReasons.push(`Current semester CIE average (${currentCieAverage}/50) is below the benchmark (25/50)`);
    }

    if (lowCieSubjects.length > 0 && !attentionReasons.some((r) => r.includes('CIE average'))) {
      needsAcademicAttention = true;
      attentionReasons.push(`Low CIE marks in ${lowCieSubjects.length} subject(s): ${lowCieSubjects.map((s) => s.subjectCode).join(', ')}`);
    }

const academicAttention = { // Debug log removed
      needsAttention: needsAcademicAttention,
      statusLabel: needsAcademicAttention ? 'Students Needing Academic Attention' : 'Good Academic Standing',
      reasons: attentionReasons,
      cieAverage: currentCieAverage,
      activeBacklogs: totalActiveBacklogs,
      lowCieSubjects,
    };

    // 3. Attendance Signal (Completely Separate from Attention Score)
    const Attendance = require('../models/Attendance');
    const attendanceRecords = await Attendance.find({ studentId: student._id }).sort({ semester: -1, subjectCode: 1 });
    let totalClassesAll = 0;
    let attendedClassesAll = 0;
    const lowAttendanceSubjects = [];
    attendanceRecords.forEach((att) => {
      totalClassesAll += att.totalClasses || 0;
      attendedClassesAll += att.classesAttended || 0;
      if (att.attendancePercentage !== undefined && att.attendancePercentage < 75) {
        lowAttendanceSubjects.push({
          subjectCode: att.subjectCode,
          subjectName: att.subjectName,
          semester: att.semester,
          percentage: att.attendancePercentage,
        });
      }
    });
    const overallAttendancePercentage =
      totalClassesAll > 0 ? Math.round((attendedClassesAll / totalClassesAll) * 100 * 10) / 10 : 0;
    const hasAttendanceWarning = attendanceRecords.length > 0 && (overallAttendancePercentage < 75 || lowAttendanceSubjects.length > 0);

    // 4. Other holistic subsystems (Achievements, Sessions, Placement, Requests, Documents)
    const [Achievement, Session, PlacementProfile, PlacementApplication, PlacementDrive, ExamRequest, Document] = [
      require('../models/Achievement'),
      require('../models/Session'),
      require('../models/PlacementProfile'),
      require('../models/PlacementApplication'),
      require('../models/PlacementDrive'),
      require('../models/ExamRequest'),
      require('../models/Document'),
    ];

    const [achievements, sessions, placementProfile, applications, eligibleDrives, examRequests, documents] = await Promise.all([
      Achievement.find({ studentId: student._id }).sort({ createdAt: -1 }),
      Session.find({ studentId: student._id }).sort({ startTime: -1 }).limit(10),
      PlacementProfile.findOne({ studentId: student._id }),
      PlacementApplication.find({ studentId: student._id }).populate('driveId', 'company role ctc jobType'),
      PlacementDrive.find({
        status: { $in: ['Upcoming', 'Active', 'Ongoing'] },
        eligibleDepartments: { $in: [student.department, 'ALL'] },
        minCGPA: { $lte: cgpa },
        maxBacklogs: { $gte: totalActiveBacklogs },
      }).sort({ applicationDeadline: 1 }).limit(5),
      ExamRequest.find({ studentId: student._id }).sort({ createdAt: -1 }),
      Document.find({ studentId: student._id, status: 'active' }).sort({ createdAt: -1 }),
    ]);

    // 5. Structured Factual Mentor Brief
    const verifiedAchievements = achievements.filter((a) => a.isVerified || a.status === 'approved');
    const pendingAchievements = achievements.filter((a) => a.status === 'pending');

    const recommendedFocus = [];
    if (totalActiveBacklogs > 0) {
      recommendedFocus.push(`Prioritize backlog clearance review for ${totalActiveBacklogs} subject(s).`);
    }
    if (cieSubjectCount > 0 && currentCieAverage < 25) {
      recommendedFocus.push(`Academic check-ins to boost current semester CIE average (${currentCieAverage}/50).`);
    }
    if (hasAttendanceWarning) {
      const lowAttNames = lowAttendanceSubjects.map((s) => s.subjectCode).join(', ');
      recommendedFocus.push(`Attendance counselling to restore attendance above statutory 75% in: ${lowAttNames || 'flagged subjects'}.`);
    }
    if (placementProfile && (!placementProfile.skills || placementProfile.skills.length === 0)) {
      recommendedFocus.push('Encourage mentee to build technical skills profile and resume for campus placement readiness.');
    }
    if (recommendedFocus.length === 0) {
      recommendedFocus.push('Academic performance and statutory attendance are stable; focus on skill expansion and career preparation.');
    }

    const narrativeSummary = `${student.userId?.name || 'Student'} (USN: ${student.usn}, Sem ${student.semester} '${student.section || 'A'}', Dept: ${student.department}). CGPA: ${cgpa.toFixed(2)}, Active Backlogs: ${totalActiveBacklogs}, Current CIE Avg: ${currentCieAverage}/50. Attendance: ${attendanceRecords.length > 0 ? `${overallAttendancePercentage}%` : 'Not Ingested'}. Verified achievements: ${verifiedAchievements.length}. Placement status: ${placementProfile?.placementStatus || 'Seeking'} (${applications.length} drive applications). Mentoring history: ${sessions.length} logged sessions.`;

    const mentorBrief = {
      summary: narrativeSummary,
      academic: `Cumulative CGPA: ${cgpa.toFixed(2)}. Current semester CIE average is ${currentCieAverage}/50 across ${cieSubjectCount} evaluated subject(s).`,
      attention: needsAcademicAttention
        ? `Academic Attention Required: ${attentionReasons.join('; ')}.`
        : 'Good Academic Standing: 0 active backlogs and satisfactory continuous internal evaluation.',
      attendance: attendanceRecords.length > 0
        ? `Attendance is recorded at ${overallAttendancePercentage}% across ${attendanceRecords.length} registered subject(s). ${hasAttendanceWarning ? 'Notice: Mentee has statutory attendance shortage (< 75%).' : 'Eligible per statutory attendance norms.'}`
        : 'Attendance data not imported yet.',
      placement: placementProfile
        ? `Status: ${placementProfile.placementStatus || 'Seeking'}. Registered skills: ${placementProfile.skills?.length ? placementProfile.skills.join(', ') : 'None registered'}. Active applications: ${applications.length}.`
        : 'No placement profile registered yet.',
      achievements: `${verifiedAchievements.length} verified achievement(s) on record (${pendingAchievements.length} pending verification).`,
      recommendedFocus,
    };

    return {
      student,
      academicSummary: {
        cgpa,
        totalActiveBacklogs,
        totalEarnedCredits,
        currentSemester: student.semester,
        currentCieAverage,
        semesters: student.academics,
        backlogRecords: student.backlogRecords || [],
      },
      academicAttention,
      attendanceSummary: {
        overallPercentage: attendanceRecords.length > 0 ? overallAttendancePercentage : 0,
        hasAttendanceWarning,
        totalClasses: totalClassesAll,
        classesAttended: attendedClassesAll,
        records: attendanceRecords,
        lowAttendanceSubjects,
        hasRecords: attendanceRecords.length > 0,
      },
      mentorBrief,
      achievements,
      sessions,
      placement: {
        profile: placementProfile,
        applications,
        eligibleDrives,
      },
      examRequests,
      documents,
    };
  }
}

module.exports = StudentService;

