import express from "express";

import {
  register,
  login,
  me,
} from "../controllers/authController.js";

import { auth } from "../middleware/auth.js";

const router = express.Router();

/* =========================================================
   REGISTER
========================================================= */

router.post(
  "/register",
  register
);

/* =========================================================
   LOGIN
========================================================= */

router.post(
  "/login",
  login
);

/* =========================================================
   CURRENT USER
========================================================= */

router.get(
  "/me",
  auth,
  me
);

export default router;