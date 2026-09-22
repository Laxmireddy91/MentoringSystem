const mongoose = require('mongoose');

const messageAttachmentSchema = new mongoose.Schema({
  url: { type: String, required: true },
  filename: { type: String, required: true },
  originalName: { type: String },
  mimeType: { type: String },
  fileSize: { type: Number },
  type: { type: String, enum: ['image', 'file', 'audio'] },
});

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender ID is required'],
      index: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Receiver ID is required'],
      index: true,
    },
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
    messageType: { type: String, enum: ['text', 'image', 'file', 'audio', 'mixed'], default: 'text' },
    attachments: [messageAttachmentSchema],
    audioDuration: { type: Number },
    isDelivered: { type: Boolean, default: false },
    deliveredAt: { type: Date },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    // content may be empty for non-text messages
    content: { type: String, trim: true, maxlength: [2000, 'Message cannot exceed 2000 characters'] },
  },
  {
    timestamps: true,
  }
);

// Compound index for conversation message history and unread queries
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
