const express = require('express');
const router = express.Router();

const ParentController = require('../controllers/parentController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES } = require('../config/constants');

// Parent exclusive routes
router.use(authenticate, authorize(ROLES.PARENT));

router.get('/child', ParentController.getChildOverview);
router.get('/my-ward', ParentController.getChildOverview);
router.get('/child/semester/:semester', ParentController.getChildSemesterAcademics);
router.get('/my-ward/semester/:semester', ParentController.getChildSemesterAcademics);

module.exports = router;
