const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const { User, Student, Mentor, StudentRecord } = require('../models');
const { generateAccessToken } = require('../utils/tokenUtils');
const { ROLES } = require('../config/constants');

describe('HOD Student Directory & Pre-Registration Suite', () => {
  let hodUser, hodToken;
  let mentorUser, mentorDoc;
  let activatedUser, activatedStudent;
  const testDept = 'CSE_TEST_DIR';

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_mentoring_system_test');
    }

    // Clean up test data
    await User.deleteMany({ email: { $regex: /@hodtest\.edu$/i } });
    await Student.deleteMany({ usn: { $regex: /^1HT/ } });
    await StudentRecord.deleteMany({ usn: { $regex: /^1HT/ } });
    await Mentor.deleteMany({ employeeId: 'EMP_HOD_TEST' });

    // 1. Create HOD User
    hodUser = await User.create({
      name: 'Dr. Test HOD',
      email: 'hod@hodtest.edu',
      password: 'Password@123',
      role: ROLES.HOD,
      department: testDept,
    });
    hodToken = generateAccessToken(hodUser);

    // 2. Create Mentor
    mentorUser = await User.create({
      name: 'Prof. Test Mentor',
      email: 'mentor@hodtest.edu',
      password: 'Password@123',
      role: ROLES.MENTOR,
      department: testDept,
    });
    mentorDoc = await Mentor.create({
      userId: mentorUser._id,
      employeeId: 'EMP_HOD_TEST',
      department: testDept,
    });

    // 3. Create an existing activated Student
    activatedUser = await User.create({
      name: 'Active Student',
      email: 'active.student@hodtest.edu',
      password: 'Password@123',
      role: ROLES.STUDENT,
      department: testDept,
      isActivated: true,
    });
    activatedStudent = await Student.create({
      userId: activatedUser._id,
      usn: '1HT23CS001',
      department: testDept,
      semester: 3,
      section: 'A',
      batch: '2023',
      mentorId: mentorDoc._id,
      status: 'ACTIVE',
    });
    await StudentRecord.create({
      usn: '1HT23CS001',
      email: 'active.student@hodtest.edu',
      name: 'Active Student',
      department: testDept,
      semester: 3,
      section: 'A',
      isActivated: true,
      activatedAt: new Date(),
      activatedUserId: activatedUser._id,
    });
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $regex: /@hodtest\.edu$/i } });
    await Student.deleteMany({ usn: { $regex: /^1HT/ } });
    await StudentRecord.deleteMany({ usn: { $regex: /^1HT/ } });
    await Mentor.deleteMany({ employeeId: 'EMP_HOD_TEST' });
    await mongoose.disconnect();
  });

  describe('1. Individual Student Pre-Registration (POST /api/hod/students/individual)', () => {
    it('rejects request with missing name, email, or USN', async () => {
      const res = await request(app)
        .post('/api/hod/students/individual')
        .set('Authorization', `Bearer ${hodToken}`)
        .send({ name: 'Incomplete' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/required/i);
    });

    it('creates ONLY a StudentRecord with isActivated = false, and no User/Student account', async () => {
      const res = await request(app)
        .post('/api/hod/students/individual')
        .set('Authorization', `Bearer ${hodToken}`)
        .send({
          name: 'Pre-registered Student',
          email: 'prereg@hodtest.edu',
          usn: '1HT24CS002',
          department: testDept,
          batch: '2024-2028',
          semester: 1,
          section: 'B',
          phone: '+91 9999900001',
          parentName: 'Mr. Parent',
          parentEmail: 'parent.prereg@hodtest.edu',
          parentRelation: 'Father',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.student).toBeNull();
      expect(res.body.data.user).toBeNull();
      expect(res.body.data.studentRecord).toBeDefined();
      expect(res.body.data.studentRecord.isActivated).toBe(false);

      // Verify DB state
      const record = await StudentRecord.findOne({ usn: '1HT24CS002' });
      expect(record).toBeDefined();
      expect(record.isActivated).toBe(false);
      expect(record.name).toBe('Pre-registered Student');

      // Verify no Student or User document exists
      const student = await Student.findOne({ usn: '1HT24CS002' });
      expect(student).toBeNull();
      const user = await User.findOne({ email: 'prereg@hodtest.edu' });
      expect(user).toBeNull();
    });

    it('rejects duplicate pre-registration with same USN when already pre-registered', async () => {
      const res = await request(app)
        .post('/api/hod/students/individual')
        .set('Authorization', `Bearer ${hodToken}`)
        .send({
          name: 'Duplicate USN',
          email: 'another@hodtest.edu',
          usn: '1HT24CS002',
          department: testDept,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Student with USN 1HT24CS002 is already pre-registered');
    });

    it('rejects duplicate pre-registration with same email when already pre-registered', async () => {
      const res = await request(app)
        .post('/api/hod/students/individual')
        .set('Authorization', `Bearer ${hodToken}`)
        .send({
          name: 'Duplicate Email',
          email: 'prereg@hodtest.edu',
          usn: '1HT24CS999',
          department: testDept,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('A student record with this email address is already pre-registered');
    });

    it('rejects pre-registration with USN of an already activated student', async () => {
      const res = await request(app)
        .post('/api/hod/students/individual')
        .set('Authorization', `Bearer ${hodToken}`)
        .send({
          name: 'Active Duplicate',
          email: 'different@hodtest.edu',
          usn: '1HT23CS001',
          department: testDept,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Student with USN 1HT23CS001 has already activated their account');
    });

    it('rejects pre-registration with email of an already active student', async () => {
      const res = await request(app)
        .post('/api/hod/students/individual')
        .set('Authorization', `Bearer ${hodToken}`)
        .send({
          name: 'Active Email Duplicate',
          email: 'active.student@hodtest.edu',
          usn: '1HT24CS888',
          department: testDept,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('An active student record with this email address already exists');
    });
  });

  describe('2. HOD Student Directory (GET /api/hod/students)', () => {
    it('returns BOTH activated students and pre-registered students', async () => {
      const res = await request(app)
        .get(`/api/hod/students?department=${testDept}`)
        .set('Authorization', `Bearer ${hodToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      const usns = res.body.data.map((s) => s.usn);
      expect(usns).toContain('1HT23CS001'); // Activated student
      expect(usns).toContain('1HT24CS002'); // Pre-registered student

      const activeItem = res.body.data.find((s) => s.usn === '1HT23CS001');
      expect(activeItem.isActivated).toBe(true);
      expect(activeItem.status).toBe('ACTIVE');
      expect(activeItem.name).toBe('Active Student');
      expect(activeItem.mentorId).toBeDefined();

      const preRegItem = res.body.data.find((s) => s.usn === '1HT24CS002');
      expect(preRegItem.isActivated).toBe(false);
      expect(preRegItem.status).toBe('PRE_REGISTERED');
      expect(preRegItem.name).toBe('Pre-registered Student');
      expect(preRegItem.email).toBe('prereg@hodtest.edu');
      expect(preRegItem.mentorId).toBeNull();
      expect(preRegItem.cgpa).toBe(0);
      expect(preRegItem.totalBacklogs).toBe(0);
    });

    it('supports searching by name, USN, or email across both active and pre-registered', async () => {
      const res = await request(app)
        .get(`/api/hod/students?department=${testDept}&search=prereg@hodtest.edu`)
        .set('Authorization', `Bearer ${hodToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].usn).toBe('1HT24CS002');
    });

    it('filters by status = PRE_REGISTERED returning only pre-registered students', async () => {
      const res = await request(app)
        .get(`/api/hod/students?department=${testDept}&status=PRE_REGISTERED`)
        .set('Authorization', `Bearer ${hodToken}`);

      expect(res.status).toBe(200);
      const usns = res.body.data.map((s) => s.usn);
      expect(usns).toContain('1HT24CS002');
      expect(usns).not.toContain('1HT23CS001');
    });

    it('filters by status = ACTIVE returning only active students', async () => {
      const res = await request(app)
        .get(`/api/hod/students?department=${testDept}&status=ACTIVE`)
        .set('Authorization', `Bearer ${hodToken}`);

      expect(res.status).toBe(200);
      const usns = res.body.data.map((s) => s.usn);
      expect(usns).toContain('1HT23CS001');
      expect(usns).not.toContain('1HT24CS002');
    });

    it('allows pre-registered student to activate through /activate and updates directory to ACTIVE', async () => {
      // Activate via authService endpoint
      const actRes = await request(app)
        .post('/api/auth/activate/student')
        .send({
          usn: '1HT24CS002',
          email: 'prereg@hodtest.edu',
          password: 'NewPassword@123',
        });

      expect([200, 201]).toContain(actRes.status);

      // Verify directory now reflects activated state
      const dirRes = await request(app)
        .get(`/api/hod/students?department=${testDept}`)
        .set('Authorization', `Bearer ${hodToken}`);

      const nowActiveItem = dirRes.body.data.find((s) => s.usn === '1HT24CS002');
      expect(nowActiveItem).toBeDefined();
      expect(nowActiveItem.isActivated).toBe(true);
      expect(nowActiveItem.status).toBe('ACTIVE');

      // Verify no duplicate in list
      const matches = dirRes.body.data.filter((s) => s.usn === '1HT24CS002');
      expect(matches.length).toBe(1);
    });
  });
});
