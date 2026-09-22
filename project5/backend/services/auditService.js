const { AuditLog, LoginActivity } = require('../models');
const logger = require('../config/logger');

class AuditService {
  /**
   * Record an action in the system audit log
   */
  static async logAction({
    actorId,
    actorRole = 'system',
    actorName = 'System',
    action,
    entity,
    entityId = null,
    oldValue = null,
    newValue = null,
    ipAddress = 'unknown',
    userAgent = '',
    description = '',
  }) {
    try {
      const log = await AuditLog.create({
        actorId,
        actorRole,
        actorName,
        action,
        entity,
        entityId,
        oldValue,
        newValue,
        ipAddress,
        userAgent,
        description,
        timestamp: new Date(),
      });
      return log;
    } catch (err) {
      logger.error(`Failed to record audit log: ${err.message}`);
      return null;
    }
  }

  /**
   * Record an authentication event (success, failure, or locked)
   */
  static async logLoginActivity({
    userId = null,
    email,
    role = 'unknown',
    ipAddress = 'unknown',
    userAgent = '',
    device = 'Desktop',
    browser = 'Unknown Browser',
    os = 'Unknown OS',
    status,
    failureReason = '',
  }) {
    try {
      const activity = await LoginActivity.create({
        userId,
        email,
        role,
        ipAddress,
        userAgent,
        device,
        browser,
        os,
        status,
        failureReason,
        timestamp: new Date(),
      });
      return activity;
    } catch (err) {
      logger.error(`Failed to record login activity: ${err.message}`);
      return null;
    }
  }
}

module.exports = AuditService;
