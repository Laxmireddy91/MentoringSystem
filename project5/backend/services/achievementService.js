const archiver = require('archiver');
const fs = require('fs');
const path = require('path');
const { Achievement, Student, Notification, AuditLog } = require('../models');
const AppError = require('../utils/AppError');
const { NOTIFICATION_CATEGORIES, AUDIT_ACTIONS } = require('../config/constants');
const { evaluateBadges } = require('../utils/academicCalculations');

class AchievementService {
  /**
   * Upload and create student achievement
   */
  static async createAchievement(studentUserId, data, uploadedFiles = []) {
    const student = await Student.findOne({ userId: studentUserId }).populate('userId', 'name email');
    if (!student) throw new AppError('Student profile not found', 404);

    const files = uploadedFiles.map((file) => ({
      url: `/uploads/achievements/${file.filename}`,
      originalName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
    }));

    // 1. Run Certificate Verification Assistant (Consistency Analysis)
    const verificationAnalysis = await this.analyseCertificate(data, student);

    const achievement = await Achievement.create({
      studentId: student._id,
      title: data.title,
      category: data.category,
      description: data.description || '',
      issuer: data.issuer || data.organization || '',
      issueDate: data.issueDate ? new Date(data.issueDate) : new Date(),
      certificateId: data.certificateId || '',
      verificationUrl: data.verificationUrl || '',
      files,
      isVerified: false,
      status: 'pending',
      verificationAnalysis,
    });

    // Notify assigned Mentor
    if (student.mentorId) {
      const studentDoc = await student.populate({ path: 'mentorId', populate: { path: 'userId' } });
      if (studentDoc.mentorId?.userId) {
        await Notification.create({
          recipientId: studentDoc.mentorId.userId._id,
          senderId: student.userId._id,
          title: 'New Achievement Uploaded',
          message: `Mentee ${student.usn} (${student.userId.name}) submitted achievement: "${achievement.title}" for review.`,
          category: NOTIFICATION_CATEGORIES.ACHIEVEMENT || 'achievement',
          link: `/mentor/students/${student._id}`,
        }).catch(() => null);
      }
    }

    // Audit log for creation
    await AuditLog.create({
      actorId: studentUserId,
      actorRole: 'student',
      actorName: student.userId.name,
      action: AUDIT_ACTIONS.ACHIEVEMENT_CREATED || 'ACHIEVEMENT_CREATED',
      entity: 'Achievement',
      entityId: achievement._id,
      description: `Student ${student.usn} uploaded achievement ${achievement.title}`,
    }).catch(() => null);

    return achievement;
  }

  /**
   * Retrieve achievements for a given student (or all if no id provided)
   */
  static async getAchievements(studentId) {
    if (!studentId) {
      throw new AppError('Student ID is required', 400);
    }
    const achievements = await Achievement.find({ studentId })
      .sort({ createdAt: -1 })
      .lean();
    return achievements;
  }

  /**
   * Retrieve pending achievements for mentors (optionally scoped to their mentees)
   */
  static async getPendingAchievements(mentorUser) {
    // Simple implementation: return all pending achievements; route middleware ensures access control
    const pending = await Achievement.find({ status: 'pending' })
      .populate('studentId', 'usn userId')
      .lean();
    return pending;
  }

  /**
   * Certificate Verification Assistant — Consistency Analysis
   * Strictly an indicator for mentor review. Never claims proof of authenticity.
   */
  static async analyseCertificate(data, student) {
    const studentName = (student.userId?.name || '').toLowerCase();
    const nameParts = studentName.split(' ').filter((p) => p.length > 2);
    const certText = `${data.title || ''} ${data.description || ''} ${data.issuer || ''}`.toLowerCase();

    // Consistency Checks
    const nameMatch = nameParts.length > 0 && nameParts.some((part) => certText.includes(part));
    const organizationDetected = !!(data.issuer && data.issuer.trim().length > 2);
    const eventDetected = !!(data.title && data.title.trim().length > 3);
    const dateDetected = !!(data.issueDate && !isNaN(new Date(data.issueDate).getTime()));
    const certificateIdDetected = !!(data.certificateId && data.certificateId.trim().length >= 4);

    let verificationUrlValid = null;
    if (data.verificationUrl) {
      try {
        const parsed = new URL(data.verificationUrl);
        verificationUrlValid = parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        verificationUrlValid = false;
      }
    }

    // Duplicate Certificate ID Check
    let duplicateCertificateId = false;
    if (data.certificateId) {
      const duplicate = await Achievement.findOne({
        certificateId: data.certificateId.trim(),
        studentId: { $ne: student._id },
      });
      if (duplicate) duplicateCertificateId = true;
    }

    const positiveChecks = [nameMatch, organizationDetected, eventDetected, dateDetected].filter(Boolean).length;
    const assessment =
      positiveChecks >= 3 && !duplicateCertificateId ? 'indicators_verified' : 'needs_manual_review';

    return {
      extractedText: `${data.title} | ${data.issuer || 'Unknown Issuer'} | ${data.issueDate || 'Undated'}`,
      nameMatch,
      organizationDetected,
      eventDetected,
      dateDetected,
      certificateIdDetected,
      verificationUrlValid,
      duplicateCertificateId,
      extractionQuality: 'good',
      assessment,
      analysedAt: new Date(),
      disclaimer:
        'This analysis is an assistance mechanism and is not proof of certificate authenticity. Final verification is performed by the authorized mentor.',
    };
  }

