// backend/controllers/profileController.js

const User = require('../models/User');
const Document = require('../models/Document');
const Student = require('../models/Student');
const Mentor = require('../models/Mentor');
const StaffRecord = require('../models/StaffRecord');
const PlacementProfile = require('../models/PlacementProfile');
const Session = require('../models/Session');
const StudentGoal = require('../models/StudentGoal');
const Achievement = require('../models/Achievement');
const Attendance = require('../models/Attendance');
const ApiResponse = require('../utils/apiResponse');
const AuditService = require('../services/auditService');

// Fields that must never be updated via the profile endpoint
const PROTECTED_FIELDS = [
  'role',
  'email',
  'isActivated',
  'department',
  'usn',
  'employeeId',
  'batch',
  'semester',
  'section',
  'permissions',
  'loginAttempts',
  'lockUntil',
  'lastLogin',
  'password',
];

/**
 * Enrich profile with Student-specific data
 */
async function enrichStudentProfile(userId) {
  const student = await Student.findOne({ userId })
    .populate({
      path: 'mentorId',
      populate: { path: 'userId', select: 'name email phone department' },
    })
    .lean();

  if (!student) return { roleData: null, stats: null };

  // Calculate CGPA from academics
  let cgpa = 0;
  let totalActiveBacklogs = 0;
  let totalEarnedCredits = 0;
  if (student.academics && student.academics.length > 0) {
    const latestSemester = student.academics[student.academics.length - 1];
    cgpa = latestSemester.cgpa || 0;
    student.academics.forEach((sem) => {
      totalEarnedCredits += sem.totalCredits || 0;
      totalActiveBacklogs += sem.backlogsCount || 0;
    });
  }

  // Counts
  const [goalsCount, completedGoalsCount, achievementsCount, sessionsCount, attendanceRecords] = await Promise.all([
    StudentGoal.countDocuments({ studentId: student._id }),
    StudentGoal.countDocuments({ studentId: student._id, status: 'Achieved' }),
    Achievement.countDocuments({ studentId: student._id }),
    Session.countDocuments({ studentId: student._id }),
    Attendance.find({ studentId: student._id }).sort({ semester: -1 }).lean(),
  ]);

  // Attendance summary
  let totalClasses = 0;
  let classesAttended = 0;
  attendanceRecords.forEach((a) => {
    totalClasses += a.totalClasses || 0;
    classesAttended += a.classesAttended || 0;
  });
  const attendancePercentage = totalClasses > 0 ? Math.round((classesAttended / totalClasses) * 100 * 10) / 10 : null;

  // Latest session info
  const latestSession = await Session.findOne({ studentId: student._id })
    .sort({ startTime: -1 })
    .populate({ path: 'mentorId', populate: { path: 'userId', select: 'name' } })
    .lean();

  const upcomingSession = await Session.findOne({
    studentId: student._id,
    status: { $in: ['scheduled', 'confirmed'] },
    startTime: { $gte: new Date() },
  })
    .sort({ startTime: 1 })
    .populate({ path: 'mentorId', populate: { path: 'userId', select: 'name' } })
    .lean();

  // Placement profile
  const placementProfile = await PlacementProfile.findOne({ studentId: student._id }).lean();

  return {
    roleData: {
      usn: student.usn,
      department: student.department,
      program: student.program,
      admissionYear: student.admissionYear,
      academicYear: student.academicYear,
      entryType: student.entryType,
      status: student.status,
      semester: student.semester,
      section: student.section,
      batch: student.batch,
      mentor: student.mentorId
        ? {
            name: student.mentorId.userId?.name,
            email: student.mentorId.userId?.email,
            phone: student.mentorId.userId?.phone,
            department: student.mentorId.userId?.department || student.mentorId.department,
            designation: student.mentorId.designation,
            employeeId: student.mentorId.employeeId,
          }
        : null,
      riskProfile: student.riskProfile || null,
      parentDetails: student.parentDetails || null,
      badges: student.badges || [],
      backlogRecords: student.backlogRecords || [],
      onlineCourses: student.onlineCoursesAttended || [],
    },
    stats: {
      cgpa,
      totalActiveBacklogs,
      totalEarnedCredits,
      goalsCount,
      completedGoalsCount,
      achievementsCount,
      sessionsCount,
      attendancePercentage,
      latestSession: latestSession
        ? {
            date: latestSession.startTime,
            status: latestSession.status,
            mentorName: latestSession.mentorId?.userId?.name,
          }
        : null,
      upcomingSession: upcomingSession
        ? {
            date: upcomingSession.startTime,
            status: upcomingSession.status,
            mentorName: upcomingSession.mentorId?.userId?.name,
          }
        : null,
    },
    placementProfile: placementProfile || null,
  };
}

/**
 * Enrich profile with Mentor-specific data
 */
