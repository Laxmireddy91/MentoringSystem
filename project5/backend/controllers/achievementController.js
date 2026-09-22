const AchievementService = require('../services/achievementService');
const { Student } = require('../models');
const ApiResponse = require('../utils/apiResponse');

class AchievementController {
  static async uploadAchievement(req, res, next) {
    try {
      const achievement = await AchievementService.createAchievement(
        req.user._id,
        req.body,
        req.files || []
      );
      return ApiResponse.created(res, achievement, 'Achievement uploaded successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getStudentAchievements(req, res, next) {
    try {
      let studentId = req.params.studentId;
      if (!studentId && req.user.role === 'student') {
        const student = await Student.findOne({ userId: req.user._id });
        if (student) studentId = student._id;
      }
      const achievements = await AchievementService.getAchievements(studentId);
      return ApiResponse.success(res, achievements, 'Achievements retrieved');
    } catch (err) {
      next(err);
    }
  }

  // New: Mentor/ HOD can fetch pending achievements for review
  static async getPendingAchievements(req, res, next) {
    try {
      const pending = await AchievementService.getPendingAchievements(req.user);
      return ApiResponse.success(res, pending, 'Pending achievements retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async verifyAchievement(req, res, next) {
    try {
      const { isVerified, status, remarks, correctionNotes } = req.body;
      const finalStatus = status || (isVerified ? 'approved' : 'rejected');
      const achievement = await AchievementService.reviewAchievement(
        req.params.id,
        req.user,
        { status: finalStatus, remarks, correctionNotes }
      );
      return ApiResponse.success(
        res,
        achievement,
        `Achievement review updated: ${finalStatus.toUpperCase()}`
      );
    } catch (err) {
      next(err);
    }
  }

  static async reviewAchievement(req, res, next) {
    try {
      const { status, remarks, correctionNotes } = req.body;
      const achievement = await AchievementService.reviewAchievement(
        req.params.id,
        req.user,
        { status, remarks, correctionNotes }
      );
      return ApiResponse.success(
        res,
        achievement,
        `Achievement review recorded: ${status}`
      );
    } catch (err) {
      next(err);
    }
  }

  static async downloadZipBundle(req, res, next) {
    try {
      let studentId = req.params.studentId;
      if (!studentId && req.user.role === 'student') {
        const student = await Student.findOne({ userId: req.user._id });
        if (student) studentId = student._id;
      }
      await AchievementService.createZipBundle(studentId, res);
    } catch (err) {
      next(err);
    }
  }

  static async deleteAchievement(req, res, next) {
    try {
      const result = await AchievementService.deleteAchievement(req.params.id, req.user);
      return ApiResponse.success(res, null, result.message);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AchievementController;
