import express from 'express';
import { protect, allowRoles } from '../middleware/auth.js';
import { list, generate, download } from '../controllers/reportController.js';

const router = express.Router();
router.use(protect, allowRoles('hod'));

router.get('/', list);
router.post('/', generate);
router.get('/:id/download', download);

export default router;
