const express = require('express');
const router = express.Router();
const AllocationController = require('../controllers/allocationController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES } = require('../config/constants');

// All allocation endpoints require authentication and either MENTORING_COORDINATOR or HOD role
router.use(authenticate);
router.use(authorize(ROLES.MENTORING_COORDINATOR, ROLES.HOD));

router.get('/metrics', AllocationController.getMetrics);
router.get('/capacity', AllocationController.getCapacity);
router.post('/capacity', AllocationController.calculateCapacity);
router.post('/preview', AllocationController.previewAllocation);
router.post('/confirm', AllocationController.confirmAllocation);
router.post('/reassign', AllocationController.reassignStudent);
router.patch('/mentors/:id/status', AllocationController.toggleMentorStatus);
router.get('/history', AllocationController.getHistory);
router.get('/history/:id', AllocationController.getBatchById);

module.exports = router;
