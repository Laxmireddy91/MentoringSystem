const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const { User, Student, Mentor, Session, Feedback } = require('../models');
const { generateAccessToken } = require('../utils/tokenUtils');

describe('Mentoring Sessions & Booking Integration Tests', () => {
  let mentorUser, mentorDoc, mentorToken;
  let studentUser, studentDoc, studentToken;
  let unassignedStudentUser, unassignedStudentToken;
  let createdSessionId;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_mentoring_system_test');
    }

    await User.deleteMany({ email: { $in: ['m_sess@test.com', 'st_sess1@test.com', 'st_sess2@test.com'] } });
    await Student.deleteMany({ usn: { $in: ['1MS21CS111', '1MS21CS222'] } });
    await Mentor.deleteMany({ employeeId: 'EMP_SESS' });
    await Session.deleteMany({});
    await Feedback.deleteMany({});

    // 1. Mentor
    mentorUser = await User.create({
      name: 'Dr. Session Mentor',
      email: 'm_sess@test.com',
      password: 'Password@123',
      role: 'mentor',
      department: 'CSE',
    });
    mentorDoc = await Mentor.create({
      userId: mentorUser._id,
      employeeId: 'EMP_SESS',
      department: 'CSE',
      maxMentees: 25,
      officeHours: [
        {
          dayOfWeek: 2,
          dayName: 'Tuesday',
          startTime: '14:00',
          endTime: '16:00',
          slotDurationMinutes: 30,
          location: 'Room 201',
          isActive: true,
        },
      ],
    });
    mentorToken = generateAccessToken(mentorUser);

    // 2. Assigned Student
    studentUser = await User.create({
      name: 'Assigned Mentee',
      email: 'st_sess1@test.com',
      password: 'Password@123',
      role: 'student',
      department: 'CSE',
    });
    studentDoc = await Student.create({
      userId: studentUser._id,
      usn: '1MS21CS111',
      department: 'CSE',
      semester: 5,
      mentorId: mentorDoc._id,
    });
    studentToken = generateAccessToken(studentUser);

    // 3. Unassigned Student
    unassignedStudentUser = await User.create({
      name: 'Unassigned Mentee',
      email: 'st_sess2@test.com',
      password: 'Password@123',
      role: 'student',
      department: 'CSE',
    });
    await Student.create({
      userId: unassignedStudentUser._id,
      usn: '1MS21CS222',
      department: 'CSE',
      semester: 5,
      mentorId: null, // no mentor assigned
    });
    unassignedStudentToken = generateAccessToken(unassignedStudentUser);
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $in: ['m_sess@test.com', 'st_sess1@test.com', 'st_sess2@test.com'] } });
    await Student.deleteMany({ usn: { $in: ['1MS21CS111', '1MS21CS222'] } });
    await Mentor.deleteMany({ employeeId: 'EMP_SESS' });
    await Session.deleteMany({});
    await Feedback.deleteMany({});
    await mongoose.disconnect();
  });

  describe('Session Scheduling & Conflict Handling', () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const startHour10 = new Date(tomorrow.setHours(10, 0, 0, 0)).toISOString();
    const endHour1030 = new Date(tomorrow.setHours(10, 30, 0, 0)).toISOString();
    const startHour1015 = new Date(tomorrow.setHours(10, 15, 0, 0)).toISOString();
    const endHour1045 = new Date(tomorrow.setHours(10, 45, 0, 0)).toISOString();

    it('should allow mentor to create a scheduled session', async () => {
      const res = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${mentorToken}`)
        .send({
          studentId: studentDoc._id.toString(),
          title: 'Career & Internship Guidance',
          sessionType: 'career',
          startTime: startHour10,
          endTime: endHour1030,
          meetingType: 'offline',
          location: 'Cabin 102',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('scheduled');
      createdSessionId = res.body.data._id;
    });

    it('should detect collision and reject overlapping session creation', async () => {
      const res = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${mentorToken}`)
        .send({
          studentId: studentDoc._id.toString(),
          title: 'Duplicate Time Slot Attempt',
          sessionType: 'academic',
          startTime: startHour1015, // overlaps with 10:00 - 10:30
          endTime: endHour1045,
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('conflicts');
    });

    it('should reject unassigned student from booking slot with unrelated mentor', async () => {
      const dayAfter = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const slotStart = new Date(dayAfter.setHours(14, 0, 0, 0)).toISOString();
      const slotEnd = new Date(dayAfter.setHours(14, 30, 0, 0)).toISOString();

      const res = await request(app)
        .post('/api/sessions/book')
        .set('Authorization', `Bearer ${unassignedStudentToken}`)
        .send({
          mentorId: mentorDoc._id.toString(),
          title: 'Unauthorized Booking Attempt',
          startTime: slotStart,
          endTime: slotEnd,
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow assigned student to book an office hours slot', async () => {
      const dayAfter = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const slotStart = new Date(dayAfter.setHours(14, 0, 0, 0)).toISOString();
      const slotEnd = new Date(dayAfter.setHours(14, 30, 0, 0)).toISOString();

      const res = await request(app)
        .post('/api/sessions/book')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          mentorId: mentorDoc._id.toString(),
          title: 'Doubt Clearing on Graph Algorithms',
          startTime: slotStart,
          endTime: slotEnd,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('confirmed');
    });

    it('should update session status to completed and allow student feedback rating', async () => {
      // 1. Mentor marks session as completed
      const updateRes = await request(app)
        .patch(`/api/sessions/${createdSessionId}/status`)
        .set('Authorization', `Bearer ${mentorToken}`)
        .send({
          status: 'completed',
          mentorNotes: 'Student has clear roadmap for semester end exams.',
          actionItems: [{ task: 'Complete Trees assignment', completed: false }],
        });

      expect(updateRes.statusCode).toBe(200);
      expect(updateRes.body.data.status).toBe('completed');

      // 2. Student submits rating feedback
      const feedbackRes = await request(app)
        .post(`/api/students/sessions/${createdSessionId}/feedback`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          rating: 5,
          comment: 'Very helpful and actionable discussion!',
          aspects: { punctuality: 5, helpfulness: 5, clarity: 5 },
        });

      expect(feedbackRes.statusCode).toBe(201);
      expect(feedbackRes.body.success).toBe(true);

      // 3. Verify mentor aggregated rating updated
      const updatedMentor = await Mentor.findById(mentorDoc._id);
      expect(updatedMentor.ratingAverage).toBe(5);
      expect(updatedMentor.totalRatings).toBe(1);
    });
  });
});
