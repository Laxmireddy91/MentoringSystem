import express from "express";

import {
  sendMessage,
  getConversation,
  markMessagesRead,
} from "../controllers/messageController.js";

import { protect } from "../middleware/auth.js";
import { validate, messageSchema } from "../validation.js";

import {
  requireMessagePermission,
} from "../middleware/messageAuth.js";

const router = express.Router();

/*
=========================================================
 SEND MESSAGE
=========================================================
*/

router.post(
  "/",
  protect,
  validate(messageSchema),
  requireMessagePermission,
  sendMessage
);


/*
=========================================================
 GET CONVERSATION
=========================================================
*/

router.get(
  "/:userId",
  protect,
  requireMessagePermission,
  getConversation
);


/*
=========================================================
 MARK MESSAGES AS READ
=========================================================
*/

router.put(
  "/:userId/read",
  protect,
  requireMessagePermission,
  markMessagesRead
);


export default router;