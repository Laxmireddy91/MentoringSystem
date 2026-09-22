const DocumentService = require('../services/documentService');
const { Student } = require('../models');
const ApiResponse = require('../utils/apiResponse');
const fs = require('fs');
const path = require('path');

class DocumentController {
  static async upload(req, res, next) {
    try {
      const student = await Student.findOne({ userId: req.user._id });
      const targetStudentId = req.body.studentId || student?._id;
      if (!targetStudentId) return ApiResponse.forbidden(res, 'Student ID missing');

      const doc = await DocumentService.uploadDocument({
        studentId: targetStudentId,
        category: req.body.category,
        documentType: req.body.documentType,
        title: req.body.title,
        description: req.body.description,
        visibility: req.body.visibility,
        semester: req.body.semester,
        academicYear: req.body.academicYear,
        file: req.file || { originalname: req.body.title || 'document.pdf', size: 1024, mimetype: 'application/pdf' },
        uploadedByUser: req.user,
      });

      return ApiResponse.created(res, doc, 'Document uploaded to vault successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getStudentDocs(req, res, next) {
    try {
      const studentId = req.params.studentId;
      if (!studentId) return ApiResponse.badRequest(res, 'Student ID is required');

      const { category, semester, academicYear, documentType, status } = req.query;
      const docs = await DocumentService.getStudentDocuments(studentId, req.user, { category, semester, academicYear, documentType, status });
      return ApiResponse.success(res, docs, 'Documents retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async getMyDocs(req, res, next) {
    try {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student) return ApiResponse.badRequest(res, 'Student record not found');
      
      const { category, semester, academicYear, documentType, status } = req.query;
      const docs = await DocumentService.getStudentDocuments(student._id, req.user, { category, semester, academicYear, documentType, status });
      return ApiResponse.success(res, docs, 'Documents retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async getById(req, res, next) {
    try {
      const doc = await DocumentService.getDocumentById(req.params.id, req.user);
      return ApiResponse.success(res, doc, 'Document details retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async archive(req, res, next) {
    try {
      const { hardDelete } = req.query;
      const result = await DocumentService.deleteDocument(req.params.id, req.user, hardDelete === 'true');
      return ApiResponse.success(res, result, result.message);
    } catch (err) {
      next(err);
    }
  }

  static async download(req, res, next) {
    try {
      const { storagePath, filename, mimeType } = await DocumentService.downloadDocument(req.params.id, req.user);
      const fullPath = path.resolve(__dirname, '..', storagePath);
      if (!fs.existsSync(fullPath)) return ApiResponse.notFound(res, 'File not found on server');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', mimeType || 'application/octet-stream');
      fs.createReadStream(fullPath).pipe(res);
    } catch (err) { next(err); }
  }

  static async preview(req, res, next) {
    try {
      const { storagePath, filename, mimeType } = await DocumentService.downloadDocument(req.params.id, req.user);
      const fullPath = path.resolve(__dirname, '..', storagePath);
      if (!fs.existsSync(fullPath)) return ApiResponse.notFound(res, 'File not found on server');
      if (!['application/pdf','image/jpeg','image/png','image/webp'].includes(mimeType)) {
        return ApiResponse.badRequest(res, 'Preview not available for this file type');
      }
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.setHeader('Content-Type', mimeType);
      fs.createReadStream(fullPath).pipe(res);
    } catch (err) { next(err); }
  }

  static async addVersion(req, res, next) {
    try {
      if (!req.file) return ApiResponse.badRequest(res, 'File is required');
      const doc = await DocumentService.addDocumentVersion(req.params.id, req.user, req.file);
      return ApiResponse.success(res, doc, 'Document version added successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getChecklist(req, res, next) {
    try {
      const { studentId, semester } = req.params;
      const data = await DocumentService.getDocumentChecklist(studentId, semester, req.user);
      return ApiResponse.success(res, data, 'Document checklist retrieved');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = DocumentController;
