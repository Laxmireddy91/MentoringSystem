const express = require('express');
const router = express.Router();

const AcademicController = require('../controllers/academicController');
const { authenticate } = require('../middleware/auth');
const { authorize, requireStudentRelationship } = require('../middleware/rbac');
const validate = require('../middleware/validator');
const { updateStudentMarksSchema } = require('../validators/academicValidators');
const { ROLES } = require('../config/constants');

// Get logged in student's marks
router.get(
  '/my-marks',
  authenticate,
  authorize(ROLES.STUDENT),
  AcademicController.getMyMarks
);

// Get logged in student's official attendance
router.get(
  '/my-attendance',
  authenticate,
  authorize(ROLES.STUDENT),
  AcademicController.getMyAttendance
);

// Get student attendance records (Student, Mentor, HOD, Parent with relationship ownership check)
router.get(
  '/attendance/:studentId',
  authenticate,
  requireStudentRelationship,
  AcademicController.getStudentAttendance
);

// Update marks (Mentor & HOD only, mentor restricted to assigned student)
router.put(
  '/marks/:studentId',
  authenticate,
  authorize(ROLES.MENTOR, ROLES.HOD),
  requireStudentRelationship,
  validate(updateStudentMarksSchema),
  AcademicController.updateMarks
);

router.post(
  '/marks/:studentId',
  authenticate,
  authorize(ROLES.MENTOR, ROLES.HOD),
  requireStudentRelationship,
  validate(updateStudentMarksSchema),
  AcademicController.updateMarks
);

// Get student academic records (Student, Mentor, HOD, Parent with ownership check)
router.get(
  '/:studentId',
  authenticate,
  requireStudentRelationship,
  AcademicController.getAcademics
);

// Get student semester records
router.get(
  '/student/:studentId/semester/:semesterNumber',
  authenticate,
  requireStudentRelationship,
  AcademicController.getTimeline
);

// Get semester progression timeline
router.get(
  '/:studentId/timeline/:semester',
  authenticate,
  requireStudentRelationship,
  AcademicController.getTimeline
);

// Get student vs class anonymous comparison
router.get(
  '/:studentId/comparison/:semester',
  authenticate,
  requireStudentRelationship,
  AcademicController.getClassComparison
);

module.exports = router;
