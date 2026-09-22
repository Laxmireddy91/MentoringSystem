const ExamRequestService = require('../services/examRequestService');
const { Student, Mentor } = require('../models');
const ApiResponse = require('../utils/apiResponse');

class ExamRequestController {
  static async create(req, res, next) {
    try {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student) return ApiResponse.forbidden(res, 'Student profile not found');
      const request = await ExamRequestService.createRequest(student._id, req.body, req.user);
      return ApiResponse.created(res, request, 'Exam permission request submitted successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getMyRequests(req, res, next) {
    try {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student) return ApiResponse.forbidden(res, 'Student profile not found');
      const requests = await ExamRequestService.getStudentRequests(student._id);
      return ApiResponse.success(res, requests, 'Student exam requests retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async getMentorRequests(req, res, next) {
    try {
      const mentor = await Mentor.findOne({ userId: req.user._id });
      if (!mentor) return ApiResponse.forbidden(res, 'Mentor profile not found');
      const requests = await ExamRequestService.getMentorRequests(mentor._id);
      return ApiResponse.success(res, requests, 'Mentee exam requests retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async mentorReview(req, res, next) {
    try {
      const updated = await ExamRequestService.mentorReview(req.params.id, req.body, req.user);
      return ApiResponse.success(res, updated, 'Mentor review recorded');
    } catch (err) {
      next(err);
    }
  }

  static async getCoordinatorRequests(req, res, next) {
    try {
      const department = req.query.department || req.user.department || 'ALL';
      const requests = await ExamRequestService.getCoordinatorRequests(department);
      return ApiResponse.success(res, requests, 'Exam Coordinator requests retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async coordinatorDecision(req, res, next) {
    try {
      const updated = await ExamRequestService.coordinatorDecision(req.params.id, req.body, req.user);
      return ApiResponse.success(res, updated, 'Exam Coordinator decision recorded');
    } catch (err) {
      next(err);
    }
  }

  static async getById(req, res, next) {
    try {
      const request = await ExamRequestService.getRequestById(req.params.id);
      return ApiResponse.success(res, request, 'Exam request details retrieved');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ExamRequestController;
