const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const { User, Student, Mentor, Message, Notification } = require('../models');
const { generateAccessToken } = require('../utils/tokenUtils');

describe('Real-Time Messaging & Security Integration Tests', () => {
  let mentorUser, mentorDoc, mentorToken;
  let otherMentorUser, otherMentorToken;
  let studentUser, studentToken;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_mentoring_system_test');
    }

    await User.deleteMany({ email: { $in: ['m_msg1@test.com', 'm_msg2@test.com', 'st_msg1@test.com'] } });
    await Student.deleteMany({ usn: '1MS21CS333' });
    await Mentor.deleteMany({ employeeId: { $in: ['EMP_MSG1', 'EMP_MSG2'] } });
    await Message.deleteMany({});
    await Notification.deleteMany({});

    // 1. Mentor 1
    mentorUser = await User.create({
      name: 'Dr. Message Mentor',
      email: 'm_msg1@test.com',
      password: 'Password@123',
      role: 'mentor',
      department: 'CSE',
    });
    mentorDoc = await Mentor.create({
      userId: mentorUser._id,
      employeeId: 'EMP_MSG1',
      department: 'CSE',
    });
    mentorToken = generateAccessToken(mentorUser);

    // 2. Mentor 2 (Unrelated)
    otherMentorUser = await User.create({
      name: 'Dr. Other Mentor',
      email: 'm_msg2@test.com',
      password: 'Password@123',
      role: 'mentor',
      department: 'CSE',
    });
    await Mentor.create({
      userId: otherMentorUser._id,
      employeeId: 'EMP_MSG2',
      department: 'CSE',
    });
    otherMentorToken = generateAccessToken(otherMentorUser);

    // 3. Student (Assigned to Mentor 1)
    studentUser = await User.create({
      name: 'Messaging Student',
      email: 'st_msg1@test.com',
      password: 'Password@123',
      role: 'student',
      department: 'CSE',
    });
    await Student.create({
      userId: studentUser._id,
      usn: '1MS21CS333',
      department: 'CSE',
      semester: 5,
      mentorId: mentorDoc._id,
    });
    studentToken = generateAccessToken(studentUser);
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $in: ['m_msg1@test.com', 'm_msg2@test.com', 'st_msg1@test.com'] } });
    await Student.deleteMany({ usn: '1MS21CS333' });
    await Mentor.deleteMany({ employeeId: { $in: ['EMP_MSG1', 'EMP_MSG2'] } });
    await Message.deleteMany({});
    await Notification.deleteMany({});
    await mongoose.disconnect();
  });

  describe('Message Exchange & Authorization', () => {
    it('should allow student to send a message to assigned mentor', async () => {
      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          receiverId: mentorUser._id.toString(),
          content: 'Hello Professor, could we discuss the CIE3 marks breakdown?',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toContain('CIE3 marks');

      // Verify Notification was generated for Mentor
      const notif = await Notification.findOne({ recipientId: mentorUser._id, category: 'message' });
      expect(notif).toBeDefined();
    });

    it('should reject student attempting to send message to unassigned mentor (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          receiverId: otherMentorUser._id.toString(),
          content: 'Hello unrelated mentor',
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('assigned mentor');
    });

    it('should reject unassigned mentor attempting to message student (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${otherMentorToken}`)
        .send({
          receiverId: studentUser._id.toString(),
          content: 'Unsolicited mentor message',
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('assigned mentees');
    });

    it('should allow mentor to view conversation history with assigned mentee', async () => {
      const res = await request(app)
        .get(`/api/messages/user/${studentUser._id}`)
        .set('Authorization', `Bearer ${mentorToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should retrieve conversations summary list', async () => {
      const res = await request(app)
        .get('/api/messages/conversations')
        .set('Authorization', `Bearer ${mentorToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });
});
