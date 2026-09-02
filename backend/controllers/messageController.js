import Message from "../models/Message.js";
import { canMessage } from "../middleware/messageAuth.js";

/* =========================================================
   SEND MESSAGE
========================================================= */

export async function sendMessage(req, res, next) {
  try {
    const { receiver, message } = req.body;

    /* -------------------------------------------------------
       VALIDATION
    ------------------------------------------------------- */

    if (!receiver || !message?.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Receiver and message are required",
      });
    }

    /* -------------------------------------------------------
       SECURITY CHECK
    ------------------------------------------------------- */

    const permission =
      await canMessage(
        req.user,
        receiver
      );

    if (!permission.allowed) {
      return res.status(403).json({
        success: false,
        message:
          permission.reason ||
          "You are not allowed to message this user",
      });
    }

    /* -------------------------------------------------------
       CREATE MESSAGE
    ------------------------------------------------------- */

    const newMessage =
      await Message.create({
        sender: req.user._id,
        receiver,
        message: message.trim(),
        status: "sent",
      });

    /* -------------------------------------------------------
       POPULATE USERS
    ------------------------------------------------------- */

    const populatedMessage =
      await Message.findById(
        newMessage._id
      )
        .populate(
          "sender",
          "name email role"
        )
        .populate(
          "receiver",
          "name email role"
        );

    return res.status(201).json({
      success: true,
      message: populatedMessage,
    });
  } catch (error) {
    console.error(
      "❌ Send message error:",
      error
    );

    next(error);
  }
}


/* =========================================================
   GET CONVERSATION
========================================================= */

export async function getConversation(
  req,
  res,
  next
) {
  try {
    const otherUser =
      req.params.userId;

    const currentUser =
      req.user._id;

    /* -------------------------------------------------------
       VALIDATION
    ------------------------------------------------------- */

    if (!otherUser) {
      return res.status(400).json({
        success: false,
        message:
          "User ID is required",
      });
    }

    /* -------------------------------------------------------
       SECURITY CHECK
    ------------------------------------------------------- */

    const permission =
      await canMessage(
        req.user,
        otherUser
      );

    if (!permission.allowed) {
      return res.status(403).json({
        success: false,
        message:
          permission.reason ||
          "You are not allowed to view this conversation",
      });
    }

    /* -------------------------------------------------------
       FIND CONVERSATION
    ------------------------------------------------------- */

    const messages =
      await Message.find({
        $or: [
          {
            sender: currentUser,
            receiver: otherUser,
          },
          {
            sender: otherUser,
            receiver: currentUser,
          },
        ],
      })
        .sort({
          createdAt: 1,
        })
        .populate(
          "sender",
          "name email role"
        )
        .populate(
          "receiver",
          "name email role"
        );

    return res.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error(
      "❌ Get conversation error:",
      error
    );

    next(error);
  }
}


/* =========================================================
   MARK MESSAGES AS READ
========================================================= */

export async function markMessagesRead(
  req,
  res,
  next
) {
  try {
    const sender =
      req.params.userId;

    const receiver =
      req.user._id;

    /* -------------------------------------------------------
       SECURITY CHECK
    ------------------------------------------------------- */

    const permission =
      await canMessage(
        req.user,
        sender
      );

    if (!permission.allowed) {
      return res.status(403).json({
        success: false,
        message:
          permission.reason ||
          "You are not allowed to access these messages",
      });
    }

    /* -------------------------------------------------------
       MARK AS READ
    ------------------------------------------------------- */

    const result =
      await Message.updateMany(
        {
          sender,
          receiver,
          status: {
            $ne: "read",
          },
        },
        {
          $set: {
            status: "read",
            readAt: new Date(),
          },
        }
      );

    return res.json({
      success: true,
      message:
        "Messages marked as read",
      updated:
        result.modifiedCount || 0,
    });
  } catch (error) {
    console.error(
      "❌ Mark messages read error:",
      error
    );

    next(error);
  }
}