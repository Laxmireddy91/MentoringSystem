const { ExamRequest, Student, Mentor, User, Notification, AuditLog } = require('../models');
const { REQUEST_STATUS, NOTIFICATION_CATEGORIES } = require('../config/constants');
const AppError = require('../utils/AppError');

class ExamRequestService {
  /**
   * Student submits a permission request (CIE Re-test, Attendance Condonation, Exam Permission)
   */
  static async createRequest(studentId, data, studentUser) {
    const student = await Student.findById(studentId).populate('mentorId');
    if (!student) throw new AppError('Student record not found', 404);

    const initialTimeline = [
      {
        stage: 'SUBMITTED',
        actor: studentUser._id,
        actorName: studentUser.name,
        action: 'Request Submitted',
        remarks: data.reason || 'Permission request submitted by student',
        timestamp: new Date(),
      },
    ];

    const examRequest = await ExamRequest.create({
      studentId,
      mentorId: student.mentorId?._id || null,
      requestType: data.requestType,
      title: data.title || data.reason || `${(data.requestType || 'Permission').replace('_', ' ').toUpperCase()} Request`,
      subjectCode: (data.subjectCode || '').toUpperCase(),
      subjectName: data.subjectName || '',
      semester: data.semester || student.semester,
      academicYear: data.academicYear || new Date().getFullYear().toString(),
      reason: data.reason || '',
      description: data.description || '',
      documents: data.documents || [],
      status: REQUEST_STATUS.SUBMITTED,
      timeline: initialTimeline,
    });

    // Notify assigned mentor
    if (student.mentorId?.userId) {
      await Notification.create({
        recipientId: student.mentorId.userId,
        title: `New Permission Request: ${student.usn}`,
        message: `${studentUser.name} (${student.usn}) has submitted a ${data.requestType?.replace('_', ' ').toUpperCase()} request for ${data.subjectCode || 'Exam'}.`,
        category: NOTIFICATION_CATEGORIES.EXAM_REQUEST,
      }).catch(() => null);
    }

    return examRequest;
  }

  /**
   * Get student's own requests
   */
  static async getStudentRequests(studentId) {
    return ExamRequest.find({ studentId }).sort({ createdAt: -1 });
  }

  /**
   * Get requests pending mentor review for an assigned mentor
   */
  static async getMentorRequests(mentorId) {
    return ExamRequest.find({ mentorId })
      .populate({
        path: 'studentId',
        select: 'usn department semester',
        populate: { path: 'userId', select: 'name email avatar' },
      })
      .sort({ createdAt: -1 });
  }

  /**
   * Mentor review step: Forward to Exam Coordinator or Reject
   */
  static async mentorReview(requestId, { action, remarks }, mentorUser) {
    const request = await ExamRequest.findById(requestId).populate('studentId');
    if (!request) throw new AppError('Exam request not found', 404);

    if (request.status !== REQUEST_STATUS.SUBMITTED && request.status !== REQUEST_STATUS.CLARIFICATION_NEEDED) {
      throw new AppError('Request is not in a reviewable stage for mentor', 400);
    }

    const isForward = action === 'forward' || action === 'approve';
    const newStatus = isForward ? REQUEST_STATUS.COORDINATOR_REVIEW : REQUEST_STATUS.REJECTED;

    request.status = newStatus;
    request.mentorDecision = {
      decision: isForward ? 'approved' : 'rejected',
      decidedBy: mentorUser._id,
      decidedByName: mentorUser.name,
      decidedAt: new Date(),
      remarks: remarks || '',
    };

    request.timeline.push({
      stage: isForward ? 'MENTOR_REVIEWED' : 'MENTOR_REJECTED',
      actor: mentorUser._id,
      actorName: mentorUser.name,
      action: isForward ? 'Reviewed and Forwarded to Exam Coordinator' : 'Rejected by Mentor',
      remarks: remarks || '',
      timestamp: new Date(),
    });

    await request.save();

    // Notify student
    const student = await Student.findById(request.studentId).populate('userId');
    if (student?.userId?._id) {
      await Notification.create({
        recipientId: student.userId._id,
        title: `Exam Request Update: ${request.subjectCode}`,
        message: isForward
          ? `Your mentor ${mentorUser.name} has forwarded your request to the Exam Coordinator.`
          : `Your mentor ${mentorUser.name} rejected your request. Remarks: ${remarks}`,
        category: NOTIFICATION_CATEGORIES.EXAM_REQUEST,
      }).catch(() => null);
    }

    // If forwarded, notify Exam Coordinators
    if (isForward) {
      const examCoordinators = await User.find({ role: 'exam_coordinator', isActive: true });
      for (const ec of examCoordinators) {
        await Notification.create({
          recipientId: ec._id,
          title: `Pending Exam Request: ${request.subjectCode}`,
          message: `Request for student ${student?.usn} forwarded by mentor ${mentorUser.name} awaiting your approval.`,
          category: NOTIFICATION_CATEGORIES.EXAM_REQUEST,
        }).catch(() => null);
      }
    }

    return request;
  }