async function enrichMentorProfile(userId) {
  const mentor = await Mentor.findOne({ userId }).lean();
  if (!mentor) return { roleData: null, stats: null };

  const [activeMenteeCount, totalSessionsCount, completedSessionsCount, upcomingSessionsCount] = await Promise.all([
    Student.countDocuments({ mentorId: mentor._id }),
    Session.countDocuments({ mentorId: mentor._id }),
    Session.countDocuments({ mentorId: mentor._id, status: 'completed' }),
    Session.countDocuments({
      mentorId: mentor._id,
      status: { $in: ['scheduled', 'confirmed'] },
      startTime: { $gte: new Date() },
    }),
  ]);

  return {
    roleData: {
      employeeId: mentor.employeeId,
      department: mentor.department,
      designation: mentor.designation,
      specialization: mentor.specialization || [],
      officeHours: mentor.officeHours || [],
      maxMentees: mentor.maxMentees,
      isActive: mentor.isActive,
      ratingAverage: mentor.ratingAverage,
      totalRatings: mentor.totalRatings,
    },
    stats: {
      activeMenteeCount,
      availableCapacity: Math.max(0, (mentor.maxMentees || 30) - activeMenteeCount),
      totalSessionsCount,
      completedSessionsCount,
      upcomingSessionsCount,
    },
  };
}

/**
 * Enrich profile with Staff-specific data (HOD, Coordinator, Exam Coordinator, TPO)
 */
async function enrichStaffProfile(user) {
  // Try StaffRecord first, then fall back to User.staffProfile
  const staffRecord = await StaffRecord.findOne({ email: user.email }).lean();

  const roleData = {
    employeeId: staffRecord?.employeeId || user.staffProfile?.employeeId || user.mentorProfile?.employeeId || null,
    designation: staffRecord?.designation || user.staffProfile?.designation || user.mentorProfile?.designation || null,
    department: staffRecord?.department || user.department || null,
  };

  // For HOD, get department statistics
  let stats = null;
  if (user.role === 'hod') {
    const dept = user.department;
    const [studentCount, mentorCount] = await Promise.all([
      Student.countDocuments({ department: dept }),
      Mentor.countDocuments({ department: dept }),
    ]);
    stats = { studentCount, mentorCount };
  }

  // For mentoring_coordinator, get coordination statistics
  if (user.role === 'mentoring_coordinator') {
    const dept = user.department;
    const [studentCount, mentorCount] = await Promise.all([
      Student.countDocuments({ department: dept }),
      Mentor.countDocuments({ department: dept }),
    ]);
    stats = { studentCount, mentorCount };
  }

  return { roleData, stats };
}

/**
 * Enrich profile with Parent-specific data (linked ward)
 */
async function enrichParentProfile(userId) {
  const student = await Student.findOne({ parentUserId: userId })
    .populate('userId', 'name email phone department')
    .populate({
      path: 'mentorId',
      populate: { path: 'userId', select: 'name email phone department' },
    })
    .lean();

  if (!student) return { roleData: null, stats: null };

  // Academic summary
  let cgpa = 0;
  let totalActiveBacklogs = 0;
  if (student.academics && student.academics.length > 0) {
    const latestSemester = student.academics[student.academics.length - 1];
    cgpa = latestSemester.cgpa || 0;
    student.academics.forEach((sem) => {
      totalActiveBacklogs += sem.backlogsCount || 0;
    });
  }

  // Attendance
  const attendanceRecords = await Attendance.find({ studentId: student._id }).lean();
  let totalClasses = 0;
  let classesAttended = 0;
  attendanceRecords.forEach((a) => {
    totalClasses += a.totalClasses || 0;
    classesAttended += a.classesAttended || 0;
  });
  const attendancePercentage = totalClasses > 0 ? Math.round((classesAttended / totalClasses) * 100 * 10) / 10 : null;

  // Session count
  const sessionsCount = await Session.countDocuments({ studentId: student._id });

  return {
    roleData: {
      ward: {
        name: student.userId?.name,
        email: student.userId?.email,
        phone: student.userId?.phone,
        usn: student.usn,
        department: student.department,
        program: student.program,
        semester: student.semester,
        section: student.section,
        batch: student.batch,
        status: student.status,
        mentor: student.mentorId
          ? {
              name: student.mentorId.userId?.name,
              email: student.mentorId.userId?.email,
              department: student.mentorId.userId?.department || student.mentorId.department,
              designation: student.mentorId.designation,
            }
          : null,
        riskProfile: student.riskProfile || null,
      },
      relation: null, // Will be filled from User.parentProfile
    },
    stats: {
      cgpa,
      totalActiveBacklogs,
      attendancePercentage,
      sessionsCount,
    },
  };
}

/**
 * GET /api/profile/me
 * Returns the authenticated user's profile with role-specific enrichment.
 */
exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -emailVerificationToken -resetPasswordToken -resetPasswordExpires -emailVerificationExpires -twoFactorSecret')
      .populate('avatarDocumentId')
      .populate('resumeReference')
      .populate('certifications.documentRef')
      .lean();
    if (!user) {
      return ApiResponse.notFound(res, 'User not found');
    }

    // Role-specific enrichment
    let enrichment = { roleData: null, stats: null };
    switch (user.role) {
      case 'student':
        enrichment = await enrichStudentProfile(user._id);
        break;
      case 'mentor':
        enrichment = await enrichMentorProfile(user._id);
        break;
      case 'hod':
      case 'mentoring_coordinator':
      case 'exam_coordinator':
      case 'tpo':
        enrichment = await enrichStaffProfile(user);
        break;
      case 'parent':
        enrichment = await enrichParentProfile(user._id);
        // Inject relation from User.parentProfile
        if (enrichment.roleData && user.parentProfile) {
          enrichment.roleData.relation = user.parentProfile.relation || null;
          enrichment.roleData.studentUsn = user.parentProfile.studentUsn || null;
        }
        break;
    }

    const responseData = {
      ...user,
      roleData: enrichment.roleData,
      stats: enrichment.stats,
    };

    // Include placementProfile for students if available
    if (user.role === 'student' && enrichment.placementProfile) {
      responseData.placementProfile = enrichment.placementProfile;
    }

    return ApiResponse.success(res, responseData, 'Profile fetched');
  } catch (err) {
    console.error('Error in getMyProfile:', err);
    return ApiResponse.serverError(res, 'Failed to fetch profile');
  }
};

/**
 * PATCH /api/profile/me
 * Updates allowed profile fields. Protected fields are stripped.
 */
exports.updateMyProfile = async (req, res) => {
  try {
    const updates = { ...req.body };

    // Remove any protected fields that might have been sent
    PROTECTED_FIELDS.forEach((field) => delete updates[field]);

    if (updates.fullName && !updates.name) {
      updates.name = updates.fullName;
    }

    // If avatarDocumentId is supplied, verify ownership
    if (updates.avatarDocumentId) {
      const doc = await Document.findById(updates.avatarDocumentId);
      if (!doc || String(doc.uploadedBy) !== String(req.user.id)) {
        return ApiResponse.badRequest(res, 'Invalid avatar document');
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .select('-password -emailVerificationToken -resetPasswordToken -resetPasswordExpires -emailVerificationExpires -twoFactorSecret')
      .populate('avatarDocumentId')
      .populate('resumeReference')
      .populate('certifications.documentRef')
      .lean();

    // Audit logging – use existing AuditService.logAction
    await AuditService.logAction({
      actorId: req.user.id,
      actorRole: req.user.role || 'unknown',
      actorName: updatedUser?.name || req.user.email || 'User',
      action: 'profile_updated',
      entity: 'User',
      entityId: req.user.id,
      newValue: updates,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || '',
      description: 'User updated their own profile',
    });

    return ApiResponse.success(res, updatedUser, 'Profile updated');
  } catch (err) {
    console.error('Error in updateMyProfile:', err);
    if (err.name === 'ValidationError') {
      return ApiResponse.badRequest(res, err.message);
    }
    return ApiResponse.serverError(res, 'Failed to update profile');
  }
};

/**
 * POST /api/profile/avatar
 * Uploads an avatar image and sets avatarDocumentId on User for any authenticated role.
 */
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return ApiResponse.badRequest(res, 'No image file uploaded');
    }

    // Find studentId if user is a student, or null/fallback
    const student = await Student.findOne({ userId: req.user._id || req.user.id });
    
    // Create Document record
    const initialVersion = {
      versionNumber: 1,
      filename: req.file.filename || req.file.originalname,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      storagePath: req.file.path,
      uploadedAt: new Date(),
      uploadedBy: req.user._id || req.user.id,
    };

    const doc = await Document.create({
      studentId: student ? student._id : (req.user._id || req.user.id),
      category: 'Institutional',
      documentType: 'Avatar',
      title: `${req.user.name || 'User'} Profile Avatar`,
      description: 'Profile photo',
      visibility: 'institution_visible',
      status: 'active',
      versions: [initialVersion],
      uploadedBy: req.user._id || req.user.id,
    });

    // Update user's avatarDocumentId
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id || req.user.id,
      { $set: { avatarDocumentId: doc._id } },
      { new: true }
    )
      .select('-password -emailVerificationToken -resetPasswordToken -resetPasswordExpires -emailVerificationExpires -twoFactorSecret')
      .populate('avatarDocumentId')
      .lean();

    return ApiResponse.success(
      res,
      { avatarDocumentId: doc._id, user: updatedUser },
      'Profile photo uploaded successfully'
    );
  } catch (err) {
    console.error('Error in uploadAvatar:', err);
    return ApiResponse.serverError(res, err.message || 'Failed to upload avatar');
  }
};

