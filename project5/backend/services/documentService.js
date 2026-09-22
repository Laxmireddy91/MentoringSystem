const { Document, Student, Mentor, User } = require('../models');
const { DOCUMENT_STATUS, DOCUMENT_VISIBILITY, ROLES } = require('../config/constants');
const AppError = require('../utils/AppError');
const fs = require('fs');

class DocumentService {
  static async uploadDocument({ studentId, category, documentType, title, description, visibility, semester, academicYear, file, uploadedByUser }) {
    const student = await Student.findById(studentId);
    if (!student) throw new AppError('Student record not found', 404);

    const initialVersion = {
      versionNumber: 1,
      filename: file?.filename || file?.originalname || 'document.pdf',
      originalName: file?.originalname || 'document.pdf',
      mimeType: file?.mimetype || 'application/pdf',
      fileSize: file?.size || 0,
      storagePath: file?.path || '',
      uploadedAt: new Date(),
      uploadedBy: uploadedByUser._id,
    };

    const doc = await Document.create({
      studentId,
      category: category || 'Academic',
      documentType: documentType || 'Other',
      title: title || file?.originalname || 'Document',
      description: description || '',
      visibility: visibility || DOCUMENT_VISIBILITY.MENTOR_VISIBLE,
      semester,
      academicYear,
      status: DOCUMENT_STATUS.ACTIVE,
      versions: [initialVersion],
      uploadedBy: uploadedByUser._id,
    });

    return doc;
  }

  static async getStudentDocuments(studentId, requestingUser, filters = {}) {
    const student = await Student.findById(studentId);
    if (!student) throw new AppError('Student not found', 404);

    const query = { studentId, status: filters.status || DOCUMENT_STATUS.ACTIVE };
    
    if (filters.category) query.category = filters.category;
    if (filters.semester) query.semester = Number(filters.semester);
    if (filters.academicYear) query.academicYear = filters.academicYear;
    if (filters.documentType) query.documentType = filters.documentType;

    if (requestingUser.role === ROLES.STUDENT) {
      if (student.userId.toString() !== requestingUser._id.toString()) {
        throw new AppError('Access denied: You can only access your own documents', 403);
      }
      return Document.find(query).sort({ createdAt: -1 });
    }

    if (requestingUser.role === ROLES.MENTOR) {
      const mentor = await Mentor.findOne({ userId: requestingUser._id });
      if (!mentor || !student.mentorId || student.mentorId.toString() !== mentor._id.toString()) {
        throw new AppError('Access denied: You can only view documents of assigned mentees', 403);
      }
      query.visibility = { $in: [DOCUMENT_VISIBILITY.MENTOR_VISIBLE, DOCUMENT_VISIBILITY.INSTITUTION_VISIBLE] };
      return Document.find(query).sort({ createdAt: -1 });
    }

    if (requestingUser.role === ROLES.TPO) {
      query.category = 'Placement';
      query.visibility = { $in: [DOCUMENT_VISIBILITY.MENTOR_VISIBLE, DOCUMENT_VISIBILITY.INSTITUTION_VISIBLE] };
      return Document.find(query).sort({ createdAt: -1 });
    }

    if ([ROLES.HOD, ROLES.MENTORING_COORDINATOR, ROLES.EXAM_COORDINATOR].includes(requestingUser.role)) {
      query.visibility = { $in: [DOCUMENT_VISIBILITY.MENTOR_VISIBLE, DOCUMENT_VISIBILITY.INSTITUTION_VISIBLE] };
      return Document.find(query).sort({ createdAt: -1 });
    }

    throw new AppError('Unauthorized to view documents', 403);
  }

  static async getDocumentById(documentId, requestingUser) {
    const doc = await Document.findById(documentId).populate('studentId');
    if (!doc) throw new AppError('Document not found', 404);

    const student = doc.studentId;

    if (requestingUser.role === ROLES.STUDENT) {
      if (student.userId.toString() !== requestingUser._id.toString()) {
        throw new AppError('Access denied', 403);
      }
    } else if (requestingUser.role === ROLES.MENTOR) {
      const mentor = await Mentor.findOne({ userId: requestingUser._id });
      if (!mentor || !student.mentorId || student.mentorId.toString() !== mentor._id.toString()) {
        throw new AppError('Access denied', 403);
      }
      if (doc.visibility === DOCUMENT_VISIBILITY.PRIVATE) {
        throw new AppError('Access denied: Document is private', 403);
      }
    } else if (requestingUser.role === ROLES.TPO) {
      if (doc.category !== 'Placement') throw new AppError('Access denied', 403);
    } else if ([ROLES.HOD, ROLES.MENTORING_COORDINATOR, ROLES.EXAM_COORDINATOR].includes(requestingUser.role)) {
      if (doc.visibility === DOCUMENT_VISIBILITY.PRIVATE) {
        throw new AppError('Access denied: Document is private', 403);
      }
    } else {
      throw new AppError('Unauthorized', 403);
    }

    return doc;
  }