  /**
   * Mentor reviews achievement: Approve, Reject, or Request Correction
   */
  static async reviewAchievement(achievementId, mentorUser, { status, remarks, correctionNotes }) {
    const achievement = await Achievement.findById(achievementId).populate('studentId');
    if (!achievement) throw new AppError('Achievement not found', 404);

    const validStatuses = ['approved', 'rejected', 'correction_requested'];
    if (!validStatuses.includes(status)) {
      throw new AppError(`Invalid review status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    achievement.status = status;
    achievement.isVerified = status === 'approved';
    achievement.verifiedBy = mentorUser._id;
    achievement.verifiedAt = new Date();
    achievement.mentorReviewRemarks = remarks || '';
    if (correctionNotes) achievement.correctionNotes = correctionNotes;
    await achievement.save();

    const student = await Student.findById(achievement.studentId).populate('userId', 'name email');
    if (student) {
      const verifiedCount = await Achievement.countDocuments({ studentId: student._id, isVerified: true });
      student.badges = evaluateBadges({
        academics: student.academics,
        completedGoalsCount: 0,
        verifiedAchievementsCount: verifiedCount,
      });
      await student.save();

      // Notify student of mentor decision
      await Notification.create({
        recipientId: student.userId._id || student.userId,
        senderId: mentorUser._id,
        title: `Achievement ${status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Correction Requested'}`,
        message: `Mentor ${mentorUser.name} reviewed "${achievement.title}": ${status.toUpperCase()}. ${remarks || ''}`,
        category: NOTIFICATION_CATEGORIES.ACHIEVEMENT || 'achievement',
        link: '/student/achievements',
      }).catch(() => null);
    }

    // Audit log for review
    await AuditLog.create({
      actorId: mentorUser._id,
      actorRole: mentorUser.role,
      actorName: mentorUser.name,
      action: status === 'approved' ? AUDIT_ACTIONS.ACHIEVEMENT_APPROVED : AUDIT_ACTIONS.ACHIEVEMENT_REJECTED,
      entity: 'Achievement',
      entityId: achievement._id,
      description: `Mentor ${mentorUser.name} ${status} achievement ${achievement.title}`,
    }).catch(() => null);

    return achievement;
  }

  /**
   * Legacy verify method for backwards compatibility
   */
  static async verifyAchievement(achievementId, mentorUser, { isVerified }) {
    return this.reviewAchievement(achievementId, mentorUser, {
      status: isVerified ? 'approved' : 'rejected',
      remarks: isVerified ? 'Verified by mentor' : 'Rejected by mentor',
    });
  }

  /**
   * Bundle all uploaded achievement files into a downloadable ZIP archive
   */
  static async createZipBundle(studentId, res) {
    const student = await Student.findById(studentId);
    if (!student) throw new AppError('Student not found', 404);

    const achievements = await Achievement.find({ studentId });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${student.usn}_achievements_bundle.zip"`);

    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.on('error', (err) => {
      throw err;
    });

    archive.pipe(res);

    for (const ach of achievements) {
      if (ach.files && ach.files.length > 0) {
        ach.files.forEach((file) => {
          const filePath = path.join(__dirname, '..', file.url);
          if (fs.existsSync(filePath)) {
            archive.file(filePath, { name: `${ach.category}/${file.originalName}` });
          }
        });
      }
    }

    await archive.finalize();
  }

  /**
   * Delete achievement and its files (owning student or HOD only)
   */
  static async deleteAchievement(achievementId, user) {
    const achievement = await Achievement.findById(achievementId);
    if (!achievement) {
      throw new AppError('Achievement not found', 404);
    }

    if (user.role === 'student') {
      const student = await Student.findOne({ userId: user._id });
      if (!student || achievement.studentId.toString() !== student._id.toString()) {
        throw new AppError('You can only delete your own achievements', 403);
      }
    } else if (user.role !== 'hod') {
      throw new AppError('Unauthorized to delete this achievement', 403);
    }

    // Safely delete files on disk
    if (achievement.files && achievement.files.length > 0) {
      achievement.files.forEach((file) => {
        try {
          const filePath = path.join(__dirname, '..', file.url);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (err) {
          // Log or continue
        }
      });
    }

    await achievement.deleteOne();
    return { success: true, message: 'Achievement deleted successfully' };
  }
}

module.exports = AchievementService;
