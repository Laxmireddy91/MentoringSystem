const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const { User, Student, Mentor } = require('../models');
const { generateAccessToken } = require('../utils/tokenUtils');

describe('Parent Portal Integration Test Suite', () => {
  let parentUser, parentToken;
  let otherParentUser, otherParentToken;
  let studentUser;
  let mentorUser, mentorDoc;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_mentoring_system_test');
    }

    await User.deleteMany({ email: { $in: ['p1@test.com', 'p2@test.com', 'st_p@test.com', 'm_p@test.com'] } });
    await Student.deleteMany({ usn: '1MS21CS666' });
    await Mentor.deleteMany({ employeeId: 'EMP_P' });

    mentorUser = await User.create({
      name: 'Dr. Parent Mentor',
      email: 'm_p@test.com',
      password: 'Password@123',
      role: 'mentor',
      department: 'CSE',
    });
    mentorDoc = await Mentor.create({
      userId: mentorUser._id,
      employeeId: 'EMP_P',
      department: 'CSE',
    });

    parentUser = await User.create({
      name: 'Mr. Parent One',
      email: 'p1@test.com',
      password: 'Password@123',
      role: 'parent',
      department: 'General',
    });
    parentToken = generateAccessToken(parentUser);

    otherParentUser = await User.create({
      name: 'Mr. Parent Two',
      email: 'p2@test.com',
      password: 'Password@123',
      role: 'parent',
      department: 'General',
    });
    otherParentToken = generateAccessToken(otherParentUser);

    studentUser = await User.create({
      name: 'Linked Child Student',
      email: 'st_p@test.com',
      password: 'Password@123',
      role: 'student',
      department: 'CSE',
    });
    await Student.create({
      userId: studentUser._id,
      usn: '1MS21CS666',
      department: 'CSE',
      semester: 4,
      mentorId: mentorDoc._id,
      parentUserId: parentUser._id, // linked to Parent 1
      academics: [
        {
          semesterNumber: 4,
          sgpa: 9.0,
          totalCredits: 4,
          backlogsCount: 0,
          subjects: [
            { subjectCode: 'CS401', subjectName: 'Algorithms', credits: 4, cie1: 40, cie2: 40, cie3: 40, finalMarks: 40, totalMarks: 80, grade: 'A+', gradePoint: 9, result: 'PASS' },
          ],
        },
      ],
    });
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $in: ['p1@test.com', 'p2@test.com', 'st_p@test.com', 'm_p@test.com'] } });
    await Student.deleteMany({ usn: '1MS21CS666' });
    await Mentor.deleteMany({ employeeId: 'EMP_P' });
    await mongoose.disconnect();
  });

  it('should allow linked parent to view child overview and academic progress', async () => {
    const res = await request(app)
      .get('/api/parent/child')
      .set('Authorization', `Bearer ${parentToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.student.usn).toBe('1MS21CS666');
    expect(res.body.data.summary.cgpa).toBe(9.0);
  });

  it('should allow linked parent to view child specific semester marks', async () => {
    const res = await request(app)
      .get('/api/parent/child/semester/4')
      .set('Authorization', `Bearer ${parentToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.semesterNumber).toBe(4);
    expect(res.body.data.subjects.length).toBe(1);
  });

  it('should return 404 for unlinked parent with no registered child', async () => {
    const res = await request(app)
      .get('/api/parent/child')
      .set('Authorization', `Bearer ${otherParentToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
