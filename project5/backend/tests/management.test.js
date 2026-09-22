const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const { User, Student, Mentor, PerformanceSnapshot } = require('../models');
const { generateAccessToken } = require('../utils/tokenUtils');

describe('Academic Management & RBAC Integration Tests', () => {
  let mentorUser, mentorDoc, mentorToken;
  let otherMentorUser, otherMentorToken;
  let studentUser, studentDoc, studentToken;
  let hodUser, hodToken;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_mentoring_system_test');
    }

    // Clean test DB
    await User.deleteMany({ email: { $in: ['m1@test.com', 'm2@test.com', 'st1@test.com', 'hod1@test.com'] } });
    await Student.deleteMany({ usn: '1MS21CS001' });
    await Mentor.deleteMany({ employeeId: { $in: ['EMP_M1', 'EMP_M2'] } });
    await PerformanceSnapshot.deleteMany({});

    // 1. Create Mentor 1
    mentorUser = await User.create({
      name: 'Mentor One',
      email: 'm1@test.com',
      password: 'Password@123',
      role: 'mentor',
      department: 'CSE',
    });
    mentorDoc = await Mentor.create({
      userId: mentorUser._id,
      employeeId: 'EMP_M1',
      department: 'CSE',
      maxMentees: 20,
    });
    mentorToken = generateAccessToken(mentorUser);

    // 2. Create Mentor 2 (Other Mentor)
    otherMentorUser = await User.create({
      name: 'Mentor Two',
      email: 'm2@test.com',
      password: 'Password@123',
      role: 'mentor',
      department: 'CSE',
    });
    await Mentor.create({
      userId: otherMentorUser._id,
      employeeId: 'EMP_M2',
      department: 'CSE',
      maxMentees: 20,
    });
    otherMentorToken = generateAccessToken(otherMentorUser);

    // 3. Create Student (Assigned to Mentor 1)
    studentUser = await User.create({
      name: 'Student One',
      email: 'st1@test.com',
      password: 'Password@123',
      role: 'student',
      department: 'CSE',
    });
    studentDoc = await Student.create({
      userId: studentUser._id,
      usn: '1MS21CS001',
      department: 'CSE',
      semester: 5,
      mentorId: mentorDoc._id,
    });
    studentToken = generateAccessToken(studentUser);

    // 4. Create HOD
    hodUser = await User.create({
      name: 'HOD User',
      email: 'hod1@test.com',
      password: 'Password@123',
      role: 'hod',
      department: 'CSE',
    });
    hodToken = generateAccessToken(hodUser);
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $in: ['m1@test.com', 'm2@test.com', 'st1@test.com', 'hod1@test.com'] } });
    await Student.deleteMany({ usn: '1MS21CS001' });
    await Mentor.deleteMany({ employeeId: { $in: ['EMP_M1', 'EMP_M2'] } });
    await PerformanceSnapshot.deleteMany({});
    await mongoose.disconnect();
  });

  describe('Academic Marks Update & RBAC Protection', () => {
    const marksPayload = {
      semesterNumber: 5,
      subjects: [
        {
          subjectCode: 'CS501',
          subjectName: 'Software Engineering',
          credits: 4,
          cie1: 42,
          cie2: 46,
          cie3: 40,
          finalMarks: 44,
        },
        {
          subjectCode: 'CS502',
          subjectName: 'Computer Networks',
          credits: 4,
          cie1: 38,
          cie2: 40,
          cie3: 36,
          finalMarks: 38,
        },
      ],
      reason: 'CIE & Semester End Evaluation Entry',
    };

    it('should allow assigned mentor to update student marks and create snapshots', async () => {
      const res = await request(app)
        .put(`/api/academics/marks/${studentDoc._id}`)
        .set('Authorization', `Bearer ${mentorToken}`)
        .send(marksPayload);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.semester.sgpa).toBeGreaterThan(7.0);

      // Verify PerformanceSnapshot audit record was created
      const snapshots = await PerformanceSnapshot.find({ studentId: studentDoc._id });
      expect(snapshots.length).toBe(2);
      expect(snapshots[0].subjectCode).toBe('CS501');
    });

    it('should reject unassigned mentor attempting to modify marks (403 Forbidden)', async () => {
      const res = await request(app)
        .put(`/api/academics/marks/${studentDoc._id}`)
        .set('Authorization', `Bearer ${otherMentorToken}`)
        .send(marksPayload);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('not your assigned mentee');
    });

    it('should reject student attempting to modify official academic marks (403 Forbidden)', async () => {
      const res = await request(app)
        .put(`/api/academics/marks/${studentDoc._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send(marksPayload);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow student to view their own academic records as read-only', async () => {
      const res = await request(app)
        .get(`/api/academics/${studentDoc._id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.student.usn).toBe('1MS21CS001');
      expect(res.body.data.snapshots).toBeDefined();
    });
  });

  describe('HOD & Mentor Operations', () => {
    it('should allow HOD to view department analytics', async () => {
      const res = await request(app)
        .get('/api/hod/analytics')
        .set('Authorization', `Bearer ${hodToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.metrics.totalStudents).toBeGreaterThanOrEqual(1);
    });

    it('should allow mentor to update office hours', async () => {
      const officeHours = [
        {
          dayOfWeek: 1,
          dayName: 'Monday',
          startTime: '10:00',
          endTime: '12:00',
          slotDurationMinutes: 30,
          location: 'Cabin 304',
          isActive: true,
        },
      ];

      const res = await request(app)
        .put('/api/mentors/office-hours')
        .set('Authorization', `Bearer ${mentorToken}`)
        .send({ officeHours });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should allow student to update emergency contact details', async () => {
      const res = await request(app)
        .put('/api/students/me/emergency-contact')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          fatherName: 'Rajesh Sharma',
          motherName: 'Sunita Sharma',
          guardianRelationship: 'Father',
          guardianPhone: '9876543210',
          guardianEmail: 'rajesh@parent.com',
          emergencyContact: {
            name: 'Uncle Suresh',
            relationship: 'Uncle',
            phone: '9876543219',
            email: 'suresh@family.com',
          },
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.emergencyContact.name).toBe('Uncle Suresh');
    });

    it('should allow student to add and delete an online course', async () => {
      const addRes = await request(app)
        .post('/api/students/me/online-courses')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          courseName: 'Deep Learning Specialization',
          platform: 'Coursera',
          completionDate: new Date(),
          status: 'Completed',
        });

      expect(addRes.statusCode).toBe(201);
      expect(addRes.body.success).toBe(true);
      expect(addRes.body.data.courseName).toBe('Deep Learning Specialization');

      const courseId = addRes.body.data._id;
      const delRes = await request(app)
        .delete(`/api/students/me/online-courses/${courseId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(delRes.statusCode).toBe(200);
      expect(delRes.body.success).toBe(true);
    });

    it('should allow mentor to log a mentorship interaction record for assigned student', async () => {
      const res = await request(app)
        .post(`/api/students/${studentDoc._id}/mentorship-records`)
        .set('Authorization', `Bearer ${mentorToken}`)
        .send({
          type: 'Career & Internship',
          notes: 'Discussed summer internship preparation and resume review.',
          outcome: 'Student to complete 2 leetcode problems daily.',
          studentSigned: true,
          mentorSigned: true,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.type).toBe('Career & Internship');
    });

    it('should forbid other mentor from logging mentorship record for unassigned student (403)', async () => {
      const res = await request(app)
        .post(`/api/students/${studentDoc._id}/mentorship-records`)
        .set('Authorization', `Bearer ${otherMentorToken}`)
        .send({
          type: 'Academic Review',
          notes: 'Unauthorized attempt.',
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow mentor to log a backlog record for assigned student', async () => {
      const res = await request(app)
        .post(`/api/students/${studentDoc._id}/backlog-records`)
        .set('Authorization', `Bearer ${mentorToken}`)
        .send({
          semester: 3,
          subject: 'Data Structures',
          subjectCode: '21CS32',
          status: 'Cleared',
          attempts: 2,
          clearedDate: new Date(),
          remarks: 'Cleared in re-exam with B grade',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.subjectCode).toBe('21CS32');
    });
  });
});
