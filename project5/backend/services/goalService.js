const { StudentGoal, Student } = require('../models');
const AppError = require('../utils/AppError');
const { GOAL_STATUS } = require('../config/constants');
const { evaluateBadges } = require('../utils/academicCalculations');

class GoalService {
  /**
   * Create new student academic / skill goal
   */
  static async createGoal(studentUserId, data) {
    const student = await Student.findOne({ userId: studentUserId });
    if (!student) throw new AppError('Student profile not found', 404);

    const goal = await StudentGoal.create({
      studentId: student._id,
      title: data.title,
      category: data.category || 'academic',
      targetValue: Number(data.targetValue),
      currentValue: Number(data.currentValue) || 0,
      unit: data.unit || '%',
      deadline: new Date(data.deadline),
      status: GOAL_STATUS.ON_TRACK,
      notes: data.notes || '',
      milestones: data.milestones || [],
    });

    return goal;
  }

  /**
   * Get all goals for student
   */
  static async getGoals(studentId) {
    const goals = await StudentGoal.find({ studentId }).sort({ deadline: 1 });

    const processed = goals.map((g) => {
      const isPastDeadline = new Date(g.deadline) < new Date();
      let autoStatus = g.status;
      if (g.currentValue >= g.targetValue) {
        autoStatus = GOAL_STATUS.ACHIEVED;
      } else if (isPastDeadline && g.status !== GOAL_STATUS.ACHIEVED) {
        autoStatus = GOAL_STATUS.OVERDUE;
      }

      const progressPercent = Math.min(100, Math.round((g.currentValue / (g.targetValue || 1)) * 100));

      return {
        ...g.toObject(),
        status: autoStatus,
        progressPercent,
      };
    });

    return processed;
  }

  /**
   * Update goal progress / toggle milestone
   */
  static async updateGoal(goalId, studentUserId, updates) {
    const student = await Student.findOne({ userId: studentUserId });
    if (!student) throw new AppError('Student profile not found', 404);

    const goal = await StudentGoal.findOne({ _id: goalId, studentId: student._id });
    if (!goal) throw new AppError('Goal not found', 404);

    if (updates.title !== undefined) goal.title = updates.title;
    if (updates.targetValue !== undefined) goal.targetValue = Number(updates.targetValue);
    if (updates.currentValue !== undefined) goal.currentValue = Number(updates.currentValue);
    if (updates.deadline !== undefined) goal.deadline = new Date(updates.deadline);
    if (updates.notes !== undefined) goal.notes = updates.notes;
    if (updates.milestones !== undefined) goal.milestones = updates.milestones;

    // Automatic status update
    if (goal.currentValue >= goal.targetValue) {
      goal.status = GOAL_STATUS.ACHIEVED;
    } else if (new Date(goal.deadline) < new Date()) {
      goal.status = GOAL_STATUS.OVERDUE;
    } else if (updates.status) {
      goal.status = updates.status;
    }

    await goal.save();

    // Re-evaluate student badges
    const completedGoalsCount = await StudentGoal.countDocuments({ studentId: student._id, status: GOAL_STATUS.ACHIEVED });
    student.badges = evaluateBadges({
      academics: student.academics,
      completedGoalsCount,
    });
    await student.save();

    return goal;
  }

  /**
   * Delete goal
   */
  static async deleteGoal(goalId, studentUserId) {
    const student = await Student.findOne({ userId: studentUserId });
    if (!student) throw new AppError('Student profile not found', 404);

    const goal = await StudentGoal.findOneAndDelete({ _id: goalId, studentId: student._id });
    if (!goal) throw new AppError('Goal not found', 404);

    return { success: true };
  }

  /**
   * Toggle milestone completed state
   */
  static async toggleMilestone(goalId, studentUserId, milestoneIndex) {
    const student = await Student.findOne({ userId: studentUserId });
    if (!student) throw new AppError('Student profile not found', 404);

    const goal = await StudentGoal.findOne({ _id: goalId, studentId: student._id });
    if (!goal) throw new AppError('Goal not found', 404);

    const idx = parseInt(milestoneIndex, 10);
    if (isNaN(idx) || !goal.milestones || !goal.milestones[idx]) {
      throw new AppError('Milestone not found', 404);
    }

    goal.milestones[idx].isCompleted = !goal.milestones[idx].isCompleted;
    if (goal.milestones[idx].isCompleted) {
      goal.milestones[idx].completedAt = new Date();
    } else {
      goal.milestones[idx].completedAt = null;
    }

    await goal.save();
    return goal;
  }
}

module.exports = GoalService;