  static async downloadDocument(documentId, requestingUser) {
    const doc = await Document.findById(documentId).populate('studentId').select('+versions.storagePath');
    if (!doc) throw new AppError('Document not found', 404);

    const student = doc.studentId;

    if (requestingUser.role === ROLES.STUDENT) {
      if (student.userId.toString() !== requestingUser._id.toString()) {
        throw new AppError('Access denied', 403);
      }
    } else if (requestingUser.role === ROLES.MENTOR) {
      const mentor = await Mentor.findOne({ userId: requestingUser._id });
      if (!mentor || !student.mentorId || student.mentorId.toString() !== mentor._id.toString()) {
        throw new AppError('Access denied', 403);
      }
      if (doc.visibility === DOCUMENT_VISIBILITY.PRIVATE) {
        throw new AppError('Access denied: Document is private', 403);
      }
    } else if (requestingUser.role === ROLES.TPO) {
      if (doc.category !== 'Placement') throw new AppError('Access denied', 403);
    } else if ([ROLES.HOD, ROLES.MENTORING_COORDINATOR, ROLES.EXAM_COORDINATOR].includes(requestingUser.role)) {
      if (doc.visibility === DOCUMENT_VISIBILITY.PRIVATE) {
        throw new AppError('Access denied: Document is private', 403);
      }
    } else {
      throw new AppError('Unauthorized', 403);
    }

    const currentVersion = doc.versions[doc.versions.length - 1];
    return {
      storagePath: currentVersion.storagePath,
      filename: currentVersion.originalName,
      mimeType: currentVersion.mimeType,
    };
  }

  static async addDocumentVersion(documentId, requestingUser, file) {
    const doc = await Document.findById(documentId).populate('studentId');
    if (!doc) throw new AppError('Document not found', 404);

    const student = doc.studentId;
    if (requestingUser.role !== ROLES.STUDENT || student.userId.toString() !== requestingUser._id.toString()) {
      throw new AppError('Only the document owner can add a new version', 403);
    }

    const newVersion = {
      versionNumber: doc.currentVersion + 1,
      filename: file?.filename || file?.originalname || 'document.pdf',
      originalName: file?.originalname || 'document.pdf',
      mimeType: file?.mimetype || 'application/pdf',
      fileSize: file?.size || 0,
      storagePath: file?.path || '',
      uploadedAt: new Date(),
      uploadedBy: requestingUser._id,
    };

    doc.versions.push(newVersion);
    doc.currentVersion += 1;
    await doc.save();

    return doc;
  }

  static async deleteDocument(documentId, requestingUser, hardDelete = false) {
    const doc = await Document.findById(documentId).populate('studentId');
    if (!doc) throw new AppError('Document not found', 404);

    const student = doc.studentId;

    if (requestingUser.role === ROLES.STUDENT) {
      if (student.userId.toString() !== requestingUser._id.toString()) {
        throw new AppError('Access denied', 403);
      }
    } else if (requestingUser.role === ROLES.HOD) {
      // Allow HOD
    } else {
      throw new AppError('Unauthorized to delete document', 403);
    }

    if (hardDelete && requestingUser.role === ROLES.STUDENT) {
      const docWithPaths = await Document.findById(documentId).select('+versions.storagePath');
      for (const v of docWithPaths.versions) {
        if (v.storagePath && fs.existsSync(v.storagePath)) {
          fs.unlinkSync(v.storagePath);
        }
      }
      await Document.findByIdAndDelete(documentId);
      return { message: 'Document permanently deleted' };
    }

    doc.status = DOCUMENT_STATUS.ARCHIVED;
    await doc.save();
    return { message: 'Document archived successfully' };
  }

  static async getDocumentChecklist(studentId, semester, requestingUser) {
    const docs = await this.getStudentDocuments(studentId, requestingUser, { semester });
    const required = ['Semester Result', 'Examination Application'];
    
    const uploadedDocs = docs.filter(d => required.includes(d.documentType));
    const uploaded = uploadedDocs.map(d => d.documentType);
    const missing = required.filter(r => !uploaded.includes(r));
    
    const completionRate = Math.round((uploaded.length / required.length) * 100);

    return { required, uploaded, missing, completionRate };
  }
}

module.exports = DocumentService;
