const SessionService = require('../services/sessionService');
const ApiResponse = require('../utils/apiResponse');

class SessionController {
  static async createSession(req, res, next) {
    try {
      const session = await SessionService.createSession(req.user._id, req.body);
      return ApiResponse.created(res, session, 'Mentoring session created successfully');
    } catch (err) {
      next(err);
    }
  }

  static async bookSlot(req, res, next) {
    try {
      const session = await SessionService.bookSlot(req.user._id, req.body);
      return ApiResponse.created(res, session, 'Mentoring slot booked successfully');
    } catch (err) {
      next(err);
    }
  }

  static async updateStatus(req, res, next) {
    try {
      const session = await SessionService.updateStatus({
        sessionId: req.params.sessionId,
        user: req.user,
        updateData: req.body,
      });
      return ApiResponse.success(res, session, `Session status updated to ${req.body.status}`);
    } catch (err) {
      next(err);
    }
  }

  static async getCalendarSessions(req, res, next) {
    try {
      const sessions = await SessionService.getCalendarSessions(req.user, req.query);
      return ApiResponse.success(res, sessions, 'Calendar sessions retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async getSessionById(req, res, next) {
    try {
      const { Session } = require('../models');
      const session = await Session.findById(req.params.id || req.params.sessionId)
        .populate({ path: 'mentorId', populate: { path: 'userId', select: 'name email avatar' } })
        .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email avatar' } })
        .populate('feedbackId');
      if (!session) return ApiResponse.notFound(res, 'Session not found');
      return ApiResponse.success(res, session, 'Session retrieved');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = SessionController;
