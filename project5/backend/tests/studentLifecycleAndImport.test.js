const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const app = require('../app');
const { User, Student, Mentor, StudentRecord, AllocationBatch, AuditLog } = require('../models');
const { generateAccessToken } = require('../utils/tokenUtils');
const { ROLES } = require('../config/constants');

describe('Student Lifecycle, Bulk Import & Mentor Allocation Integration Test Suite', () => {
  let hodUser, hodToken;
  let coordinatorUser, coordinatorToken;
  let mentorUser1, mentorDoc1;
  let mentorUser2, mentorDoc2;
  let inactiveMentorUser, inactiveMentorDoc;
  let tempCsvPath;
  let tempMultiCohortCsvPath;
  let tempInvalidCsvPath;

  const testDept = 'CSE_LIFECYCLE';

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_mentoring_system_test');
    }

    // Cleanup any existing data
    await User.deleteMany({ email: { $regex: /lifecycle/i } });
    await Student.deleteMany({ $or: [{ department: testDept }, { usn: { $regex: /^1SG/ } }] });
    await Mentor.deleteMany({ department: testDept });
    await StudentRecord.deleteMany({ $or: [{ department: testDept }, { usn: { $regex: /^1SG/ } }] });
    await AllocationBatch.deleteMany({ department: testDept });

    // 1. Create HOD
    hodUser = await User.create({
      name: 'Dr. HOD Lifecycle',
      email: 'hod@lifecycle.edu',
      password: 'Password@123',
      role: ROLES.HOD,
      department: testDept,
      isActive: true,
      isActivated: true,
    });
    hodToken = generateAccessToken(hodUser);

    // 2. Create Mentoring Coordinator
    coordinatorUser = await User.create({
      name: 'Coordinator Lifecycle',
      email: 'coord@lifecycle.edu',
      password: 'Password@123',
      role: ROLES.MENTORING_COORDINATOR,
      department: testDept,
      isActive: true,
      isActivated: true,
    });
    coordinatorToken = generateAccessToken(coordinatorUser);

    // 3. Create Active Mentor 1 (capacity: 5)
    mentorUser1 = await User.create({
      name: 'Faculty Mentor One',
      email: 'mentor1@lifecycle.edu',
      password: 'Password@123',
      role: ROLES.MENTOR,
      department: testDept,
      isActive: true,
      isActivated: true,
    });
    mentorDoc1 = await Mentor.create({
      userId: mentorUser1._id,
      employeeId: 'EMP_LIFE_01',
      department: testDept,
      maxMentees: 5,
      isActive: true,
    });

    // 4. Create Active Mentor 2 (capacity: 5)
    mentorUser2 = await User.create({
      name: 'Faculty Mentor Two',
      email: 'mentor2@lifecycle.edu',
      password: 'Password@123',
      role: ROLES.MENTOR,
      department: testDept,
      isActive: true,
      isActivated: true,
    });
    mentorDoc2 = await Mentor.create({
      userId: mentorUser2._id,
      employeeId: 'EMP_LIFE_02',
      department: testDept,
      maxMentees: 5,
      isActive: true,
    });

    // 5. Create Inactive Mentor
    inactiveMentorUser = await User.create({
      name: 'Faculty Mentor Inactive',
      email: 'mentor_inact@lifecycle.edu',
      password: 'Password@123',
      role: ROLES.MENTOR,
      department: testDept,
      isActive: true,
      isActivated: true,
    });
    inactiveMentorDoc = await Mentor.create({
      userId: inactiveMentorUser._id,
      employeeId: 'EMP_LIFE_INACT',
      department: testDept,
      maxMentees: 10,
      isActive: false,
    });
  });

  afterAll(async () => {
    // Remove temporary test files if any exist
    [tempCsvPath, tempMultiCohortCsvPath, tempInvalidCsvPath].forEach((file) => {
      try {
        if (file && fs.existsSync(file)) fs.unlinkSync(file);
      } catch (_e) {}
    });

    await User.deleteMany({ email: { $regex: /lifecycle/i } });
    await Student.deleteMany({ $or: [{ department: testDept }, { usn: { $regex: /^1SG/ } }] });
    await Mentor.deleteMany({ department: testDept });
    await StudentRecord.deleteMany({ $or: [{ department: testDept }, { usn: { $regex: /^1SG/ } }] });
    await AllocationBatch.deleteMany({ department: testDept });
    await mongoose.disconnect();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1. MANUAL STUDENT REGISTRATION & ACTIVE LOGIN
  // ──────────────────────────────────────────────────────────────────────────
  describe('1. Manual Student Registration & Immediate Active Login', () => {
    const manualStudentData = {
      name: 'Priya Anand',
      email: 'priya.anand@lifecycle.edu',
      password: 'Student@123',
      usn: '1SG23CS001',
      department: testDept,
      semester: 1,
      section: 'A',
      batch: '2023',
      admissionYear: 2023,
      academicYear: '2023-2024',
      entryType: 'REGULAR',
      phone: '9876543210',
    };

    it('creates User, Student, and StudentRecord with active status', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...manualStudentData,
          role: 'student',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();

      // Check User in DB
      const user = await User.findOne({ email: manualStudentData.email });
      expect(user).toBeDefined();
      expect(user.isActive).toBe(true);
      expect(user.isActivated).toBe(true);
      expect(user.role).toBe(ROLES.STUDENT);

      // Check Student in DB
      const student = await Student.findOne({ usn: manualStudentData.usn });
      expect(student).toBeDefined();
      expect(student.userId.toString()).toBe(user._id.toString());
      expect(student.admissionYear).toBe(2023);
      expect(student.batch).toBe('2023');
      expect(student.entryType).toBe('REGULAR');
      expect(student.status).toBe('ACTIVE');
      expect(student.semester).toBe(1);
      expect(student.section).toBe('A');

      // Check StudentRecord in DB
      const record = await StudentRecord.findOne({ usn: manualStudentData.usn });
      expect(record).toBeDefined();
      expect(record.isActivated).toBe(true);
      expect(record.activatedUserId.toString()).toBe(user._id.toString());
    });

    it('allows immediate login using Email and Password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: manualStudentData.email,
          password: manualStudentData.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(manualStudentData.email);
    });

    it('allows immediate login using USN and Password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: manualStudentData.usn, // Login identifier accepts USN
          password: manualStudentData.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    it('allows student to access /api/auth/me and access dashboard profile', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: manualStudentData.email,
          password: manualStudentData.password,
        });
      const token = loginRes.body.data.token;

      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.success).toBe(true);
      expect(meRes.body.data.user.name).toBe(manualStudentData.name);
      expect(meRes.body.data.profile.usn).toBe(manualStudentData.usn);
      expect(meRes.body.data.profile.admissionYear).toBe(2023);
    });

    it('rejects duplicate registration with identical USN or email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...manualStudentData,
          role: 'student',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('supports HOD manual individual student creation as pre-registered StudentRecord then activates', async () => {
      const res = await request(app)
        .post('/api/hod/students/individual')
        .set('Authorization', `Bearer ${hodToken}`)
        .send({
          name: 'Vikram Seth',
          email: 'vikram.seth@lifecycle.edu',
          password: 'Student@123',
          usn: '1SG23CS002',
          department: testDept,
          batch: '2023',
          admissionYear: 2023,
          academicYear: '2023-2024',
          entryType: 'REGULAR',
          semester: 1,
          section: 'B',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      // Verify ONLY StudentRecord was created with isActivated: false
      const record = await StudentRecord.findOne({ usn: '1SG23CS002' });
      expect(record).toBeDefined();
      expect(record.isActivated).toBe(false);

      const unactivatedStudent = await Student.findOne({ usn: '1SG23CS002' });
      expect(unactivatedStudent).toBeNull();

      // Verify unactivated student appears in HOD student directory
      const dirRes = await request(app)
        .get(`/api/hod/students?department=${testDept}`)
        .set('Authorization', `Bearer ${hodToken}`);
      expect(dirRes.status).toBe(200);
      const preRegInDir = dirRes.body.data.find((s) => s.usn === '1SG23CS002');
      expect(preRegInDir).toBeDefined();
      expect(preRegInDir.isActivated).toBe(false);
      expect(preRegInDir.status).toBe('PRE_REGISTERED');

      // Student activates account via /activate
      const actRes = await request(app)
        .post('/api/auth/activate/student')
        .send({
          usn: '1SG23CS002',
          email: 'vikram.seth@lifecycle.edu',
          password: 'Student@123',
        });
      expect([200, 201]).toContain(actRes.status);

      const student = await Student.findOne({ usn: '1SG23CS002' });
      expect(student).toBeDefined();
      expect(student.status).toBe('ACTIVE');

      // Test login with activated account
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'vikram.seth@lifecycle.edu',
          password: 'Student@123',
        });
      expect(loginRes.status).toBe(200);
      expect(loginRes.body.data.user.name).toBe('Vikram Seth');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. BULK EXCEL / CSV IMPORT — MULTIPLE COHORTS, LATERAL ENTRY & VALIDATION
  // ──────────────────────────────────────────────────────────────────────────
  describe('2. Single Pipeline Bulk Import & Multi-Cohort Support', () => {
    it('imports regular and lateral entry students with diverse admission cohorts in one file', async () => {
      tempMultiCohortCsvPath = path.join(__dirname, 'test_multi_cohort.csv');
      fs.writeFileSync(
        tempMultiCohortCsvPath,
        'USN,Full Name,Email,Department,Program,Admission Year,Batch,Entry Type,Current Academic Year,Current Semester,Section,Status\n' +
        `1SG23CS010,Rahul Verma,rahul.v@lifecycle.edu,${testDept},B.E.,2023,2023,REGULAR,2023-2024,1,A,ACTIVE\n` +
        `1SG24CS001,Ananya Roy,ananya.r@lifecycle.edu,${testDept},B.E.,2024,2024,REGULAR,2024-2025,1,A,ACTIVE\n` +
        `1SG24CS101,Karan Nair,karan.n@lifecycle.edu,${testDept},B.E.,2024,2024-LATERAL,LATERAL,2024-2025,3,B,ACTIVE\n`
      );

      const res = await request(app)
        .post('/api/imports/students')
        .set('Authorization', `Bearer ${hodToken}`)
        .attach('file', tempMultiCohortCsvPath);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.createdCount).toBe(3);
      expect(res.body.data.failureCount).toBe(0);

      // Verify 2023 Regular student
      const st23 = await Student.findOne({ usn: '1SG23CS010' });
      expect(st23).toBeDefined();
      expect(st23.admissionYear).toBe(2023);
      expect(st23.batch).toBe('2023');
      expect(st23.entryType).toBe('REGULAR');
      expect(st23.semester).toBe(1);

      // Verify 2024 Regular student
      const st24Reg = await Student.findOne({ usn: '1SG24CS001' });
      expect(st24Reg).toBeDefined();
      expect(st24Reg.admissionYear).toBe(2024);
      expect(st24Reg.batch).toBe('2024');
      expect(st24Reg.entryType).toBe('REGULAR');
      expect(st24Reg.semester).toBe(1);

      // Verify 2024 Lateral student
      const st24Lat = await Student.findOne({ usn: '1SG24CS101' });
      expect(st24Lat).toBeDefined();
      expect(st24Lat.admissionYear).toBe(2024);
      expect(st24Lat.batch).toBe('2024-LATERAL');
      expect(st24Lat.entryType).toBe('LATERAL');
      expect(st24Lat.semester).toBe(3); // Lateral enters at Semester 3
    });

    it('provides detailed failure reporting for invalid rows (missing fields, bad email, bad sem)', async () => {
      tempInvalidCsvPath = path.join(__dirname, 'test_invalid_rows.csv');
      fs.writeFileSync(
        tempInvalidCsvPath,
        'USN,Full Name,Email,Department,Admission Year,Batch,Entry Type,Semester,Status\n' +
        `1SG24CS091,Valid Student,valid.st@lifecycle.edu,${testDept},2024,2024,REGULAR,1,ACTIVE\n` +
        `,Missing USN,no.usn@lifecycle.edu,${testDept},2024,2024,REGULAR,1,ACTIVE\n` +
        `1SG24CS092,Bad Email,not-an-email,${testDept},2024,2024,REGULAR,1,ACTIVE\n` +
        `1SG24CS093,Bad Semester,bad.sem@lifecycle.edu,${testDept},2024,2024,REGULAR,12,ACTIVE\n` +
        `1SG24CS094,Bad EntryType,bad.entry@lifecycle.edu,${testDept},2024,2024,INVALID_TYPE,1,ACTIVE\n`
      );

      const res = await request(app)
        .post('/api/imports/students')
        .set('Authorization', `Bearer ${hodToken}`)
        .attach('file', tempInvalidCsvPath);

      expect(res.status).toBe(200);
      expect(res.body.data.createdCount).toBe(1);
      expect(res.body.data.failureCount).toBe(4);
      expect(res.body.data.errors.length).toBe(4);

      const reasons = res.body.data.errors.map((e) => e.reason);
      expect(reasons.some((r) => r.includes('Missing required field'))).toBe(true);
      expect(reasons.some((r) => r.includes('Invalid email format'))).toBe(true);
      expect(reasons.some((r) => r.includes('Invalid semester'))).toBe(true);
      expect(reasons.some((r) => r.includes('Invalid entry type'))).toBe(true);
    });

    it('safely detects duplicate rows without overwriting admission cohort or destroying data', async () => {
      tempCsvPath = path.join(__dirname, 'test_duplicate_check.csv');
      fs.writeFileSync(
        tempCsvPath,
        'USN,Full Name,Email,Department,Admission Year,Batch,Entry Type,Semester,Status\n' +
        // 1SG23CS010 already exists from previous test
        `1SG23CS010,Rahul Verma,rahul.v@lifecycle.edu,${testDept},2099,OVERWRITE_BATCH,LATERAL,1,ACTIVE\n` +
        `1SG24CS050,New Student Fifty,fifty@lifecycle.edu,${testDept},2024,2024,REGULAR,1,ACTIVE\n`
      );

      const res = await request(app)
        .post('/api/imports/students')
        .set('Authorization', `Bearer ${hodToken}`)
        .attach('file', tempCsvPath);

      expect(res.status).toBe(200);
      expect(res.body.data.duplicateCount).toBe(1);
      expect(res.body.data.createdCount).toBe(1);

      // Verify existing student cohort was NOT overwritten
      const existing = await Student.findOne({ usn: '1SG23CS010' });
      expect(existing.admissionYear).toBe(2023); // Preserved!
      expect(existing.batch).toBe('2023'); // Preserved!
      expect(existing.entryType).toBe('REGULAR'); // Preserved!
    });

    it('future-year import: 2025 cohort imported without replacing or modifying 2023/2024 cohorts', async () => {
      const futureCsv = path.join(__dirname, 'test_future_cohort.csv');
      fs.writeFileSync(
        futureCsv,
        'USN,Full Name,Email,Department,Admission Year,Batch,Entry Type,Semester,Status\n' +
        `1SG25CS001,Future Student 2025,future25@lifecycle.edu,${testDept},2025,2025,REGULAR,1,ACTIVE\n`
      );

      const res = await request(app)
        .post('/api/imports/students')
        .set('Authorization', `Bearer ${hodToken}`)
        .attach('file', futureCsv);

      expect(res.status).toBe(200);
      expect(res.body.data.createdCount).toBe(1);

      try {
        if (fs.existsSync(futureCsv)) fs.unlinkSync(futureCsv);
      } catch (_e) {}

      // Verify all cohorts coexist
      const count2023 = await Student.countDocuments({ department: testDept, admissionYear: 2023 });
      const count2024 = await Student.countDocuments({ department: testDept, admissionYear: 2024 });
      const count2025 = await Student.countDocuments({ department: testDept, admissionYear: 2025 });

      expect(count2023).toBeGreaterThanOrEqual(1);
      expect(count2024).toBeGreaterThanOrEqual(1);
      expect(count2025).toBe(1);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. SEMESTER PROGRESSION & GRADUATION LIFECYCLE
  // ──────────────────────────────────────────────────────────────────────────
  describe('3. Semester Progression & Graduation Lifecycle', () => {
    let studentForProgression;

    beforeAll(async () => {
      studentForProgression = await Student.findOne({ usn: '1SG23CS001' });
    });

    it('progresses student semester while keeping admission cohort immutable', async () => {
      const res = await request(app)
        .post(`/api/hod/students/${studentForProgression._id}/progress`)
        .set('Authorization', `Bearer ${hodToken}`)
        .send({
          semester: 2,
          academicYear: '2023-2024',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updated = await Student.findById(studentForProgression._id);
      expect(updated.semester).toBe(2);
      // Admission cohort must be strictly unchanged
      expect(updated.admissionYear).toBe(2023);
      expect(updated.batch).toBe('2023');
      expect(updated.entryType).toBe('REGULAR');
      expect(updated.usn).toBe('1SG23CS001');
    });

    it('allows progression to higher semesters and verifies audit log created', async () => {
      const res = await request(app)
        .post(`/api/hod/students/${studentForProgression._id}/progress`)
        .set('Authorization', `Bearer ${hodToken}`)
        .send({
          semester: 3,
          academicYear: '2024-2025',
        });

      expect(res.status).toBe(200);
      const updated = await Student.findById(studentForProgression._id);
      expect(updated.semester).toBe(3);
      expect(updated.academicYear).toBe('2024-2025');

      const audit = await AuditLog.findOne({
        entityId: studentForProgression._id,
        action: 'STUDENT_PROMOTED',
      });
      expect(audit).toBeDefined();
    });

    it('graduates student (status = GRADUATED) and preserves full academic and historical data', async () => {
      const res = await request(app)
        .post(`/api/hod/students/${studentForProgression._id}/progress`)
        .set('Authorization', `Bearer ${hodToken}`)
        .send({
          semester: 8,
          academicYear: '2026-2027',
          status: 'GRADUATED',
        });

      expect(res.status).toBe(200);
      const graduated = await Student.findById(studentForProgression._id);
      expect(graduated.status).toBe('GRADUATED');
      expect(graduated.admissionYear).toBe(2023);
      expect(graduated.batch).toBe('2023');

      // Check audit log for graduation
      const audit = await AuditLog.findOne({
        entityId: studentForProgression._id,
        action: 'STUDENT_GRADUATED',
      });
      expect(audit).toBeDefined();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. MENTOR ALLOCATION ENGINE INTEGRATION & STATUS SAFETY
  // ──────────────────────────────────────────────────────────────────────────
  describe('4. Mentor Allocation Engine & Status/Lifecycle Safety', () => {
    it('excludes graduated and inactive students from allocation preview and capacity counts', async () => {
      // 1SG23CS001 is GRADUATED -> Must NOT appear in allocation preview
      const previewRes = await request(app)
        .post('/api/allocation/preview')
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({
          department: testDept,
          mode: 'incremental',
        });

      expect(previewRes.status).toBe(200);
      const assignedUsns = previewRes.body.data.assignments.map((a) => a.usn);
      expect(assignedUsns).not.toContain('1SG23CS001'); // Graduated student excluded!

      // Capacity check: graduated student not counted in unassigned students
      const capacityRes = await request(app)
        .get(`/api/allocation/capacity?department=${testDept}`)
        .set('Authorization', `Bearer ${coordinatorToken}`);
      expect(capacityRes.status).toBe(200);
      expect(capacityRes.body.data.unassignedStudents).not.toBeNaN();
    });

    it('excludes inactive mentors from capacity and allocations', async () => {
      const capacityRes = await request(app)
        .get(`/api/allocation/capacity?department=${testDept}`)
        .set('Authorization', `Bearer ${coordinatorToken}`);

      const data = capacityRes.body.data;
      const inactMentor = data.mentors.find((m) => m.employeeId === 'EMP_LIFE_INACT');
      expect(inactMentor).toBeDefined();
      expect(inactMentor.isActive).toBe(false);

      // Total capacity should only be active mentors: mentor1 (5) + mentor2 (5) = 10
      expect(data.capacity.totalCapacity).toBe(10);
    });

    it('generates allocation preview with section soft-preference and least-loaded mentor selection', async () => {
      const res = await request(app)
        .post('/api/allocation/preview')
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({
          department: testDept,
          mode: 'incremental',
          sectionPreference: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.assignments.length).toBeGreaterThanOrEqual(1);

      // Preview must NOT modify the database
      const sample = await Student.findOne({ usn: res.body.data.assignments[0].usn });
      expect(sample.mentorId).toBeNull();
    });

    it('confirms allocation, persists mentorId, and records mentorHistory on students', async () => {
      const previewRes = await request(app)
        .post('/api/allocation/preview')
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({
          department: testDept,
          mode: 'incremental',
        });

      const assignments = previewRes.body.data.assignments;

      const confirmRes = await request(app)
        .post('/api/allocation/confirm')
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({
          department: testDept,
          assignments,
          academicYear: '2024-2025',
          notes: 'Integration test cohort allocation',
        });

      expect(confirmRes.status).toBe(200);
      expect(confirmRes.body.success).toBe(true);

      // Verify Student.mentorId was updated AND mentorHistory recorded
      const sampleStudent = await Student.findOne({ usn: assignments[0].usn });
      expect(sampleStudent.mentorId).not.toBeNull();
      expect(sampleStudent.mentorHistory.length).toBeGreaterThanOrEqual(1);
      expect(sampleStudent.mentorHistory[0].mentorId.toString()).toBe(sampleStudent.mentorId.toString());

      // Verify AllocationBatch was created
      const batch = await AllocationBatch.findOne({ department: testDept, status: 'confirmed' });
      expect(batch).toBeDefined();
      expect(batch.allocations.length).toBe(assignments.length);
    });

    it('reassigns student, updates mentorHistory, and rejects reassignment to inactive mentor', async () => {
      const student = await Student.findOne({ department: testDept, status: 'ACTIVE', mentorId: { $ne: null } });

      // Attempt to reassign to inactive mentor -> must fail 400
      const failRes = await request(app)
        .post('/api/allocation/reassign')
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({
          studentId: student._id,
          newMentorId: inactiveMentorDoc._id,
          reason: 'Attempt assign to inactive',
        });
      expect(failRes.status).toBe(400);

      // Reassign to other active mentor
      const targetMentor = student.mentorId.toString() === mentorDoc1._id.toString()
        ? mentorDoc2
        : mentorDoc1;

      const reassignRes = await request(app)
        .post('/api/allocation/reassign')
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({
          studentId: student._id,
          newMentorId: targetMentor._id,
          reason: 'Balanced workload domain shift',
        });

      expect(reassignRes.status).toBe(200);

      const updated = await Student.findById(student._id);
      expect(updated.mentorId.toString()).toBe(targetMentor._id.toString());
      // History should now have multiple entries
      expect(updated.mentorHistory.length).toBeGreaterThanOrEqual(2);
    });

    it('rejects mentor reassignment for graduated students', async () => {
      const graduated = await Student.findOne({ department: testDept, status: 'GRADUATED' });
      expect(graduated).toBeDefined();

      const res = await request(app)
        .post('/api/allocation/reassign')
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({
          studentId: graduated._id,
          newMentorId: mentorDoc1._id,
          reason: 'Cannot assign to graduated',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/graduated/i);
    });

    it('HOD student management API supports filtering by cohort, batch, entryType, and status', async () => {
      const res = await request(app)
        .get(`/api/hod/students?department=${testDept}&admissionYear=2024&entryType=LATERAL`)
        .set('Authorization', `Bearer ${hodToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const usns = res.body.data.map((s) => s.usn);
      expect(usns).toContain('1SG24CS101'); // Lateral student
      expect(usns).not.toContain('1SG23CS001'); // 2023 student filtered out
    });
  });
});
