const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const app = require('../app');
const {
  User,
  Student,
  Mentor,
  Attendance,
  AuditLog,
  Notification,
} = require('../models');
const { generateAccessToken } = require('../utils/tokenUtils');
const { ROLES } = require('../config/constants');

describe('Phase 4 — CIE & Attendance Ingestion Integration Test Suite', () => {
  let hodUser, hodToken;
  let mentorUser1, mentorToken1, mentorDoc1;
  let mentorUser2, mentorToken2, mentorDoc2;
  let studentUser1, studentToken1, studentDoc1;
  let studentUser2, studentToken2, studentDoc2;
  let lateStudentUser, lateStudentToken, lateStudentDoc;
  let parentUser1, parentToken1;
  let tempCieCsvPath, tempAttCsvPath;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_mentoring_system_test');
    }

    // Clean test data
    await User.deleteMany({ email: /@phase4-test\.edu$/ });
    await Student.deleteMany({ usn: /^P4USN/ });
    await Mentor.deleteMany({ employeeId: /^EMP_P4/ });
    await Attendance.deleteMany({ usn: /^P4USN/ });
    await AuditLog.deleteMany({ 'newValue.department': 'P4_CSE' });

    // 1. HOD
    hodUser = await User.create({
      name: 'Dr. HOD Phase4',
      email: 'hod@phase4-test.edu',
      password: 'Password@123',
      role: ROLES.HOD,
      department: 'P4_CSE',
      isActivated: true,
    });
    hodToken = generateAccessToken(hodUser);

    // 2. Mentors
    mentorUser1 = await User.create({
      name: 'Prof. Assigned Mentor',
      email: 'm1@phase4-test.edu',
      password: 'Password@123',
      role: ROLES.MENTOR,
      department: 'P4_CSE',
      isActivated: true,
    });
    mentorDoc1 = await Mentor.create({
      userId: mentorUser1._id,
      employeeId: 'EMP_P4_01',
      department: 'P4_CSE',
      maxMentees: 10,
    });
    mentorToken1 = generateAccessToken(mentorUser1);

    mentorUser2 = await User.create({
      name: 'Prof. Other Mentor',
      email: 'm2@phase4-test.edu',
      password: 'Password@123',
      role: ROLES.MENTOR,
      department: 'P4_CSE',
      isActivated: true,
    });
    mentorDoc2 = await Mentor.create({
      userId: mentorUser2._id,
      employeeId: 'EMP_P4_02',
      department: 'P4_CSE',
      maxMentees: 10,
    });
    mentorToken2 = generateAccessToken(mentorUser2);

    // 3. Parent of Student 1
    parentUser1 = await User.create({
      name: 'Parent of Student One',
      email: 'parent1@phase4-test.edu',
      password: 'Password@123',
      role: ROLES.PARENT,
      isActivated: true,
    });
    parentToken1 = generateAccessToken(parentUser1);

    // 4. Students
    studentUser1 = await User.create({
      name: 'Student One',
      email: 'st1@phase4-test.edu',
      password: 'Password@123',
      role: ROLES.STUDENT,
      department: 'P4_CSE',
      isActivated: true,
    });
    studentDoc1 = await Student.create({
      userId: studentUser1._id,
      usn: 'P4USN001',
      department: 'P4_CSE',
      semester: 5,
      section: 'A',
      batch: '2022-2026',
      mentorId: mentorDoc1._id,
      parentUserId: parentUser1._id,
      academics: [
        {
          semesterNumber: 4,
          sgpa: 8.5,
          cgpa: 8.5,
          totalCredits: 20,
          backlogsCount: 0,
          subjects: [
            {
              subjectCode: 'CS401',
              subjectName: 'Design & Analysis of Algorithms',
              credits: 4,
              cie1: 45,
              cie2: 46,
              cie3: 44,
              finalMarks: 45,
              totalMarks: 90,
              grade: 'O',
              gradePoint: 10,
              result: 'PASS',
            },
          ],
        },
      ],
    });
    studentToken1 = generateAccessToken(studentUser1);

    studentUser2 = await User.create({
      name: 'Student Two',
      email: 'st2@phase4-test.edu',
      password: 'Password@123',
      role: ROLES.STUDENT,
      department: 'P4_CSE',
      isActivated: true,
    });
    studentDoc2 = await Student.create({
      userId: studentUser2._id,
      usn: 'P4USN002',
      department: 'P4_CSE',
      semester: 5,
      section: 'A',
      batch: '2022-2026',
      mentorId: mentorDoc1._id,
    });
    studentToken2 = generateAccessToken(studentUser2);

    // 5. Late admission student (initially has no academics or attendance)
    lateStudentUser = await User.create({
      name: 'Late Admission Student',
      email: 'late@phase4-test.edu',
      password: 'Password@123',
      role: ROLES.STUDENT,
      department: 'P4_CSE',
      isActivated: true,
    });
    lateStudentDoc = await Student.create({
      userId: lateStudentUser._id,
      usn: 'P4USNLATE',
      department: 'P4_CSE',
      semester: 1,
      section: 'A',
      batch: '2024-2028',
      mentorId: null,
      academics: [],
    });
    lateStudentToken = generateAccessToken(lateStudentUser);

    // Setup temporary CSV files
    tempCieCsvPath = path.join(__dirname, 'temp_p4_cie.csv');
    tempAttCsvPath = path.join(__dirname, 'temp_p4_attendance.csv');
  });

  afterAll(async () => {
    try {
      if (fs.existsSync(tempCieCsvPath)) fs.unlinkSync(tempCieCsvPath);
      if (fs.existsSync(tempAttCsvPath)) fs.unlinkSync(tempAttCsvPath);
    } catch (_err) {}

    await User.deleteMany({ email: /@phase4-test\.edu$/ });
    await Student.deleteMany({ usn: /^P4USN/ });
    await Mentor.deleteMany({ employeeId: /^EMP_P4/ });
    await Attendance.deleteMany({ usn: /^P4USN/ });
    await AuditLog.deleteMany({ 'newValue.department': 'P4_CSE' });
  });

  // ─────────────────────────────────────────────────────────────
  // 1. CIE Validation & Preview Tests
  // ─────────────────────────────────────────────────────────────
  describe('CIE Validation & Preview Workflow', () => {
    let previewData;

    beforeAll(() => {
      // Create test CSV with:
      // Row 1: Valid student 1
      // Row 2: Valid late admission student
      // Row 3: Non-existent student USN (ERROR)
      // Row 4: Missing subject code (ERROR)
      // Row 5: Invalid semester > 8 (ERROR)
      // Row 6: Invalid CIE mark > 50 (ERROR)
      // Row 7: Duplicate entry for student 1 (DUPLICATE)
      const content = [
        'USN,Subject Code,Subject Name,Semester,CIE 1,CIE 2,CIE 3,Credits',
        'P4USN001,CS501,Database Management Systems,5,42,44,40,4',
        'P4USNLATE,CS101,Programming in C,1,38,40,42,4',
        'P4USNNONEXISTENT,CS501,Database Management Systems,5,40,40,40,4',
        'P4USN001,,Database Management Systems,5,40,40,40,4',
        'P4USN001,CS502,Operating Systems,99,40,40,40,4',
        'P4USN001,CS503,Computer Networks,5,85,40,40,4',
        'P4USN001,CS501,Database Management Systems,5,42,44,40,4', // Duplicate
      ].join('\n');
      fs.writeFileSync(tempCieCsvPath, content);
    });

    it('should preview CIE upload and classify rows into VALID, WARNING, ERROR, DUPLICATE', async () => {
      const res = await request(app)
        .post('/api/hod/imports/cie/preview')
        .set('Authorization', `Bearer ${hodToken}`)
        .attach('file', tempCieCsvPath);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      expect(data.totalRows).toBe(7);
      expect(data.errorRows).toBe(4);
      expect(data.duplicateRows).toBe(1);
      expect(data.validRows).toBeGreaterThanOrEqual(1);
      expect(data.readyToImport).toBe(2);

      // Verify specific error reasons
      const errNonExistent = data.preview.find((r) => r.usn === 'P4USNNONEXISTENT');
      expect(errNonExistent.status).toBe('error');
      expect(errNonExistent.reason).toContain('not found');

      const errMark = data.preview.find((r) => r.subjectCode === 'CS503');
      expect(errMark.status).toBe('error');
      expect(errMark.reason).toContain('between 0 and 50');

      const dupRow = data.preview.filter((r) => r.usn === 'P4USN001' && r.subjectCode === 'CS501')[1];
      expect(dupRow.status).toBe('duplicate');

      previewData = data.preview;
    });

    it('preview step must NOT persist any academic records to database', async () => {
      const st1 = await Student.findById(studentDoc1._id);
      const sem5 = st1.academics.find((s) => s.semesterNumber === 5);
      expect(sem5).toBeUndefined();

      const lateSt = await Student.findById(lateStudentDoc._id);
      expect(lateSt.academics.length).toBe(0);
    });

    it('should confirm CIE import and persist ONLY valid rows, leaving errors and duplicates excluded', async () => {
      const res = await request(app)
        .post('/api/hod/imports/cie/confirm')
        .set('Authorization', `Bearer ${hodToken}`)
        .send({ previewData });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.successCount).toBe(2); // P4USN001 (CS501) and P4USNLATE (CS101)

      // Verify Student 1 has Semester 5 record with CS501
      const updatedSt1 = await Student.findById(studentDoc1._id);
      const sem5 = updatedSt1.academics.find((s) => s.semesterNumber === 5);
      expect(sem5).toBeDefined();
      expect(sem5.subjects.length).toBe(1);
      expect(sem5.subjects[0].subjectCode).toBe('CS501');
      expect(sem5.subjects[0].cie1).toBe(42);

      // Verify Semester 4 of Student 1 was preserved (Semester Isolation)
      const sem4 = updatedSt1.academics.find((s) => s.semesterNumber === 4);
      expect(sem4).toBeDefined();
      expect(sem4.subjects[0].subjectCode).toBe('CS401');

      // Verify Student 2 was NOT modified (missing student in file remains untouched)
      const st2 = await Student.findById(studentDoc2._id);
      expect(st2.academics.length).toBe(0);

      // Verify Late Admission Student now has Semester 1 records created
      const updatedLate = await Student.findById(lateStudentDoc._id);
      expect(updatedLate.academics.length).toBe(1);
      expect(updatedLate.academics[0].semesterNumber).toBe(1);
      expect(updatedLate.academics[0].subjects[0].subjectCode).toBe('CS101');

      // Verify AuditLog was recorded
      const audit = await AuditLog.findOne({ action: 'CIE_IMPORT', actorId: hodUser._id });
      expect(audit).toBeDefined();
      expect(audit.newValue.importType).toBe('CIE');
      expect(audit.newValue.importedRows).toBe(2);

      // Verify Notification was dispatched to student
      const notif = await Notification.findOne({ recipientId: studentUser1._id, category: 'academic' });
      expect(notif).toBeDefined();
    });

    it('should non-destructively upsert and warn when importing an existing subject', async () => {
      // Create new CSV with CS501 (update) and CS504 (new subject in same semester)
      const updateContent = [
        'USN,Subject Code,Subject Name,Semester,CIE 1,CIE 2,CIE 3,Credits',
        'P4USN001,CS501,Database Management Systems,5,48,48,48,4', // Existing subject
        'P4USN001,CS504,Software Engineering,5,40,40,40,4',      // New subject in Sem 5
      ].join('\n');
      fs.writeFileSync(tempCieCsvPath, updateContent);

      const previewRes = await request(app)
        .post('/api/hod/imports/cie/preview')
        .set('Authorization', `Bearer ${hodToken}`)
        .attach('file', tempCieCsvPath);

      expect(previewRes.statusCode).toBe(200);
      const data = previewRes.body.data;
      expect(data.warningRows).toBeGreaterThanOrEqual(1); // CS501 flagged as warning (existing)

      // Confirm update
      const confirmRes = await request(app)
        .post('/api/hod/imports/cie/confirm')
        .set('Authorization', `Bearer ${hodToken}`)
        .send({ previewData: data.preview });

      expect(confirmRes.statusCode).toBe(200);

      // Verify both CS501 and CS504 exist in Semester 5 (CS501 was updated, not duplicated)
      const st1 = await Student.findById(studentDoc1._id);
      const sem5 = st1.academics.find((s) => s.semesterNumber === 5);
      expect(sem5.subjects.length).toBe(2);
      const cs501 = sem5.subjects.find((s) => s.subjectCode === 'CS501');
      const cs504 = sem5.subjects.find((s) => s.subjectCode === 'CS504');
      expect(cs501.cie1).toBe(48); // Updated
      expect(cs504).toBeDefined();  // Added
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. Attendance Ingestion & Calculations Tests
  // ─────────────────────────────────────────────────────────────
  describe('Attendance Ingestion Workflow & Calculations', () => {
    let attPreviewData;

    beforeAll(() => {
      // Rows:
      // 1. Valid: 40 total, 36 attended => 90%
      // 2. Valid Low Attendance: 40 total, 28 attended => 70% (<75%)
      // 3. Safe Zero Total Classes: 0 total, 0 attended => 0% (no NaN)
      // 4. Invalid: attended > total => ERROR
      // 5. Invalid: negative classes => ERROR
      // 6. Invalid: non-existent student => ERROR
      // 7. Duplicate in file => DUPLICATE
      const content = [
        'USN,Subject Code,Subject Name,Semester,Total Classes,Classes Attended',
        'P4USN001,CS501,Database Management Systems,5,40,36',
        'P4USN001,CS504,Software Engineering,5,40,28', // 70%
        'P4USNLATE,CS101,Programming in C,1,0,0',       // 0/0 -> 0%
        'P4USN001,CS502,Operating Systems,5,30,35',    // Attended > Total
        'P4USN001,CS503,Computer Networks,5,-10,5',    // Negative
        'P4USNNONEXISTENT,CS501,Database Management Systems,5,40,30',
        'P4USN001,CS501,Database Management Systems,5,40,36', // Duplicate
      ].join('\n');
      fs.writeFileSync(tempAttCsvPath, content);
    });

    it('should preview attendance upload and accurately calculate percentages', async () => {
      const res = await request(app)
        .post('/api/hod/imports/attendance/preview')
        .set('Authorization', `Bearer ${hodToken}`)
        .attach('file', tempAttCsvPath);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      expect(data.totalRows).toBe(7);
      expect(data.errorRows).toBe(3);
      expect(data.duplicateRows).toBe(1);
      expect(data.readyToImport).toBe(3);

      // Verify percentage calculations
      const r1 = data.preview.find((r) => r.subjectCode === 'CS501');
      expect(r1.attendancePercentage).toBe(90);

      const r2 = data.preview.find((r) => r.subjectCode === 'CS504');
      expect(r2.attendancePercentage).toBe(70);
      expect(r2.status).toBe('warning');
      expect(r2.reason).toContain('below statutory 75%');

      const rZero = data.preview.find((r) => r.usn === 'P4USNLATE');
      expect(rZero.attendancePercentage).toBe(0);
      expect(isNaN(rZero.attendancePercentage)).toBe(false);

      attPreviewData = data.preview;
    });

    it('attendance preview must NOT write to Attendance collection', async () => {
      const count = await Attendance.countDocuments({ usn: /^P4USN/ });
      expect(count).toBe(0);
    });

    it('should confirm attendance import and persist only valid/warning records', async () => {
      const res = await request(app)
        .post('/api/hod/imports/attendance/confirm')
        .set('Authorization', `Bearer ${hodToken}`)
        .send({ previewData: attPreviewData });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.successCount).toBe(3);

      // Verify persisted attendance records
      const att1 = await Attendance.findOne({ usn: 'P4USN001', subjectCode: 'CS501' });
      expect(att1).toBeDefined();
      expect(att1.attendancePercentage).toBe(90);
      expect(att1.totalClasses).toBe(40);
      expect(att1.classesAttended).toBe(36);

      const attLow = await Attendance.findOne({ usn: 'P4USN001', subjectCode: 'CS504' });
      expect(attLow.attendancePercentage).toBe(70);

      // Verify late admission student has attendance created
      const lateAtt = await Attendance.findOne({ usn: 'P4USNLATE' });
      expect(lateAtt).toBeDefined();
      expect(lateAtt.attendancePercentage).toBe(0);

      // Verify Low Attendance notification was generated
      const lowNotif = await Notification.findOne({
        recipientId: studentUser1._id,
        category: 'attendance',
        title: /Low Attendance/i,
      });
      expect(lowNotif).toBeDefined();

      // Verify AuditLog was recorded
      const audit = await AuditLog.findOne({ action: 'ATTENDANCE_IMPORT', actorId: hodUser._id });
      expect(audit).toBeDefined();
      expect(audit.newValue.importType).toBe('ATTENDANCE');
      expect(audit.newValue.importedRows).toBe(3);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. Official Attendance & Marks Security & RBAC Tests
  // ─────────────────────────────────────────────────────────────
  describe('Attendance & Academic Marks RBAC and Relationship Isolation', () => {
    it('should allow student to view their own attendance via /api/academics/my-attendance', async () => {
      const res = await request(app)
        .get('/api/academics/my-attendance')
        .set('Authorization', `Bearer ${studentToken1}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.records.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data.overallPercentage).toBeGreaterThan(0);
    });

    it('should allow assigned mentor to view mentee attendance via /api/academics/attendance/:studentId', async () => {
      const res = await request(app)
        .get(`/api/academics/attendance/${studentDoc1._id}`)
        .set('Authorization', `Bearer ${mentorToken1}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.records.length).toBeGreaterThanOrEqual(1);
    });

    it('should reject unassigned mentor attempting to view student attendance (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/academics/attendance/${studentDoc1._id}`)
        .set('Authorization', `Bearer ${mentorToken2}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow parent to view linked ward attendance via parent profile', async () => {
      const res = await request(app)
        .get('/api/parent/my-ward')
        .set('Authorization', `Bearer ${parentToken1}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.attendance).toBeDefined();
      expect(res.body.data.attendance.records.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data.attendance.hasRecords).toBe(true);
    });

    it('should reject mentor attempting to confirm HOD attendance import (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/hod/imports/attendance/confirm')
        .set('Authorization', `Bearer ${mentorToken1}`)
        .send({ previewData: [] });

      expect(res.statusCode).toBe(403);
    });

    it('should reject mentor attempting to confirm HOD CIE import (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/hod/imports/cie/confirm')
        .set('Authorization', `Bearer ${mentorToken1}`)
        .send({ previewData: [] });

      expect(res.statusCode).toBe(403);
    });

    it('should reject student attempting to access HOD import history (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/hod/imports/history')
        .set('Authorization', `Bearer ${studentToken1}`);

      expect(res.statusCode).toBe(403);
    });

    it('should allow HOD to inspect previous import history with rich audit stats', async () => {
      const res = await request(app)
        .get('/api/hod/imports/history')
        .set('Authorization', `Bearer ${hodToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.logs.length).toBeGreaterThanOrEqual(2);

      const cieLog = res.body.data.logs.find((l) => l.action === 'CIE_IMPORT');
      expect(cieLog).toBeDefined();
      expect(cieLog.newValue.importedRows).toBeGreaterThanOrEqual(1);

      const attLog = res.body.data.logs.find((l) => l.action === 'ATTENDANCE_IMPORT');
      expect(attLog).toBeDefined();
      expect(attLog.newValue.importType).toBe('ATTENDANCE');
    });
  });
});
