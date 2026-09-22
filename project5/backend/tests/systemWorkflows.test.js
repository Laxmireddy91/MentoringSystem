const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const {
  User,
  Student,
  Mentor,
  PlacementDrive,
  PlacementApplication,
  ExamRequest,
  Attendance,
  AllocationBatch,
} = require('../models');
const { ROLES } = require('../config/constants');
const { generateAccessToken } = require('../utils/tokenUtils');

describe('Core System Workflows Integration Test Suite', () => {
  let coordinatorUser, coordinatorToken;
  let tpoUser, tpoToken;
  let examCoordUser, examCoordToken;
  let mentorUser1, mentor1Token, mentorDoc1;
  let mentorUser2, mentor2Token, mentorDoc2;
  let studentUser1, student1Token, studentDoc1;
  let studentUser2, student2Token, studentDoc2;
  let lateAdmissionUser, lateAdmissionToken, lateAdmissionDoc;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_mentoring_system_test');
    }

    // Clean test data
    await User.deleteMany({ email: /@test-workflow\.edu$/ });
    await Student.deleteMany({ usn: /^TEST/ });
    await Mentor.deleteMany({ employeeId: /^EMP_TEST/ });
    await PlacementDrive.deleteMany({ company: 'TestCorp Technologies' });
    await ExamRequest.deleteMany({ subjectCode: '21CS51' });
    await AllocationBatch.deleteMany({ department: 'TEST_CSE' });

    // 1. Mentoring Coordinator
    coordinatorUser = await User.create({
      name: 'Prof. Coordinator',
      email: 'coord@test-workflow.edu',
      password: 'Password@123',
      role: ROLES.MENTORING_COORDINATOR,
      department: 'TEST_CSE',
      isActivated: true,
    });
    coordinatorToken = generateAccessToken(coordinatorUser);

    // 2. TPO
    tpoUser = await User.create({
      name: 'Mr. Placement Officer',
      email: 'tpo@test-workflow.edu',
      password: 'Password@123',
      role: ROLES.TPO,
      department: 'Central Placement',
      isActivated: true,
    });
    tpoToken = generateAccessToken(tpoUser);

    // 3. Exam Coordinator
    examCoordUser = await User.create({
      name: 'Dr. Exam Head',
      email: 'exam@test-workflow.edu',
      password: 'Password@123',
      role: ROLES.EXAM_COORDINATOR,
      department: 'Examination Section',
      isActivated: true,
    });
    examCoordToken = generateAccessToken(examCoordUser);

    // 4. Mentors
    mentorUser1 = await User.create({
      name: 'Dr. Mentor One',
      email: 'm1@test-workflow.edu',
      password: 'Password@123',
      role: ROLES.MENTOR,
      department: 'TEST_CSE',
      isActivated: true,
    });
    mentorDoc1 = await Mentor.create({
      userId: mentorUser1._id,
      employeeId: 'EMP_TEST_01',
      department: 'TEST_CSE',
      maxMentees: 10,
    });
    mentor1Token = generateAccessToken(mentorUser1);

    mentorUser2 = await User.create({
      name: 'Prof. Mentor Two',
      email: 'm2@test-workflow.edu',
      password: 'Password@123',
      role: ROLES.MENTOR,
      department: 'TEST_CSE',
      isActivated: true,
    });
    mentorDoc2 = await Mentor.create({
      userId: mentorUser2._id,
      employeeId: 'EMP_TEST_02',
      department: 'TEST_CSE',
      maxMentees: 10,
    });
    mentor2Token = generateAccessToken(mentorUser2);

    // 5. Students (Unassigned initially)
    studentUser1 = await User.create({
      name: 'Student One',
      email: 's1@test-workflow.edu',
      password: 'Password@123',
      role: ROLES.STUDENT,
      department: 'TEST_CSE',
      isActivated: true,
    });
    studentDoc1 = await Student.create({
      userId: studentUser1._id,
      usn: 'TEST001',
      department: 'TEST_CSE',
      semester: 5,
      section: 'A',
      batch: '2022-2026',
      academics: [
        {
          semesterNumber: 5,
          sgpa: 8.5,
          cgpa: 8.5,
          subjects: [
            { subjectCode: '21CS51', subjectName: 'Software Engineering', credits: 4, cie1: 45, cie2: 48, finalMarks: 45 },
          ],
        },
      ],
    });
    student1Token = generateAccessToken(studentUser1);

    studentUser2 = await User.create({
      name: 'Student Two',
      email: 's2@test-workflow.edu',
      password: 'Password@123',
      role: ROLES.STUDENT,
      department: 'TEST_CSE',
      isActivated: true,
    });
    studentDoc2 = await Student.create({
      userId: studentUser2._id,
      usn: 'TEST002',
      department: 'TEST_CSE',
      semester: 5,
      section: 'B',
      batch: '2022-2026',
      academics: [
        {
          semesterNumber: 5,
          sgpa: 5.2,
          cgpa: 5.8,
          subjects: [
            { subjectCode: '21CS51', subjectName: 'Software Engineering', credits: 4, cie1: 18, cie2: 20, finalMarks: 25 },
          ],
        },
      ],
      backlogRecords: [
        { subjectCode: '21CS32', subjectName: 'Data Structures', semester: 3, isCleared: false, status: 'Active' },
      ],
    });
    student2Token = generateAccessToken(studentUser2);
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@test-workflow\.edu$/ });
    await Student.deleteMany({ usn: /^TEST/ });
    await Mentor.deleteMany({ employeeId: /^EMP_TEST/ });
    await PlacementDrive.deleteMany({ company: 'TestCorp Technologies' });
    await ExamRequest.deleteMany({ subjectCode: '21CS51' });
    await AllocationBatch.deleteMany({ department: 'TEST_CSE' });
    await mongoose.disconnect();
  });

  // ─────────────────────────────────────────────────────────────
  // 1. Mentoring Coordinator Allocation Engine
  // ─────────────────────────────────────────────────────────────
  describe('Automatic Mentor-Mentee Allocation Engine', () => {
    let previewData;

    it('should calculate capacity correctly for the department', async () => {
      const res = await request(app)
        .post('/api/coordinator/capacity')
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({ department: 'TEST_CSE', batch: '2022-2026', semester: 5 });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.requiredCapacity).toBe(2);
      expect(res.body.data.totalAvailableCapacity).toBe(20); // 10 + 10
      expect(res.body.data.isSufficient).toBe(true);
      expect(res.body.data.capacityShortage).toBe(0);
    });

    it('should generate a balanced allocation preview without saving to DB', async () => {
      const res = await request(app)
        .post('/api/coordinator/preview')
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({ department: 'TEST_CSE', batch: '2022-2026', semester: 5 });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary.studentsAllocated).toBe(2);
      expect(res.body.data.allocationsByMentor.length).toBeGreaterThanOrEqual(1);

      previewData = res.body.data;

      // Verify DB was NOT modified during preview
      const st1 = await Student.findById(studentDoc1._id);
      expect(st1.mentorId).toBeNull();
    });

    it('should confirm allocation and persist assignments to DB', async () => {
      const res = await request(app)
        .post('/api/coordinator/confirm')
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({ allocationData: previewData, notes: 'Confirmed batch allocation' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify DB is now updated
      const st1 = await Student.findById(studentDoc1._id);
      const st2 = await Student.findById(studentDoc2._id);
      expect(st1.mentorId).not.toBeNull();
      expect(st2.mentorId).not.toBeNull();
    });

    it('should handle incremental allocation for a newly admitted student without disturbing existing', async () => {
      // Create a 3rd student (Late admission)
      lateAdmissionUser = await User.create({
        name: 'Late Admission Student',
        email: 'late@test-workflow.edu',
        password: 'Password@123',
        role: ROLES.STUDENT,
        department: 'TEST_CSE',
        isActivated: true,
      });
      lateAdmissionDoc = await Student.create({
        userId: lateAdmissionUser._id,
        usn: 'TEST003',
        department: 'TEST_CSE',
        semester: 5,
        section: 'A',
        batch: '2022-2026',
      });

      // Run preview again
      const previewRes = await request(app)
        .post('/api/coordinator/preview')
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({ department: 'TEST_CSE', batch: '2022-2026', semester: 5 });

      expect(previewRes.statusCode).toBe(200);
      // ONLY the 1 unassigned student is allocated
      expect(previewRes.body.data.summary.studentsAllocated).toBe(1);
      expect(previewRes.body.data.allocationsByMentor[0].students[0].studentUsn).toBe('TEST003');

      // Existing assignments remained untouched!
      const st1 = await Student.findById(studentDoc1._id);
      expect(st1.mentorId).not.toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. Student 360° Console & Strict Academic Attention Rule
  // ─────────────────────────────────────────────────────────────
  describe('Student 360° Console & Academic Attention Rule', () => {
    it('should correctly report Good Academic Standing when CIE is high and backlogs are 0', async () => {
      const res = await request(app)
        .get(`/api/students/${studentDoc1._id}/360`)
        .set('Authorization', `Bearer ${coordinatorToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.academicAttention.needsAttention).toBe(false);
      expect(res.body.data.academicAttention.statusLabel).toBe('Good Academic Standing');
      expect(res.body.data.mentorBrief.summary).toContain('TEST001');
    });

    it('should strictly flag Academic Attention based ONLY on CIE + Backlogs', async () => {
      const res = await request(app)
        .get(`/api/students/${studentDoc2._id}/360`)
        .set('Authorization', `Bearer ${coordinatorToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.academicAttention.needsAttention).toBe(true);
      expect(res.body.data.academicAttention.statusLabel).toMatch(/Need(s|ing) Academic Attention/);
      expect(res.body.data.academicAttention.reasons.length).toBeGreaterThan(0);
      expect(res.body.data.academicAttention.reasons.some((r) => r.includes('backlog'))).toBe(true);
      // Attendance is separate
      expect(res.body.data.attendanceSummary).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. TPO Placement Drives & Rule-based Eligibility
  // ─────────────────────────────────────────────────────────────
  describe('TPO Placement Drive & Eligibility Engine', () => {
    let driveId;

    it('should allow TPO to create a placement drive', async () => {
      const res = await request(app)
        .post('/api/placement/drives')
        .set('Authorization', `Bearer ${tpoToken}`)
        .send({
          company: 'TestCorp Technologies',
          role: 'Software Development Engineer',
          jobType: 'Full Time',
          ctc: '12 LPA',
          eligibleDepartments: ['TEST_CSE'],
          minCGPA: 7.0,
          maxBacklogs: 0,
          requiredSkills: ['JavaScript', 'Node.js'],
          description: 'Campus hiring drive for 2026 batch',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.company).toBe('TestCorp Technologies');
      driveId = res.body.data._id;
    });

    it('should accurately evaluate student eligibility with clear explainable reasons', async () => {
      const res = await request(app)
        .get(`/api/placement/drives/${driveId}/eligibility`)
        .set('Authorization', `Bearer ${tpoToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const st1Result = res.body.data.students.find((s) => s.usn === 'TEST001');
      const st2Result = res.body.data.students.find((s) => s.usn === 'TEST002');

      // Student 1 (CGPA 8.5, 0 backlogs) -> Eligible
      expect(st1Result.isEligible).toBe(true);
      expect(st1Result.reasons.some((r) => r.includes('satisfies requirement'))).toBe(true);

      // Student 2 (CGPA 5.8, 1 backlog) -> Ineligible with reasons
      expect(st2Result.isEligible).toBe(false);
      expect(st2Result.reasons.some((r) => r.includes('below required minimum'))).toBe(true);
      expect(st2Result.reasons.some((r) => r.includes('exceed allowed maximum'))).toBe(true);
    });

    it('should allow eligible student to apply for drive', async () => {
      const res = await request(app)
        .post(`/api/placement/drives/${driveId}/apply`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('applied');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. Digital Exam / CIE Permission Multi-Stage Workflow
  // ─────────────────────────────────────────────────────────────
  describe('Exam / CIE Permission Workflow', () => {
    let requestId;

    it('should allow student to submit an exam permission request', async () => {
      const res = await request(app)
        .post('/api/exam-requests')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          requestType: 'cie_retest',
          subjectCode: '21CS51',
          subjectName: 'Software Engineering',
          semester: 5,
          reason: 'Severe illness during CIE 2',
          description: 'Requesting permission to appear for makeup CIE test',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('submitted');
      expect(res.body.data.timeline.length).toBe(1);
      requestId = res.body.data._id;
    });

    it('should allow mentor to review and forward the request to Exam Coordinator', async () => {
      const res = await request(app)
        .patch(`/api/exam-requests/${requestId}/mentor-review`)
        .set('Authorization', `Bearer ${mentor1Token}`)
        .send({
          action: 'forward',
          remarks: 'Medical certificate verified. Recommended for makeup test.',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('coordinator_review');
      expect(res.body.data.timeline.length).toBe(2);
      expect(res.body.data.timeline[1].action).toContain('Forwarded to Exam Coordinator');
    });

    it('should allow Exam Coordinator to give final decision and record approval in timeline', async () => {
      const res = await request(app)
        .patch(`/api/exam-requests/${requestId}/decision`)
        .set('Authorization', `Bearer ${examCoordToken}`)
        .send({
          action: 'approve',
          remarks: 'Makeup CIE approved for 21CS51 on Monday 10:00 AM.',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('approved');
      expect(res.body.data.timeline.length).toBe(3);
      expect(res.body.data.timeline[2].action).toContain('Final Approval Granted by Exam Coordinator');
    });
  });
});
