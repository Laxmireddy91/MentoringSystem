const RiskService = require('../services/riskService');
const { Student } = require('../models');
const ApiResponse = require('../utils/apiResponse');

class RiskController {
  static async getSettings(req, res, next) {
    try {
      const department = req.query.department || req.user.department || 'ALL';
      const settings = await RiskService.getSettings(department);
      return ApiResponse.success(res, settings, 'Risk settings retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async updateSettings(req, res, next) {
    try {
      const department = req.body.department || req.user.department || 'ALL';
      const settings = await RiskService.updateSettings(department, req.body, req.user);
      return ApiResponse.success(res, settings, 'Risk settings updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async evaluateStudentRisk(req, res, next) {
    try {
      const studentId = req.params.studentId || req.targetStudent?._id;
      const riskProfile = await RiskService.updateAndPersistStudentRisk(studentId);
      return ApiResponse.success(res, riskProfile, 'Rule-based student risk analysis evaluated');
    } catch (err) {
      next(err);
    }
  }

  static async getMyRisk(req, res, next) {
    try {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student) return ApiResponse.notFound(res, 'Student profile not found');
      const risk = await RiskService.evaluateStudentRisk(student);
      return ApiResponse.success(res, risk, 'Student risk status');
    } catch (err) {
      next(err);
    }
  }

  static async recalculateAll(req, res, next) {
    try {
      const department = req.body.department || req.user.department || null;
      const result = await RiskService.recalculateAll(department);
      return ApiResponse.success(res, result, 'All students risk recalculated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getStudentRisk(req, res, next) {
    try {
      const studentId = req.params.studentId || req.targetStudent?._id;
      const student = await Student.findById(studentId);
      if (!student) return ApiResponse.notFound(res, 'Student not found');

      // Re-evaluate if not evaluated recently or return existing profile
      const risk = await RiskService.evaluateStudentRisk(student);
      return ApiResponse.success(res, risk, 'Student risk status');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = RiskController;
