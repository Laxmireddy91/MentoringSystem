import express from 'express';
import { protect, allowRoles } from '../middleware/auth.js';
import { getDeptStats, createTemplate } from '../controllers/taskController.js';

const router = express.Router();
router.use(protect, allowRoles('hod'));

router.get('/dept/stats', getDeptStats);
router.post('/dept/template', createTemplate);

export default router;
