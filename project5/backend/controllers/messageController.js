const MessageService = require('../services/messageService');
const ApiResponse = require('../utils/apiResponse');
const upload = require('../middleware/upload');

class MessageController {
  static async sendMessage(req, res, next) {
    try {
      const io = req.app.get('io');
      const { receiverId, content, attachments } = req.body;
      const message = await MessageService.sendMessage({
        senderUser: req.user,
        receiverId,
        content,
        attachments,
        io,
      });
      return ApiResponse.created(res, message, 'Message sent successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getConversation(req, res, next) {
    try {
      const otherUserId = req.params.otherUserId || req.params.id;
      const result = await MessageService.getConversationMessages(req.user, otherUserId, req.query);
      return ApiResponse.success(res, result.messages, 'Conversation messages', 200, result.pagination);
    } catch (err) {
      next(err);
    }
  }

  static async getConversationsList(req, res, next) {
    try {
      const conversations = await MessageService.getConversationsList(req.user);
      return ApiResponse.success(res, conversations, 'Conversations list');
    } catch (err) {
      next(err);
    }
  }

  // Mark a message as delivered by the receiver
  static async markDelivered(req, res, next) {
    try {
      const { id } = req.params; // messageId
      const updated = await MessageService.markDelivered(id, req.user);
      return ApiResponse.success(res, updated, 'Message marked as delivered');
    } catch (err) {
      next(err);
    }
  }

  // Mark a message as read by the receiver
  static async markRead(req, res, next) {
    try {
      const { id } = req.params; // messageId
      const updated = await MessageService.markRead(id, req.user);
      return ApiResponse.success(res, updated, 'Message marked as read');
    } catch (err) {
      next(err);
    }
  }

  // Upload attachment for a message
  static async uploadAttachment(req, res, next) {
    try {
      // Multer middleware stores file info in req.file
      if (!req.file) {
        return ApiResponse.badRequest(res, 'No file uploaded');
      }
      const file = req.file;
      const attachment = {
        url: `/uploads/messages/${file.filename}`,
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        type: file.mimetype.startsWith('audio') ? 'audio' : (file.mimetype.startsWith('image') ? 'image' : 'file'),
      };
      return ApiResponse.created(res, attachment, 'File uploaded');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = MessageController;
