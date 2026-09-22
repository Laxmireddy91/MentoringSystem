const request = require('supertest');
const mongoose = require('mongoose');
jest.setTimeout(30000);
const app = require('../app');
const {
  User,
  Student,
  Mentor,
  Attendance,
  Achievement,
  PlacementProfile,
  Session,
} = require('../models');
const { generateAccessToken } = require('../utils/tokenUtils');
const { ROLES } = require('../config/constants');
const HodService = require('../services/hodService');

describe('Phase 5 — Student 360° & Academic Attention Verification Suite', () => {
  let hodUserCse, hodTokenCse;
  let mentorUser1, mentorToken1, mentorDoc1;
  let mentorUser2, mentorToken2, mentorDoc2;
  let studentUser1, studentToken1, studentDoc1; // Assigned to Mentor 1, Good Academic Standing
  let studentUser2, studentToken2, studentDoc2; // Assigned to Mentor 2, Low CIE
  let studentUser3, studentToken3, studentDoc3; // Assigned to Mentor 1, Active Backlogs
  let studentUser4, studentToken4, studentDoc4; // Assigned to Mentor 1, Low Attendance (<75%) ONLY
  let studentLate, studentTokenLate, studentDocLate; // Unassigned, Late admission, No CIE or Attendance
  let studentEce, studentDocEce; // Different department (P5_ECE)
  let parentUser, parentToken;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_mentoring_system_test');
    }

    // Cleanup previous test artifacts
    await User.deleteMany({ email: /@phase5-test\.edu$/ });
    await Student.deleteMany({ usn: /^P5USN/ });
    await Mentor.deleteMany({ employeeId: /^EMP_P5/ });
    await Attendance.deleteMany({ usn: /^P5USN/ });

    // 1. HOD (CSE)
    hodUserCse = await User.create({
      name: 'Dr. HOD CSE Phase 5',
      email: 'hod_cse@phase5-test.edu',
      password: 'Password@123',
      role: ROLES.HOD,
      department: 'P5_CSE',
      isActivated: true,
    });
    hodTokenCse = generateAccessToken(hodUserCse);

    // 2. Mentors
    mentorUser1 = await User.create({
      name: 'Dr. Mentor One Phase 5',
      email: 'mentor1@phase5-test.edu',
      password: 'Password@123',
      role: ROLES.MENTOR,
      department: 'P5_CSE',
      isActivated: true,
    });
    mentorDoc1 = await Mentor.create({
      userId: mentorUser1._id,
      employeeId: 'EMP_P5_01',
      name: 'Dr. Mentor One Phase 5',
      email: 'mentor1@phase5-test.edu',
      department: 'P5_CSE',
      maxMentees: 20,
    });
    mentorToken1 = generateAccessToken(mentorUser1);

    mentorUser2 = await User.create({
      name: 'Prof. Mentor Two Phase 5',
      email: 'mentor2@phase5-test.edu',
      password: 'Password@123',
      role: ROLES.MENTOR,
      department: 'P5_CSE',
      isActivated: true,
    });
    mentorDoc2 = await Mentor.create({
      userId: mentorUser2._id,
      employeeId: 'EMP_P5_02',
      name: 'Prof. Mentor Two Phase 5',
      email: 'mentor2@phase5-test.edu',
      department: 'P5_CSE',
      maxMentees: 20,
    });
    mentorToken2 = generateAccessToken(mentorUser2);

    // 3. Student 1: Good Academic Standing (CIE: 38/50, Backlogs: 0, Attendance: 85%)
    studentUser1 = await User.create({
      name: 'Alice Top Performer',
      email: 'alice@phase5-test.edu',
      password: 'Password@123',
      role: ROLES.STUDENT,
      department: 'P5_CSE',
      isActivated: true,
    });
    studentToken1 = generateAccessToken(studentUser1);
    studentDoc1 = await Student.create({
      userId: studentUser1._id,
      usn: 'P5USN001',
      name: 'Alice Top Performer',
      email: 'alice@phase5-test.edu',
      department: 'P5_CSE',
      batch: '2024-2028',
      semester: 3,
      section: 'A',
      mentorId: mentorDoc1._id,
      academics: [
        {
          semesterNumber: 3,
          sgpa: 8.5,
          creditsEarned: 20,
          subjects: [
            { subjectCode: 'CS301', subjectName: 'Data Structures', credits: 4, cie1: 38, cie2: 40, cie3: 36, finalMarks: 40 },
            { subjectCode: 'CS302', subjectName: 'Algorithms', credits: 4, cie1: 35, cie2: 38, cie3: 39, finalMarks: 40 },
          ],
        },
      ],
      backlogRecords: [],
    });

    await Attendance.create({
      studentId: studentDoc1._id,
      usn: 'P5USN001',
      studentName: 'Alice Top Performer',
      department: 'P5_CSE',
      semester: 3,
      section: 'A',
      subjectCode: 'CS301',
      subjectName: 'Data Structures',
      totalClasses: 40,
      classesAttended: 34,
      attendancePercentage: 85,
      importedBy: hodUserCse._id,
    });

    // 4. Student 2: Assigned to Mentor 2 — Low CIE (< 25/50, Backlogs: 0)
    studentUser2 = await User.create({
      name: 'Bob Low Marks',
      email: 'bob@phase5-test.edu',
      password: 'Password@123',
      role: ROLES.STUDENT,
      department: 'P5_CSE',
      isActivated: true,
    });
    studentToken2 = generateAccessToken(studentUser2);
    studentDoc2 = await Student.create({
      userId: studentUser2._id,
      usn: 'P5USN002',
      name: 'Bob Low Marks',
      email: 'bob@phase5-test.edu',
      department: 'P5_CSE',
      batch: '2024-2028',
      semester: 3,
      section: 'B',
      mentorId: mentorDoc2._id,
      academics: [
        {
          semesterNumber: 3,
          sgpa: 5.0,
          creditsEarned: 16,
          subjects: [
            { subjectCode: 'CS301', subjectName: 'Data Structures', credits: 4, cie1: 18, cie2: 20, cie3: 21 },
            { subjectCode: 'CS302', subjectName: 'Algorithms', credits: 4, cie1: 15, cie2: 19, cie3: 16 },
          ],
        },
      ],
      backlogRecords: [],
    });

    // 5. Student 3: Assigned to Mentor 1 — Good CIE (38/50) but Active Backlogs (> 0)
    studentUser3 = await User.create({
      name: 'Charlie Backlogs',
      email: 'charlie@phase5-test.edu',
      password: 'Password@123',
      role: ROLES.STUDENT,
      department: 'P5_CSE',
      isActivated: true,
    });
    studentToken3 = generateAccessToken(studentUser3);
    studentDoc3 = await Student.create({
      userId: studentUser3._id,
      usn: 'P5USN003',
      name: 'Charlie Backlogs',
      email: 'charlie@phase5-test.edu',
      department: 'P5_CSE',
      batch: '2024-2028',
      semester: 3,
      section: 'A',
      mentorId: mentorDoc1._id,
      academics: [
        {
          semesterNumber: 3,
          sgpa: 7.0,
          creditsEarned: 18,
          subjects: [
            { subjectCode: 'CS301', subjectName: 'Data Structures', credits: 4, cie1: 38, cie2: 40, cie3: 36, finalMarks: 40 },
          ],
        },
      ],
      backlogRecords: [
        { semester: 2, subject: 'Mathematics II', subjectCode: 'MAT201', status: 'Active', attempts: 2 },
      ],
    });

    // 6. Student 4: Assigned to Mentor 1 — Good CIE (38/50), 0 Backlogs, BUT Low Attendance (60% < 75%)
    studentUser4 = await User.create({
      name: 'David Low Attendance',
      email: 'david@phase5-test.edu',
      password: 'Password@123',
      role: ROLES.STUDENT,
      department: 'P5_CSE',
      isActivated: true,
    });
    studentToken4 = generateAccessToken(studentUser4);
    studentDoc4 = await Student.create({
      userId: studentUser4._id,
      usn: 'P5USN004',
      name: 'David Low Attendance',
      email: 'david@phase5-test.edu',
      department: 'P5_CSE',
      batch: '2024-2028',
      semester: 3,
      section: 'A',
      mentorId: mentorDoc1._id,
      academics: [
        {
          semesterNumber: 3,
          sgpa: 8.0,
          creditsEarned: 20,
          subjects: [
            { subjectCode: 'CS301', subjectName: 'Data Structures', credits: 4, cie1: 38, cie2: 40, cie3: 36, semesterExamMarks: 40 },
          ],
        },
      ],
      backlogRecords: [],
    });

    await Attendance.create({
      studentId: studentDoc4._id,
      usn: 'P5USN004',
      studentName: 'David Low Attendance',
      department: 'P5_CSE',
      semester: 3,
      section: 'A',
      subjectCode: 'CS301',
      subjectName: 'Data Structures',
      totalClasses: 40,
      classesAttended: 24,
      attendancePercentage: 60,
      importedBy: hodUserCse._id,
    });

    // 7. Student Late: Late admission student (No mentor, No CIE, No attendance)
    studentLate = await User.create({
      name: 'Emily Late Admit',
      email: 'emily@phase5-test.edu',
      password: 'Password@123',
      role: ROLES.STUDENT,
      department: 'P5_CSE',
      isActivated: true,
    });
    studentTokenLate = generateAccessToken(studentLate);
    studentDocLate = await Student.create({
      userId: studentLate._id,
      usn: 'P5USNLATE',
      name: 'Emily Late Admit',
      email: 'emily@phase5-test.edu',
      department: 'P5_CSE',
      batch: '2024-2028',
      semester: 1,
      section: 'C',
      mentorId: null,
      academics: [],
      backlogRecords: [],
    });

    // 8. Student in ECE (Different department)
    const userEce = await User.create({
      name: 'Frank ECE Student',
      email: 'frank@phase5-test.edu',
      password: 'Password@123',
      role: ROLES.STUDENT,
      department: 'P5_ECE',
      isActivated: true,
    });
    studentDocEce = await Student.create({
      userId: userEce._id,
      usn: 'P5USNECE',
      name: 'Frank ECE Student',
      email: 'frank@phase5-test.edu',
      department: 'P5_ECE',
      batch: '2024-2028',
      semester: 3,
      section: 'A',
      mentorId: null,
      academics: [],
      backlogRecords: [],
    });

    // 9. Parent
    parentUser = await User.create({
      name: 'Mr. Parent of Alice',
      email: 'parent@phase5-test.edu',
      password: 'Password@123',
      role: ROLES.PARENT,
      department: 'General',
      isActivated: true,
    });
    parentToken = generateAccessToken(parentUser);
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@phase5-test\.edu$/ });
    await Student.deleteMany({ usn: /^P5USN/ });
    await Mentor.deleteMany({ employeeId: /^EMP_P5/ });
    await Attendance.deleteMany({ usn: /^P5USN/ });
  });

  // ─────────────────────────────────────────────────────────────
  // 1. RBAC & Access Scoping for Student 360°
  // ─────────────────────────────────────────────────────────────
  describe('RBAC & Relationship Access Scoping', () => {
    it('Mentor 1 CAN access assigned mentee Alice (Student 1)', async () => {
      const res = await request(app)
        .get(`/api/students/${studentDoc1._id}/360`)
        .set('Authorization', `Bearer ${mentorToken1}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.student._id.toString()).toBe(studentDoc1._id.toString());
      expect(res.body.data.academicSummary).toBeDefined();
      expect(res.body.data.academicAttention).toBeDefined();
      expect(res.body.data.attendanceSummary).toBeDefined();
      expect(res.body.data.mentorBrief).toBeDefined();
    });

    it('Mentor 1 CANNOT access Mentor 2 mentee Bob (Student 2) — returns 403 Forbidden', async () => {
      const res = await request(app)
        .get(`/api/students/${studentDoc2._id}/360`)
        .set('Authorization', `Bearer ${mentorToken1}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toMatch(/not your assigned mentee/i);
    });

    it('Mentor 1 CANNOT access unassigned late student Emily — returns 403 Forbidden', async () => {
      const res = await request(app)
        .get(`/api/students/${studentDocLate._id}/360`)
        .set('Authorization', `Bearer ${mentorToken1}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toMatch(/not your assigned mentee/i);
    });

    it('Student can access own 360 overview via /api/students/me/360', async () => {
      const res = await request(app)
        .get('/api/students/me/360')
        .set('Authorization', `Bearer ${studentToken1}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.student.usn).toBe('P5USN001');
    });

    it('Student can access own 360 overview via /api/students/:id/360', async () => {
      const res = await request(app)
        .get(`/api/students/${studentDoc1._id}/360`)
        .set('Authorization', `Bearer ${studentToken1}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('Student CANNOT access another student 360 overview — returns 403 Forbidden', async () => {
      const res = await request(app)
        .get(`/api/students/${studentDoc2._id}/360`)
        .set('Authorization', `Bearer ${studentToken1}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toMatch(/only access your own/i);
    });

    it('Parent CANNOT access arbitrary student 360 via /api/students/:id/360 — returns 403 Forbidden', async () => {
      const res = await request(app)
        .get(`/api/students/${studentDoc1._id}/360`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.statusCode).toBe(403);
    });

    it('HOD can access 360 for any student within their department', async () => {
      const res = await request(app)
        .get(`/api/students/${studentDoc1._id}/360`)
        .set('Authorization', `Bearer ${hodTokenCse}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('HOD CANNOT access student in another department (P5_ECE) — returns 403 Forbidden', async () => {
      const res = await request(app)
        .get(`/api/students/${studentDocEce._id}/360`)
        .set('Authorization', `Bearer ${hodTokenCse}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toMatch(/only access students within your authorized department/i);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. Strict Academic Attention Evaluation (CIE + Backlogs ONLY)
  // ─────────────────────────────────────────────────────────────
  describe('Academic Attention Evaluation Formula & Terminology', () => {
    it('High CIE (>= 25) + 0 backlogs results in Good Academic Standing', async () => {
      const res = await request(app)
        .get(`/api/students/${studentDoc1._id}/360`)
        .set('Authorization', `Bearer ${mentorToken1}`);

      expect(res.statusCode).toBe(200);
      const attention = res.body.data.academicAttention;
      expect(attention.needsAttention).toBe(false);
      expect(attention.statusLabel).toBe('Good Academic Standing');
      expect(attention.activeBacklogs).toBe(0);
      expect(attention.cieAverage).toBeGreaterThanOrEqual(25);
    });

    it('Low CIE (< 25) + 0 backlogs results in Students Needing Academic Attention', async () => {
      const res = await request(app)
        .get(`/api/students/${studentDoc2._id}/360`)
        .set('Authorization', `Bearer ${mentorToken2}`);

      expect(res.statusCode).toBe(200);
      const attention = res.body.data.academicAttention;
      expect(attention.needsAttention).toBe(true);
      expect(attention.statusLabel).toBe('Students Needing Academic Attention');
      expect(attention.reasons.some((r) => r.includes('CIE average') || r.includes('Low CIE'))).toBe(true);
    });

    it('Good CIE + Active Backlogs (> 0) results in Students Needing Academic Attention', async () => {
      const res = await request(app)
        .get(`/api/students/${studentDoc3._id}/360`)
        .set('Authorization', `Bearer ${mentorToken1}`);

      expect(res.statusCode).toBe(200);
      const attention = res.body.data.academicAttention;
      expect(attention.needsAttention).toBe(true);
      expect(attention.statusLabel).toBe('Students Needing Academic Attention');
      expect(attention.activeBacklogs).toBe(1);
      expect(attention.reasons.some((r) => r.includes('backlog'))).toBe(true);
    });

    it('ATTENDANCE MUST NEVER BE INCLUDED IN ACADEMIC ATTENTION: Low attendance alone does NOT trigger academic attention', async () => {
      const res = await request(app)
        .get(`/api/students/${studentDoc4._id}/360`)
        .set('Authorization', `Bearer ${mentorToken1}`);

      expect(res.statusCode).toBe(200);
      const attention = res.body.data.academicAttention;
      const attendance = res.body.data.attendanceSummary;

      // Academic Attention MUST BE FALSE because CIE is high (38/50) and backlogs = 0
      expect(attention.needsAttention).toBe(false);
      expect(attention.statusLabel).toBe('Good Academic Standing');
      expect(attention.reasons.length).toBe(0);

      // Attendance is flagged strictly as an independent warning signal
      expect(attendance.hasAttendanceWarning).toBe(true);
      expect(attendance.overallPercentage).toBe(60);
      expect(attendance.lowAttendanceSubjects.length).toBe(1);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. Late-Admission & Clean Empty State Handling
  // ─────────────────────────────────────────────────────────────
  describe('Late Admission & Empty State Handling', () => {
    it('Late admission student with no CIE or attendance returns clean empty structure without NaN/null errors', async () => {
      const res = await request(app)
        .get('/api/students/me/360')
        .set('Authorization', `Bearer ${studentTokenLate}`);

      expect(res.statusCode).toBe(200);
      const data = res.body.data;

      // Academics
      expect(data.academicSummary.cgpa).toBe(0);
      expect(data.academicSummary.totalActiveBacklogs).toBe(0);
      expect(data.academicSummary.currentCieAverage).toBe(0);
      expect(data.academicAttention.needsAttention).toBe(false);
      expect(data.academicAttention.statusLabel).toBe('Good Academic Standing');

      // Attendance (Must not default to fake 100% or NaN)
      expect(data.attendanceSummary.overallPercentage).toBe(0);
      expect(data.attendanceSummary.hasRecords).toBe(false);
      expect(data.attendanceSummary.records).toEqual([]);
      expect(data.attendanceSummary.hasAttendanceWarning).toBe(false);

      // Mentor Brief
      expect(data.mentorBrief.summary).toBeDefined();
      expect(data.mentorBrief.summary).toContain('Not Ingested');
      expect(data.mentorBrief.attendance).toBe('Attendance data not imported yet.');
      expect(data.mentorBrief.recommendedFocus.length).toBeGreaterThan(0);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. Department Analytics Academic Attention & Attendance KPIs
  // ─────────────────────────────────────────────────────────────
  describe('Department Analytics Attention Metrics', () => {
    it('HOD department analytics returns studentsNeedingAttentionCount and lowAttendanceCount', async () => {
      const analytics = await HodService.getDepartmentAnalytics('P5_CSE');

      expect(analytics.metrics).toBeDefined();
      expect(analytics.metrics.totalStudents).toBeGreaterThanOrEqual(4);
      // Student 2 (low CIE) and Student 3 (backlog) need attention
      expect(analytics.metrics.studentsNeedingAttentionCount).toBeGreaterThanOrEqual(2);
      // Student 4 has attendance shortage (< 75%)
      expect(analytics.metrics.lowAttendanceCount).toBeGreaterThanOrEqual(1);
    });
  });
});
