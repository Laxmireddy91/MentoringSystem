const AllocationService = require('../services/allocationService');
const ApiResponse = require('../utils/apiResponse');

class AllocationController {
  static async getMetrics(req, res, next) {
    try {
      const department = req.query.department || req.user.department || 'ALL';
      const result = await AllocationService.getCoordinatorMetrics(department);
      return ApiResponse.success(res, result, 'Coordinator metrics retrieved');
    } catch (err) {
      next(err);
    }
  }

  // Handles GET /capacity
  static async getCapacity(req, res, next) {
    try {
      const department = req.query.department || req.user.department || 'ALL';
      const { batch, semester } = req.query;
      const result = await AllocationService.calculateCapacity({ department, batch, semester });
      return ApiResponse.success(res, result, 'Capacity calculation complete');
    } catch (err) {
      next(err);
    }
  }

  // Handles POST /capacity
  static async calculateCapacity(req, res, next) {
    try {
      const { department, batch, semester } = req.body;
      const dept = department || req.user.department || 'ALL';
      const result = await AllocationService.calculateCapacity({ department: dept, batch, semester });
      return ApiResponse.success(res, result, 'Capacity calculation complete');
    } catch (err) {
      next(err);
    }
  }

  static async previewAllocation(req, res, next) {
    try {
      const { department, batch, semester, academicYear, mode, sectionPreference } = req.body;
      const dept = department || req.user.department || 'ALL';
      const result = await AllocationService.generateAllocationPreview({
        department: dept,
        batch,
        semester,
        academicYear,
        mode: mode || 'incremental',
        sectionPreference: sectionPreference !== false,
      });
      return ApiResponse.success(res, result, 'Allocation preview generated');
    } catch (err) {
      next(err);
    }
  }

  static async confirmAllocation(req, res, next) {
    try {
      const { allocationData, assignments, notes, academicYear, mode, department, semester, batch } = req.body;
      const result = await AllocationService.confirmAllocation({
        allocationData,
        assignments,
        coordinatorUser: req.user,
        notes,
        academicYear,
        mode,
        department,
        semester,
        batch,
      });
      return ApiResponse.success(res, result, 'Mentor-mentee allocation confirmed and saved');
    } catch (err) {
      next(err);
    }
  }

  static async reassignStudent(req, res, next) {
    try {
      const { studentId, newMentorId, reason } = req.body;
      const result = await AllocationService.reassignStudent({
        studentId,
        newMentorId,
        reason,
        coordinatorUser: req.user,
      });
      return ApiResponse.success(res, result, result.message);
    } catch (err) {
      next(err);
    }
  }

  static async toggleMentorStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const result = await AllocationService.toggleMentorStatus(id, isActive, req.user);
      return ApiResponse.success(res, result, result.message);
    } catch (err) {
      next(err);
    }
  }

  static async getHistory(req, res, next) {
    try {
      const department = req.query.department || req.user.department || 'ALL';
      const result = await AllocationService.getAllocationHistory(department);
      return ApiResponse.success(res, result, 'Allocation history retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async getBatchById(req, res, next) {
    try {
      const result = await AllocationService.getAllocationBatchById(req.params.id);
      return ApiResponse.success(res, result, 'Allocation batch details retrieved');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AllocationController;
