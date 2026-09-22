const User = require('./User');
const Student = require('./Student');
const Mentor = require('./Mentor');
const Session = require('./Session');
const Feedback = require('./Feedback');
const Message = require('./Message');
const Notification = require('./Notification');
const Task = require('./Task');
const Report = require('./Report');
const StudentGoal = require('./StudentGoal');
const Achievement = require('./Achievement');
const PerformanceSnapshot = require('./PerformanceSnapshot');
const RiskSettings = require('./RiskSettings');
const LoginActivity = require('./LoginActivity');
const AuditLog = require('./AuditLog');
// Phase 1 — New models
const Attendance = require('./Attendance');
const Document = require('./Document');
const PlacementDrive = require('./PlacementDrive');
const PlacementApplication = require('./PlacementApplication');
const PlacementProfile = require('./PlacementProfile');
const ExamRequest = require('./ExamRequest');
const AllocationBatch = require('./AllocationBatch');
const StaffRecord = require('./StaffRecord');
const StudentRecord = require('./StudentRecord');

module.exports = {
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
  // New
  Attendance,
  Document,
  PlacementDrive,
  PlacementApplication,
  PlacementProfile,
  ExamRequest,
  AllocationBatch,
  StaffRecord,
  StudentRecord,
};
