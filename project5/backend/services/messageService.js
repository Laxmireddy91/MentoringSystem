const { Message, User, Student, Mentor, Notification } = require('../models');
const AppError = require('../utils/AppError');
const { NOTIFICATION_CATEGORIES } = require('../config/constants');

class MessageService {
  /**
   * Deterministic conversation ID for two user IDs
   */
  static getConversationId(idA, idB) {
    const sorted = [idA.toString(), idB.toString()].sort();
    return `${sorted[0]}_${sorted[1]}`;
  }

  /**
   * Verify if two users are authorized to exchange messages
   */
  static async validateChatRelationship(senderUser, receiverUserId) {
    if (senderUser._id.toString() === receiverUserId.toString()) {
      throw new AppError('Cannot send message to yourself', 400);
    }

    const receiverUser = await User.findById(receiverUserId);
    if (!receiverUser) {
      throw new AppError('Recipient user not found', 404);
    }

    // HOD has omni-directional messaging authority with anyone in the system
    if (senderUser.role === 'hod' || receiverUser.role === 'hod') {
      return { senderUser, receiverUser };
    }

    // If sender is Student, receiver must be their assigned Mentor
    if (senderUser.role === 'student') {
      const studentDoc = await Student.findOne({ userId: senderUser._id });
      if (!studentDoc || !studentDoc.mentorId) {
        throw new AppError('You do not have an assigned mentor to message', 403);
      }
      const mentorDoc = await Mentor.findById(studentDoc.mentorId);
      if (!mentorDoc || mentorDoc.userId.toString() !== receiverUser._id.toString()) {
        throw new AppError('Access denied: You can only communicate with your assigned mentor', 403);
      }
      return { senderUser, receiverUser };
    }

    // If sender is Mentor, receiver must be one of their assigned Mentees
    if (senderUser.role === 'mentor') {
      const mentorDoc = await Mentor.findOne({ userId: senderUser._id });
      if (!mentorDoc) throw new AppError('Mentor profile not found', 404);

      const studentDoc = await Student.findOne({ userId: receiverUser._id, mentorId: mentorDoc._id });
      if (!studentDoc) {
        throw new AppError('Access denied: You can only communicate with your assigned mentees', 403);
      }
      return { senderUser, receiverUser };
    }

    throw new AppError('Unauthorized messaging relationship', 403);
  }

  /**
   * Send a direct message
   */
  static async sendMessage({ senderUser, receiverId, content, attachments = [], io = null }) {
    const { receiverUser } = await this.validateChatRelationship(senderUser, receiverId);
    const conversationId = this.getConversationId(senderUser._id, receiverId);

    const message = await Message.create({
      senderId: senderUser._id,
      receiverId: receiverUser._id,
      conversationId,
      content,
      attachments,
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'name email avatar role')
      .populate('receiverId', 'name email avatar role');

    // Notify recipient via socket
    await Notification.create({
      recipientId: receiverUser._id,
      senderId: senderUser._id,
      title: `New Message from ${senderUser.name}`,
      message: content.length > 60 ? `${content.substring(0, 60)}...` : content,
      category: NOTIFICATION_CATEGORIES.MESSAGE,
      link: `/messages/${conversationId}`,
    });

    if (io) {
      // Emit new message to receiver only; sender receives ack via separate event
      io.to(`user_${receiverUser._id}`).emit('message:new', populatedMessage);
    }

    return populatedMessage;
  }

  /**
   * Get messages in a conversation
   */
  static async getConversationMessages(user, otherUserId, { page = 1, limit = 50 }) {
    await this.validateChatRelationship(user, otherUserId);
    const conversationId = this.getConversationId(user._id, otherUserId);

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const messages = await Message.find({ conversationId })
      .populate('senderId', 'name email avatar role')
      .populate('receiverId', 'name email avatar role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Message.countDocuments({ conversationId });

    return {
      messages: messages.reverse(),
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    };
  }

  /**
   * Get list of active conversations for current user
   */
  static async getConversationsList(user) {
    const userMessages = await Message.find({
      $or: [{ senderId: user._id }, { receiverId: user._id }],
    })
      .sort({ createdAt: -1 })
      .populate('senderId', 'name email avatar role')
      .populate('receiverId', 'name email avatar role');

    const conversationsMap = new Map();

    for (const msg of userMessages) {
      if (!conversationsMap.has(msg.conversationId)) {
        const otherUser = msg.senderId._id.toString() === user._id.toString() ? msg.receiverId : msg.senderId;
        const unreadCount = await Message.countDocuments({
          conversationId: msg.conversationId,
          receiverId: user._id,
          isRead: false,
        });
        conversationsMap.set(msg.conversationId, {
          conversationId: msg.conversationId,
          participant: otherUser,
          lastMessage: msg,
          unreadCount,
        });
      }
    }

    return Array.from(conversationsMap.values());
  }

  // Mark a message as delivered by the receiver
  static async markDelivered(messageId, user) {
    const message = await Message.findById(messageId);
    if (!message) throw new AppError('Message not found', 404);
    if (message.receiverId.toString() !== user._id.toString()) {
      throw new AppError('Only the receiver can mark delivery', 403);
    }
    message.isDelivered = true;
    message.deliveredAt = new Date();
    await message.save();
    return message;
  }

  // Mark a message as read by the receiver
  static async markRead(messageId, user) {
    const message = await Message.findById(messageId);
    if (!message) throw new AppError('Message not found', 404);
    if (message.receiverId.toString() !== user._id.toString()) {
      throw new AppError('Only the receiver can mark as read', 403);
    }
    message.isRead = true;
    message.readAt = new Date();
    await message.save();
    return message;
  }
}

module.exports = MessageService;
