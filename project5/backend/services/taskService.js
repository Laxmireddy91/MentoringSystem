const Task = require('../models/Task');
const Student = require('../models/Student');
const Mentor = require('../models/Mentor');
const User = require('../models/User');
const AppError = require('../utils/AppError');

class TaskService {
  /**
   * Create a new task (mentor or hod only)
   */
  async createTask(userOrId, roleOrData, maybeData) {
    let user;
    let role;
    let taskData;

    if (userOrId && typeof userOrId === 'object' && userOrId._id) {
      user = userOrId;
      role = user.role;
      taskData = roleOrData || {};
    } else {
      user = await User.findById(userOrId);
      role = roleOrData || (user ? user.role : null);
      taskData = maybeData || {};
    }

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const { assignedTo, studentId, title, description, dueDate, priority } = taskData;

    if (!title || !title.trim()) {
      throw new AppError('Task title is required', 400);
    }

    let targetStudent = null;

    if (studentId) {
      targetStudent = await Student.findById(studentId);
    } else if (assignedTo) {
      targetStudent = await Student.findOne({ userId: assignedTo });
    }

    if (!targetStudent) {
      throw new AppError('Valid target student is required to assign a task', 400);
    }

    if (role === 'mentor') {
      const mentor = await Mentor.findOne({ userId: user._id });
      if (!mentor) {
        throw new AppError('Mentor profile not found', 404);
      }

      if (!targetStudent.mentorId || targetStudent.mentorId.toString() !== mentor._id.toString()) {
        throw new AppError('Access denied: You can only assign tasks to your assigned mentees', 403);
      }
    } else if (role === 'hod') {
      // Enforce HOD department scope
      if (user.department && user.department !== 'ALL' && user.department !== 'General') {
        if (targetStudent.department && targetStudent.department !== user.department) {
          throw new AppError('Access denied: You can only assign tasks to students within your authorized department', 403);
        }
      }
    } else {
      throw new AppError('Unauthorized: Only mentors and HODs can create tasks', 403);
    }

    const task = await Task.create({
      assignedTo: targetStudent.userId,
      assignedBy: user._id,
      studentId: targetStudent._id,
      title: title.trim(),
      description: description ? description.trim() : '',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      priority: priority || 'medium',
      status: 'pending',
    });

    return await task.populate([
      { path: 'assignedTo', select: 'name email role' },
      { path: 'assignedBy', select: 'name email role' },
      { path: 'studentId', select: 'usn name department semester section' },
    ]);
  }

