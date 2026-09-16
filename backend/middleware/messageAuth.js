import Student from "../models/Student.js";
import Mentor from "../models/Mentor.js";
import User from "../models/User.js";

/*
=========================================================
 CHECK WHETHER TWO USERS ARE ALLOWED TO MESSAGE
=========================================================

Allowed:

Student  <------>  Assigned Mentor

IMPORTANT:
The student ↔ mentor relationship is determined ONLY by:

Student.mentorId -> Mentor._id

We do NOT use:

Student.mentor -> Mentor.name

Names are not reliable identifiers because:
- names can change
- two people can have the same name
- spelling/case can differ
*/

/**
 * Check whether currentUser can communicate with receiverId.
 *
 * @param {Object} currentUser - req.user
 * @param {String} receiverId - User._id of other user
 * @returns {Promise<Object>}
 */
export async function canMessage(currentUser, receiverId) {
  try {
    if (!currentUser?._id || !receiverId) {
      return {
        allowed: false,
        reason: "Invalid user information",
      };
    }

    const receiver = await User.findById(receiverId).select(
      "_id name email role active"
    );

    if (!receiver) {
      return {
        allowed: false,
        reason: "Receiver not found",
      };
    }

    if (receiver.active === false) {
      return {
        allowed: false,
        reason: "Receiver account is inactive",
      };
    }

    if (String(currentUser._id) === String(receiver._id)) {
      return {
        allowed: false,
        reason: "You cannot message yourself",
      };
    }

    /*
    =======================================================
    STUDENT → MENTOR
    =======================================================
    */

    if (
      currentUser.role === "student" &&
      receiver.role === "mentor"
    ) {
      const student = await Student.findOne({
        user: currentUser._id,
      }).lean();

      if (!student) {
        return {
          allowed: false,
          reason: "Student profile not found",
        };
      }

      if (!student.mentorId) {
        return {
          allowed: false,
          reason: "No mentor is assigned to this student",
        };
      }

      const mentor = await Mentor.findOne({
        _id: student.mentorId,
        user: receiver._id,
      }).lean();

      if (!mentor) {
        return {
          allowed: false,
          reason: "You can only message your assigned mentor",
        };
      }

      return {
        allowed: true,
        student,
        mentor,
        receiver,
      };
    }

    /*
    =======================================================
    MENTOR → STUDENT
    =======================================================
    */

    if (
      currentUser.role === "mentor" &&
      receiver.role === "student"
    ) {
      const mentor = await Mentor.findOne({
        user: currentUser._id,
      }).lean();

      if (!mentor) {
        return {
          allowed: false,
          reason: "Mentor profile not found",
        };
      }

      const student = await Student.findOne({
        user: receiver._id,
      }).lean();

      if (!student) {
        return {
          allowed: false,
          reason: "Student profile not found",
        };
      }

      if (
        !student.mentorId ||
        String(student.mentorId) !== String(mentor._id)
      ) {
        return {
          allowed: false,
          reason: "You can only message your assigned students",
        };
      }

      return {
        allowed: true,
        student,
        mentor,
        receiver,
      };
    }

    return {
      allowed: false,
      reason:
        "Messaging is currently available only between assigned students and mentors",
    };
  } catch (error) {
    console.error("❌ Message authorization error:", error);

    return {
      allowed: false,
      reason: "Unable to verify messaging permission",
    };
  }
}
export async function requireMessagePermission(req, res, next) {
  try {
    const receiverId = req.params.userId || req.body.receiverId;

    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: "Receiver ID is required",
      });
    }

    const result = await canMessage(req.user, receiverId);

    if (!result.allowed) {
      return res.status(403).json({
        success: false,
        message: result.reason,
      });
    }

    req.messagePermission = result;

    next();
  } catch (error) {
    console.error("❌ Message permission middleware error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify messaging permission",
    });
  }
}