const mongoose = require('mongoose');
const { Student, RiskSettings, Notification } = require('../models');
const { calculateCumulativeCGPA } = require('../utils/academicCalculations');
const { RISK_LEVELS, NOTIFICATION_CATEGORIES } = require('../config/constants');
const AppError = require('../utils/AppError');

class RiskService {
  /**
   * Get default or department-specific risk settings
   */
  static async getSettings(department = 'ALL') {
    if (mongoose.connection.readyState !== 1) {
      return {
        department: 'ALL',
        cieThresholdPercentage: 50,
        backlogThresholdCount: 2,
        weights: {
          cie: 0.40,
          backlogs: 0.40,
          trend: 0.20,
        },
      };
    }

    try {
      let settings = await RiskSettings.findOne({ department });
      if (!settings && department !== 'ALL') {
        settings = await RiskSettings.findOne({ department: 'ALL' });
      }
      if (!settings) {
        settings = {
          department: 'ALL',
          cieThresholdPercentage: 50,
          backlogThresholdCount: 2,
          weights: {
            cie: 0.40,
            backlogs: 0.40,
            trend: 0.20,
          },
        };
      }
      return settings;
    } catch {
      return {
        department: 'ALL',
        cieThresholdPercentage: 50,
        backlogThresholdCount: 2,
        weights: {
          cie: 0.40,
          backlogs: 0.40,
          trend: 0.20,
        },
      };
    }
  }

