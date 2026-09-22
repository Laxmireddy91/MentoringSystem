const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const app = require('../app');
const { User, Student, Mentor } = require('../models');
const { generateAccessToken } = require('../utils/tokenUtils');

describe('CSV & Excel Bulk Imports Integration Tests', () => {
  let hodUser, hodToken;
  let mentorUser, mentorDoc, mentorToken;
  let tempCsvPath, tempMarksCsvPath;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_mentoring_system_test');
    }

    await User.deleteMany({ email: { $in: ['hod_imp@test.com', 'm_imp@test.com', 'imp1@student.edu', 'imp2@student.edu'] } });
    await Student.deleteMany({ usn: { $in: ['1MS21CS771', '1MS21CS772', '1MS21CS773'] } });
    await Mentor.deleteMany({ employeeId: 'EMP_IMP' });

    hodUser = await User.create({
      name: 'Dr. HOD Importer',
      email: 'hod_imp@test.com',
      password: 'Password@123',
      role: 'hod',
      department: 'CSE',
    });
    hodToken = generateAccessToken(hodUser);

    mentorUser = await User.create({
      name: 'Dr. Mentor Importer',
      email: 'm_imp@test.com',
      password: 'Password@123',
      role: 'mentor',
      department: 'CSE',
    });
    mentorDoc = await Mentor.create({
      userId: mentorUser._id,
      employeeId: 'EMP_IMP',
      department: 'CSE',
    });
    mentorToken = generateAccessToken(mentorUser);

    // Create a student assigned to mentor for marks import
    const stUser = await User.create({
      name: 'Existing Import Student',
      email: 'imp1@student.edu',
      password: 'Password@123',
      role: 'student',
      department: 'CSE',
    });
    await Student.create({
      userId: stUser._id,
      usn: '1MS21CS771',
      department: 'CSE',
      semester: 5,
      mentorId: mentorDoc._id,
    });

    // Create temporary CSV files for tests
    tempCsvPath = path.join(__dirname, 'test_students.csv');
    fs.writeFileSync(
      tempCsvPath,
      'name,email,usn,department,semester,section,batch\n' +
      'Imported Student Two,imp2@student.edu,1MS21CS772,CSE,5,A,2022-2026\n' +
      'Invalid Student Missing Email,,1MS21CS773,CSE,5,A,2022-2026\n'
    );

    tempMarksCsvPath = path.join(__dirname, 'test_marks.csv');
    fs.writeFileSync(
      tempMarksCsvPath,
      'usn,semesterNumber,subjectCode,subjectName,credits,cie1,cie2,cie3,finalMarks\n' +
      '1MS21CS771,5,CS501,Database Management Systems,4,45,46,44,48\n'
    );
  });

  afterAll(async () => {
    try {
      if (fs.existsSync(tempCsvPath)) fs.unlinkSync(tempCsvPath);
      if (fs.existsSync(tempMarksCsvPath)) fs.unlinkSync(tempMarksCsvPath);
    } catch (_err) {
      // Ignore cleanup error
    }

    await User.deleteMany({ email: { $in: ['hod_imp@test.com', 'm_imp@test.com', 'imp1@student.edu', 'imp2@student.edu'] } });
    await Student.deleteMany({ usn: { $in: ['1MS21CS771', '1MS21CS772', '1MS21CS773'] } });
    await Mentor.deleteMany({ employeeId: 'EMP_IMP' });
    await mongoose.disconnect();
  });

  it('should process CSV students import and report success and failure counts', async () => {
    const res = await request(app)
      .post('/api/imports/students')
      .set('Authorization', `Bearer ${hodToken}`)
      .attach('file', tempCsvPath);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.successCount).toBe(1);
    expect(res.body.data.failureCount).toBe(1);
    expect(res.body.data.errors.length).toBe(1);
  });

  it('should process CSV marks import and update student semester SGPA', async () => {
    const res = await request(app)
      .post('/api/imports/marks')
      .set('Authorization', `Bearer ${mentorToken}`)
      .attach('file', tempMarksCsvPath);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.successCount).toBe(1);

    // Verify marks were recorded in student document
    const updatedStudent = await Student.findOne({ usn: '1MS21CS771' });
    expect(updatedStudent.academics.length).toBeGreaterThanOrEqual(1);
  });
});
