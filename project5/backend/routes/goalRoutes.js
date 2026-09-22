const express = require('express');
const router = express.Router();

const GoalController = require('../controllers/goalController');
const { authenticate } = require('../middleware/auth');
const { authorize, requireStudentRelationship } = require('../middleware/rbac');
const { ROLES } = require('../config/constants');

router.use(authenticate);

// Student creates goal & lists own goals
router.post('/', authorize(ROLES.STUDENT), GoalController.createGoal);
router.get('/', authorize(ROLES.STUDENT), GoalController.getGoals);

// Get student goals
router.get('/student/:studentId', requireStudentRelationship, GoalController.getGoals);

// Update / toggle milestone progress
router.patch('/:id/milestones/:index/toggle', authorize(ROLES.STUDENT), GoalController.toggleMilestone);
router.patch('/:id', authorize(ROLES.STUDENT), GoalController.updateGoal);

// Delete goal
router.delete('/:id', authorize(ROLES.STUDENT), GoalController.deleteGoal);

module.exports = router;
