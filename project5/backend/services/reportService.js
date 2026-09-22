const { Report } = require('../models');
const AppError = require('../utils/AppError');
const AuditService = require('./auditService');
const { AUDIT_ACTIONS } = require('../config/constants');

class ReportService {
  static async createReport(user, data) {
    const report = await Report.create({
      title: data.title,
      reportType: data.reportType,
      generatedBy: user._id,
      department: data.department || user.department || 'ALL',
      semester: data.semester || null,
      filters: data.filters || {},
      fileUrl: data.fileUrl || '',
      fileType: data.fileType || 'pdf',
      summary: data.summary || {},
    });

    await AuditService.logAction({
      actorId: user._id,
      actorRole: user.role,
      actorName: user.name,
      action: AUDIT_ACTIONS.REPORT_GENERATED,
      entity: 'Report',
      entityId: report._id,
      newValue: { title: report.title, type: report.reportType },
      description: `Generated report: ${report.title}`,
    });

    return report;
  }

  static async getReports(user, { reportType = '', department = '', page = 1, limit = 20 }) {
    const query = {};
    if (user.role !== 'hod') {
      query.generatedBy = user._id;
    }
    if (reportType) query.reportType = reportType;
    if (department && department !== 'ALL') query.department = department;

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const reports = await Report.find(query)
      .populate('generatedBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Report.countDocuments(query);

    return {
      reports,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    };
  }

  static async getReportById(reportId) {
    const report = await Report.findById(reportId).populate('generatedBy', 'name email role');
    if (!report) throw new AppError('Report not found', 404);
    return report;
  }

  static async deleteReport(reportId, user) {
    const report = await Report.findById(reportId);
    if (!report) throw new AppError('Report not found', 404);

    if (report.generatedBy.toString() !== user._id.toString() && user.role !== 'hod') {
      throw new AppError('Unauthorized to delete this report', 403);
    }

    await Report.findByIdAndDelete(reportId);
    return { success: true };
  }
}

module.exports = ReportService;
