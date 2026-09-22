const express = require('express');
const router = express.Router();

const AchievementController = require('../controllers/achievementController');
const { authenticate } = require('../middleware/auth');
const { authorize, requireStudentRelationship } = require('../middleware/rbac');
const upload = require('../middleware/upload');
const { ROLES } = require('../config/constants');

router.use(authenticate);

const normalizeFiles = (req, res, next) => {
  if (req.files && !Array.isArray(req.files)) {
    req.files = Object.values(req.files).flat();
  }
  next();
};

// Student upload achievements (Multi-file multipart/form-data: 'files', 'certificates', or 'file')
router.post(
  '/',
  authorize(ROLES.STUDENT),
  upload.fields([
    { name: 'files', maxCount: 5 },
    { name: 'certificates', maxCount: 5 },
    { name: 'file', maxCount: 1 },
  ]),
  normalizeFiles,
  AchievementController.uploadAchievement
);

// Get current student's achievements
router.get(
  '/my-achievements',
  authorize(ROLES.STUDENT),
  AchievementController.getStudentAchievements
);

// Get student achievements (mentor/HOD access)
router.get(
  '/student/:studentId',
  requireStudentRelationship,
  AchievementController.getStudentAchievements
);

// Mentor verifies or reviews achievement
router.patch(
  '/:id/verify',
  authorize(ROLES.MENTOR, ROLES.HOD),
  AchievementController.verifyAchievement
);
router.patch(
  '/:id/review',
  authorize(ROLES.MENTOR, ROLES.HOD),
  AchievementController.reviewAchievement
);

// Mentor list pending achievements
router.get(
  '/pending',
  authorize(ROLES.MENTOR, ROLES.HOD),
  AchievementController.getPendingAchievements
);

// Download ZIP bundle of certificate files
router.get(
  '/bundle/:studentId',
  requireStudentRelationship,
  AchievementController.downloadZipBundle
);

router.get(
  '/export/zip',
  authorize(ROLES.STUDENT),
  AchievementController.downloadZipBundle
);

// Delete achievement (Owning student or HOD)
router.delete(
  '/:id',
  authorize(ROLES.STUDENT, ROLES.HOD),
  AchievementController.deleteAchievement
);

module.exports = router;
