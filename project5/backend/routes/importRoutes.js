const express = require('express');
const router = express.Router();

const ImportController = require('../controllers/importController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const upload = require('../middleware/upload');
const { ROLES } = require('../config/constants');

router.use(authenticate);

// HOD imports student directory via CSV or Excel
router.post(
  '/students',
  authorize(ROLES.HOD),
  upload.single('file'),
  ImportController.importStudents
);

router.post(
  '/students/csv',
  authorize(ROLES.HOD),
  upload.single('file'),
  ImportController.importStudents
);

router.post(
  '/students/excel',
  authorize(ROLES.HOD),
  upload.single('file'),
  ImportController.importStudents
);

// Mentor / HOD imports bulk marks via CSV or Excel
router.post(
  '/marks',
  authorize(ROLES.MENTOR, ROLES.HOD),
  upload.single('file'),
  ImportController.importMarks
);

router.post(
  '/marks/csv',
  authorize(ROLES.MENTOR, ROLES.HOD),
  upload.single('file'),
  ImportController.importMarks
);

router.post(
  '/marks/excel',
  authorize(ROLES.MENTOR, ROLES.HOD),
  upload.single('file'),
  ImportController.importMarks
);

// HOD imports bulk attendance via CSV or Excel
router.post(
  '/attendance',
  authorize(ROLES.HOD),
  upload.single('file'),
  ImportController.importAttendance
);

module.exports = router;
