const express = require('express');
const router = express.Router();

const profileController = require('../controllers/profileController');
const { authenticate } = require('../middleware/auth');

// Get own profile
router.get('/me', authenticate, profileController.getMyProfile);

// Update own profile – body validated by validator middleware (to be added in route)
const validate = require('../middleware/validator');
const { profileSchema } = require('../validators/profileValidator');
const { documentUpload } = require('../middleware/upload');

router.patch('/me', authenticate, validate(profileSchema, 'body'), profileController.updateMyProfile);

// Upload avatar
router.post('/avatar', authenticate, documentUpload.single('file'), profileController.uploadAvatar);

module.exports = router;
