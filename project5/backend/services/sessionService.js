const { Session, Student, Mentor, Notification } = require('../models');
const AppError = require('../utils/AppError');
const emailService = require('./emailService');
const { SESSION_STATUS, NOTIFICATION_CATEGORIES } = require('../config/constants');

class SessionService {
  /**
   * Check if a time slot collides with existing non-cancelled sessions
   */
  static async checkCollision({ mentorId, studentId, startTime, endTime, excludeSessionId = null }) {
    const query = {
      status: { $nin: [SESSION_STATUS.CANCELLED] },
      $or: [
        { mentorId },
        ...(studentId ? [{ studentId }] : []),
      ],
      $and: [
        { startTime: { $lt: new Date(endTime) } },
        { endTime: { $gt: new Date(startTime) } },
      ],
    };

    if (excludeSessionId) {
      query._id = { $ne: excludeSessionId };
    }

    const collision = await Session.findOne(query);
    return collision;
  }

  /**
   * Mentor creates a scheduled session
   */
  static async createSession(mentorUserId, data) {
    const mentor = await Mentor.findOne({ userId: mentorUserId }).populate('userId', 'name email');
    if (!mentor) throw new AppError('Mentor profile not found', 404);

    const student = await Student.findById(data.studentId).populate('userId', 'name email');
    if (!student) throw new AppError('Student not found', 404);

    // Verify student is assigned to this mentor
    if (!student.mentorId || student.mentorId.toString() !== mentor._id.toString()) {
      throw new AppError('Unauthorized: You can only schedule sessions with your assigned mentees', 403);
    }

    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (start >= end) {
      throw new AppError('Session start time must be before end time', 400);
    }

    // Check collision
    const collision = await this.checkCollision({
      mentorId: mentor._id,
      studentId: student._id,
      startTime: start,
      endTime: end,
    });

    if (collision) {
      throw new AppError('Time slot conflicts with an existing confirmed/scheduled session', 409);
    }

    const session = await Session.create({
      mentorId: mentor._id,
      studentId: student._id,
      title: data.title,
      description: data.description || '',
      sessionType: data.sessionType,
      startTime: start,
      endTime: end,
      meetingType: data.meetingType,
      location: data.location || (data.meetingType === 'online' ? 'Google Meet' : 'Faculty Cabin'),
      meetingLink: data.meetingLink || '',
      agenda: data.agenda || '',
      status: SESSION_STATUS.SCHEDULED,
    });

    // Notify student
    await Notification.create({
      recipientId: student.userId._id || student.userId,
      senderId: mentor.userId._id,
      title: 'New Mentoring Session Scheduled',
      message: `Prof. ${mentor.userId.name} has scheduled a session: "${session.title}" on ${start.toLocaleString()}.`,
      category: NOTIFICATION_CATEGORIES.SESSION,
      link: '/student/sessions',
    });

    // Send email alert
    await emailService.sendSessionNotificationEmail({
      to: student.userId.email,
      mentorName: mentor.userId.name,
      studentName: student.userId.name,
      title: session.title,
      startTime: session.startTime,
      meetingLink: session.meetingLink,
    });

    return session;
  }

