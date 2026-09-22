import express from 'express';
import { protect, allowRoles } from '../middleware/auth.js';
import {
  getSummary,
  getStudents,
  getMentors,
  getAuditLogsHandler,
  getLeaderboardHandler,
  getTaskStats,
} from '../controllers/hodController.js';

const router = express.Router();
router.use(protect, allowRoles('hod'));

router.get('/summary', getSummary);
router.get('/students', getStudents);
router.get('/mentors', getMentors);
router.get('/audit-logs', getAuditLogsHandler);
router.get('/leaderboard', getLeaderboardHandler);
router.get('/tasks', getTaskStats);

export default router;
