const StudentService = require('../services/studentService');
const ApiResponse = require('../utils/apiResponse');

class StudentController {
  static async getMyProfile(req, res, next) {
    try {
      const data = await StudentService.getProfileByUserId(req.user._id);
      return ApiResponse.success(res, data, 'Student profile retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async getMy360(req, res, next) {
    try {
      const student = await require('../models').Student.findOne({ userId: req.user._id });
      if (!student) return ApiResponse.notFound(res, 'Student profile not found');
      const data = await StudentService.getStudent360(student._id);
      return ApiResponse.success(res, data, 'Student 360 overview retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async getStudent360(req, res, next) {
    try {
      const studentIdentifier = req.params.studentId || req.params.id;
      let student = req.targetStudent;
      if (!student) {
        student = await require('../models').Student.findById(studentIdentifier);
      }
      if (!student) return ApiResponse.notFound(res, 'Student not found');
      const data = await StudentService.getStudent360(student._id);
      return ApiResponse.success(res, data, 'Student 360 overview retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async getMySessions(req, res, next) {
    try {
      const studentProfile = await StudentService.getProfileByUserId(req.user._id);
      const sessions = await StudentService.getStudentSessions(studentProfile.student._id);
      return ApiResponse.success(res, sessions, 'Mentoring sessions retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async submitFeedback(req, res, next) {
    try {
      const { rating, comment, aspects, isAnonymous } = req.body;
      const feedback = await StudentService.submitSessionFeedback({
        sessionId: req.params.sessionId,
        studentUserId: req.user._id,
        rating,
        comment,
        aspects,
        isAnonymous,
      });
      return ApiResponse.created(res, feedback, 'Session feedback submitted successfully');
    } catch (err) {
      next(err);
    }
  }

  static async addMentorshipRecord(req, res, next) {
    try {
      const studentId = req.params.studentId || req.targetStudent?._id;
      const { date, type, notes, outcome, actionTaken, studentSigned, mentorSigned } = req.body;
      const record = await StudentService.addMentorshipRecord({
        studentId,
        mentorName: req.user.name,
        date,
        type,
        notes,
        outcome,
        actionTaken,
        studentSigned,
        mentorSigned,
      });
      return ApiResponse.created(res, record, 'Mentorship record added successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getMentorshipRecords(req, res, next) {
    try {
      const studentId = req.params.studentId || req.targetStudent?._id;
      const records = await StudentService.getMentorshipRecords(studentId);
      return ApiResponse.success(res, records, 'Mentorship records retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async addBacklogRecord(req, res, next) {
    try {
      const studentId = req.params.studentId || req.targetStudent?._id;
      const { semester, subject, subjectCode, status, attempts, clearedDate, remarks } = req.body;
      const record = await StudentService.addBacklogRecord({
        studentId,
        semester,
        subject,
        subjectCode,
        status,
        attempts,
        clearedDate,
        remarks,
      });
      return ApiResponse.created(res, record, 'Backlog record logged successfully');
    } catch (err) {
      next(err);
    }
  }

  static async updateBacklogRecord(req, res, next) {
    try {
      const studentId = req.params.studentId || req.targetStudent?._id;
      const { recordId } = req.params;
      const { status, clearedDate, attempts, remarks } = req.body;
      const record = await StudentService.updateBacklogRecord({
        studentId,
        recordId,
        status,
        clearedDate,
        attempts,
        remarks,
      });
      return ApiResponse.success(res, record, 'Backlog record updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async addOnlineCourse(req, res, next) {
    try {
      const { courseName, platform, completionDate, certificateUrl, status } = req.body;
      const course = await StudentService.addOnlineCourse({
        studentUserId: req.user._id,
        courseName,
        platform,
        completionDate,
        certificateUrl,
        status,
      });
      return ApiResponse.created(res, course, 'Online course added successfully');
    } catch (err) {
      next(err);
    }
  }

  static async deleteOnlineCourse(req, res, next) {
    try {
      const { courseId } = req.params;
      const result = await StudentService.deleteOnlineCourse({
        studentUserId: req.user._id,
        courseId,
      });
      return ApiResponse.success(res, result, 'Online course deleted');
    } catch (err) {
      next(err);
    }
  }

  static async updateEmergencyContact(req, res, next) {
    try {
      const { fatherName, motherName, guardianRelationship, guardianPhone, guardianEmail, emergencyContact } = req.body;
      const parentDetails = await StudentService.updateEmergencyContact({
        studentUserId: req.user._id,
        fatherName,
        motherName,
        guardianRelationship,
        guardianPhone,
        guardianEmail,
        emergencyContact,
      });
      return ApiResponse.success(res, parentDetails, 'Contact and emergency details updated successfully');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = StudentController;