  /**
   * Update department risk settings (HOD only)
   */
  static async updateSettings(department = 'ALL', updates, updatedByUser) {
    const settings = await RiskSettings.findOneAndUpdate(
      { department },
      {
        ...updates,
        department,
        updatedBy: updatedByUser._id,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return settings;
  }

  /**
   * Evaluate Rule-Based Academic Risk for a student (CIE, Backlogs, Trend)
   */
  static async evaluateStudentRisk(student) {
    const settings = await this.getSettings(student.department);

    let cieRiskScore = 0;
    let backlogRiskScore = 0;
    let trendRiskScore = 0;

    const reasons = [];
    const recommendations = [];

    const { totalActiveBacklogs, semesters } = calculateCumulativeCGPA(student.academics);

    // 1. Backlogs Evaluation (Weight: 40%)
    if (totalActiveBacklogs >= 3) {
      backlogRiskScore = 100;
      reasons.push(`Critical backlog burden (${totalActiveBacklogs} active backlogs)`);
      recommendations.push('Immediate academic counseling and remedial backlog clearance plan required.');
    } else if (totalActiveBacklogs >= (settings.backlogThresholdCount || 2)) {
      backlogRiskScore = 75;
      reasons.push(`${totalActiveBacklogs} active backlogs require immediate attention`);
      recommendations.push('Attend departmental tutorial classes for backlogged subjects.');
    } else if (totalActiveBacklogs === 1) {
      backlogRiskScore = 40;
      reasons.push('1 active backlog');
      recommendations.push('Register for supplementary examination review sessions.');
    }

    // 2. CIE Performance in current/latest semester (Weight: 40%)
    let lowCieCount = 0;
    let decliningSubjectCount = 0;

    if (semesters.length > 0) {
      const latestSem = semesters[semesters.length - 1];
      latestSem.subjects.forEach((subj) => {
        const cieAvg = subj.cieAverage || (subj.cie1 + subj.cie2) / 2;
        if (cieAvg < ((settings.cieThresholdPercentage || 50) / 100) * 50) {
          lowCieCount++;
        }

        if (subj.cie3 > 0 && subj.cie2 > 0 && subj.cie1 > 0) {
          if (subj.cie1 > subj.cie2 && subj.cie2 > subj.cie3) {
            decliningSubjectCount++;
          }
        }
      });

      if (lowCieCount >= 3) {
        cieRiskScore = 90;
        reasons.push(`Low continuous internal evaluation (CIE) across ${lowCieCount} subjects`);
        recommendations.push('Weekly mentor check-ins and structured self-study log submission.');
      } else if (lowCieCount > 0) {
        cieRiskScore = 50;
        reasons.push(`Low internal marks in ${lowCieCount} subjects`);
        recommendations.push('Focus on subject-wise assignment revisions and remedial quizzes.');
      }
    }

    // 3. Performance Trend Evaluation (Weight: 20%)
    if (decliningSubjectCount >= 2) {
      trendRiskScore = 80;
      reasons.push(`Consistent score decline observed across multiple CIE tests in ${decliningSubjectCount} subjects`);
      recommendations.push('Schedule one-on-one mentor diagnostic session to address learning bottlenecks.');
    } else if (decliningSubjectCount === 1) {
      trendRiskScore = 40;
      reasons.push('Declining test performance in 1 subject');
      recommendations.push('Review subject foundation concepts with course instructor.');
    }

    // Calculate Final Weighted Risk Score (0-100)
    const weights = settings.weights || { cie: 0.40, backlogs: 0.40, trend: 0.20 };
    const finalScore = Math.round(
      cieRiskScore * (weights.cie || 0.40) +
      backlogRiskScore * (weights.backlogs || 0.40) +
      trendRiskScore * (weights.trend || 0.20)
    );

    // Determine Risk Level
    let riskLevel = RISK_LEVELS.LOW;
    if (finalScore >= 80 || totalActiveBacklogs >= 3) {
      riskLevel = RISK_LEVELS.CRITICAL;
    } else if (finalScore >= 60 || totalActiveBacklogs >= 2 || lowCieCount >= 3) {
      riskLevel = RISK_LEVELS.HIGH;
    } else if (finalScore >= 30 || totalActiveBacklogs >= 1 || lowCieCount >= 1) {
      riskLevel = RISK_LEVELS.MEDIUM;
    }

    if (reasons.length === 0) {
      reasons.push('Academic performance is stable with no identified risk flags.');
      recommendations.push('Maintain current study momentum and active participation.');
    }

    return {
      riskLevel,
      riskScore: finalScore,
      reasons,
      recommendations,
      lastEvaluatedAt: new Date(),
    };
  }

  /**
   * Re-evaluate and persist student risk status
   */
  static async updateAndPersistStudentRisk(studentId) {
    const student = await Student.findById(studentId).populate('userId', 'name email');
    if (!student) throw new AppError('Student not found', 404);

    const prevLevel = student.riskProfile?.riskLevel;
    const evaluated = await this.evaluateStudentRisk(student);

    student.riskProfile = evaluated;
    await student.save();

    if ((evaluated.riskLevel === RISK_LEVELS.HIGH || evaluated.riskLevel === RISK_LEVELS.CRITICAL) && prevLevel !== evaluated.riskLevel) {
      await Notification.create({
        recipientId: student.userId._id || student.userId,
        title: 'Academic Risk Status Alert',
        message: `Your academic profile has been flagged as ${evaluated.riskLevel} Risk. Please schedule a session with your mentor.`,
        category: NOTIFICATION_CATEGORIES.RISK,
        link: '/student/risk',
      });

      if (student.mentorId) {
        const mentorDoc = await student.populate('mentorId');
        if (mentorDoc.mentorId?.userId) {
          await Notification.create({
            recipientId: mentorDoc.mentorId.userId,
            title: 'Mentee Academic Risk Escalation',
            message: `Mentee ${student.usn} (${student.userId?.name}) risk status changed to ${evaluated.riskLevel}.`,
            category: NOTIFICATION_CATEGORIES.RISK,
            link: `/mentor/students/${student._id}`,
          });
        }
      }
    }

    return evaluated;
  }

  /**
   * Recalculate risk for all students in a department or all
   */
  static async recalculateAll(department = null) {
    const filter = {};
    if (department && department !== 'ALL') {
      filter.department = department;
    }
    const students = await Student.find(filter);
    const results = [];
    for (const student of students) {
      try {
        const evalResult = await this.updateAndPersistStudentRisk(student._id);
        results.push({ studentId: student._id, usn: student.usn, riskLevel: evalResult.riskLevel });
      } catch (err) {
        // continue
      }
    }
    return { evaluatedCount: results.length, results };
  }
}

module.exports = RiskService;
