const express = require('express');
const router = express.Router();
const ExamRequestController = require('../controllers/examRequestController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES } = require('../config/constants');

router.use(authenticate);

// Student endpoints
router.post('/', authorize(ROLES.STUDENT), ExamRequestController.create);
router.get('/my', authorize(ROLES.STUDENT), ExamRequestController.getMyRequests);

// Mentor endpoints
router.get('/mentor', authorize(ROLES.MENTOR), ExamRequestController.getMentorRequests);
router.patch('/:id/mentor-review', authorize(ROLES.MENTOR), ExamRequestController.mentorReview);

// Exam Coordinator endpoints
router.get('/coordinator', authorize(ROLES.EXAM_COORDINATOR, ROLES.HOD), ExamRequestController.getCoordinatorRequests);
router.patch('/:id/decision', authorize(ROLES.EXAM_COORDINATOR), ExamRequestController.coordinatorDecision);

// View details (Student, Mentor, Exam Coordinator, HOD)
router.get('/:id', ExamRequestController.getById);

module.exports = router;
