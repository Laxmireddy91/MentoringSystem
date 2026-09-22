const PlacementService = require('../services/placementService');
const { Student, Mentor } = require('../models');
const ApiResponse = require('../utils/apiResponse');

class PlacementController {
  static async createDrive(req, res, next) {
    try {
      const drive = await PlacementService.createDrive(req.body, req.user);
      return ApiResponse.created(res, drive, 'Placement drive created successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getDrives(req, res, next) {
    try {
      const filter = {
        status: req.query.status,
        department: req.query.department || req.user.department,
      };
      const drives = await PlacementService.getDrives(filter);
      return ApiResponse.success(res, drives, 'Placement drives retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async getDriveById(req, res, next) {
    try {
      const drive = await PlacementService.getDriveById(req.params.id);
      return ApiResponse.success(res, drive, 'Drive details retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async getEligibility(req, res, next) {
    try {
      const department = req.query.department || (req.user.role === 'tpo' ? 'ALL' : req.user.department) || 'ALL';
      const result = await PlacementService.calculateDriveEligibility(req.params.id, department);
      return ApiResponse.success(res, result, 'Eligibility evaluation complete');
    } catch (err) {
      next(err);
    }
  }

  static async apply(req, res, next) {
    try {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student) return ApiResponse.forbidden(res, 'Only registered students can apply');
      const application = await PlacementService.applyForDrive(student._id, req.params.id);
      return ApiResponse.created(res, application, 'Application submitted successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getApplications(req, res, next) {
    try {
      const applications = await PlacementService.getDriveApplications(req.params.id);
      return ApiResponse.success(res, applications, 'Drive applications retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async updateApplicationStatus(req, res, next) {
    try {
      const updated = await PlacementService.updateApplicationStatus(req.params.applicationId, req.body, req.user);
      return ApiResponse.success(res, updated, 'Application status updated');
    } catch (err) {
      next(err);
    }
  }

  static async getMentorPlacementReadiness(req, res, next) {
    try {
      const mentor = await Mentor.findOne({ userId: req.user._id });
      if (!mentor) return ApiResponse.forbidden(res, 'Mentor record not found');
      const roster = await PlacementService.getMenteePlacementReadiness(mentor._id);
      return ApiResponse.success(res, roster, 'Mentee placement readiness retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async getAnalytics(req, res, next) {
    try {
      const department = req.query.department || req.user.department || 'ALL';
      const analytics = await PlacementService.getPlacementAnalytics(department);
      return ApiResponse.success(res, analytics, 'Placement analytics retrieved');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = PlacementController;
