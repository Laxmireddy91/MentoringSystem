const express = require('express');
const router = express.Router();

const RiskController = require('../controllers/riskController');
const { authenticate } = require('../middleware/auth');
const { authorize, requireStudentRelationship } = require('../middleware/rbac');
const validate = require('../middleware/validator');
const { riskSettingsSchema } = require('../validators/managementValidators');
const { ROLES } = require('../config/constants');

// View / update risk settings (HOD only)
router.get('/settings', authenticate, authorize(ROLES.HOD), RiskController.getSettings);
router.put('/settings', authenticate, authorize(ROLES.HOD), validate(riskSettingsSchema), RiskController.updateSettings);

// Recalculate all students' risk (HOD & Mentor)
router.post('/recalculate-all', authenticate, authorize(ROLES.HOD, ROLES.MENTOR), RiskController.recalculateAll);

// Logged in student risk analysis
router.get('/my-analysis', authenticate, authorize(ROLES.STUDENT), RiskController.getMyRisk);

// Evaluate / view student risk (Student, Mentor, HOD, Parent with ownership check)
router.get('/:studentId', authenticate, requireStudentRelationship, RiskController.getStudentRisk);
router.post('/:studentId/evaluate', authenticate, authorize(ROLES.MENTOR, ROLES.HOD), requireStudentRelationship, RiskController.evaluateStudentRisk);

module.exports = router;
