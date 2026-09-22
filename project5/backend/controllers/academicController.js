const AcademicService = require('../services/academicService');
const ApiResponse = require('../utils/apiResponse');

class AcademicController {
  static async updateMarks(req, res, next) {
    try {
      const studentId = req.params.studentId || req.targetStudent?._id;
      const { semesterNumber, subjects, reason } = req.body;

      const result = await AcademicService.updateStudentMarks({
        studentId,
        semesterNumber,
        subjects,
        updatedByUser: req.user,
        reason,
      });

      return ApiResponse.success(res, result, 'Student marks updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getMyMarks(req, res, next) {
    try {
      const student = await require('../models/Student').findOne({ userId: req.user._id });
      if (!student) {
        return ApiResponse.notFound(res, 'Student profile not found');
      }
      const result = await AcademicService.getStudentAcademics(student._id);
      return ApiResponse.success(res, result, 'Academic records retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async getAcademics(req, res, next) {
    try {
      const studentId = req.params.studentId || req.targetStudent?._id;
      const result = await AcademicService.getStudentAcademics(studentId);
      return ApiResponse.success(res, result, 'Academic records retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async getTimeline(req, res, next) {
    try {
      const studentId = req.params.studentId || req.targetStudent?._id;
      const semesterNumber = req.params.semester || 1;
      const result = await AcademicService.getSemesterTimeline(studentId, semesterNumber);
      return ApiResponse.success(res, result, 'Semester progression timeline retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async getClassComparison(req, res, next) {
    try {
      const studentId = req.params.studentId || req.targetStudent?._id;
      const semesterNumber = req.params.semester || 1;
      const result = await AcademicService.getClassComparison(studentId, semesterNumber);
      return ApiResponse.success(res, result, 'Class comparison data retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async getMyAttendance(req, res, next) {
    try {
      const student = await require('../models/Student').findOne({ userId: req.user._id });
      if (!student) {
        return ApiResponse.notFound(res, 'Student profile not found');
      }
      const Attendance = require('../models/Attendance');
      const records = await Attendance.find({ studentId: student._id }).sort({ semester: -1, subjectCode: 1 });
      let totalClasses = 0;
      let classesAttended = 0;
      records.forEach((r) => {
        totalClasses += r.totalClasses || 0;
        classesAttended += r.classesAttended || 0;
      });
      const overallPercentage = totalClasses > 0 ? Math.round((classesAttended / totalClasses) * 100 * 10) / 10 : 0;
      return ApiResponse.success(
        res,
        {
          studentId: student._id,
          usn: student.usn,
          totalClasses,
          classesAttended,
          overallPercentage,
          records,
          hasRecords: records.length > 0,
        },
        'Attendance records retrieved'
      );
    } catch (err) {
      next(err);
    }
  }

  static async getStudentAttendance(req, res, next) {
    try {
      const studentId = req.params.studentId || req.targetStudent?._id;
      const Attendance = require('../models/Attendance');
      const Student = require('../models/Student');
      const student = req.targetStudent || (await Student.findById(studentId));
      if (!student) {
        return ApiResponse.notFound(res, 'Student not found');
      }
      const records = await Attendance.find({ studentId: student._id }).sort({ semester: -1, subjectCode: 1 });
      let totalClasses = 0;
      let classesAttended = 0;
      records.forEach((r) => {
        totalClasses += r.totalClasses || 0;
        classesAttended += r.classesAttended || 0;
      });
      const overallPercentage = totalClasses > 0 ? Math.round((classesAttended / totalClasses) * 100 * 10) / 10 : 0;
      return ApiResponse.success(
        res,
        {
          studentId: student._id,
          usn: student.usn,
          totalClasses,
          classesAttended,
          overallPercentage,
          records,
          hasRecords: records.length > 0,
        },
        'Student attendance records retrieved'
      );
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AcademicController;
