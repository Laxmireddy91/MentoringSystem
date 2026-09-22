const { Notification } = require('../models');
const AppError = require('../utils/AppError');

class NotificationService {
  /**
   * Get paginated notifications with unread count and category filter
   */
  static async getUserNotifications(userId, { category = '', isRead = '', page = 1, limit = 20 }) {
    const query = { recipientId: userId };

    if (category) {
      query.category = category;
    }

    if (isRead !== '') {
      query.isRead = isRead === 'true' || isRead === true;
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const notifications = await Notification.find(query)
      .populate('senderId', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ recipientId: userId, isRead: false });

    return {
      notifications,
      unreadCount,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    };
  }

  /**
   * Mark single notification as read
   */
  static async markAsRead(notificationId, userId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipientId: userId },
      { $set: { isRead: true, readAt: new Date() } },
      { new: true }
    );
    if (!notification) throw new AppError('Notification not found', 404);
    return notification;
  }

  /**
   * Mark all unread notifications as read
   */
  static async markAllAsRead(userId) {
    const result = await Notification.updateMany(
      { recipientId: userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Delete single notification
   */
  static async deleteNotification(notificationId, userId) {
    const notification = await Notification.findOneAndDelete({ _id: notificationId, recipientId: userId });
    if (!notification) throw new AppError('Notification not found', 404);
    return { success: true };
  }

  /**
   * Clear all notifications for user
   */
  static async clearAllNotifications(userId) {
    const result = await Notification.deleteMany({ recipientId: userId });
    return { deletedCount: result.deletedCount };
  }
}

module.exports = NotificationService;