  /**
   * Get all requests forwarded to Exam Coordinator
   */
  static async getCoordinatorRequests(department = 'ALL') {
    const query = { status: { $in: [REQUEST_STATUS.COORDINATOR_REVIEW, REQUEST_STATUS.APPROVED, REQUEST_STATUS.REJECTED] } };
    return ExamRequest.find(query)
      .populate({
        path: 'studentId',
        select: 'usn department semester',
        populate: { path: 'userId', select: 'name email' },
      })
      .populate({
        path: 'mentorId',
        select: 'employeeId',
        populate: { path: 'userId', select: 'name' },
      })
      .sort({ createdAt: -1 });
  }

  /**
   * Exam Coordinator decision: Final Approve or Reject
   */
  static async coordinatorDecision(requestId, { action, remarks }, coordinatorUser) {
    const request = await ExamRequest.findById(requestId).populate('studentId').populate('mentorId');
    if (!request) throw new AppError('Exam request not found', 404);

    if (request.status !== REQUEST_STATUS.COORDINATOR_REVIEW) {
      throw new AppError('Request is not currently pending Exam Coordinator decision', 400);
    }

    const isApprove = action === 'approve';
    request.status = isApprove ? REQUEST_STATUS.APPROVED : REQUEST_STATUS.REJECTED;
    request.coordinatorDecision = {
      decision: isApprove ? 'approved' : 'rejected',
      decidedBy: coordinatorUser._id,
      decidedByName: coordinatorUser.name,
      decidedAt: new Date(),
      remarks: remarks || '',
    };

    request.timeline.push({
      stage: isApprove ? 'COORDINATOR_APPROVED' : 'COORDINATOR_REJECTED',
      actor: coordinatorUser._id,
      actorName: coordinatorUser.name,
      action: isApprove ? 'Final Approval Granted by Exam Coordinator' : 'Rejected by Exam Coordinator',
      remarks: remarks || '',
      timestamp: new Date(),
    });

    await request.save();

    // Log to AuditLog
    await AuditLog.create({
      actorId: coordinatorUser._id,
      actorRole: coordinatorUser.role,
      actorName: coordinatorUser.name,
      action: isApprove ? 'EXAM_REQUEST_APPROVED' : 'EXAM_REQUEST_REJECTED',
      entity: 'ExamRequest',
      entityId: request._id,
      newValue: { status: request.status, remarks },
      description: `Exam request ${request._id} (${request.requestType}) for subject ${request.subjectCode} ${request.status}.`,
    });

    // Notify Student
    const student = await Student.findById(request.studentId).populate('userId');
    if (student?.userId?._id) {
      await Notification.create({
        recipientId: student.userId._id,
        title: `Exam Request ${isApprove ? 'Approved' : 'Rejected'}: ${request.subjectCode}`,
        message: `Your ${request.requestType?.replace('_', ' ')} request has been ${request.status} by Exam Coordinator ${coordinatorUser.name}.`,
        category: NOTIFICATION_CATEGORIES.EXAM_REQUEST,
      }).catch(() => null);
    }

    // Notify Mentor
    if (request.mentorId?.userId) {
      await Notification.create({
        recipientId: request.mentorId.userId,
        title: `Mentee Exam Request Decision: ${student?.usn}`,
        message: `Request for ${student?.usn} (${request.subjectCode}) has been ${request.status} by Exam Coordinator.`,
        category: NOTIFICATION_CATEGORIES.EXAM_REQUEST,
      }).catch(() => null);
    }

    return request;
  }

  /**
   * Get single request with full timeline
   */
  static async getRequestById(requestId) {
    const request = await ExamRequest.findById(requestId)
      .populate({
        path: 'studentId',
        select: 'usn department semester',
        populate: { path: 'userId', select: 'name email avatar' },
      })
      .populate({
        path: 'mentorId',
        select: 'employeeId',
        populate: { path: 'userId', select: 'name email' },
      });
    if (!request) throw new AppError('Exam request not found', 404);
    return request;
  }
}

module.exports = ExamRequestService;
