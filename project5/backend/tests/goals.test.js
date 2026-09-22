const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const { User, Student, Mentor, StudentGoal, Achievement } = require('../models');
const { generateAccessToken } = require('../utils/tokenUtils');

describe('Student Goals & Achievements Integration Test Suite', () => {
  let mentorUser, mentorDoc, mentorToken;
  let studentUser, studentDoc, studentToken;
  let goalId, achievementId;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_mentoring_system_test');
    }

    await User.deleteMany({ email: { $in: ['m_goal@test.com', 'st_goal@test.com'] } });
    await Student.deleteMany({ usn: '1MS21CS555' });
    await Mentor.deleteMany({ employeeId: 'EMP_GOAL' });
    await StudentGoal.deleteMany({});
    await Achievement.deleteMany({});

    mentorUser = await User.create({
      name: 'Mentor Goal Admin',
      email: 'm_goal@test.com',
      password: 'Password@123',
      role: 'mentor',
      department: 'CSE',
    });
    mentorDoc = await Mentor.create({
      userId: mentorUser._id,
      employeeId: 'EMP_GOAL',
      department: 'CSE',
    });
    mentorToken = generateAccessToken(mentorUser);

    studentUser = await User.create({
      name: 'Goal Test Student',
      email: 'st_goal@test.com',
      password: 'Password@123',
      role: 'student',
      department: 'CSE',
    });
    studentDoc = await Student.create({
      userId: studentUser._id,
      usn: '1MS21CS555',
      department: 'CSE',
      semester: 4,
      mentorId: mentorDoc._id,
    });
    studentToken = generateAccessToken(studentUser);
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $in: ['m_goal@test.com', 'st_goal@test.com'] } });
    await Student.deleteMany({ usn: '1MS21CS555' });
    await Mentor.deleteMany({ employeeId: 'EMP_GOAL' });
    await StudentGoal.deleteMany({});
    await Achievement.deleteMany({});
    await mongoose.disconnect();
  });

  describe('Student Goals Operations', () => {
    it('should allow student to create a goal with milestones', async () => {
      const res = await request(app)
        .post('/api/goals')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Target CIE Score 90% in Machine Learning',
          category: 'academic',
          targetValue: 90,
          currentValue: 75,
          unit: '%',
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          milestones: [
            { title: 'Complete Assignment 1', completed: true },
            { title: 'Complete Lab Practicals', completed: false },
          ],
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('On Track');
      goalId = res.body.data._id;
    });

    it('should list goals with calculated progress percentage', async () => {
      const res = await request(app)
        .get(`/api/goals/student/${studentDoc._id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].progressPercent).toBe(83); // 75/90 * 100 = 83%
    });

    it('should update goal progress and mark as Achieved when target reached', async () => {
      const res = await request(app)
        .patch(`/api/goals/${goalId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          currentValue: 92,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('Achieved');
    });
  });

  describe('Student Achievements & Verification', () => {
    it('should allow student to upload an achievement certificate', async () => {
      const res = await request(app)
        .post('/api/achievements')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('title', '1st Place in National Hackathon 2026')
        .field('category', 'Hackathon')
        .field('issuer', 'IEEE Computer Society')
        .field('description', 'Built an AI-assisted diagnostic assistant');

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isVerified).toBe(false);
      achievementId = res.body.data._id;
    });

    it('should allow mentor to verify student achievement', async () => {
      const res = await request(app)
        .patch(`/api/achievements/${achievementId}/verify`)
        .set('Authorization', `Bearer ${mentorToken}`)
        .send({
          isVerified: true,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isVerified).toBe(true);
    });

    it('should stream downloadable ZIP bundle of achievements', async () => {
      const res = await request(app)
        .get(`/api/achievements/bundle/${studentDoc._id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('application/zip');
    });
  });
});
