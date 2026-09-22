const express = require('express');
const router = express.Router();

const MessageController = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');
const validate = require('../middleware/validator');
const { sendMessageSchema } = require('../validators/messageValidators');

router.use(authenticate);

// Get conversations summary list
router.get('/conversations', MessageController.getConversationsList);

// Send message
router.post('/', validate(sendMessageSchema), MessageController.sendMessage);

// Get message history with specific user / thread
router.get('/user/:otherUserId', MessageController.getConversation);
router.get('/thread/:id', MessageController.getConversation);
router.post('/:id/delivered', MessageController.markDelivered);
router.post('/:id/read', MessageController.markRead);
router.post('/upload', upload.single('file'), MessageController.uploadAttachment);
module.exports = router;
