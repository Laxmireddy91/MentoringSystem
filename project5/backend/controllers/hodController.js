const HodService = require('../services/hodService');
const { Student, Mentor, User } = require('../models');
const AuthService = require('../services/authService');
const AuditService = require('../services/auditService');
const ApiResponse = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const { AUDIT_ACTIONS, ROLES } = require('../config/constants');

class HodController {
  static async getAnalytics(req, res, next) {
    try {
      const department = req.query.department || req.user.department || 'ALL';
      const data = await HodService.getDepartmentAnalytics(department);
      return ApiResponse.success(res, data, 'Department analytics data');
    } catch (err) {
      next(err);
    }
  }

  static async getAllStudents(req, res, next) {
    try {
      const result = await HodService.getAllStudents(req.query);
      return ApiResponse.success(
        res,
        result.students,
        'Students retrieved',
        200,
        result.pagination
      );
    } catch (err) {
      next(err);
    }
  }

  static async createStudent(req, res, next) {
    try {
      const payload = { ...req.body, role: ROLES.STUDENT };
      const result = await AuthService.register(payload, req.user);
      return ApiResponse.created(res, result.roleProfile, 'Student created successfully');
    } catch (err) {
      next(err);
    }
  }

  static async updateStudent(req, res, next) {
    try {
      const student = await Student.findById(req.params.id);
      if (!student) throw new AppError('Student not found', 404);

      const oldVal = student.toObject();
      const { name, email, semester, section, batch, mentorId, department, phone, admissionYear, academicYear, entryType, status, program } = req.body;

      if (semester !== undefined) student.semester = Number(semester);
      if (section !== undefined) student.section = section;
      if (batch !== undefined) student.batch = batch;
      if (mentorId !== undefined) student.mentorId = mentorId;
      if (department !== undefined) student.department = department;
      if (admissionYear !== undefined) student.admissionYear = Number(admissionYear);
      if (academicYear !== undefined) student.academicYear = academicYear;
      if (entryType !== undefined) student.entryType = entryType;
      if (status !== undefined) student.status = status;
      if (program !== undefined) student.program = program;

      await student.save();

      // Update linked User if name, email, phone provided
      if (name || email || phone) {
        await User.findByIdAndUpdate(student.userId, {
          ...(name && { name }),
          ...(email && { email: email.toLowerCase() }),
          ...(phone && { phone }),
        });
      }

      await AuditService.logAction({
        actorId: req.user._id,
        actorRole: req.user.role,
        actorName: req.user.name,
        action: AUDIT_ACTIONS.STUDENT_UPDATED,
        entity: 'Student',
        entityId: student._id,
        oldValue: oldVal,
        newValue: student.toObject(),
        description: `Updated student details for ${student.usn}`,
      });

      return ApiResponse.success(res, student, 'Student updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async deleteStudent(req, res, next) {
    try {
      const student = await Student.findById(req.params.id);
      if (!student) throw new AppError('Student not found', 404);

      const userId = student.userId;
      await Student.findByIdAndDelete(student._id);
      await User.findByIdAndDelete(userId);

      await AuditService.logAction({
        actorId: req.user._id,
        actorRole: req.user.role,
        actorName: req.user.name,
        action: AUDIT_ACTIONS.STUDENT_DELETED,
        entity: 'Student',
        entityId: student._id,
        description: `Deleted student ${student.usn}`,
      });

      return ApiResponse.success(res, null, 'Student removed successfully');
    } catch (err) {
      next(err);
    }
  }

  static async reassignStudentMentor(req, res, next) {
    try {
      const studentId = req.params.id;
      const { mentorId } = req.body;
      const student = await HodService.reassignStudentMentor(studentId, mentorId, req.user);
      return ApiResponse.success(res, student, 'Student mentor updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getAllMentors(req, res, next) {
    try {
      const { department } = req.query;
      const query = department && department !== 'ALL' ? { department } : {};

      const mentors = await Mentor.find(query).populate('userId', 'name email phone avatar isActive');

      const enhanced = await Promise.all(
        mentors.map(async (m) => {
          const menteeCount = await Student.countDocuments({ mentorId: m._id });
          return {
            ...m.toObject(),
            name: m.userId?.name || 'Faculty Mentor',
            email: m.userId?.email || '',
            phone: m.userId?.phone || '',
            menteeCount,
            assignedMenteesCount: menteeCount,
            assignedStudents: Array(menteeCount).fill(null),
          };
        })
      );

      return ApiResponse.success(res, enhanced, 'Mentors list retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async createMentor(req, res, next) {
    try {
      const payload = { ...req.body, role: ROLES.MENTOR };
      const result = await AuthService.register(payload, req.user);
      return ApiResponse.created(res, result.roleProfile, 'Mentor created successfully');
    } catch (err) {
      next(err);
    }
  }

  static async updateMentor(req, res, next) {
    try {
      const mentor = await Mentor.findById(req.params.id);
      if (!mentor) throw new AppError('Mentor not found', 404);

      const { name, email, department, designation, specialization, maxMentees, phone } = req.body;

      if (department) mentor.department = department;
      if (designation) mentor.designation = designation;
      if (specialization) mentor.specialization = specialization;
      if (maxMentees) mentor.maxMentees = maxMentees;

      await mentor.save();

      if (name || email || phone) {
        await User.findByIdAndUpdate(mentor.userId, {
          ...(name && { name }),
          ...(email && { email: email.toLowerCase() }),
          ...(phone && { phone }),
        });
      }

      await AuditService.logAction({
        actorId: req.user._id,
        actorRole: req.user.role,
        actorName: req.user.name,
        action: AUDIT_ACTIONS.MENTOR_UPDATED,
        entity: 'Mentor',
        entityId: mentor._id,
        description: `Updated mentor details for ${mentor.employeeId}`,
      });

      return ApiResponse.success(res, mentor, 'Mentor updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async assignMentees(req, res, next) {
    try {
      const { studentIds, mentorId } = req.body;
      const result = await HodService.assignMentees({
        studentIds,
        mentorId,
        hodUser: req.user,
      });
      return ApiResponse.success(res, result, 'Students assigned to mentor successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getLeaderboard(req, res, next) {
    try {
      const { department = 'ALL', limit = 10 } = req.query;
      const data = await HodService.getLeaderboard(department, limit);
      return ApiResponse.success(res, data, 'Leaderboard data');
    } catch (err) {
      next(err);
    }
  }

  static async unlockAccount(req, res, next) {
    try {
      const result = await HodService.unlockUserAccount(req.params.userId, req.user);
      return ApiResponse.success(res, null, result.message);
    } catch (err) {
      next(err);
    }
  }

  static async getAuditLogs(req, res, next) {
    try {
      const data = await HodService.getAuditLogs(req.query);
      return ApiResponse.success(res, data.logs, 'Audit logs retrieved', 200, data.pagination);
    } catch (err) {
      next(err);
    }
  }

  // ─── Individual Student Creation (Late Admission) ───────────────────────────

  static async createIndividualStudent(req, res, next) {
    try {
      const result = await HodService.createIndividualStudent(
        req.body,
        req.user
      );

      return ApiResponse.created(
        res,
        result,
        result.message
      );
    } catch (err) {
      next(err);
    }
  }

  // ─── Student Progression ──────────────────────────────────────────────────

  static async progressStudent(req, res, next) {
    try {
      const { id } = req.params;
      const { semester, academicYear, status } = req.body;
      const updated = await HodService.progressStudentSemester(id, { semester, academicYear, status }, req.user);
      return ApiResponse.success(res, updated, 'Student progressed successfully');
    } catch (err) {
      next(err);
    }
  }

  // ─── CIE Import: Preview (Validate without persisting) ────────────────────

  static async previewCIEImport(req, res, next) {
    try {
      if (!req.file) return ApiResponse.badRequest(res, 'No file uploaded. Please provide an xlsx or csv file.');
      const ImportService = require('../services/importService');
      const preview = await ImportService.previewCIEImport(req.file.path, req.user);
      return ApiResponse.success(res, preview, `Preview ready: ${preview.validRows} valid, ${preview.invalidRows} invalid rows`);
    } catch (err) {
      next(err);
    }
  }

  // ─── CIE Import: Confirm (Persist after preview approval) ────────────────

  static async confirmCIEImport(req, res, next) {
    try {
      const { previewData } = req.body;
      if (!previewData || !Array.isArray(previewData) || previewData.length === 0) {
        return ApiResponse.badRequest(res, 'Preview data is required. Run /imports/cie/preview first.');
      }
      const ImportService = require('../services/importService');
      const io = req.app.get('io');
      const result = await ImportService.confirmCIEImport(previewData, req.user, io);
      return ApiResponse.success(res, result, `CIE import complete: ${result.successCount} successful, ${result.failureCount} failed`);
    } catch (err) {
      next(err);
    }
  }

  // ─── Attendance Import: Preview ───────────────────────────────────────────

  static async previewAttendanceImport(req, res, next) {
    try {
      if (!req.file) return ApiResponse.badRequest(res, 'No file uploaded. Please provide an xlsx or csv file.');
      const ImportService = require('../services/importService');
      const preview = await ImportService.previewAttendanceImport(req.file.path, req.user);
      return ApiResponse.success(res, preview, `Preview ready: ${preview.validRows} valid, ${preview.invalidRows} invalid rows`);
    } catch (err) {
      next(err);
    }
  }

  // ─── Attendance Import: Confirm ───────────────────────────────────────────

  static async confirmAttendanceImport(req, res, next) {
    try {
      const { previewData } = req.body;
      if (!previewData || !Array.isArray(previewData) || previewData.length === 0) {
        return ApiResponse.badRequest(res, 'Preview data is required. Run /imports/attendance/preview first.');
      }
      const ImportService = require('../services/importService');
      const importBatchId = `ATT_${Date.now()}`;
      const result = await ImportService.confirmAttendanceImport(previewData, req.user, importBatchId);
      return ApiResponse.success(res, result, `Attendance import complete: ${result.successCount} successful, ${result.failureCount} failed`);
    } catch (err) {
      next(err);
    }
  }

  // ─── Mentor Import: Preview ───────────────────────────────────────────────

  static async previewMentorImport(req, res, next) {
    try {
      if (!req.file) return ApiResponse.badRequest(res, 'No file uploaded. Please provide an xlsx, xls, or csv file.');
      const ImportService = require('../services/importService');
      const preview = await ImportService.previewMentorImport(req.file.path, req.user);
      return ApiResponse.success(res, preview, `Preview ready: ${preview.validRows} valid, ${preview.errorRows} invalid rows`);
    } catch (err) {
      next(err);
    }
  }

  // ─── Mentor Import: Confirm ───────────────────────────────────────────────

  static async confirmMentorImport(req, res, next) {
    try {
      const { previewData } = req.body;
      if (!previewData || !Array.isArray(previewData) || previewData.length === 0) {
        return ApiResponse.badRequest(res, 'Preview data is required. Run /imports/mentors/preview first.');
      }
      const ImportService = require('../services/importService');
      const result = await ImportService.confirmMentorImport(previewData, req.user);
      return ApiResponse.success(res, result, `Mentor master import complete: ${result.successCount} successful, ${result.failureCount} failed`);
    } catch (err) {
      next(err);
    }
  }

  // ─── Import History ───────────────────────────────────────────────────────

  static async getImportHistory(req, res, next) {
    try {
      const { AuditLog } = require('../models');
      const { page = 1, limit = 20 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);
      const query = { action: { $in: ['CIE_IMPORT', 'ATTENDANCE_IMPORT', 'BULK_IMPORT', 'MENTOR_IMPORT'] } };
      const [logs, total] = await Promise.all([
        AuditLog.find(query).sort({ timestamp: -1 }).skip(skip).limit(Number(limit)),
        AuditLog.countDocuments(query),
      ]);
      return ApiResponse.success(res, { logs, total, page: Number(page), pages: Math.ceil(total / Number(limit)) }, 'Import history retrieved');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = HodController;
