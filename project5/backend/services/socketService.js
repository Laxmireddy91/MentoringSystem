const { verifyAccessToken } = require('../utils/tokenUtils');
const { User } = require('../models');
const MessageService = require('./messageService');
const logger = require('../config/logger');

// Presence maps
const presenceMap = new Map(); // userId -> Set of socket ids
const lastSeenMap = new Map(); // userId -> ISO timestamp

const initSocket = (io) => {
  // Socket.IO JWT Authentication Handshake Middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) {
        return next(new Error('Authentication token missing from socket handshake'));
      }
      let decoded;
      try {
        decoded = verifyAccessToken(token);
      } catch (err) {
        return next(new Error('Invalid or expired socket authentication token'));
      }
      const user = await User.findById(decoded.id);
      if (!user || !user.isActive) {
        return next(new Error('User account inactive or not found'));
      }
      socket.user = user;
      next();
    } catch (err) {
      logger.warn(`Socket connection rejected: ${err.message}`);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    logger.info(`🔌 Socket connected: User ${user.name} (${user.email}) - SocketID: ${socket.id}`);

    // Join personal private room for direct notifications and messages
    const userRoom = `user_${user._id}`;
    socket.join(userRoom);

    // Presence handling: add socket to presence map
    const userIdStr = user._id.toString();
    if (!presenceMap.has(userIdStr)) {
      presenceMap.set(userIdStr, new Set());
    }
    presenceMap.get(userIdStr).add(socket.id);
    // If first socket for user, broadcast online status
    if (presenceMap.get(userIdStr).size === 1) {
      io.emit('presence:update', { userId: userIdStr, online: true, lastSeen: null });
    }

    // Client can request presence snapshot
    socket.on('presence:request', () => {
      const snapshot = [];
      presenceMap.forEach((sockets, uid) => {
        snapshot.push({ userId: uid, online: true, socketIds: Array.from(sockets) });
      });
      // Include offline users from lastSeenMap
      lastSeenMap.forEach((ts, uid) => {
        if (!presenceMap.has(uid)) {
          snapshot.push({ userId: uid, online: false, lastSeen: ts });
        }
      });
      socket.emit('presence:snapshot', snapshot);
    });

    // Join conversation room (after validating chat authorization)
    socket.on('conversation:join', async ({ otherUserId }) => {
      try {
        await MessageService.validateChatRelationship(user, otherUserId);
        const conversationId = MessageService.getConversationId(user._id, otherUserId);
        socket.join(`conv_${conversationId}`);
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // Real-time message dispatch handler
    socket.on('message:send', async ({ receiverId, content, attachments = [] }) => {
      try {
        const message = await MessageService.sendMessage({
          senderUser: user,
          receiverId,
          content,
          attachments,
          io,
        });
        socket.emit('message:ack', { success: true, messageId: message._id });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // Typing indicators
    socket.on('typing:start', ({ receiverId }) => {
      io.to(`user_${receiverId}`).emit('typing:status', {
        userId: user._id,
        userName: user.name,
        isTyping: true,
      });
    });

    // Typing stop indicator
    socket.on('typing:stop', ({ receiverId }) => {
      io.to(`user_${receiverId}`).emit('typing:status', {
        userId: user._id,
        userName: user.name,
        isTyping: false,
      });
    });

    // Delivery acknowledgment from receiver
    socket.on('message:delivered', async ({ messageId }) => {
      try {
        const updated = await MessageService.markDelivered(messageId, user);
        const senderId = updated.senderId.toString();
        io.to(`user_${senderId}`).emit('message:delivered', { messageId, deliveredAt: updated.deliveredAt });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // Read acknowledgment from receiver
    socket.on('message:read', async ({ messageId }) => {
      try {
        const updated = await MessageService.markRead(messageId, user);
        const senderId = updated.senderId.toString();
        io.to(`user_${senderId}`).emit('message:read', { messageId, readAt: updated.readAt });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // Clean up on socket disconnect – update presence map
    socket.on('disconnect', () => {
      logger.info(`🔌 Socket disconnected: User ${user.name}`);
      const uid = user._id.toString();
      if (presenceMap.has(uid)) {
        const sockets = presenceMap.get(uid);
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          presenceMap.delete(uid);
          const lastSeen = new Date().toISOString();
          lastSeenMap.set(uid, lastSeen);
          io.emit('presence:update', { userId: uid, online: false, lastSeen });
        }
      }
    });
  });
};

module.exports = { initSocket };
