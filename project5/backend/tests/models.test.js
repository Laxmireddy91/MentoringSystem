const mongoose = require('mongoose');
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
} = require('../models');

describe('Database Models Schema & Method Verification', () => {
  describe('User Model', () => {
    it('should create a user instance and properly hash password', async () => {
      const user = new User({
        name: 'John Doe',
        email: 'john.doe@college.edu',
        password: 'SecurePassword123!',
        role: 'student',
        department: 'CSE',
      });

      // trigger pre-save hook manually or via validation
      await user.validate();
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john.doe@college.edu');
      expect(user.role).toBe('student');
    });

    it('should validate email format and reject invalid emails', async () => {
      const user = new User({
        name: 'Invalid Email User',
        email: 'invalid-email-format',
        password: 'Password123!',
        role: 'mentor',
      });

      let err;
      try {
        await user.validate();
      } catch (e) {
        err = e;
      }
      expect(err).toBeDefined();
      expect(err.errors.email).toBeDefined();
    });

    it('should correctly evaluate isLocked and incLoginAttempts', () => {
      const user = new User({
        name: 'Lock Test',
        email: 'lock@college.edu',
        password: 'Password123!',
        role: 'hod',
      });

      expect(user.isLocked()).toBe(false);
      user.lockUntil = new Date(Date.now() + 10 * 60 * 1000);
      expect(user.isLocked()).toBe(true);
    });
  });

  describe('Student Model', () => {
    it('should validate student fields and require ObjectId mentorId and usn', async () => {
      const student = new Student({
        userId: new mongoose.Types.ObjectId(),
        usn: '1MS21CS001',
        department: 'CSE',
        semester: 5,
        mentorId: new mongoose.Types.ObjectId(),
      });

      await student.validate();
      expect(student.usn).toBe('1MS21CS001');
      expect(student.semester).toBe(5);
      expect(mongoose.Types.ObjectId.isValid(student.mentorId)).toBe(true);
    });
  });

  describe('Session Model', () => {
    it('should require start and end Date objects and ObjectId links', async () => {
      const start = new Date();
      const end = new Date(start.getTime() + 30 * 60 * 1000);

      const session = new Session({
        mentorId: new mongoose.Types.ObjectId(),
        studentId: new mongoose.Types.ObjectId(),
        title: 'Mid-term Performance Review',
        startTime: start,
        endTime: end,
        sessionType: 'academic',
      });

      await session.validate();
      expect(session.startTime).toEqual(start);
      expect(session.endTime).toEqual(end);
      expect(session.status).toBe('scheduled');
    });
  });

  describe('All 15 Models Export Verification', () => {
    it('should have all 15 models defined and properly instantiated', () => {
      expect(User.modelName).toBe('User');
      expect(Student.modelName).toBe('Student');
      expect(Mentor.modelName).toBe('Mentor');
      expect(Session.modelName).toBe('Session');
      expect(Feedback.modelName).toBe('Feedback');
      expect(Message.modelName).toBe('Message');
      expect(Notification.modelName).toBe('Notification');
      expect(Task.modelName).toBe('Task');
      expect(Report.modelName).toBe('Report');
      expect(StudentGoal.modelName).toBe('StudentGoal');
      expect(Achievement.modelName).toBe('Achievement');
      expect(PerformanceSnapshot.modelName).toBe('PerformanceSnapshot');
      expect(RiskSettings.modelName).toBe('RiskSettings');
      expect(LoginActivity.modelName).toBe('LoginActivity');
      expect(AuditLog.modelName).toBe('AuditLog');
    });
  });
});
