const express = require('express');
const router = express.Router();

const StudentController = require('../controllers/studentController');
const { authenticate } = require('../middleware/auth');
const { authorize, requireStudentRelationship } = require('../middleware/rbac');
const { ROLES } = require('../config/constants');

// Self profile & records for logged in student
router.get('/me', authenticate, authorize(ROLES.STUDENT), StudentController.getMyProfile);
router.get('/me/360', authenticate, authorize(ROLES.STUDENT), StudentController.getMy360);
router.get('/profile', authenticate, authorize(ROLES.STUDENT), StudentController.getMyProfile);
router.get('/me/sessions', authenticate, authorize(ROLES.STUDENT), StudentController.getMySessions);
router.post('/sessions/:sessionId/feedback', authenticate, authorize(ROLES.STUDENT), StudentController.submitFeedback);

// Self online courses & emergency contact
router.put('/me/emergency-contact', authenticate, authorize(ROLES.STUDENT), StudentController.updateEmergencyContact);
router.post('/me/online-courses', authenticate, authorize(ROLES.STUDENT), StudentController.addOnlineCourse);
router.delete('/me/online-courses/:courseId', authenticate, authorize(ROLES.STUDENT), StudentController.deleteOnlineCourse);

// Mentorship & Backlog records (Scoped by RBAC relationship)
router.get(
  '/:studentId/360',
  authenticate,
  authorize(ROLES.MENTOR, ROLES.HOD, ROLES.MENTORING_COORDINATOR, ROLES.EXAM_COORDINATOR, ROLES.TPO, ROLES.STUDENT),
  requireStudentRelationship,
  StudentController.getStudent360
);
router.get('/:studentId/mentorship-records', authenticate, requireStudentRelationship, StudentController.getMentorshipRecords);
router.post(
  '/:studentId/mentorship-records',
  authenticate,
  authorize(ROLES.MENTOR, ROLES.HOD),
  requireStudentRelationship,
  StudentController.addMentorshipRecord
);
router.post(
  '/:studentId/backlog-records',
  authenticate,
  authorize(ROLES.MENTOR, ROLES.HOD),
  requireStudentRelationship,
  StudentController.addBacklogRecord
);
router.put(
  '/:studentId/backlog-records/:recordId',
  authenticate,
  authorize(ROLES.MENTOR, ROLES.HOD),
  requireStudentRelationship,
  StudentController.updateBacklogRecord
);

module.exports = router;
