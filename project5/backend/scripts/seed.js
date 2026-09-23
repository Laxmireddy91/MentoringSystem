const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '../.env') });

const {
  User,
  Student,
  Mentor,
  Session,
  Feedback,
  Message,
  Notification,
  Task,
  Report,
  StudentGoal,
  Achievement,
  PerformanceSnapshot,
  RiskSettings,
  LoginActivity,
  AuditLog,
  AllocationBatch,
  PlacementDrive,
  PlacementApplication,
  PlacementProfile,
  ExamRequest,
  Document,
  Attendance,
  StaffRecord,
  StudentRecord,
} = require('../models');

const {
  ROLES,
  SESSION_STATUS,
  SESSION_TYPES,
  REQUEST_TYPES,
  REQUEST_STATUS,
  PLACEMENT_DRIVE_STATUS,
  AUDIT_ACTIONS,
} = require('../config/constants');

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_mentoring_system';
    console.log(`🌱 Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB.');

    console.log('🧹 Purging old collections...');
    await Promise.all([
      User.deleteMany({}),
      Student.deleteMany({}),
      Mentor.deleteMany({}),
      Session.deleteMany({}),
      Feedback.deleteMany({}),
      Message.deleteMany({}),
      Notification.deleteMany({}),
      Task.deleteMany({}),
      Report.deleteMany({}),
      StudentGoal.deleteMany({}),
      Achievement.deleteMany({}),
      PerformanceSnapshot.deleteMany({}),
      RiskSettings.deleteMany({}),
      LoginActivity.deleteMany({}),
      AuditLog.deleteMany({}),
      AllocationBatch.deleteMany({}),
      PlacementDrive.deleteMany({}),
      PlacementApplication.deleteMany({}),
      PlacementProfile.deleteMany({}),
      ExamRequest.deleteMany({}),
      Document.deleteMany({}),
      Attendance.deleteMany({}),
      StaffRecord.deleteMany({}),
      StudentRecord.deleteMany({}),
    ]);

    console.log('🏛️ Creating S.G. Balekundri Institute of Technology Institutional Staff & Leadership...');

    // ── 1. Leadership & Institutional Staff ────────────────────────────────────

    // HOD
    const hodUser = await User.create({
      name: 'Dr. Suresh Kalloli',
      email: 'hod.cse@sgbit.edu.in',
      password: 'Password@123', // also supports Hod@12345
      role: ROLES.HOD,
      department: 'CSE',
      phone: '+91 9845012345',
      isActivated: true,
      isEmailVerified: true,
      staffProfile: { employeeId: 'HOD_CSE_01', designation: 'HOD & Professor' },
    });

    await StaffRecord.create({
      employeeId: 'HOD_CSE_01',
      email: 'hod.cse@sgbit.edu.in',
      name: 'Dr. Suresh Kalloli',
      role: ROLES.HOD,
      department: 'CSE',
      designation: 'HOD & Professor',
      phone: '+91 9845012345',
      isActivated: true,
      activatedAt: new Date(),
      activatedUserId: hodUser._id,
    });

    // Mentoring Coordinator
    const coordUser = await User.create({
      name: 'Prof. Preethi Hegde',
      email: 'coordinator.cse@sgbit.edu.in',
      password: 'Password@123',
      role: ROLES.MENTORING_COORDINATOR,
      department: 'CSE',
      phone: '+91 9845099999',
      isActivated: true,
      isEmailVerified: true,
      staffProfile: { employeeId: 'COORD_CSE_01', designation: 'Mentoring Coordinator' },
    });

    await StaffRecord.create({
      employeeId: 'COORD_CSE_01',
      email: 'coordinator.cse@sgbit.edu.in',
      name: 'Prof. Preethi Hegde',
      role: ROLES.MENTORING_COORDINATOR,
      department: 'CSE',
      designation: 'Mentoring Coordinator & Associate Professor',
      phone: '+91 9845099999',
      isActivated: true,
      activatedAt: new Date(),
      activatedUserId: coordUser._id,
    });

    // Exam Coordinator
    const examCoordUser = await User.create({
      name: 'Dr. Ramesh Sharma',
      email: 'exam.cell@sgbit.edu.in',
      password: 'Password@123',
      role: ROLES.EXAM_COORDINATOR,
      department: 'Examination Section',
      phone: '+91 9845088888',
      isActivated: true,
      isEmailVerified: true,
      staffProfile: { employeeId: 'EXAM_01', designation: 'Controller of Examinations' },
    });

    await StaffRecord.create({
      employeeId: 'EXAM_01',
      email: 'exam.cell@sgbit.edu.in',
      name: 'Dr. Ramesh Sharma',
      role: ROLES.EXAM_COORDINATOR,
      department: 'Examination Section',
      designation: 'Controller of Examinations',
      phone: '+91 9845088888',
      isActivated: true,
      activatedAt: new Date(),
      activatedUserId: examCoordUser._id,
    });

    // Training & Placement Officer (TPO)
    const tpoUser = await User.create({
      name: 'Mr. Chethan Rao',
      email: 'tpo@sgbit.edu.in',
      password: 'Password@123',
      role: ROLES.TPO,
      department: 'Training & Placement Cell',
      phone: '+91 9845077777',
      isActivated: true,
      isEmailVerified: true,
      staffProfile: { employeeId: 'TPO_01', designation: 'Head - Training & Placement' },
    });

    await StaffRecord.create({
      employeeId: 'TPO_01',
      email: 'tpo@sgbit.edu.in',
      name: 'Mr. Chethan Rao',
      role: ROLES.TPO,
      department: 'Training & Placement Cell',
      designation: 'Head - Training & Placement',
      phone: '+91 9845077777',
      isActivated: true,
      activatedAt: new Date(),
      activatedUserId: tpoUser._id,
    });

    // ── 2. Faculty Mentors (4 Active + 1 Unactivated) ───────────────────────────
    console.log('👨‍🏫 Creating SGBIT Faculty Mentors...');

    const mentorData = [
      {
        name: 'Dr. Ravi Kumar',
        email: 'ravi.kumar@sgbit.edu.in',
        employeeId: 'MTR001',
        designation: 'Associate Professor',
        phone: '+91 9845011001',
        specialization: ['Machine Learning', 'Data Analytics', 'Cloud Computing'],
        maxMentees: 20,
      },
      {
        name: 'Dr. Anita Sharma',
        email: 'anita.sharma@sgbit.edu.in',
        employeeId: 'MTR002',
        designation: 'Assistant Professor',
        phone: '+91 9845011002',
        specialization: ['Database Systems', 'Software Engineering', 'Big Data'],
        maxMentees: 20,
      },
      {
        name: 'Prof. Rajesh Kumar',
        email: 'rajesh.kumar@sgbit.edu.in',
        employeeId: 'MTR003',
        designation: 'Assistant Professor',
        phone: '+91 9845011003',
        specialization: ['Computer Networks', 'Cybersecurity', 'IoT'],
        maxMentees: 20,
      },
      {
        name: 'Prof. Priyanka Rao',
        email: 'priyanka.rao@sgbit.edu.in',
        employeeId: 'MTR004',
        designation: 'Assistant Professor',
        phone: '+91 9845011004',
        specialization: ['Web Technologies', 'Compiler Design', 'Operating Systems'],
        maxMentees: 20,
      },
    ];

    const mentorDocs = [];

    for (const m of mentorData) {
      const user = await User.create({
        name: m.name,
        email: m.email,
        password: 'Password@123',
        role: ROLES.MENTOR,
        department: 'CSE',
        phone: m.phone,
        isActivated: true,
        isEmailVerified: true,
        mentorProfile: { employeeId: m.employeeId, designation: m.designation },
        staffProfile: { employeeId: m.employeeId, designation: m.designation },
      });

      const mentor = await Mentor.create({
        userId: user._id,
        employeeId: m.employeeId,
        department: 'CSE',
        designation: m.designation,
        specialization: m.specialization,
        maxMentees: m.maxMentees,
        isActive: true,
        ratingAverage: 4.6,
        totalRatings: 18,
        officeHours: [
          {
            dayOfWeek: 2,
            dayName: 'Tuesday',
            startTime: '14:00',
            endTime: '16:00',
            slotDurationMinutes: 30,
            location: 'CSE Cabin 204',
          },
          {
            dayOfWeek: 4,
            dayName: 'Thursday',
            startTime: '15:00',
            endTime: '17:00',
            slotDurationMinutes: 30,
            location: 'CSE Cabin 204',
          },
        ],
      });

      await StaffRecord.create({
        employeeId: m.employeeId,
        email: m.email,
        name: m.name,
        role: ROLES.MENTOR,
        department: 'CSE',
        designation: m.designation,
        phone: m.phone,
        isActivated: true,
        activatedAt: new Date(),
        activatedUserId: user._id,
        createdBy: hodUser._id,
      });

      mentorDocs.push(mentor);
    }

    // Unactivated Mentor 5 in StaffRecord: Prof. Mahesh Patil (Ready for /activate/staff demo)
    await StaffRecord.create({
      employeeId: 'MTR005',
      email: 'mahesh.patil@sgbit.edu.in',
      name: 'Prof. Mahesh Patil',
      role: ROLES.MENTOR,
      department: 'CSE',
      designation: 'Assistant Professor',
      phone: '+91 9845011005',
      isActivated: false,
      createdBy: hodUser._id,
    });
    console.log('  [+] Created unactivated StaffRecord for Prof. Mahesh Patil (MTR005) for /activate testing.');

    // ── 3. Students (~30 Students, 25 Assigned + 5 Unassigned) ─────────────────
    console.log('🎓 Creating 30 Realistic SGBIT CSE Students with VTU Curriculum...');

    const rawStudents = [
      // ── Assigned Students (25) ──
      // Mentor 0 (Dr. Ravi Kumar) Mentees:
      { usn: '2SB23CS001', name: 'Rahul Kumar', email: 'rahul.cs23@sgbit.edu.in', sem: 3, sec: 'A', mentorIdx: 0, cgpa: 9.2, risk: 'Low', att: 92, backlogs: 0 },
      { usn: '2SB23CS002', name: 'Priya Patel', email: 'priya.cs23@sgbit.edu.in', sem: 3, sec: 'A', mentorIdx: 0, cgpa: 8.4, risk: 'Low', att: 86, backlogs: 0 },
      { usn: '2SB23CS003', name: 'Aditya Desai', email: 'aditya.cs23@sgbit.edu.in', sem: 3, sec: 'A', mentorIdx: 0, cgpa: 7.9, risk: 'Low', att: 81, backlogs: 0 },
      { usn: '2SB22CS004', name: 'Sneha Kulkarni', email: 'sneha.cs22@sgbit.edu.in', sem: 5, sec: 'B', mentorIdx: 0, cgpa: 6.1, risk: 'Medium', att: 73, backlogs: 1 },
      { usn: '2SB22CS005', name: 'Varun Joshi', email: 'varun.cs22@sgbit.edu.in', sem: 5, sec: 'B', mentorIdx: 0, cgpa: 7.4, risk: 'Low', att: 88, backlogs: 0 },
      { usn: '2SB21CS006', name: 'Arjun Naik', email: 'arjun.cs21@sgbit.edu.in', sem: 7, sec: 'C', mentorIdx: 0, cgpa: 4.8, risk: 'Critical', att: 61, backlogs: 3 },

      // Mentor 1 (Dr. Anita Sharma) Mentees:
      { usn: '2SB23CS007', name: 'Ananya Hegde', email: 'ananya.cs23@sgbit.edu.in', sem: 3, sec: 'A', mentorIdx: 1, cgpa: 8.9, risk: 'Low', att: 94, backlogs: 0 },
      { usn: '2SB23CS008', name: 'Rohan Shinde', email: 'rohan.cs23@sgbit.edu.in', sem: 3, sec: 'A', mentorIdx: 1, cgpa: 7.5, risk: 'Low', att: 83, backlogs: 0 },
      { usn: '2SB22CS009', name: 'Kavya Bhat', email: 'kavya.cs22@sgbit.edu.in', sem: 5, sec: 'B', mentorIdx: 1, cgpa: 8.2, risk: 'Low', att: 89, backlogs: 0 },
      { usn: '2SB22CS010', name: 'Manish Prabhu', email: 'manish.cs22@sgbit.edu.in', sem: 5, sec: 'B', mentorIdx: 1, cgpa: 5.4, risk: 'High', att: 68, backlogs: 2 },
      { usn: '2SB21CS011', name: 'Pooja Angadi', email: 'pooja.cs21@sgbit.edu.in', sem: 7, sec: 'C', mentorIdx: 1, cgpa: 8.7, risk: 'Low', att: 91, backlogs: 0 },
      { usn: '2SB21CS012', name: 'Kiran Gasti', email: 'kiran.cs21@sgbit.edu.in', sem: 7, sec: 'C', mentorIdx: 1, cgpa: 6.8, risk: 'Medium', att: 74, backlogs: 1 },

      // Mentor 2 (Prof. Rajesh Kumar) Mentees:
      { usn: '2SB23CS013', name: 'Sachin Belagavi', email: 'sachin.cs23@sgbit.edu.in', sem: 3, sec: 'A', mentorIdx: 2, cgpa: 8.1, risk: 'Low', att: 85, backlogs: 0 },
      { usn: '2SB23CS014', name: 'Deepa Hiremath', email: 'deepa.cs23@sgbit.edu.in', sem: 3, sec: 'B', mentorIdx: 2, cgpa: 7.8, risk: 'Low', att: 80, backlogs: 0 },
      { usn: '2SB22CS015', name: 'Girish Hosur', email: 'girish.cs22@sgbit.edu.in', sem: 5, sec: 'A', mentorIdx: 2, cgpa: 6.9, risk: 'Low', att: 79, backlogs: 0 },
      { usn: '2SB22CS016', name: 'Megha Kamat', email: 'megha.cs22@sgbit.edu.in', sem: 5, sec: 'B', mentorIdx: 2, cgpa: 8.6, risk: 'Low', att: 93, backlogs: 0 },
      { usn: '2SB21CS017', name: 'Nikhil Hubli', email: 'nikhil.cs21@sgbit.edu.in', sem: 7, sec: 'C', mentorIdx: 2, cgpa: 5.9, risk: 'High', att: 65, backlogs: 2 },
      { usn: '2SB21CS018', name: 'Aishwarya Patil', email: 'aishwarya.cs21@sgbit.edu.in', sem: 7, sec: 'C', mentorIdx: 2, cgpa: 7.6, risk: 'Low', att: 84, backlogs: 0 },

      // Mentor 3 (Prof. Priyanka Rao) Mentees:
      { usn: '2SB23CS019', name: 'Darshan Kittur', email: 'darshan.cs23@sgbit.edu.in', sem: 3, sec: 'B', mentorIdx: 3, cgpa: 8.5, risk: 'Low', att: 88, backlogs: 0 },
      { usn: '2SB23CS020', name: 'Swati Chougala', email: 'swati.cs23@sgbit.edu.in', sem: 3, sec: 'B', mentorIdx: 3, cgpa: 7.2, risk: 'Medium', att: 72, backlogs: 1 },
      { usn: '2SB22CS021', name: 'Prashant Savadatti', email: 'prashant.cs22@sgbit.edu.in', sem: 5, sec: 'A', mentorIdx: 3, cgpa: 8.3, risk: 'Low', att: 90, backlogs: 0 },
      { usn: '2SB22CS022', name: 'Bhavana Chawan', email: 'bhavana.cs22@sgbit.edu.in', sem: 5, sec: 'A', mentorIdx: 3, cgpa: 6.5, risk: 'Low', att: 78, backlogs: 0 },
      { usn: '2SB21CS023', name: 'Vinayak Mutalik', email: 'vinayak.cs21@sgbit.edu.in', sem: 7, sec: 'B', mentorIdx: 3, cgpa: 7.7, risk: 'Low', att: 82, backlogs: 0 },
      { usn: '2SB21CS024', name: 'Shreya Bailhongal', email: 'shreya.cs21@sgbit.edu.in', sem: 7, sec: 'B', mentorIdx: 3, cgpa: 8.8, risk: 'Low', att: 95, backlogs: 0 },
      { usn: '2SB23CS025', name: 'Tejas Gokak', email: 'tejas.cs23@sgbit.edu.in', sem: 3, sec: 'B', mentorIdx: 3, cgpa: 7.6, risk: 'Low', att: 81, backlogs: 0 },

      // ── Unassigned Students (5) (for HOD Allocation testing) ──
      { usn: '2SB23CS026', name: 'Chetan Mudalgi', email: 'chetan.cs23@sgbit.edu.in', sem: 3, sec: 'A', mentorIdx: null, cgpa: 8.0, risk: 'Low', att: 87, backlogs: 0 },
      { usn: '2SB23CS027', name: 'Netra Saundatti', email: 'netra.cs23@sgbit.edu.in', sem: 3, sec: 'B', mentorIdx: null, cgpa: 7.7, risk: 'Low', att: 82, backlogs: 0 },
      { usn: '2SB22CS028', name: 'Praveen Khanapur', email: 'praveen.cs22@sgbit.edu.in', sem: 5, sec: 'A', mentorIdx: null, cgpa: 6.2, risk: 'Medium', att: 71, backlogs: 1 },
      { usn: '2SB22CS029', name: 'Sunita Hukkeri', email: 'sunita.cs22@sgbit.edu.in', sem: 5, sec: 'B', mentorIdx: null, cgpa: 7.4, risk: 'Low', att: 85, backlogs: 0 },
      { usn: '2SB21CS030', name: 'Basavaraj Ramdurg', email: 'basavaraj.cs21@sgbit.edu.in', sem: 7, sec: 'A', mentorIdx: null, cgpa: 5.6, risk: 'High', att: 66, backlogs: 2 },
    ];

    const studentDocs = [];

    const subjectsBySem = {
      3: [
        { code: '21CS31', name: 'Transform Calculus & Linear Algebra', credits: 3 },
        { code: '21CS32', name: 'Data Structures and Applications', credits: 4 },
        { code: '21CS33', name: 'Analog and Digital Electronics', credits: 3 },
        { code: '21CS34', name: 'Computer Organization and Architecture', credits: 3 },
        { code: '21CS35', name: 'Object Oriented Programming with Java', credits: 3 },
      ],
      5: [
        { code: '21CS51', name: 'Management and Entrepreneurship', credits: 3 },
        { code: '21CS52', name: 'Computer Networks and Security', credits: 4 },
        { code: '21CS53', name: 'Database Management Systems', credits: 4 },
        { code: '21CS54', name: 'Automata Theory and Computability', credits: 3 },
        { code: '21CS55', name: 'Web Technologies and Cloud', credits: 3 },
      ],
      7: [
        { code: '21CS71', name: 'Artificial Intelligence and Machine Learning', credits: 4 },
        { code: '21CS72', name: 'Big Data Analytics', credits: 4 },
        { code: '21CS73', name: 'Cryptography and Cyber Law', credits: 3 },
        { code: '21CS74', name: 'Cloud Computing Services', credits: 3 },
        { code: '21CSP75', name: 'Major Project Phase-1', credits: 4 },
      ],
    };

    for (const raw of rawStudents) {
      const assignedMentor = raw.mentorIdx !== null ? mentorDocs[raw.mentorIdx] : null;

      const user = await User.create({
        name: raw.name,
        email: raw.email,
        password: 'Password@123', // supports Student@12345
        role: ROLES.STUDENT,
        department: 'CSE',
        phone: '+91 974100' + raw.usn.slice(-4),
        isActivated: true,
        isEmailVerified: true,
        studentProfile: {
          usn: raw.usn,
          semester: raw.sem,
          section: raw.sec,
        },
      });

      // Build academic semester records
      const semSubjects = (subjectsBySem[raw.sem] || subjectsBySem[3]).map((sub, idx) => {
        let cie1 = Math.round(35 + Math.random() * 14);
        let cie2 = Math.round(35 + Math.random() * 14);
        let cie3 = Math.round(36 + Math.random() * 13);
        let finalMarks = Math.round(raw.cgpa * 9.5);
        let grade = 'A';

        if (raw.risk === 'Critical' || raw.risk === 'High') {
          if (idx < raw.backlogs) {
            cie1 = 16;
            cie2 = 18;
            cie3 = 19;
            finalMarks = 32;
            grade = 'F';
          }
        }

        return {
          subjectCode: sub.code,
          subjectName: sub.name,
          credits: sub.credits,
          cie1,
          cie2,
          cie3,
          assignmentMarks: 9,
          semesterExamMarks: finalMarks,
          finalMarks,
          grade,
        };
      });

      const student = await Student.create({
        userId: user._id,
        usn: raw.usn,
        department: 'CSE',
        program: 'B.E.',
        semester: raw.sem,
        section: raw.sec,
        batch: `${2027 - raw.sem}`,
        admissionYear: 2027 - raw.sem - 4,
        academicYear: '2025-2026',
        mentorId: assignedMentor ? assignedMentor._id : null,
        parentEmail: raw.usn === '2SB23CS001' ? 'parent.rahul@gmail.com' : `parent.${raw.usn.toLowerCase()}@gmail.com`,
        parentPhone: '+91 944800' + raw.usn.slice(-4),
        cgpa: raw.cgpa,
        totalBacklogs: raw.backlogs,
        riskCategory: raw.risk,
        riskProfile: {
          riskLevel: raw.risk,
          score: raw.risk === 'Critical' ? 88 : raw.risk === 'High' ? 68 : raw.risk === 'Medium' ? 42 : 12,
          reasons: raw.backlogs > 0 ? [`${raw.backlogs} active backlog course(s)`] : [],
        },
        academics: [
          {
            semesterNumber: raw.sem,
            academicYear: '2025-2026',
            sgpa: raw.cgpa,
            credits: 20,
            earnedCredits: raw.backlogs > 0 ? 16 : 20,
            subjects: semSubjects,
          },
        ],
        isActivated: true,
      });

      await StudentRecord.create({
        usn: raw.usn,
        email: raw.email,
        name: raw.name,
        department: 'CSE',
        semester: raw.sem,
        section: raw.sec,
        batch: `${2027 - raw.sem}`,
        parentEmail: raw.usn === '2SB23CS001' ? 'parent.rahul@gmail.com' : `parent.${raw.usn.toLowerCase()}@gmail.com`,
        parentName: raw.usn === '2SB23CS001' ? 'Mr. Ashok Kumar' : `Guardian of ${raw.name}`,
        parentPhone: '+91 944800' + raw.usn.slice(-4),
        parentRelation: 'Father',
        isActivated: true,
        activatedAt: new Date(),
        activatedUserId: user._id,
      });

      // Create attendance records
      for (const sub of semSubjects) {
        const totalClasses = 48;
        const classesAttended = Math.round((totalClasses * raw.att) / 100);
        await Attendance.create({
          studentId: student._id,
          usn: student.usn,
          subjectCode: sub.subjectCode,
          subjectName: sub.subjectName,
          semester: raw.sem,
          academicYear: '2025-2026',
          totalClasses,
          classesAttended,
          attendancePercentage: raw.att,
          importedBy: hodUser._id,
        });
      }

      studentDocs.push(student);
    }

    // ── 4. Parent Account for Rahul Kumar (2SB23CS001) ─────────────────────────
    console.log('👨‍👩‍👧 Creating Parent Account for Rahul Kumar (2SB23CS001)...');

    const rahulStudent = studentDocs.find((s) => s.usn === '2SB23CS001');

    const parentUser = await User.create({
      name: 'Mr. Ashok Kumar',
      email: 'parent.rahul@gmail.com',
      password: 'Password@123',
      role: ROLES.PARENT,
      department: 'General',
      phone: '+91 9448001001',
      isActivated: true,
      isEmailVerified: true,
      parentProfile: {
        studentUsn: '2SB23CS001',
        relation: 'Father',
      },
    });

    if (rahulStudent) {
      rahulStudent.parentUserId = parentUser._id;
      await rahulStudent.save();
    }

    // ── 5. Mentoring Sessions ──────────────────────────────────────────────────
    console.log('📅 Creating Mentoring Sessions (Completed & Scheduled)...');

    const primaryMentor = mentorDocs[0]; // Dr. Ravi Kumar
    const priyaStudent = studentDocs.find((s) => s.usn === '2SB23CS002');
    const snehaStudent = studentDocs.find((s) => s.usn === '2SB22CS004');
    const arjunStudent = studentDocs.find((s) => s.usn === '2SB21CS006');

    // Completed past session with Rahul
    const pastSession1 = await Session.create({
      mentorId: primaryMentor._id,
      studentId: rahulStudent._id,
      title: 'Semester 3 Academic Goal Setting & Minor Project Guidance',
      description: 'Review of Data Structures performance and planning for IEEE SGBIT Hackathon participation.',
      scheduledDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000),
      sessionType: SESSION_TYPES.ACADEMIC,
      status: SESSION_STATUS.COMPLETED,
      notes: 'Rahul is performing exceptionally well in Data Structures. Recommended him to participate in IEEE SGBIT Hackathon.',
      actionItems: [
        { task: 'Prepare synopsis for IEEE Smart Campus project', completed: true },
        { task: 'Complete NPTEL Data Science registration', completed: false },
      ],
    });

    // Student Feedback for past session
    await Feedback.create({
      sessionId: pastSession1._id,
      studentId: rahulStudent._id,
      mentorId: primaryMentor._id,
      rating: 5,
      aspects: { punctuality: 5, helpfulness: 5, clarity: 5 },
      comment: 'Dr. Ravi Kumar provided very constructive ideas on my project architecture and guided me toward quality research papers.',
      isAnonymous: false,
    });

    // Upcoming scheduled session with Rahul
    await Session.create({
      mentorId: primaryMentor._id,
      studentId: rahulStudent._id,
      title: 'CIE 1 Marks Review & Career Pathway Counseling',
      description: 'Reviewing CIE 1 marks across subjects and exploring internship preparation tracks.',
      scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
      sessionType: SESSION_TYPES.ACADEMIC,
      status: SESSION_STATUS.SCHEDULED,
      location: 'CSE Cabin 204',
    });

    // Upcoming scheduled session with Sneha (At-risk mentee)
    if (snehaStudent) {
      await Session.create({
        mentorId: primaryMentor._id,
        studentId: snehaStudent._id,
        title: 'Academic Recovery Plan for Backlog Course (Automata Theory)',
        description: 'Structured study schedule and tutorial doubt-clearing sessions.',
        scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000),
        sessionType: SESSION_TYPES.ACADEMIC,
        status: SESSION_STATUS.CONFIRMED,
        location: 'CSE Mentoring Room',
      });
    }

    // ── 6. Mentoring Tasks ─────────────────────────────────────────────────────
    console.log('📋 Creating Mentoring Tasks & Deliverables...');

    const rahulUser = await User.findById(rahulStudent.userId);
    const mentorUser = await User.findById(primaryMentor.userId);

    await Task.create({
      assignedTo: rahulUser._id,
      assignedBy: mentorUser._id,
      studentId: rahulStudent._id,
      title: 'Submit IEEE Student Branch Paper Draft',
      description: 'Draft the 4-page paper on IoT Based Smart Energy Management for SGBIT Campus and share preliminary results.',
      status: 'in_progress',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      priority: 'high',
    });

    await Task.create({
      assignedTo: rahulUser._id,
      assignedBy: mentorUser._id,
      studentId: rahulStudent._id,
      title: 'Complete LeetCode 50 SQL Problem Set',
      description: 'Strengthen query optimization skills before CIE 2 tests.',
      status: 'in_progress',
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      priority: 'medium',
    });

    if (arjunStudent) {
      const arjunUser = await User.findById(arjunStudent.userId);
      await Task.create({
        assignedTo: arjunUser._id,
        assignedBy: mentorUser._id,
        studentId: arjunStudent._id,
        title: 'Weekly Attendance Recovery Timesheet',
        description: 'Meet subject faculty daily and maintain signed lecture attendance verification card.',
        status: 'pending',
        dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        priority: 'high',
      });
    }

    // ── 7. Messages & Communication ────────────────────────────────────────────
    console.log('💬 Creating Inter-Role Messages (Mentor, Student, Parent)...');

    const getConvId = (id1, id2) => [id1.toString(), id2.toString()].sort().join('_');

    await Message.create({
      senderId: mentorUser._id,
      receiverId: rahulUser._id,
      conversationId: getConvId(mentorUser._id, rahulUser._id),
      content: 'Hello Rahul, I reviewed your CIE 1 marks for Data Structures (48/50). Excellent work! Keep up the momentum for CIE 2.',
      isRead: true,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    });

    await Message.create({
      senderId: rahulUser._id,
      receiverId: mentorUser._id,
      conversationId: getConvId(mentorUser._id, rahulUser._id),
      content: 'Thank you Sir! I am preparing the project presentation as discussed and will bring the working prototype next Tuesday.',
      isRead: true,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    });

    await Message.create({
      senderId: mentorUser._id,
      receiverId: parentUser._id,
      conversationId: getConvId(mentorUser._id, parentUser._id),
      content: 'Dear Mr. Ashok Kumar, Rahul continues to demonstrate outstanding discipline with 92% attendance and top academic standing. We have scheduled our next mentoring session for this Thursday.',
      isRead: false,
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    });

    // ── 8. Placement Drives & Student Applications ──────────────────────────────
    console.log('💼 Creating Placement Drives & Student Profiles...');

    const tcsDrive = await PlacementDrive.create({
      role: 'TCS Campus Recruitment 2026 - Ninja & Digital Cadres',
      company: 'Tata Consultancy Services',
      description: 'Pan-India hiring drive for Final Year & Pre-final Year B.E. Computer Science & Engineering students.',
      eligibleDepartments: ['CSE', 'ISE'],
      minCGPA: 7.0,
      maxBacklogs: 0,
      ctc: '7.5 LPA - 9.0 LPA (Digital), 3.6 LPA (Ninja)',
      jobLocation: 'Bengaluru / Pune / Hyderabad',
      applicationDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      driveDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      status: PLACEMENT_DRIVE_STATUS.ACTIVE,
      createdBy: tpoUser._id,
    });

    const infosysDrive = await PlacementDrive.create({
      role: 'Infosys Specialist Programmer (SP) & SES National Challenge',
      company: 'Infosys Limited',
      description: 'Competitive programming and core software engineering recruitment for tier-1 algorithmic engineers.',
      eligibleDepartments: ['CSE'],
      minCGPA: 7.5,
      maxBacklogs: 0,
      ctc: '9.5 LPA - 12.0 LPA',
      jobLocation: 'Bengaluru / Mysuru',
      applicationDeadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      driveDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: PLACEMENT_DRIVE_STATUS.ACTIVE,
      createdBy: tpoUser._id,
    });

    // Rahul's Placement Profile & Application
    await PlacementProfile.create({
      studentId: rahulStudent._id,
      skills: ['C++', 'Python', 'React.js', 'Node.js', 'MongoDB', 'AWS'],
      projects: [
        {
          title: 'Smart Campus Energy Management System',
          description: 'IoT based telemetry system monitoring power grid efficiency.',
          techStack: ['Node.js', 'React.js', 'MQTT', 'MongoDB'],
        },
      ],
    });

    await PlacementApplication.create({
      driveId: tcsDrive._id,
      studentId: rahulStudent._id,
      status: 'shortlisted',
      appliedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    });

    // ── 9. Examination Cell Requests ───────────────────────────────────────────
    console.log('📝 Creating Exam Cell Records & Requests...');

    if (snehaStudent) {
      await ExamRequest.create({
        studentId: snehaStudent._id,
        mentorId: primaryMentor._id,
        title: 'Medical Leave Condonation for CIE 1',
        description: 'Medical Leave due to viral fever during CIE 1 week. Attached official medical certificate from SGBIT dispensary.',
        requestType: REQUEST_TYPES.ATTENDANCE_CONDONATION,
        semester: snehaStudent.semester,
        status: REQUEST_STATUS.SUBMITTED,
      });
    }

    if (arjunStudent) {
      await ExamRequest.create({
        studentId: arjunStudent._id,
        mentorId: primaryMentor._id,
        title: 'Hall Ticket Issuance Review',
        description: 'Special review request for Semester 7 Hall Ticket issuance under mentor undertaking.',
        requestType: REQUEST_TYPES.EXAM_PERMISSION,
        semester: arjunStudent.semester,
        status: REQUEST_STATUS.SUBMITTED,
      });
    }

    // ── 10. Student Goals & Achievements ───────────────────────────────────────
    await StudentGoal.create({
      studentId: rahulStudent._id,
      title: 'Maintain CGPA >= 9.0 in Semester 3',
      category: 'academic',
      targetValue: 9.0,
      currentValue: 8.8,
      unit: 'CGPA',
      deadline: new Date('2026-03-31'),
      notes: 'Achieve S grade in Data Structures and Object Oriented Programming.',
    });

    await Achievement.create({
      studentId: rahulStudent._id,
      title: '1st Prize - VTU Regional Coding Challenge 2025',
      category: 'Hackathon',
      status: 'approved',
      date: new Date('2025-11-15'),
      description: 'Secured first rank among 45 engineering colleges in the Belagavi regional competitive programming contest.',
    });

    // ── 11. System Audit Logs ──────────────────────────────────────────────────
    console.log('🔒 Generating Institutional Audit Trails...');

    const auditActions = [
      {
        actorId: hodUser._id,
        actorRole: ROLES.HOD,
        actorName: hodUser.name,
        action: 'MENTOR_IMPORT',
        entity: 'Mentor',
        description: 'Bulk confirmed mentor master roster: 4 faculty profiles synchronized.',
      },
      {
        actorId: hodUser._id,
        actorRole: ROLES.HOD,
        actorName: hodUser.name,
        action: AUDIT_ACTIONS.BULK_IMPORT,
        entity: 'Student',
        description: 'Bulk imported student cohort for CSE Department: 30 records parsed.',
      },
      {
        actorId: hodUser._id,
        actorRole: ROLES.HOD,
        actorName: hodUser.name,
        action: 'ALLOCATION_BATCH',
        entity: 'AllocationBatch',
        description: 'Executed mentor allocation algorithm: 25 students mapped to 4 faculty mentors.',
      },
      {
        actorId: coordUser._id,
        actorRole: ROLES.MENTORING_COORDINATOR,
        actorName: coordUser.name,
        action: 'ATTENDANCE_IMPORT',
        entity: 'Attendance',
        description: 'Synchronized mid-term biometric attendance records across 3rd, 5th, and 7th semesters.',
      },
    ];

    for (const log of auditActions) {
      await AuditLog.create(log);
    }

    // ── 12. Notifications ──────────────────────────────────────────────────────
    await Notification.create({
      recipientId: rahulUser._id,
      senderId: mentorUser._id,
      title: 'Upcoming Mentoring Session Scheduled',
      message: 'Dr. Ravi Kumar has scheduled your Semester 3 progress review for Thursday at 3:00 PM.',
      category: 'session',
      link: '/student/sessions',
      isRead: false,
    });

    await Notification.create({
      recipientId: parentUser._id,
      senderId: mentorUser._id,
      title: 'Monthly Progress Report Available',
      message: 'Rahul Kumar has achieved 92% attendance and 9.2 SGPA. View the report card in your parent portal.',
      category: 'academic',
      link: '/parent/overview',
      isRead: false,
    });

    console.log('─────────────────────────────────────────────────────────────────────────────');
    console.log('🎉 S.G. Balekundri Institute of Technology (SGBIT) Database Seeding Complete!');
    console.log('─────────────────────────────────────────────────────────────────────────────');
    console.log('🏛️ Demo Accounts (All passwords: Password@123):');
    console.log('  1. HOD (CSE):              hod.cse@sgbit.edu.in');
    console.log('  2. Faculty Mentor (Assoc): ravi.kumar@sgbit.edu.in      (MTR001, Dr. Ravi Kumar)');
    console.log('  3. Faculty Mentor (Asst):  anita.sharma@sgbit.edu.in    (MTR002, Dr. Anita Sharma)');
    console.log('  4. Faculty Mentor (Asst):  rajesh.kumar@sgbit.edu.in    (MTR003, Prof. Rajesh Kumar)');
    console.log('  5. Faculty Mentor (Asst):  priyanka.rao@sgbit.edu.in    (MTR004, Prof. Priyanka Rao)');
    console.log('  6. Unactivated Staff:      mahesh.patil@sgbit.edu.in    (MTR005, Ready for /activate/staff)');
    console.log('  7. Student (Top Tier):     rahul.cs23@sgbit.edu.in      (2SB23CS001, Rahul Kumar)');
    console.log('  8. Parent (Ward: Rahul):   parent.rahul@gmail.com       (Mr. Ashok Kumar)');
    console.log('  9. Mentoring Coordinator:  coordinator.cse@sgbit.edu.in (Prof. Preethi Hegde)');
    console.log('  10. Exam Coordinator:      exam.cell@sgbit.edu.in       (Dr. Ramesh Sharma)');
    console.log('  11. Placement Officer:     tpo@sgbit.edu.in             (Mr. Chethan Rao)');
    console.log('─────────────────────────────────────────────────────────────────────────────');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Database seeding failed with error:', err);
    process.exit(1);
  }
};

seedDatabase();
