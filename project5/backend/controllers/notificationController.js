const NotificationService = require('../services/notificationService');
const ApiResponse = require('../utils/apiResponse');

class NotificationController {
  static async getNotifications(req, res, next) {
    try {
      const data = await NotificationService.getUserNotifications(req.user._id, req.query);
      return ApiResponse.success(res, data, 'Notifications retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async markAsRead(req, res, next) {
    try {
      const notification = await NotificationService.markAsRead(req.params.id, req.user._id);
      return ApiResponse.success(res, notification, 'Notification marked as read');
    } catch (err) {
      next(err);
    }
  }

  static async markAllAsRead(req, res, next) {
    try {
      const result = await NotificationService.markAllAsRead(req.user._id);
      return ApiResponse.success(res, result, 'All notifications marked as read');
    } catch (err) {
      next(err);
    }
  }

  static async deleteNotification(req, res, next) {
    try {
      await NotificationService.deleteNotification(req.params.id, req.user._id);
      return ApiResponse.success(res, null, 'Notification removed');
    } catch (err) {
      next(err);
    }
  }

  static async clearAll(req, res, next) {
    try {
      const result = await NotificationService.clearAllNotifications(req.user._id);
      return ApiResponse.success(res, result, 'All notifications cleared');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = NotificationController;
