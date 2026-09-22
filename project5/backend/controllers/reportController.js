const ReportService = require('../services/reportService');
const PdfService = require('../services/pdfService');
const ExcelService = require('../services/excelService');
const ApiResponse = require('../utils/apiResponse');

class ReportController {
  static async getReports(req, res, next) {
    try {
      const data = await ReportService.getReports(req.user, req.query);
      return ApiResponse.success(res, data.reports, 'Reports retrieved', 200, data.pagination);
    } catch (err) {
      next(err);
    }
  }

  static async createReport(req, res, next) {
    try {
      const report = await ReportService.createReport(req.user, req.body);
      return ApiResponse.created(res, report, 'Report metadata saved');
    } catch (err) {
      next(err);
    }
  }

  static async deleteReport(req, res, next) {
    try {
      await ReportService.deleteReport(req.params.id, req.user);
      return ApiResponse.success(res, null, 'Report removed');
    } catch (err) {
      next(err);
    }
  }

  static async downloadReportCardPDF(req, res, next) {
    try {
      const studentId = req.params.studentId || req.targetStudent?._id;
      const semester = req.query.semester || req.params.semester || 1;

      const pdfBuffer = await PdfService.generateReportCardPDF(studentId, semester);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="ReportCard_Sem${semester}.pdf"`);
      return res.send(pdfBuffer);
    } catch (err) {
      next(err);
    }
  }

  static async exportStudentsExcel(req, res, next) {
    try {
      const department = req.query.department || req.user.department || 'ALL';
      const excelBuffer = await ExcelService.exportStudentsExcel(department);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="Students_Roster_${department}.xlsx"`);
      return res.send(excelBuffer);
    } catch (err) {
      next(err);
    }
  }

  static async exportMentorsExcel(req, res, next) {
    try {
      const department = req.query.department || req.user.department || 'ALL';
      const excelBuffer = await ExcelService.exportMentorsExcel(department);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="Mentors_Roster_${department}.xlsx"`);
      return res.send(excelBuffer);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ReportController;
