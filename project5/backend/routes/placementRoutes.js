const express = require('express');
const router = express.Router();
const PlacementController = require('../controllers/placementController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES } = require('../config/constants');

router.use(authenticate);

// TPO Drive Management
router.post('/drives', authorize(ROLES.TPO), PlacementController.createDrive);
router.get('/drives', PlacementController.getDrives);
router.get('/drives/:id', PlacementController.getDriveById);
router.get('/drives/:id/eligibility', PlacementController.getEligibility);

// Student Application
router.post('/drives/:id/apply', authorize(ROLES.STUDENT), PlacementController.apply);

// TPO Application Management
router.get('/drives/:id/applications', authorize(ROLES.TPO, ROLES.HOD), PlacementController.getApplications);
router.patch('/applications/:applicationId/status', authorize(ROLES.TPO), PlacementController.updateApplicationStatus);

// Mentor Placement-Readiness view (TPO -> Department -> Mentor flow)
router.get('/mentee-readiness', authorize(ROLES.MENTOR), PlacementController.getMentorPlacementReadiness);

// Analytics
router.get('/analytics', authorize(ROLES.TPO, ROLES.HOD), PlacementController.getAnalytics);

module.exports = router;
