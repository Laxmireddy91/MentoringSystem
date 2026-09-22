const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const { User, Notification } = require('../models');
const { generateAccessToken } = require('../utils/tokenUtils');

describe('Notification API Test Suite', () => {
  let user, token, testNotificationId;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_mentoring_system_test');
    }

    await User.deleteMany({ email: 'notif_user@test.com' });
    await Notification.deleteMany({});

    user = await User.create({
      name: 'Notification User',
      email: 'notif_user@test.com',
      password: 'Password@123',
      role: 'student',
      department: 'CSE',
    });
    token = generateAccessToken(user);

    // Create seed notifications
    const n1 = await Notification.create({
      recipientId: user._id,
      title: 'Marks Uploaded',
      message: 'Your CIE2 marks have been published.',
      category: 'academic',
    });
    testNotificationId = n1._id;

    await Notification.create({
      recipientId: user._id,
      title: 'Session Reminder',
      message: 'Mentoring session tomorrow at 10 AM.',
      category: 'session',
    });
  });

  afterAll(async () => {
    await User.deleteMany({ email: 'notif_user@test.com' });
    await Notification.deleteMany({});
    await mongoose.disconnect();
  });

  it('should list notifications with unread count', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.notifications.length).toBe(2);
    expect(res.body.data.unreadCount).toBe(2);
  });

  it('should filter notifications by category', async () => {
    const res = await request(app)
      .get('/api/notifications?category=academic')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.notifications.length).toBe(1);
    expect(res.body.data.notifications[0].category).toBe('academic');
  });

  it('should mark single notification as read', async () => {
    const res = await request(app)
      .patch(`/api/notifications/${testNotificationId}/read`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.isRead).toBe(true);
  });

  it('should mark all notifications as read', async () => {
    const res = await request(app)
      .patch('/api/notifications/read-all')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.modifiedCount).toBeGreaterThanOrEqual(1);
  });
});
