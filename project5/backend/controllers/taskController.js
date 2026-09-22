const TaskService = require('../services/taskService');
const ApiResponse = require('../utils/apiResponse');

class TaskController {
  static async createTask(req, res, next) {
    try {
      const task = await TaskService.createTask(req.user, req.body);
      return ApiResponse.created(res, task, 'Task created successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getTasks(req, res, next) {
    try {
      const data = await TaskService.getTasks(req.user, req.query);
      return ApiResponse.success(res, data, 'Tasks retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getTaskById(req, res, next) {
    try {
      const task = await TaskService.getTaskById(req.params.id, req.user);
      return ApiResponse.success(res, task, 'Task details retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async updateTask(req, res, next) {
    try {
      const task = await TaskService.updateTask(req.params.id, req.user, req.body);
      return ApiResponse.success(res, task, 'Task updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async updateStatus(req, res, next) {
    try {
      const { status } = req.body;
      const task = await TaskService.updateStatus(req.params.id, req.user, status);
      return ApiResponse.success(res, task, 'Task status updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async deleteTask(req, res, next) {
    try {
      await TaskService.deleteTask(req.params.id, req.user);
      return ApiResponse.success(res, null, 'Task deleted successfully');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = TaskController;
