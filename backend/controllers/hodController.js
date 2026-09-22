import {
  getDeptSummary,
  getStudentDirectory,
  getMentorDirectory,
  getAuditLogs,
  getLeaderboard,
  getDeptTaskStats,
} from '../services/hodService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export async function getSummary(req, res, next) {
  try {
    const dept = req.user.department;
    const data = await getDeptSummary(dept);
    return sendSuccess(res, { data });
  } catch (err) { next(err); }
}

export async function getStudents(req, res, next) {
  try {
    const { page = 1, limit = 20, year, section, risk } = req.query;
    const dept = req.user.department;
    const result = await getStudentDirectory(dept, { page: +page, limit: +limit, year, section, risk });
    return sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function getMentors(req, res, next) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const dept = req.user.department;
    const result = await getMentorDirectory(dept, { page: +page, limit: +limit });
    return sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function getAuditLogsHandler(req, res, next) {
  try {
    const { page = 1, limit = 20, action, startDate, endDate } = req.query;
    const dept = req.user.department;
    const result = await getAuditLogs(dept, { page: +page, limit: +limit, action, startDate, endDate });
    return sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function getLeaderboardHandler(req, res, next) {
  try {
    const { metric = 'cgpa', limit = 10 } = req.query;
    const dept = req.user.department;
    const result = await getLeaderboard(dept, { metric, limit: +limit });
    return sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function getTaskStats(req, res, next) {
  try {
    const dept = req.user.department;
    const result = await getDeptTaskStats(dept);
    return sendSuccess(res, result);
  } catch (err) { next(err); }
}
