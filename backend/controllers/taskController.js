import Task from '../models/Task.js';
import { getDeptTaskStats as statsService, createDeptTemplate } from '../services/taskService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

// ---- EXISTING FUNCTIONS (keep exactly) ----
export async function createTask(req, res, next) {
  try {
    const { title, due, owner, priority } = req.body;
    const task = await Task.create({ title, due, owner, priority, user: req.user._id });
    res.status(201).json({ success: true, task });
  } catch (err) { next(err); }
}

export async function updateTask(req, res, next) {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, task });
  } catch (err) { next(err); }
}

export async function deleteTask(req, res, next) {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) { next(err); }
}

// ---- NEW DEPARTMENT-LEVEL FUNCTIONS ----
export async function getDeptStats(req, res, next) {
  try {
    const dept = req.user.department;
    const result = await statsService(dept);
    return sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function createTemplate(req, res, next) {
  try {
    const { title, description, due, priority, department } = req.body;
    if (!title) return sendError(res, 'title is required', 400);
    const dept = department || req.user.department;
    const task = await createDeptTemplate({ title, description, due, priority, department: dept }, req.user.id);
    return sendSuccess(res, { data: task }, 'Department task template created', 201);
  } catch (err) { next(err); }
}