  /**
   * Get tasks with query filters and pagination
   */
  async getTasks(user, query = {}) {
    const { status, priority, studentId, assignedTo, page = 1, limit = 20 } = query;
    const filter = {};

    if (user.role === 'student') {
      filter.assignedTo = user._id;
    } else if (user.role === 'mentor') {
      const mentorDoc = await Mentor.findOne({ userId: user._id });
      if (!mentorDoc) {
        throw new AppError('Mentor profile not found', 404);
      }

      const menteeStudents = await Student.find({ mentorId: mentorDoc._id }).select('_id userId');
      const menteeStudentIds = menteeStudents.map((s) => s._id);
      const menteeUserIds = menteeStudents.map((s) => s.userId);

      if (assignedTo) {
        const isMentee = menteeUserIds.some((id) => id && id.toString() === assignedTo.toString());
        if (!isMentee) {
          throw new AppError('Access denied: You can only view tasks of your assigned mentees', 403);
        }
        filter.assignedTo = assignedTo;
      }

      if (studentId) {
        const isMentee = menteeStudentIds.some((id) => id && id.toString() === studentId.toString());
        if (!isMentee) {
          throw new AppError('Access denied: You can only view tasks of your assigned mentees', 403);
        }
        filter.studentId = studentId;
      }

      if (!assignedTo && !studentId) {
        filter.$or = [
          { assignedBy: user._id },
          { studentId: { $in: menteeStudentIds } },
        ];
      }
    } else if (user.role === 'hod') {
      if (user.department && user.department !== 'ALL' && user.department !== 'General') {
        const deptStudents = await Student.find({ department: user.department }).select('_id userId');
        const deptStudentIds = deptStudents.map((s) => s._id);
        const deptUserIds = deptStudents.map((s) => s.userId);

        if (assignedTo) {
          const inDept = deptUserIds.some((id) => id && id.toString() === assignedTo.toString());
          if (!inDept) {
            throw new AppError('Access denied: You can only view tasks within your authorized department', 403);
          }
          filter.assignedTo = assignedTo;
        }

        if (studentId) {
          const inDept = deptStudentIds.some((id) => id && id.toString() === studentId.toString());
          if (!inDept) {
            throw new AppError('Access denied: You can only view tasks within your authorized department', 403);
          }
          filter.studentId = studentId;
        }

        if (!assignedTo && !studentId) {
          filter.$or = [
            { assignedBy: user._id },
            { studentId: { $in: deptStudentIds } },
          ];
        }
      } else {
        if (assignedTo) filter.assignedTo = assignedTo;
        if (studentId) filter.studentId = studentId;
      }
    } else if (assignedTo) {
      filter.assignedTo = assignedTo;
    }

    if (status) {
      filter.status = status;
    }
    if (priority) {
      filter.priority = priority;
    }
    if (studentId && !filter.studentId) {
      filter.studentId = studentId;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const parsedLimit = parseInt(limit, 10);

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('assignedTo', 'name email role')
        .populate('assignedBy', 'name email role')
        .populate('studentId', 'usn name department semester section')
        .sort({ dueDate: 1, createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit),
      Task.countDocuments(filter),
    ]);

    return {
      tasks,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parsedLimit) || 1,
    };
  }

  /**
   * Get task by ID
   */
  async getTaskById(taskId, user) {
    const task = await Task.findById(taskId)
      .populate('assignedTo', 'name email role')
      .populate('assignedBy', 'name email role')
      .populate('studentId', 'usn name department semester section mentorId');

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    // Access check
    if (user.role === 'student') {
      if (task.assignedTo._id.toString() !== user._id.toString()) {
        throw new AppError('Access denied: You do not have permission to view this task', 403);
      }
    } else if (user.role === 'mentor') {
      const isCreator = task.assignedBy._id.toString() === user._id.toString();
      const mentorDoc = await Mentor.findOne({ userId: user._id });
      const isAssignedMentee =
        mentorDoc &&
        task.studentId &&
        task.studentId.mentorId &&
        task.studentId.mentorId.toString() === mentorDoc._id.toString();

      if (!isCreator && !isAssignedMentee) {
        throw new AppError('Access denied: You do not have permission to view this task', 403);
      }
    } else if (user.role === 'hod') {
      if (user.department && user.department !== 'ALL' && user.department !== 'General') {
        const studentDept = task.studentId?.department;
        if (studentDept && studentDept !== user.department) {
          throw new AppError('Access denied: You do not have permission to view this task', 403);
        }
      }
    }

    return task;
  }

  /**
   * Update a task
   */
  async updateTask(taskId, user, updateData) {
    const task = await Task.findById(taskId).populate('studentId', 'department mentorId');
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    const isAssigner = task.assignedBy.toString() === user._id.toString();
    const isAssignee = task.assignedTo.toString() === user._id.toString();

    if (user.role === 'student') {
      if (!isAssignee) {
        throw new AppError('You do not have permission to update this task', 403);
      }
      if (
        updateData.title !== undefined ||
        updateData.description !== undefined ||
        updateData.dueDate !== undefined ||
        updateData.priority !== undefined
      ) {
        throw new AppError('Access denied: Students are only permitted to update task status', 403);
      }
    } else if (user.role === 'mentor') {
      const mentorDoc = await Mentor.findOne({ userId: user._id });
      const isAssignedMentee =
        mentorDoc &&
        task.studentId &&
        task.studentId.mentorId &&
        task.studentId.mentorId.toString() === mentorDoc._id.toString();

      if (!isAssigner && !isAssignedMentee) {
        throw new AppError('You do not have permission to update this task', 403);
      }
    } else if (user.role === 'hod') {
      if (user.department && user.department !== 'ALL' && user.department !== 'General') {
        if (task.studentId?.department !== user.department) {
          throw new AppError('Access denied: You do not have permission to update tasks outside your authorized department', 403);
        }
      }
    } else {
      throw new AppError('You do not have permission to update this task', 403);
    }

    const allowedUpdates = user.role === 'student'
      ? ['status']
      : ['title', 'description', 'dueDate', 'priority', 'status'];

    allowedUpdates.forEach((field) => {
      if (updateData[field] !== undefined) {
        if (field === 'dueDate' && updateData[field]) {
          task[field] = new Date(updateData[field]);
        } else {
          task[field] = updateData[field];
        }
      }
    });

    if (updateData.status === 'completed' && !task.completedAt) {
      task.completedAt = new Date();
    } else if (updateData.status && updateData.status !== 'completed') {
      task.completedAt = null;
    }

    await task.save();

    return await task.populate([
      { path: 'assignedTo', select: 'name email role' },
      { path: 'assignedBy', select: 'name email role' },
      { path: 'studentId', select: 'usn name department semester section' },
    ]);
  }

  /**
   * Update task status only
   */
  async updateStatus(taskId, user, status) {
    return this.updateTask(taskId, user, { status });
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId, user) {
    const task = await Task.findById(taskId).populate('studentId', 'department mentorId');
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    const isAssigner = task.assignedBy.toString() === user._id.toString();

    if (user.role === 'mentor') {
      const mentorDoc = await Mentor.findOne({ userId: user._id });
      const isAssignedMentee =
        mentorDoc &&
        task.studentId &&
        task.studentId.mentorId &&
        task.studentId.mentorId.toString() === mentorDoc._id.toString();

      if (!isAssigner && !isAssignedMentee) {
        throw new AppError('Only the creator or authorized mentor can delete this task', 403);
      }
    } else if (user.role === 'hod') {
      if (user.department && user.department !== 'ALL' && user.department !== 'General') {
        if (task.studentId?.department !== user.department) {
          throw new AppError('Access denied: You do not have permission to delete tasks outside your authorized department', 403);
        }
      }
    } else {
      throw new AppError('Only the creator, authorized mentor, or HOD can delete this task', 403);
    }

    await task.deleteOne();
    return { success: true };
  }
}

module.exports = new TaskService();
