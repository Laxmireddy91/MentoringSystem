const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const { User, Student, Mentor } = require('../models');

// Mock User database entries if DB is not connected during test or test with mongoose in-memory / mock
describe('Authentication & RBAC API Test Suite', () => {
  let studentToken = '';

  const testStudent = {
    name: 'Aarav Sharma',
    email: 'aarav.sharma@college.edu',
    password: 'Password@123',
    role: 'student',
    department: 'Computer Science',
    usn: '1MS21CS099',
    semester: 5,
    section: 'B',
  };

  const testMentor = {
    name: 'Dr. Ramesh Kumar',
    email: 'ramesh.kumar@college.edu',
    password: 'Password@123',
    role: 'mentor',
    department: 'Computer Science',
    employeeId: 'EMP_CS_101',
    designation: 'Associate Professor',
  };

  beforeAll(async () => {
    // Ensure test db connection or clean state if connected
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_mentoring_system_test');
    }
    await User.deleteMany({ email: { $in: [testStudent.email, testMentor.email, 'bademail@test.com'] } });
    await Student.deleteMany({ usn: testStudent.usn });
    await Mentor.deleteMany({ employeeId: testMentor.employeeId });
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $in: [testStudent.email, testMentor.email] } });
    await Student.deleteMany({ usn: testStudent.usn });
    await Mentor.deleteMany({ employeeId: testMentor.employeeId });
    await mongoose.disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('should successfully register a new student with USN profile', async () => {
      const res = await request(app).post('/api/auth/register').send(testStudent);
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testStudent.email);
      expect(res.body.data.profile.usn).toBe(testStudent.usn);
      expect(res.body.data.token).toBeDefined();
    });

    it('should reject registration if email or USN already exists', async () => {
      const res = await request(app).post('/api/auth/register').send(testStudent);
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject weak password', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Weak User',
        email: 'weak@college.edu',
        password: 'weak',
        role: 'student',
        department: 'CSE',
        usn: '1MS21CS999',
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should register a mentor with Employee ID', async () => {
      const res = await request(app).post('/api/auth/register').send(testMentor);
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profile.employeeId).toBe(testMentor.employeeId);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login student using email and password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testStudent.email,
        password: testStudent.password,
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      studentToken = res.body.data.token;
      
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
    });

    it('should login student using USN identifier', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testStudent.usn,
        password: testStudent.password,
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('student');
    });

    it('should login mentor using Employee ID', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testMentor.employeeId,
        password: testMentor.password,
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    it('should reject invalid password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testStudent.email,
        password: 'WrongPassword!123',
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current authenticated student profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testStudent.email);
      expect(res.body.data.profile.usn).toBe(testStudent.usn);
    });

    it('should reject request without bearer token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject request with invalid bearer token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.payload');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/forgot-password & Email Verification', () => {
    it('should handle forgot password without exposing reset token in response', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testStudent.email });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data?.resetToken).toBeUndefined();
    });

    it('should verify email with valid verification token', async () => {
      const user = await User.findOne({ email: testStudent.email });
      user.emailVerificationToken = 'test-token-123456';
      user.emailVerificationExpires = new Date(Date.now() + 3600000);
      await user.save();

      const res = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'test-token-123456' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const updatedUser = await User.findOne({ email: testStudent.email });
      expect(updatedUser.isEmailVerified).toBe(true);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout and clear refresh cookie', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
