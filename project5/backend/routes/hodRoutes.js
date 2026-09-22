const express = require('express');
const router = express.Router();

const HodController = require('../controllers/hodController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const validate = require('../middleware/validator');
const {
  createStudentSchema,
  updateStudentSchema,
  createMentorSchema,
  updateMentorSchema,
  assignMentorSchema,
} = require('../validators/managementValidators');
const { ROLES } = require('../config/constants');
const { importUpload } = require('../middleware/upload');

// Protect all routes with HOD authorization
router.use(authenticate, authorize(ROLES.HOD));

router.get('/analytics', HodController.getAnalytics);
router.get('/overview', HodController.getAnalytics);

// Student management
router.get('/students', HodController.getAllStudents);
// Individual student creation (late admission — no Excel required)
router.post('/students/individual', HodController.createIndividualStudent);
router.post('/students', validate(createStudentSchema), HodController.createStudent);
router.put('/students/:id', validate(updateStudentSchema), HodController.updateStudent);
router.post('/students/:id/progress', HodController.progressStudent);
router.patch('/students/:id/mentor', HodController.reassignStudentMentor);
router.delete('/students/:id', HodController.deleteStudent);

// Mentor management
router.get('/mentors', HodController.getAllMentors);
router.post('/mentors', validate(createMentorSchema), HodController.createMentor);
router.put('/mentors/:id', validate(updateMentorSchema), HodController.updateMentor);

// Mentor Assignment
router.post('/assign-mentees', validate(assignMentorSchema), HodController.assignMentees);
router.post('/mentors/allocate-bulk', validate(assignMentorSchema), HodController.assignMentees);

// Import Workflow: Upload → Validate → Preview → Confirm (2-step, never silent import)
router.post('/imports/mentors/preview', importUpload.single('file'), HodController.previewMentorImport);
router.post('/imports/mentors/confirm', HodController.confirmMentorImport);
router.post('/imports/cie/preview', importUpload.single('file'), HodController.previewCIEImport);
router.post('/imports/cie/confirm', HodController.confirmCIEImport);
router.post('/imports/attendance/preview', importUpload.single('file'), HodController.previewAttendanceImport);
router.post('/imports/attendance/confirm', HodController.confirmAttendanceImport);
router.get('/imports/history', HodController.getImportHistory);

// Leaderboard & Security
router.get('/leaderboard', HodController.getLeaderboard);
router.post('/users/:userId/unlock', HodController.unlockAccount);
router.get('/audit-logs', HodController.getAuditLogs);

module.exports = router;

