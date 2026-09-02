import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    /* -------------------------------------------------------
       SENDER
    ------------------------------------------------------- */

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    /* -------------------------------------------------------
       RECEIVER
    ------------------------------------------------------- */

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    /* -------------------------------------------------------
       MESSAGE
    ------------------------------------------------------- */

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    /* -------------------------------------------------------
       MESSAGE STATUS
    ------------------------------------------------------- */

    status: {
      type: String,
      enum: [
        "sent",
        "delivered",
        "read",
      ],
      default: "sent",
    },

    /* -------------------------------------------------------
       READ TIME
    ------------------------------------------------------- */

    readAt: {
      type: Date,
      default: null,
    },
  },

  {
    timestamps: true,
  }
);

export default mongoose.model(
  "Message",
  messageSchema
);