const express = require('express');
const router = express.Router();

const MentorController = require('../controllers/mentorController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const validate = require('../middleware/validator');
const { updateOfficeHoursSchema } = require('../validators/managementValidators');
const { ROLES } = require('../config/constants');

// Mentor exclusive routes
router.get('/dashboard', authenticate, authorize(ROLES.MENTOR), MentorController.getDashboard);
router.get('/profile', authenticate, authorize(ROLES.MENTOR), MentorController.getDashboard);
router.get('/students', authenticate, authorize(ROLES.MENTOR), MentorController.getAssignedStudents);
router.get('/my-students', authenticate, authorize(ROLES.MENTOR), MentorController.getAssignedStudents);
router.get('/feedbacks', authenticate, authorize(ROLES.MENTOR), MentorController.getFeedbacks);
router.put(
  '/office-hours',
  authenticate,
  authorize(ROLES.MENTOR),
  validate(updateOfficeHoursSchema),
  MentorController.updateOfficeHours
);

// All mentors query
router.get('/', authenticate, MentorController.getAllMentors);

// Public/Authenticated mentor availability query
router.get('/:mentorId/office-hours', authenticate, MentorController.getOfficeHours);

module.exports = router;
