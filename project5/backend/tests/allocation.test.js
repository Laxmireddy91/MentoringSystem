const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const { User, Student, Mentor, AllocationBatch, AuditLog, StudentRecord } = require('../models');
const { generateAccessToken } = require('../utils/tokenUtils');
const { ROLES } = require('../config/constants');

describe('Phase 3 — Mentor Allocation Engine & Coordinator Workflows', () => {
  let coordinatorUser, coordinatorToken;
  let hodUser, hodToken;
  let studentUser, studentToken;
  let mentorUser, mentorToken;
  let parentUser, parentToken;

  let activeMentor1, activeMentor2, inactiveMentor;
  let student1, student2, student3, lateStudent;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_mentoring_system_test');
    }

    // Clean up test data
    await User.deleteMany({
      email: {
        $in: [
          'coord_alloc@test.com',
          'hod_alloc@test.com',
          'st_alloc1@test.com',
          'st_alloc2@test.com',
          'st_alloc3@test.com',
          'st_late_alloc@test.com',
          'm_alloc1@test.com',
          'm_alloc2@test.com',
          'm_inactive@test.com',
          'parent_alloc@test.com',
        ],
      },
    });
    await Student.deleteMany({
      usn: { $in: ['ALLOC_USN_01', 'ALLOC_USN_02', 'ALLOC_USN_03', 'ALLOC_USN_LATE'] },
    });
    await Mentor.deleteMany({
      employeeId: { $in: ['EMP_ALLOC_1', 'EMP_ALLOC_2', 'EMP_ALLOC_INACT'] },
    });
    await AllocationBatch.deleteMany({ department: 'CSE_ALLOC' });
    await StudentRecord.deleteMany({ usn: 'ALLOC_USN_LATE' });

    // 1. Create Mentoring Coordinator
    coordinatorUser = await User.create({
      name: 'Coord Allocator',
      email: 'coord_alloc@test.com',
      password: 'Password@123',
      role: ROLES.MENTORING_COORDINATOR,
      department: 'CSE_ALLOC',
      isActivated: true,
    });
    coordinatorToken = generateAccessToken(coordinatorUser);

    // 2. Create HOD
    hodUser = await User.create({
      name: 'HOD Allocator',
      email: 'hod_alloc@test.com',
      password: 'Password@123',
      role: ROLES.HOD,
      department: 'CSE_ALLOC',
      isActivated: true,
    });
    hodToken = generateAccessToken(hodUser);

    // 3. Create Regular Mentor & Student & Parent for RBAC check
    const regMentorUser = await User.create({
      name: 'Regular Mentor',
      email: 'm_reg_alloc@test.com',
      password: 'Password@123',
      role: ROLES.MENTOR,
      department: 'CSE_ALLOC',
      isActivated: true,
    });
    mentorToken = generateAccessToken(regMentorUser);

    const regStudentUser = await User.create({
      name: 'Regular Student',
      email: 'st_reg_alloc@test.com',
      password: 'Password@123',
      role: ROLES.STUDENT,
      department: 'CSE_ALLOC',
      isActivated: true,
    });
    studentToken = generateAccessToken(regStudentUser);

    parentUser = await User.create({
      name: 'Regular Parent',
      email: 'parent_alloc@test.com',
      password: 'Password@123',
      role: ROLES.PARENT,
      isActivated: true,
    });
    parentToken = generateAccessToken(parentUser);

    // 4. Create Active Mentors with controlled capacity
    const m1User = await User.create({
      name: 'Active Mentor 1',
      email: 'm_alloc1@test.com',
      password: 'Password@123',
      role: ROLES.MENTOR,
      department: 'CSE_ALLOC',
      isActivated: true,
    });
    activeMentor1 = await Mentor.create({
      userId: m1User._id,
      employeeId: 'EMP_ALLOC_1',
      department: 'CSE_ALLOC',
      maxMentees: 2, // Low capacity to test shortage & limits
      isActive: true,
    });

    const m2User = await User.create({
      name: 'Active Mentor 2',
      email: 'm_alloc2@test.com',
      password: 'Password@123',
      role: ROLES.MENTOR,
      department: 'CSE_ALLOC',
      isActivated: true,
    });
    activeMentor2 = await Mentor.create({
      userId: m2User._id,
      employeeId: 'EMP_ALLOC_2',
      department: 'CSE_ALLOC',
      maxMentees: 2,
      isActive: true,
    });

    // 5. Create Inactive Mentor
    const inactUser = await User.create({
      name: 'Inactive Mentor',
      email: 'm_inactive@test.com',
      password: 'Password@123',
      role: ROLES.MENTOR,
      department: 'CSE_ALLOC',
      isActivated: true,
    });
    inactiveMentor = await Mentor.create({
      userId: inactUser._id,
      employeeId: 'EMP_ALLOC_INACT',
      department: 'CSE_ALLOC',
      maxMentees: 10,
      isActive: false, // Inactive
    });

    // 6. Create Unassigned Students (different sections)
    const st1User = await User.create({
      name: 'Student One',
      email: 'st_alloc1@test.com',
      password: 'Password@123',
      role: ROLES.STUDENT,
      department: 'CSE_ALLOC',
      isActivated: true,
    });
    student1 = await Student.create({
      userId: st1User._id,
      usn: 'ALLOC_USN_01',
      department: 'CSE_ALLOC',
      batch: '2024-2028',
      semester: 1,
      section: 'A',
      mentorId: null, // Unassigned
    });

    const st2User = await User.create({
      name: 'Student Two',
      email: 'st_alloc2@test.com',
      password: 'Password@123',
      role: ROLES.STUDENT,
      department: 'CSE_ALLOC',
      isActivated: true,
    });
    student2 = await Student.create({
      userId: st2User._id,
      usn: 'ALLOC_USN_02',
      department: 'CSE_ALLOC',
      batch: '2024-2028',
      semester: 1,
      section: 'B', // Different section (tests section preference)
      mentorId: null,
    });

    const st3User = await User.create({
      name: 'Student Three',
      email: 'st_alloc3@test.com',
      password: 'Password@123',
      role: ROLES.STUDENT,
      department: 'CSE_ALLOC',
      batch: '2024-2028',
      semester: 1,
      section: 'C',
      mentorId: null,
    });
    student3 = await Student.create({
      userId: st3User._id,
      usn: 'ALLOC_USN_03',
      department: 'CSE_ALLOC',
      batch: '2024-2028',
      semester: 1,
      section: 'C',
      mentorId: null,
    });
  });

  afterAll(async () => {
    await User.deleteMany({
      email: {
        $in: [
          'coord_alloc@test.com',
          'hod_alloc@test.com',
          'st_alloc1@test.com',
          'st_alloc2@test.com',
          'st_alloc3@test.com',
          'st_late_alloc@test.com',
          'm_alloc1@test.com',
          'm_alloc2@test.com',
          'm_inactive@test.com',
          'parent_alloc@test.com',
          'm_reg_alloc@test.com',
          'st_reg_alloc@test.com',
        ],
      },
    });
    await Student.deleteMany({
      usn: { $in: ['ALLOC_USN_01', 'ALLOC_USN_02', 'ALLOC_USN_03', 'ALLOC_USN_LATE'] },
    });
    await Mentor.deleteMany({
      employeeId: { $in: ['EMP_ALLOC_1', 'EMP_ALLOC_2', 'EMP_ALLOC_INACT'] },
    });
    await AllocationBatch.deleteMany({ department: 'CSE_ALLOC' });
    await StudentRecord.deleteMany({ usn: 'ALLOC_USN_LATE' });
  });

  describe('1. RBAC & Access Control', () => {
    it('allows MENTORING_COORDINATOR to access allocation metrics and capacity', async () => {
      const res = await request(app)
        .get('/api/allocation/metrics?department=CSE_ALLOC')
        .set('Authorization', `Bearer ${coordinatorToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.students).toBeDefined();
    });

    it('allows HOD to access allocation metrics and capacity', async () => {
      const res = await request(app)
        .get('/api/allocation/capacity?department=CSE_ALLOC')
        .set('Authorization', `Bearer ${hodToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.capacity).toBeDefined();
    });

    it('denies access to unauthorized roles (STUDENT)', async () => {
      const res = await request(app)
        .get('/api/allocation/metrics')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    it('denies access to unauthorized roles (MENTOR)', async () => {
      const res = await request(app)
        .get('/api/allocation/preview')
        .set('Authorization', `Bearer ${mentorToken}`)
        .send({ department: 'CSE_ALLOC' });
      expect(res.status).toBe(403);
    });

    it('denies access to unauthorized roles (PARENT)', async () => {
      const res = await request(app)
        .get('/api/allocation/history')
        .set('Authorization', `Bearer ${parentToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('2. Hard Constraints & Inactive Mentor Safety', () => {
    it('excludes inactive mentors from capacity calculation and available slots', async () => {
      const res = await request(app)
        .get('/api/allocation/capacity?department=CSE_ALLOC')
        .set('Authorization', `Bearer ${coordinatorToken}`);

      expect(res.status).toBe(200);
      const data = res.body.data;
      // Inactive mentor must be marked isActive: false
      const inactEntry = data.mentors.find((m) => m._id === inactiveMentor._id.toString());
      expect(inactEntry).toBeDefined();
      expect(inactEntry.isActive).toBe(false);

      // Active mentors should have combined capacity of 4 (2 + 2)
      expect(data.capacity.totalCapacity).toBe(4);
    });

    it('generates preview without modifying database records', async () => {
      const res = await request(app)
        .post('/api/allocation/preview')
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({
          department: 'CSE_ALLOC',
          batch: '2024-2028',
          semester: 1,
          mode: 'incremental',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.assignments.length).toBe(3);

      // Verify DB was NOT modified: students are still unassigned
      const s1 = await Student.findById(student1._id);
      const s2 = await Student.findById(student2._id);
      expect(s1.mentorId).toBeNull();
      expect(s2.mentorId).toBeNull();
    });

    it('allocates students with section mismatch (section is only preference, never hard blocker)', async () => {
      const res = await request(app)
        .post('/api/allocation/preview')
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({
          department: 'CSE_ALLOC',
          batch: '2024-2028',
          semester: 1,
          sectionPreference: true,
        });

      expect(res.status).toBe(200);
      const assignments = res.body.data.assignments;
      // All 3 students (sections A, B, C) are allocated even though only 2 mentors exist
      expect(assignments.length).toBe(3);
      const allocatedSections = assignments.map((a) => a.studentSection);
      expect(allocatedSections).toContain('A');
      expect(allocatedSections).toContain('B');
      expect(allocatedSections).toContain('C');
    });
  });

  describe('3. Capacity Shortage Detection', () => {
    it('detects and explicitly flags capacity shortage when students exceed available capacity', async () => {
      // Temporarily set activeMentor1 and activeMentor2 maxMentees to 1 (total capacity = 2 for 3 students)
      await Mentor.findByIdAndUpdate(activeMentor1._id, { maxMentees: 1 });
      await Mentor.findByIdAndUpdate(activeMentor2._id, { maxMentees: 1 });

      const res = await request(app)
        .post('/api/allocation/preview')
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({
          department: 'CSE_ALLOC',
          batch: '2024-2028',
          semester: 1,
        });

      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data.summary.totalStudentsInBatch).toBe(3);
      expect(data.summary.studentsAllocated).toBe(2);
      expect(data.summary.studentsUnallocated).toBe(1);
      expect(data.summary.capacityShortage).toBe(1);
      expect(data.unallocatedStudents.length).toBe(1);
      expect(data.unallocatedStudents[0].reason).toBe('Insufficient mentor capacity');

      // Restore capacity for remaining tests
      await Mentor.findByIdAndUpdate(activeMentor1._id, { maxMentees: 5 });
      await Mentor.findByIdAndUpdate(activeMentor2._id, { maxMentees: 5 });
    });
  });

  describe('4. Late-Admission / Individually-Created Student Support', () => {
    it('automatically includes late-admission students from Phase 2 in allocation preview', async () => {
      // Create late admission student via HOD individual student service
      const lateUser = await User.create({
        name: 'Late Admission Student',
        email: 'st_late_alloc@test.com',
        password: 'Password@123',
        role: ROLES.STUDENT,
        department: 'CSE_ALLOC',
        isActivated: true,
      });

      lateStudent = await Student.create({
        userId: lateUser._id,
        usn: 'ALLOC_USN_LATE',
        department: 'CSE_ALLOC',
        batch: '2024-2028',
        semester: 1,
        section: 'A',
        mentorId: null, // Unassigned
      });

      const res = await request(app)
        .post('/api/allocation/preview')
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({
          department: 'CSE_ALLOC',
          batch: '2024-2028',
          semester: 1,
          mode: 'incremental',
        });

      expect(res.status).toBe(200);
      const usns = res.body.data.assignments.map((a) => a.usn);
      expect(usns).toContain('ALLOC_USN_LATE');
    });
  });

  describe('5. Confirmation, Persistence & Duplicate Prevention', () => {
    let previewData;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/allocation/preview')
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({
          department: 'CSE_ALLOC',
          batch: '2024-2028',
          semester: 1,
          mode: 'incremental',
        });
      previewData = res.body.data;
    });

    it('confirms allocation, persists mentorId to students, creates AllocationBatch and AuditLog', async () => {
      const confirmRes = await request(app)
        .post('/api/allocation/confirm')
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({
          assignments: previewData.assignments,
          academicYear: '2024-2025',
          department: 'CSE_ALLOC',
          batch: '2024-2028',
          semester: 1,
          notes: 'Test batch confirmation',
        });

      expect(confirmRes.status).toBe(200);
      expect(confirmRes.body.success).toBe(true);

      // Verify student 1 was persisted with a mentor
      const s1 = await Student.findById(student1._id);
      expect(s1.mentorId).not.toBeNull();

      // Verify AllocationBatch was created
      const batch = await AllocationBatch.findOne({ department: 'CSE_ALLOC' });
      expect(batch).toBeDefined();
      expect(batch.allocations.length).toBe(previewData.assignments.length);
      expect(batch.totalStudentsAllocated).toBe(previewData.assignments.length);

      // Verify AuditLog was recorded
      const audit = await AuditLog.findOne({
        action: 'ALLOCATION_CONFIRMED',
        entityId: batch._id,
      });
      expect(audit).toBeDefined();
    });

    it('rejects duplicate confirmation if the same batch is submitted again', async () => {
      // Submitting the exact same assignments after they are already in the DB must throw 400
      const res = await request(app)
        .post('/api/allocation/confirm')
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({
          assignments: previewData.assignments,
          academicYear: '2024-2025',
          department: 'CSE_ALLOC',
          notes: 'Duplicate submission attempt',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Duplicate confirmation/i);
    });

    it('incremental allocation does not reassign already-allocated students', async () => {
      // A new preview in incremental mode should find 0 unassigned students now
      const res = await request(app)
        .post('/api/allocation/preview')
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({
          department: 'CSE_ALLOC',
          batch: '2024-2028',
          semester: 1,
          mode: 'incremental',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.assignments.length).toBe(0);
      expect(res.body.data.summary.totalStudentsInBatch).toBe(0);
    });
  });

  describe('6. Manual Adjustment & Reassignment', () => {
    it('allows coordinator to reassign a student with reason and capacity check', async () => {
      const currentMentorId = (await Student.findById(student1._id)).mentorId;
      const targetMentorId =
        currentMentorId.toString() === activeMentor1._id.toString()
          ? activeMentor2._id
          : activeMentor1._id;

      const res = await request(app)
        .post('/api/allocation/reassign')
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({
          studentId: student1._id,
          newMentorId: targetMentorId,
          reason: 'Coordinator rebalancing due to specialized project domain',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updated = await Student.findById(student1._id);
      expect(updated.mentorId.toString()).toBe(targetMentorId.toString());

      // Verify AuditLog for reassignment
      const audit = await AuditLog.findOne({
        action: 'ALLOCATION_REASSIGNED',
        entityId: student1._id,
      });
      expect(audit).toBeDefined();
      expect(audit.newValue.reason).toContain('specialized project domain');
    });

    it('rejects reassignment to an inactive mentor', async () => {
      const res = await request(app)
        .post('/api/allocation/reassign')
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({
          studentId: student1._id,
          newMentorId: inactiveMentor._id,
          reason: 'Attempt to assign to inactive mentor',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/inactive/i);
    });

    it('rejects reassignment if target mentor has reached maximum capacity', async () => {
      // Set activeMentor2 maxMentees to 0
      await Mentor.findByIdAndUpdate(activeMentor2._id, { maxMentees: 0 });

      const res = await request(app)
        .post('/api/allocation/reassign')
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({
          studentId: student2._id,
          newMentorId: activeMentor2._id,
          reason: 'Overfill capacity test',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/maximum capacity/i);

      // Restore
      await Mentor.findByIdAndUpdate(activeMentor2._id, { maxMentees: 5 });
    });
  });

  describe('7. History & Audit Trail', () => {
    it('retrieves allocation batch history for the department', async () => {
      const res = await request(app)
        .get('/api/allocation/history?department=CSE_ALLOC')
        .set('Authorization', `Bearer ${coordinatorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].department).toBe('CSE_ALLOC');
    });

    it('retrieves individual batch details by ID', async () => {
      const batch = await AllocationBatch.findOne({ department: 'CSE_ALLOC' });
      const res = await request(app)
        .get(`/api/allocation/history/${batch._id}`)
        .set('Authorization', `Bearer ${coordinatorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data._id.toString()).toBe(batch._id.toString());
      expect(res.body.data.allocations.length).toBeGreaterThanOrEqual(1);
    });
  });
});