  /**
   * Student books an available office hour slot
   */
  static async bookSlot(studentUserId, data) {
    const student = await Student.findOne({ userId: studentUserId }).populate('userId', 'name email');
    if (!student) throw new AppError('Student profile not found', 404);

    const mentor = await Mentor.findById(data.mentorId).populate('userId', 'name email');
    if (!mentor) throw new AppError('Mentor not found', 404);

    // Verify mentor is assigned to this student
    if (!student.mentorId || student.mentorId.toString() !== mentor._id.toString()) {
      throw new AppError('Unauthorized: You can only book slots with your assigned mentor', 403);
    }

    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (start >= end) {
      throw new AppError('Start time must be before end time', 400);
    }

    if (start < new Date()) {
      throw new AppError('Cannot book slots in the past', 400);
    }

    // Check collision
    const collision = await this.checkCollision({
      mentorId: mentor._id,
      studentId: student._id,
      startTime: start,
      endTime: end,
    });

    if (collision) {
      throw new AppError('This slot has already been booked or conflicts with another meeting', 409);
    }

    const session = await Session.create({
      mentorId: mentor._id,
      studentId: student._id,
      title: data.title || 'Mentoring Discussion',
      description: data.description || '',
      sessionType: data.sessionType || 'academic',
      startTime: start,
      endTime: end,
      meetingType: data.meetingType || 'offline',
      location: data.location || (data.meetingType === 'online' ? 'Online Video Meet' : 'Faculty Cabin'),
      meetingLink: data.meetingLink || '',
      agenda: data.agenda || '',
      status: SESSION_STATUS.CONFIRMED,
    });

    // Notify Mentor
    await Notification.create({
      recipientId: mentor.userId._id,
      senderId: student.userId._id,
      title: 'New Office Hours Booking',
      message: `Student ${student.usn} (${student.userId.name}) booked a mentoring slot for ${start.toLocaleString()}.`,
      category: NOTIFICATION_CATEGORIES.SESSION,
      link: '/mentor/sessions',
    });

    // Send email alert to Mentor
    await emailService.sendSessionNotificationEmail({
      to: mentor.userId.email,
      mentorName: mentor.userId.name,
      studentName: student.userId.name,
      title: session.title,
      startTime: session.startTime,
      meetingLink: session.meetingLink,
    });

    return session;
  }

  /**
   * Update session status (complete, cancel, reschedule)
   */
  static async updateStatus({ sessionId, user, updateData }) {
    const session = await Session.findById(sessionId)
      .populate({ path: 'mentorId', populate: { path: 'userId', select: 'name email' } })
      .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email' } });

    if (!session) throw new AppError('Session not found', 404);

    const isMentor = session.mentorId.userId._id.toString() === user._id.toString();
    const isStudent = session.studentId.userId._id.toString() === user._id.toString();
    const isHOD = user.role === 'hod';

    if (!isMentor && !isStudent && !isHOD) {
      throw new AppError('Unauthorized to update this session', 403);
    }

    const { status, mentorNotes, cancellationReason, actionItems } = updateData;

    session.status = status;
    if (mentorNotes !== undefined) session.mentorNotes = mentorNotes;
    if (cancellationReason !== undefined) session.cancellationReason = cancellationReason;
    if (actionItems !== undefined) session.actionItems = actionItems;

    await session.save();

    // Recipient of notification
    const recipientUserId = isMentor ? session.studentId.userId._id : session.mentorId.userId._id;

    await Notification.create({
      recipientId: recipientUserId,
      senderId: user._id,
      title: `Session ${status.toUpperCase()}`,
      message: `Mentoring session "${session.title}" was marked as ${status} by ${user.name}.`,
      category: NOTIFICATION_CATEGORIES.SESSION,
      link: user.role === 'student' ? '/student/sessions' : '/mentor/sessions',
    });

    return session;
  }

  /**
   * Retrieve sessions for calendar (month, week, day views)
   */
  static async getCalendarSessions(user, { start, end, status, type }) {
    const query = {};

    if (user.role === 'student') {
      const student = await Student.findOne({ userId: user._id });
      if (!student) return [];
      query.studentId = student._id;
    } else if (user.role === 'mentor') {
      const mentor = await Mentor.findOne({ userId: user._id });
      if (!mentor) return [];
      query.mentorId = mentor._id;
    } else if (user.role === 'parent') {
      const student = await Student.findOne({ parentUserId: user._id });
      if (!student) return [];
      query.studentId = student._id;
    }

    if (start && end) {
      query.startTime = { $gte: new Date(start), $lte: new Date(end) };
    }

    if (status) {
      query.status = status;
    }

    if (type) {
      query.sessionType = type;
    }

    const sessions = await Session.find(query)
      .populate({ path: 'mentorId', populate: { path: 'userId', select: 'name email avatar' } })
      .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email avatar' } })
      .populate('feedbackId')
      .sort({ startTime: 1 });

    return sessions;
  }
}

module.exports = SessionService;
