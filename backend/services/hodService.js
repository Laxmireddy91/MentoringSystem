import Student from '../models/Student.js';
import Mentor from '../models/Mentor.js';
import AuditLog from '../models/AuditLog.js';
import Task from '../models/Task.js';
import { getRiskSettings, classifyStudentRisk } from './riskService.js';

export async function getDeptSummary(department) {
  const [students, mentors, settings] = await Promise.all([
    Student.find({ dept: department }).lean(),
    Mentor.find().lean(), // Mentor model has no dept field - filter by User join or return all
    getRiskSettings(department),
  ]);

  const allocated = students.filter(s => s.mentorId).length;
  const unallocated = students.length - allocated;
  const atRisk = students.filter(s => {
    const { level } = classifyStudentRisk(s, settings);
    return level === 'High' || level === 'Medium';
  }).length;

  return {
    totalStudents: students.length,
    totalMentors: mentors.length,
    allocated,
    unallocated,
    atRisk,
    allocationPercent: students.length ? Math.round((allocated / students.length) * 100) : 0,
  };
}

export async function getStudentDirectory(department, { page = 1, limit = 20, year, section, risk } = {}) {
  const query = { dept: department };
  if (year) query.year = year;
  if (section) query.section = section;

  const skip = (page - 1) * limit;
  const [students, total] = await Promise.all([
    Student.find(query).populate('mentorId', 'name email mentorId').skip(skip).limit(limit).lean(),
    Student.countDocuments(query),
  ]);

  // Apply risk filter after fetching (small dataset)
  let results = students;
  if (risk) {
    const settings = await getRiskSettings(department);
    results = students.filter(s => classifyStudentRisk(s, settings).level === risk);
  }

  return { students: results, total, page, pages: Math.ceil(total / limit) };
}

export async function getMentorDirectory(department, { page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;
  const [mentors, total] = await Promise.all([
    Mentor.find().populate('user', 'name email department').skip(skip).limit(limit).lean(),
    Mentor.countDocuments(),
  ]);

  // Attach assigned student count per mentor
  const results = await Promise.all(mentors.map(async m => {
    const count = await Student.countDocuments({ mentorId: m._id });
    return { ...m, assignedStudents: count };
  }));

  return { mentors: results, total, page, pages: Math.ceil(total / limit) };
}

export async function getAuditLogs(department, { page = 1, limit = 20, action, startDate, endDate } = {}) {
  const query = {};
  if (department) query.department = department;
  if (action) query.action = new RegExp(action, 'i');
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    AuditLog.find(query).populate('actorId', 'name email role').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AuditLog.countDocuments(query),
  ]);

  return { logs, total, page, pages: Math.ceil(total / limit) };
}

export async function getLeaderboard(department, { metric = 'cgpa', limit = 10 } = {}) {
  const students = await Student.find({ dept: department }).lean();
  const mentors = await Mentor.find().lean();

  let topStudents = [];
  let topMentors = [];

  if (metric === 'cgpa') {
    topStudents = [...students]
      .sort((a, b) => (b.cgpa || 0) - (a.cgpa || 0))
      .slice(0, limit)
      .map((s, i) => ({ rank: i + 1, name: s.name, usn: s.usn, dept: s.dept, value: s.cgpa || 0, metric: 'CGPA' }));
  } else if (metric === 'performance') {
    topStudents = [...students]
      .map(s => {
        const subjs = (s.subjects || []).filter(sub => Number(sub.total || 0) > 0);
        const avg = subjs.length ? subjs.reduce((sum, sub) => sum + Number(sub.total || 0), 0) / subjs.length : 0;
        return { ...s, _avg: avg };
      })
      .sort((a, b) => b._avg - a._avg)
      .slice(0, limit)
      .map((s, i) => ({ rank: i + 1, name: s.name, usn: s.usn, dept: s.dept, value: Number(s._avg.toFixed(1)), metric: 'Avg Marks' }));
  }

  // Mentor leaderboard: avg CGPA of their students
  const mentorStats = await Promise.all(mentors.map(async m => {
    const mStudents = await Student.find({ mentorId: m._id }).lean();
    const avg = mStudents.length
      ? mStudents.reduce((sum, s) => sum + (s.cgpa || 0), 0) / mStudents.length
      : 0;
    return { _id: m._id, name: m.name, email: m.email, studentCount: mStudents.length, avgCgpa: Number(avg.toFixed(2)) };
  }));

  topMentors = mentorStats
    .sort((a, b) => b.avgCgpa - a.avgCgpa)
    .slice(0, limit)
    .map((m, i) => ({ rank: i + 1, ...m }));

  return { topStudents, topMentors };
}

export async function getDeptTaskStats(department) {
  // Get all mentors, then for each get their tasks and completion
  const mentors = await Mentor.find().lean();
  const stats = await Promise.all(mentors.map(async m => {
    const tasks = await Task.find({ mentorId: m._id }).lean();
    const total = tasks.length;
    const completed = tasks.filter(t => t.done).length;
    return {
      mentorId: m._id,
      mentorName: m.name,
      total,
      completed,
      pending: total - completed,
      completionRate: total ? Math.round((completed / total) * 100) : 0,
    };
  }));

  const overall = stats.reduce((acc, s) => {
    acc.total += s.total;
    acc.completed += s.completed;
    return acc;
  }, { total: 0, completed: 0 });

  return {
    byMentor: stats,
    overall: {
      ...overall,
      completionRate: overall.total ? Math.round((overall.completed / overall.total) * 100) : 0,
    },
  };
}
