const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const { User, Student, Mentor, Report } = require('../models');
const { generateAccessToken } = require('../utils/tokenUtils');

describe('PDF & Excel Reports Integration Test Suite', () => {
  let hodUser, hodToken;
  let studentUser, studentDoc, studentToken;
  let mentorUser, mentorDoc;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_mentoring_system_test');
    }

    await User.deleteMany({ email: { $in: ['hod_rep@test.com', 'st_rep@test.com', 'm_rep@test.com'] } });
    await Student.deleteMany({ usn: '1MS21CS444' });
    await Mentor.deleteMany({ employeeId: 'EMP_REP' });
    await Report.deleteMany({});

    // 1. Mentor
    mentorUser = await User.create({
      name: 'Dr. Report Mentor',
      email: 'm_rep@test.com',
      password: 'Password@123',
      role: 'mentor',
      department: 'CSE',
    });
    mentorDoc = await Mentor.create({
      userId: mentorUser._id,
      employeeId: 'EMP_REP',
      department: 'CSE',
    });

    // 2. Student
    studentUser = await User.create({
      name: 'Report Test Student',
      email: 'st_rep@test.com',
      password: 'Password@123',
      role: 'student',
      department: 'CSE',
    });
    studentDoc = await Student.create({
      userId: studentUser._id,
      usn: '1MS21CS444',
      department: 'CSE',
      semester: 3,
      mentorId: mentorDoc._id,
      academics: [
        {
          semesterNumber: 3,
          sgpa: 8.75,
          totalCredits: 20,
          backlogsCount: 0,
          subjects: [
            {
              subjectCode: 'CS301',
              subjectName: 'Data Structures & Algorithms',
              credits: 4,
              cie1: 45,
              cie2: 45,
              cie3: 45,
              finalMarks: 45,
              totalMarks: 90,
              grade: 'O',
              gradePoint: 10,
              result: 'PASS',
              isBacklog: false,
            },
          ],
        },
      ],
    });
    studentToken = generateAccessToken(studentUser);

    // 3. HOD
    hodUser = await User.create({
      name: 'Dr. HOD Admin',
      email: 'hod_rep@test.com',
      password: 'Password@123',
      role: 'hod',
      department: 'CSE',
    });
    hodToken = generateAccessToken(hodUser);
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $in: ['hod_rep@test.com', 'st_rep@test.com', 'm_rep@test.com'] } });
    await Student.deleteMany({ usn: '1MS21CS444' });
    await Mentor.deleteMany({ employeeId: 'EMP_REP' });
    await Report.deleteMany({});
    await mongoose.disconnect();
  });

  it('should generate and stream PDF Report Card for student', async () => {
    const res = await request(app)
      .get(`/api/reports/pdf/student/${studentDoc._id}?semester=3`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toContain('ReportCard_Sem3.pdf');
    expect(res.body).toBeDefined();
  });

  it('should export formatted Students Roster Excel file', async () => {
    const res = await request(app)
      .get('/api/reports/export/students?department=CSE')
      .set('Authorization', `Bearer ${hodToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('spreadsheetml');
    expect(res.headers['content-disposition']).toContain('.xlsx');
  });

  it('should export formatted Mentors Roster Excel file', async () => {
    const res = await request(app)
      .get('/api/reports/export/mentors?department=CSE')
      .set('Authorization', `Bearer ${hodToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('spreadsheetml');
  });

  it('should manage Report CRUD records', async () => {
    // Create report record
    const createRes = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${hodToken}`)
      .send({
        title: 'Q3 Department Risk & Academic Audit',
        reportType: 'risk',
        department: 'CSE',
        fileType: 'pdf',
      });

    expect(createRes.statusCode).toBe(201);
    expect(createRes.body.data.title).toBe('Q3 Department Risk & Academic Audit');
    const reportId = createRes.body.data._id;

    // List reports
    const listRes = await request(app)
      .get('/api/reports')
      .set('Authorization', `Bearer ${hodToken}`);

    expect(listRes.statusCode).toBe(200);
    expect(listRes.body.data.length).toBeGreaterThanOrEqual(1);

    // Delete report
    const delRes = await request(app)
      .delete(`/api/reports/${reportId}`)
      .set('Authorization', `Bearer ${hodToken}`);

    expect(delRes.statusCode).toBe(200);
  });
});
