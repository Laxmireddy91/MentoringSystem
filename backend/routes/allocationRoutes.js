import express from 'express';
import { protect, allowRoles } from '../middleware/auth.js';
import {
  computeDraft,
  getDraft,
  confirm,
  reassign,
  getHistory,
  getCapacity,
} from '../controllers/allocationController.js';

const router = express.Router();
router.use(protect);

router.post('/compute', allowRoles('mentoring_coordinator'), computeDraft);
router.get('/draft/:batchId', allowRoles('mentoring_coordinator'), getDraft);
router.post('/confirm/:batchId', allowRoles('mentoring_coordinator'), confirm);
router.post('/reassign', allowRoles('mentoring_coordinator'), reassign);
router.get('/history', allowRoles('mentoring_coordinator', 'hod'), getHistory);
router.get('/mentors/capacity', allowRoles('mentoring_coordinator', 'hod'), getCapacity);

export default router;
