import express from "express";

import {
  analyzeStudentRisk,
  analyzeAllStudents,
} from "../controllers/riskController.js";

import {
  protect,
  allowRoles,
} from "../middleware/auth.js";

const router =
  express.Router();

/*
 * Analyze all students
 *
 * Only Mentor and HOD can view
 * academic risk analysis.
 */
router.get(
  "/students",
  protect,
  allowRoles("mentor", "hod"),
  analyzeAllStudents
);


/*
 * Analyze one student
 */
router.get(
  "/students/:id",
  protect,
  allowRoles("mentor", "hod"),
  analyzeStudentRisk
);

export default router;