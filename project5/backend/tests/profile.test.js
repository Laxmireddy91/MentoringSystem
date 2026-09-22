const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const { User, Document } = require('../models');
const jwt = require('jsonwebtoken');

describe('Profile API', () => {
  let token;
  let user;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_mentoring_system_test');
    }
    await User.deleteMany({ email: 'testuser@example.com' });

    user = await User.create({
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'Password123',
      role: 'student',
      avatarDocumentId: null,
    });
    token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'testsecret', { expiresIn: '1h' });
  });

  afterAll(async () => {
    await User.deleteMany({ email: 'testuser@example.com' });
    await mongoose.disconnect();
  });

  test('GET /api/profile/me returns user profile', async () => {
    const res = await request(app)
      .get('/api/profile/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('testuser@example.com');
  });

  test('PATCH /api/profile/me updates allowed fields and avatarDocumentId', async () => {
    const fakeDocId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .patch('/api/profile/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ fullName: 'Updated Name', bio: 'Hello world', phone: '9876543210' })
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Updated Name');
    expect(res.body.data.bio).toBe('Hello world');
    expect(res.body.data.phone).toBe('9876543210');
  });

  test('PATCH rejects protected fields', async () => {
    const res = await request(app)
      .patch('/api/profile/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'mentor', usn: '12345' })
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('student');
    expect(res.body.data.usn).toBeUndefined();
  });
});
