const express = require('express');
const router = express.Router();
const TaskController = require('../controllers/taskController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const { ROLES } = require('../config/constants');

router.use(authenticate);

router
  .route('/')
  .post(authorize(ROLES.MENTOR, ROLES.HOD), TaskController.createTask)
  .get(TaskController.getTasks);

router
  .route('/:id')
  .get(TaskController.getTaskById)
  .put(authorize(ROLES.MENTOR, ROLES.HOD), TaskController.updateTask)
  .patch(TaskController.updateTask)
  .delete(authorize(ROLES.MENTOR, ROLES.HOD), TaskController.deleteTask);

router.patch('/:id/status', TaskController.updateStatus);

module.exports = router;
