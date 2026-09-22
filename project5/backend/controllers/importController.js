const ImportService = require('../services/importService');
const ApiResponse = require('../utils/apiResponse');
const AppError = require('../utils/AppError');

class ImportController {
  static async importStudents(req, res, next) {
    try {
      if (!req.file) {
        throw new AppError('File (CSV or Excel) is required for student import', 400);
      }
      const fileType = req.file.originalname.endsWith('.xlsx') ? 'xlsx' : 'csv';
      const result = await ImportService.importStudents(req.file.path, req.user, fileType);
      return ApiResponse.success(res, result, 'Student import completed');
    } catch (err) {
      next(err);
    }
  }

  static async importStudentsCSV(req, res, next) {
    return ImportController.importStudents(req, res, next);
  }

  static async importMarks(req, res, next) {
    try {
      if (!req.file) {
        throw new AppError('CSV or Excel file is required for marks import', 400);
      }
      const fileType = req.file.originalname.endsWith('.xlsx') ? 'xlsx' : 'csv';
      const result = await ImportService.importMarks(req.file.path, req.user, fileType);
      return ApiResponse.success(res, result, 'Academic marks import completed');
    } catch (err) {
      next(err);
    }
  }

  static async importAttendance(req, res, next) {
    try {
      if (!req.file) {
        throw new AppError('CSV or Excel file is required for attendance import', 400);
      }
      const fileType = req.file.originalname.endsWith('.xlsx') ? 'xlsx' : 'csv';
      const result = await ImportService.importAttendance(req.file.path, req.user, fileType);
      return ApiResponse.success(res, result, 'Attendance import completed');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ImportController;
