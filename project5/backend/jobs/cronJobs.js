const cron = require('node-cron');
const { Mentor, Student, Session, Notification } = require('../models');
const RiskService = require('../services/riskService');
const emailService = require('../services/emailService');
const logger = require('../config/logger');
const { NOTIFICATION_CATEGORIES, RISK_LEVELS } = require('../config/constants');

/**
 * Weekly Risk Digest Generator
 * Aggregates high & critical risk mentees and emails their assigned mentors
 */
const runWeeklyRiskDigest = async () => {
  try {
    logger.info('⏰ Running Weekly Academic Risk Digest job...');
    const mentors = await Mentor.find().populate('userId', 'name email isActive');

    for (const mentor of mentors) {
      if (!mentor.userId || !mentor.userId.isActive || !mentor.userId.email) continue;

      const mentees = await Student.find({ mentorId: mentor._id }).populate('userId', 'name email');
      const flaggedMentees = [];

      for (const student of mentees) {
        const risk = await RiskService.evaluateStudentRisk(student);
        if (risk.riskLevel === RISK_LEVELS.HIGH || risk.riskLevel === RISK_LEVELS.CRITICAL) {
          flaggedMentees.push({
            name: student.userId?.name || 'Student',
            usn: student.usn,
            riskLevel: risk.riskLevel,
            reasons: risk.reasons,
          });
        }
      }

      if (flaggedMentees.length > 0) {
        logger.info(`📧 Sending weekly risk digest to Prof. ${mentor.userId.name} (${flaggedMentees.length} mentees flagged)`);
        await emailService.sendWeeklyRiskDigestEmail(
          mentor.userId.email,
          mentor.userId.name,
          flaggedMentees
        );

        // Also create in-app notification
        await Notification.create({
          recipientId: mentor.userId._id,
          title: 'Weekly Academic Risk Summary',
          message: `You have ${flaggedMentees.length} mentees currently flagged for High or Critical academic risk.`,
          category: NOTIFICATION_CATEGORIES.RISK,
          link: '/mentor/dashboard',
        });
      }
    }
    logger.info('✅ Weekly Academic Risk Digest job completed.');
  } catch (error) {
    logger.error(`❌ Weekly Risk Digest failed: ${error.message}`);
  }
};

/**
 * Hourly Upcoming Session Reminder
 * Finds sessions occurring in the next 1-2 hours and notifies participants
 */
const runSessionReminders = async () => {
  try {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const upcomingSessions = await Session.find({
      startTime: { $gte: oneHourLater, $lte: twoHoursLater },
      status: { $in: ['scheduled', 'confirmed'] },
    })
      .populate({ path: 'mentorId', populate: { path: 'userId', select: 'name email' } })
      .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email' } });

    for (const session of upcomingSessions) {
      const mentorUser = session.mentorId?.userId;
      const studentUser = session.studentId?.userId;

      if (mentorUser && studentUser) {
        // Send In-App Reminders
        await Notification.create({
          recipientId: studentUser._id,
          title: 'Upcoming Mentoring Session Reminder',
          message: `Reminder: Your session "${session.title}" with Prof. ${mentorUser.name} starts in approximately 1 hour.`,
          category: NOTIFICATION_CATEGORIES.SESSION,
          link: '/student/sessions',
        });

        await Notification.create({
          recipientId: mentorUser._id,
          title: 'Upcoming Mentoring Session Reminder',
          message: `Reminder: Your session "${session.title}" with ${studentUser.name} starts in approximately 1 hour.`,
          category: NOTIFICATION_CATEGORIES.SESSION,
          link: '/mentor/sessions',
        });
      }
    }
  } catch (error) {
    logger.error(`❌ Session reminder job failed: ${error.message}`);
  }
};

/**
 * Initialize background cron schedules
 */
const startCronJobs = () => {
  // Weekly Risk Digest: Every Monday at 08:00 AM
  cron.schedule('0 8 * * 1', runWeeklyRiskDigest);

  // Upcoming Session Reminders: Every hour
  cron.schedule('0 * * * *', runSessionReminders);

  logger.info('🕒 Background cron jobs scheduled: Weekly Risk Digest & Session Reminders');
};

module.exports = {
  startCronJobs,
  runWeeklyRiskDigest,
  runSessionReminders,
};
