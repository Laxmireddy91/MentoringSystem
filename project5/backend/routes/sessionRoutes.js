const express = require('express');
const router = express.Router();

const SessionController = require('../controllers/sessionController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const validate = require('../middleware/validator');
const {
  createSessionSchema,
  bookSlotSchema,
  updateSessionStatusSchema,
} = require('../validators/sessionValidators');
const { ROLES } = require('../config/constants');

// All session operations require authentication
router.use(authenticate);

// Calendar Query (Month, Week, Day) & Sessions list
router.get('/calendar', SessionController.getCalendarSessions);
router.get('/my-sessions', SessionController.getCalendarSessions);
router.get('/my-feedbacks', SessionController.getCalendarSessions);
router.get('/', SessionController.getCalendarSessions);

// Get single session details
router.get('/:id', SessionController.getSessionById);

// Mentor creates session
router.post(
  '/',
  authorize(ROLES.MENTOR, ROLES.HOD),
  validate(createSessionSchema),
  SessionController.createSession
);

// Student books office hour slot
router.post(
  '/book',
  authorize(ROLES.STUDENT),
  validate(bookSlotSchema),
  SessionController.bookSlot
);

// Update status (confirm, complete, cancel, reschedule)
router.patch(
  '/:sessionId/status',
  validate(updateSessionStatusSchema),
  SessionController.updateStatus
);

module.exports = router;
