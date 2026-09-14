import express from "express";

import {
  createFeedback,
  getSessionFeedback,
  getMentorFeedback,
} from "../controllers/feedbackController.js";

import { protect } from "../middleware/auth.js";

const router = express.Router();


/*
|--------------------------------------------------------------------------
| Student submits feedback
|--------------------------------------------------------------------------
*/
router.post(
  "/",
  protect,
  createFeedback
);


/*
|--------------------------------------------------------------------------
| Get feedback for a session
|--------------------------------------------------------------------------
*/
router.get(
  "/session/:sessionId",
  protect,
  getSessionFeedback
);


/*
|--------------------------------------------------------------------------
| Get feedback for a mentor
|--------------------------------------------------------------------------
*/
router.get(
  "/mentor/:mentorId",
  protect,
  getMentorFeedback
);


export default router;