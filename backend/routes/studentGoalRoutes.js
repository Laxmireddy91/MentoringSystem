import express from "express";

import {
  getMyGoal,
  createOrUpdateGoal,
  deleteMyGoal,
} from "../controllers/studentGoalController.js";

import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get(
  "/my",
  protect,
  getMyGoal
);

router.post(
  "/",
  protect,
  createOrUpdateGoal
);

router.delete(
  "/my",
  protect,
  deleteMyGoal
);

export default router;