const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const { User, Student, Mentor, Task } = require('../models');
const { generateAccessToken } = require('../utils/tokenUtils');

describe('Task Management Integration Test Suite', () => {
  jest.setTimeout(30000);
  let mentorUser, mentorDoc, mentorToken;
  let otherMentorUser, otherMentorDoc;
  let studentUser, studentDoc, studentToken;
  let otherStudentUser, otherStudentDoc;
  let nonMenteeUser, nonMenteeDoc;
  let otherDeptStudentUser, otherDeptStudentDoc;
  let hodUser, hodToken;
  let taskId, otherMentorTaskId, eceTaskId;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_mentoring_system_test');
    }

    await User.deleteMany({
      email: {
        $in: [
          'm_task@test.com',
          'm_task2@test.com',
          'st_task@test.com',
          'st_task2@test.com',
          'st_nonmentee@test.com',
          'st_otherdept@test.com',
          'hod_task@test.com',
        ],
      },
    });
    await Student.deleteMany({ usn: { $in: ['1MS21CS999', '1MS21CS998', '1MS21CS888', '1MS21EC777'] } });
    await Mentor.deleteMany({ employeeId: { $in: ['EMP_TASK', 'EMP_TASK2'] } });
    await Task.deleteMany({});

    // 1. Primary Mentor in CSE
    mentorUser = await User.create({
      name: 'Task Mentor',
      email: 'm_task@test.com',
      password: 'Password@123',
      role: 'mentor',
      department: 'CSE',
    });
    mentorDoc = await Mentor.create({
      userId: mentorUser._id,
      employeeId: 'EMP_TASK',
      department: 'CSE',
    });
    mentorToken = generateAccessToken(mentorUser);

    // 2. Secondary Mentor in CSE
    otherMentorUser = await User.create({
      name: 'Other Task Mentor',
      email: 'm_task2@test.com',
      password: 'Password@123',
      role: 'mentor',
      department: 'CSE',
    });
    otherMentorDoc = await Mentor.create({
      userId: otherMentorUser._id,
      employeeId: 'EMP_TASK2',
      department: 'CSE',
    });

    // 3. Assigned mentee student of Primary Mentor in CSE
    studentUser = await User.create({
      name: 'Task Student',
      email: 'st_task@test.com',
      password: 'Password@123',
      role: 'student',
      department: 'CSE',
    });
    studentDoc = await Student.create({
      userId: studentUser._id,
      usn: '1MS21CS999',
      department: 'CSE',
      semester: 4,
      mentorId: mentorDoc._id,
    });
    studentToken = generateAccessToken(studentUser);

    // 4. Assigned mentee student of Secondary Mentor in CSE
    otherStudentUser = await User.create({
      name: 'Other Task Student',
      email: 'st_task2@test.com',
      password: 'Password@123',
      role: 'student',
      department: 'CSE',
    });
    otherStudentDoc = await Student.create({
      userId: otherStudentUser._id,
      usn: '1MS21CS998',
      department: 'CSE',
      semester: 4,
      mentorId: otherMentorDoc._id,
    });

    // 5. Non-mentee student in CSE
    nonMenteeUser = await User.create({
      name: 'Non Mentee Student',
      email: 'st_nonmentee@test.com',
      password: 'Password@123',
      role: 'student',
      department: 'CSE',
    });
    nonMenteeDoc = await Student.create({
      userId: nonMenteeUser._id,
      usn: '1MS21CS888',
      department: 'CSE',
      semester: 4,
      mentorId: null,
    });

    // 6. Student in ECE department
    otherDeptStudentUser = await User.create({
      name: 'Other Dept Student',
      email: 'st_otherdept@test.com',
      password: 'Password@123',
      role: 'student',
      department: 'ECE',
    });
    otherDeptStudentDoc = await Student.create({
      userId: otherDeptStudentUser._id,
      usn: '1MS21EC777',
      department: 'ECE',
      semester: 4,
      mentorId: null,
    });

    // 7. HOD in CSE
    hodUser = await User.create({
      name: 'Task HOD',
      email: 'hod_task@test.com',
      password: 'Password@123',
      role: 'hod',
      department: 'CSE',
    });
    hodToken = generateAccessToken(hodUser);

    // Create a task by other mentor for other student
    const otherTask = await Task.create({
      assignedTo: otherStudentUser._id,
      assignedBy: otherMentorUser._id,
      studentId: otherStudentDoc._id,
      title: 'Other Mentor Task',
      description: 'Task for other mentee',
      priority: 'medium',
      status: 'pending',
    });
    otherMentorTaskId = otherTask._id;

    // Create an ECE student task
    const eceTask = await Task.create({
      assignedTo: otherDeptStudentUser._id,
      assignedBy: otherMentorUser._id,
      studentId: otherDeptStudentDoc._id,
      title: 'ECE Circuit Design Task',
      description: 'ECE lab assignment',
      priority: 'high',
      status: 'pending',
    });
    eceTaskId = eceTask._id;
  });

  afterAll(async () => {
    await User.deleteMany({
      email: {
        $in: [
          'm_task@test.com',
          'm_task2@test.com',
          'st_task@test.com',
          'st_task2@test.com',
          'st_nonmentee@test.com',
          'st_otherdept@test.com',
          'hod_task@test.com',
        ],
      },
    });
    await Student.deleteMany({ usn: { $in: ['1MS21CS999', '1MS21CS998', '1MS21CS888', '1MS21EC777'] } });
    await Mentor.deleteMany({ employeeId: { $in: ['EMP_TASK', 'EMP_TASK2'] } });
    await Task.deleteMany({});
    await mongoose.disconnect();
  });

  it('should allow mentor to create a task for assigned student', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({
        assignedTo: studentUser._id,
        studentId: studentDoc._id,
        title: 'Submit Machine Learning Lab Manual',
        description: 'Complete experiments 1 to 5 and submit before the lab session.',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'high',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Submit Machine Learning Lab Manual');
    expect(res.body.data.status).toBe('pending');
    taskId = res.body.data._id;
  });

  it('should return 403 when mentor assigns task to non-mentee', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({
        assignedTo: nonMenteeUser._id,
        studentId: nonMenteeDoc._id,
        title: 'Unauthorized Task Assignment',
        description: 'Mentor should not be able to assign task to non-mentee.',
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/only assign tasks to your assigned mentees/i);
  });

  it('should allow mentor to get own mentee tasks', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${mentorToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tasks.length).toBeGreaterThanOrEqual(1);
    // Verify none of other mentor's mentee tasks are leaked
    const hasOtherMentorTask = res.body.data.tasks.some(
      (t) => t._id.toString() === otherMentorTaskId.toString()
    );
    expect(hasOtherMentorTask).toBe(false);
  });

  it('should return 403 when mentor attempts to filter another mentor student by studentId', async () => {
    const res = await request(app)
      .get(`/api/tasks?studentId=${otherStudentDoc._id}`)
      .set('Authorization', `Bearer ${mentorToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/only view tasks of your assigned mentees/i);
  });

  it('should return 403 when mentor attempts to filter another mentor student by assignedTo', async () => {
    const res = await request(app)
      .get(`/api/tasks?assignedTo=${otherStudentUser._id}`)
      .set('Authorization', `Bearer ${mentorToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/only view tasks of your assigned mentees/i);
  });

  it('should return 403 when mentor attempts to view another mentor task by ID', async () => {
    const res = await request(app)
      .get(`/api/tasks/${otherMentorTaskId}`)
      .set('Authorization', `Bearer ${mentorToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/do not have permission to view this task/i);
  });

  it('should allow student to view own task by ID', async () => {
    const res = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id.toString()).toBe(taskId.toString());
  });

  it('should return 403 when student attempts to view another student task by ID', async () => {
    const res = await request(app)
      .get(`/api/tasks/${otherMentorTaskId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/do not have permission to view this task/i);
  });

  it('should return 403 when HOD assigns task outside authorized department', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${hodToken}`)
      .send({
        assignedTo: otherDeptStudentUser._id,
        studentId: otherDeptStudentDoc._id,
        title: 'Cross Department Task',
        description: 'HOD of CSE cannot assign tasks to ECE students.',
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/authorized department/i);
  });

  it('should return 403 when HOD filters tasks of student outside authorized department', async () => {
    const res = await request(app)
      .get(`/api/tasks?studentId=${otherDeptStudentDoc._id}`)
      .set('Authorization', `Bearer ${hodToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/within your authorized department/i);
  });

  it('should return 403 when CSE HOD attempts to view a task belonging to an ECE student by ID', async () => {
    const res = await request(app)
      .get(`/api/tasks/${eceTaskId}`)
      .set('Authorization', `Bearer ${hodToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/do not have permission to view this task/i);
  });

  it('should return 403 when CSE HOD attempts to update an out-of-department task attributed to themselves', async () => {
    const crossDeptTask = await Task.create({
      assignedTo: otherDeptStudentUser._id,
      assignedBy: hodUser._id,
      studentId: otherDeptStudentDoc._id,
      title: 'Out of Dept Task Created by HOD',
      description: 'Test description',
      priority: 'medium',
      status: 'pending',
    });

    const res = await request(app)
      .patch(`/api/tasks/${crossDeptTask._id}`)
      .set('Authorization', `Bearer ${hodToken}`)
      .send({
        title: 'HOD Attempted Update on ECE Task',
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/outside your authorized department/i);
  });

  it('should allow HOD to assign task to student within authorized department', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${hodToken}`)
      .send({
        assignedTo: studentUser._id,
        studentId: studentDoc._id,
        title: 'HOD Department Review Task',
        description: 'Departmental review assignment.',
        priority: 'medium',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('HOD Department Review Task');
  });

  it('should list tasks for assigned student', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tasks.length).toBeGreaterThanOrEqual(1);
  });

  it('should allow student updating status', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        status: 'in_progress',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('in_progress');
  });

  it('should return 403 when student attempts to change title', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Student Changed Title',
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/only permitted to update task status/i);
  });

  it('should return 403 when student attempts to change dueDate', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/only permitted to update task status/i);
  });

  it('should return 403 when student attempts to change priority', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        priority: 'low',
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/only permitted to update task status/i);
  });

  it('should allow mentor updating own assigned task title, description, dueDate, priority, status', async () => {
    const newDueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const res = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({
        title: 'Updated ML Lab Manual Deadline',
        description: 'Experiments 1 to 6 now required.',
        dueDate: newDueDate,
        priority: 'urgent',
        status: 'in_progress',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Updated ML Lab Manual Deadline');
    expect(res.body.data.description).toBe('Experiments 1 to 6 now required.');
    expect(res.body.data.priority).toBe('urgent');
  });

  it('should allow student updating task status via dedicated /status endpoint', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        status: 'completed',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('completed');
    expect(res.body.data.completedAt).toBeDefined();
  });

  it('should allow mentor to delete task', async () => {
    const res = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${mentorToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
