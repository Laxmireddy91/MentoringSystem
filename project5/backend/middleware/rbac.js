const ApiResponse = require('../utils/apiResponse');
const { Student, Mentor } = require('../models');

/**
 * Require specific user role(s)
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, 'Authentication required');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return ApiResponse.forbidden(
        res,
        `Access denied: requires one of the following roles: [${allowedRoles.join(', ')}]`
      );
    }

    next();
  };
};

/**
 * Verify relationship ownership for student-specific resources
 * HOD has department-wide access
 * Mentor can only access assigned mentees
 * Student can only access their own records
 * Parent can only access their linked child's records
 */
const requireStudentRelationship = async (req, res, next) => {
  try {
    const studentIdentifier = req.params.studentId || req.params.id || req.body.studentId;
    if (!studentIdentifier) {
      return ApiResponse.badRequest(res, 'Student identifier missing');
    }

    // Lookup student by ID or USN or userId
    let student = null;
    if (studentIdentifier.match(/^[0-9a-fA-F]{24}$/)) {
      student = await Student.findOne({
        $or: [{ _id: studentIdentifier }, { userId: studentIdentifier }],
      });
    } else {
      student = await Student.findOne({ usn: studentIdentifier.toUpperCase() });
    }

    if (!student) {
      return ApiResponse.notFound(res, 'Student record not found');
    }

    const { user } = req;

    // HOD and Mentoring Coordinator have access across authorized department
    if (user.role === 'hod' || user.role === 'mentoring_coordinator') {
      if (user.department && user.department !== 'ALL' && user.department !== 'General') {
        if (student.department && student.department !== user.department) {
          return ApiResponse.forbidden(
            res,
            'Access denied: You can only access students within your authorized department'
          );
        }
      }
      req.targetStudent = student;
      return next();
    }

    // Exam Coordinator and TPO have institutional access to student academic/profile records
    if (user.role === 'exam_coordinator' || user.role === 'tpo') {
      req.targetStudent = student;
      return next();
    }

    // Student can only access their own record
    if (user.role === 'student') {
      if (student.userId.toString() !== user._id.toString()) {
        return ApiResponse.forbidden(res, 'Access denied: You can only access your own student records');
      }
      req.targetStudent = student;
      return next();
    }

    // Mentor can only access assigned mentees
    if (user.role === 'mentor') {
      const mentorDoc = await Mentor.findOne({ userId: user._id });
      if (!mentorDoc || !student.mentorId || student.mentorId.toString() !== mentorDoc._id.toString()) {
        return ApiResponse.forbidden(
          res,
          'Access denied: You are not authorized to view or modify this student (not your assigned mentee)'
        );
      }
      req.targetStudent = student;
      req.mentorDoc = mentorDoc;
      return next();
    }

    // Parent can only access linked child
    if (user.role === 'parent') {
      const isLinkedByUserId = student.parentUserId && student.parentUserId.toString() === user._id.toString();
      const isLinkedByEmail = student.parentEmail && user.email && student.parentEmail.toLowerCase() === user.email.toLowerCase();
      if (!isLinkedByUserId && !isLinkedByEmail) {
        return ApiResponse.forbidden(res, 'Access denied: You can only view your linked ward');
      }
      req.targetStudent = student;
      return next();
    }

    return ApiResponse.forbidden(res, 'Unauthorized to access this student resource');
  } catch (err) {
    return ApiResponse.error(res, `Relationship authorization error: ${err.message}`);
  }
};

module.exports = {
  authorize,
  requireStudentRelationship,
};
