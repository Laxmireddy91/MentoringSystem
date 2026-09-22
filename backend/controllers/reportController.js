import path from 'path';
import { listReports, generateReport, getReportById } from '../services/reportService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export async function list(req, res, next) {
  try {
    const dept = req.user.department;
    const reports = await listReports(dept);
    return sendSuccess(res, { data: reports });
  } catch (err) { next(err); }
}

export async function generate(req, res, next) {
  try {
    const { type, filters } = req.body;
    const validTypes = ['performance', 'allocation', 'risk', 'leaderboard'];
    if (!type || !validTypes.includes(type)) return sendError(res, `type must be one of: ${validTypes.join(', ')}`, 400);
    const report = await generateReport(type, req.user.department, filters || {}, req.user.id);
    return sendSuccess(res, { data: report }, 'Report generation started', 202);
  } catch (err) { next(err); }
}

export async function download(req, res, next) {
  try {
    const report = await getReportById(req.params.id);
    if (!report) return sendError(res, 'Report not found', 404);
    if (report.status !== 'ready') return sendError(res, `Report is ${report.status}`, 400);
    // fileUrl is like /uploads/reports/filename.pdf
    const filePath = path.join(process.cwd(), report.fileUrl);
    return res.download(filePath, path.basename(filePath));
  } catch (err) { next(err); }
}
