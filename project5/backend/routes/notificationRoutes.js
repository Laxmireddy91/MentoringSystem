const express = require('express');
const router = express.Router();

const NotificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// Get paginated notifications
router.get('/', NotificationController.getNotifications);

// Bulk mark all as read
router.patch('/read-all', NotificationController.markAllAsRead);

// Clear all notifications
router.delete('/clear-all', NotificationController.clearAll);

// Mark single notification as read
router.patch('/:id/read', NotificationController.markAsRead);

// Delete single notification
router.delete('/:id', NotificationController.deleteNotification);

module.exports = router;
