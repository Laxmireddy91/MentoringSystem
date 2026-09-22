const MentorService = require('../services/mentorService');
const ApiResponse = require('../utils/apiResponse');

class MentorController {
  static async getDashboard(req, res, next) {
    try {
      const data = await MentorService.getMentorDashboard(req.user._id);
      return ApiResponse.success(res, data, 'Mentor dashboard overview');
    } catch (err) {
      next(err);
    }
  }

  static async getAssignedStudents(req, res, next) {
    try {
      const data = await MentorService.getAssignedStudents(req.user._id, req.query);
      return ApiResponse.success(res, data.students, 'Assigned students retrieved', 200, data.pagination);
    } catch (err) {
      next(err);
    }
  }

  static async updateOfficeHours(req, res, next) {
    try {
      const officeHours = await MentorService.updateOfficeHours(req.user._id, req.body.officeHours);
      return ApiResponse.success(res, officeHours, 'Office hours updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getOfficeHours(req, res, next) {
    try {
      const data = await MentorService.getOfficeHours(req.params.mentorId);
      return ApiResponse.success(res, data, 'Mentor office hours availability');
    } catch (err) {
      next(err);
    }
  }

  static async getFeedbacks(req, res, next) {
    try {
      const data = await MentorService.getMentorFeedbacks(req.user._id);
      return ApiResponse.success(res, data, 'Mentor feedbacks retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async getAllMentors(req, res, next) {
    try {
      const { Mentor } = require('../models');
      const query = {};
      if (req.query.department) {
        query.department = req.query.department;
      }
      const mentors = await Mentor.find(query).populate('userId', 'name email phone avatar department');
      return ApiResponse.success(res, mentors, 'Mentors list retrieved');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = MentorController;
