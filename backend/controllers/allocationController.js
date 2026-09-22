import {
  computeDraftAllocation,
  confirmAllocation,
  reassignStudent,
  getBatchList,
  getBatchById,
  getMentorCapacity,
} from '../services/allocationService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export async function computeDraft(req, res, next) {
  try {
    const { department, rules } = req.body;
    const dept = department || req.user.department;
    const batch = await computeDraftAllocation(dept, rules || {}, req.user.id);
    return sendSuccess(res, { data: batch }, 'Draft allocation computed', 201);
  } catch (err) {
    if (err.isOperational) return sendError(res, err.message, err.statusCode);
    next(err);
  }
}

export async function getDraft(req, res, next) {
  try {
    const batch = await getBatchById(req.params.batchId);
    if (!batch) return sendError(res, 'Batch not found', 404);
    return sendSuccess(res, { data: batch });
  } catch (err) { next(err); }
}

export async function confirm(req, res, next) {
  try {
    const batch = await confirmAllocation(req.params.batchId, req.user.id);
    return sendSuccess(res, { data: batch }, 'Allocation confirmed');
  } catch (err) {
    if (err.isOperational) return sendError(res, err.message, err.statusCode);
    next(err);
  }
}

export async function reassign(req, res, next) {
  try {
    const { studentId, toMentorId, reason } = req.body;
    if (!studentId || !toMentorId) return sendError(res, 'studentId and toMentorId are required', 400);
    const result = await reassignStudent({ studentId, toMentorId, reason: reason || '', actorId: req.user.id });
    return sendSuccess(res, { data: result }, 'Student reassigned');
  } catch (err) {
    if (err.isOperational) return sendError(res, err.message, err.statusCode);
    next(err);
  }
}

export async function getHistory(req, res, next) {
  try {
    const dept = req.query.department || req.user.department;
    const batches = await getBatchList(dept);
    return sendSuccess(res, { data: batches });
  } catch (err) { next(err); }
}

export async function getCapacity(req, res, next) {
  try {
    const dept = req.query.department || req.user.department;
    const result = await getMentorCapacity(dept);
    return sendSuccess(res, { data: result });
  } catch (err) { next(err); }
}
