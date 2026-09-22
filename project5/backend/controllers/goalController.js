const GoalService = require('../services/goalService');
const { Student } = require('../models');
const ApiResponse = require('../utils/apiResponse');

class GoalController {
  static async createGoal(req, res, next) {
    try {
      const goal = await GoalService.createGoal(req.user._id, req.body);
      return ApiResponse.created(res, goal, 'Goal created successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getGoals(req, res, next) {
    try {
      let studentId = req.params.studentId;
      if (!studentId && req.user.role === 'student') {
        const student = await Student.findOne({ userId: req.user._id });
        if (student) studentId = student._id;
      }
      const goals = await GoalService.getGoals(studentId);
      return ApiResponse.success(res, goals, 'Goals retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async updateGoal(req, res, next) {
    try {
      const goal = await GoalService.updateGoal(req.params.id, req.user._id, req.body);
      return ApiResponse.success(res, goal, 'Goal updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async deleteGoal(req, res, next) {
    try {
      await GoalService.deleteGoal(req.params.id, req.user._id);
      return ApiResponse.success(res, null, 'Goal deleted');
    } catch (err) {
      next(err);
    }
  }

  static async toggleMilestone(req, res, next) {
    try {
      const goal = await GoalService.toggleMilestone(req.params.id, req.user._id, req.params.index);
      return ApiResponse.success(res, goal, 'Milestone status toggled');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = GoalController;
