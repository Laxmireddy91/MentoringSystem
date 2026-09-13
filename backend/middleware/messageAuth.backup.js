import Student from "../models/Student.js";
import Mentor from "../models/Mentor.js";
import User from "../models/User.js";

/*
=========================================================
 CHECK WHETHER TWO USERS ARE ALLOWED TO MESSAGE
=========================================================

Allowed:

Student  <------>  Assigned Mentor

The existing project stores the mentor assignment
inside Student.mentor using the mentor's NAME.

Student:
    mentor: "Mentor Name"

Mentor:
    name: "Mentor Name"
    user: ObjectId -> User

We therefore verify both:
1. The student is actually assigned to that mentor.
2. The mentor User account matches the requested user.
*/

/**
 * Check whether currentUser can communicate with receiverId.
 *
 * @param {Object} currentUser - req.user
 * @param {String} receiverId - User._id of other user
 * @returns {Promise<Object>}
 */
export async function canMessage(
  currentUser,
  receiverId
) {
  try {
    console.log("========== MESSAGE AUTH DEBUG ==========");
console.log("Current User ID:", currentUser?._id);
console.log("Current User Role:", currentUser?.role);
console.log("Receiver ID:", receiverId);
    if (!currentUser?._id || !receiverId) {
      return {
        allowed: false,
        reason: "Invalid user information",
      };
    }

    /*
    -------------------------------------------------------
    LOAD RECEIVER
    -------------------------------------------------------
    */

    const receiver = await User.findById(
      receiverId
    ).select(
      "_id name email role active"
    );
    console.log("Receiver:", receiver);

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

    /*
    -------------------------------------------------------
    SAME USER CHECK
    -------------------------------------------------------
    */

    if (
      String(currentUser._id) ===
      String(receiver._id)
    ) {
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
      /*
       * Find the Student profile belonging
       * to the authenticated User.
       */
      const student =
        await Student.findOne({
          user: currentUser._id,
        }).lean();

        console.log("Student profile:", student);
console.log("Assigned mentor:", student?.mentor);
console.log("Receiver mentor name:", receiver?.name);

      if (!student) {
        return {
          allowed: false,
          reason:
            "Student profile not found",
        };
      }

      /*
       * The existing system stores the assigned
       * mentor by name.
       */
      const assignedMentorName =
        String(
          student.mentor || ""
        )
          .trim()
          .toLowerCase();

      const receiverMentorName =
        String(
          receiver.name || ""
        )
          .trim()
          .toLowerCase();

      if (
        !assignedMentorName ||
        !receiverMentorName ||
        assignedMentorName !==
          receiverMentorName
      ) {
        return {
          allowed: false,
          reason:
            "You can only message your assigned mentor",
        };
      }

      /*
       * Extra verification:
       * make sure this mentor User is actually
       * connected to a Mentor profile.
       */
      const mentor =
        await Mentor.findOne({
          user: receiver._id,
        }).lean();

      if (!mentor) {
        return {
          allowed: false,
          reason:
            "Mentor profile not found",
        };
      }

      /*
       * Verify Mentor profile name as well.
       */
      if (
        String(mentor.name || "")
          .trim()
          .toLowerCase() !==
        assignedMentorName
      ) {
        return {
          allowed: false,
          reason:
            "Mentor assignment verification failed",
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
      /*
       * Find the Mentor profile belonging
       * to the authenticated User.
       */
      const mentor =
        await Mentor.findOne({
          user: currentUser._id,
        }).lean();

      if (!mentor) {
        return {
          allowed: false,
          reason:
            "Mentor profile not found",
        };
      }

      /*
       * Find the student's profile belonging
       * to the receiver User.
       */
      const student =
        await Student.findOne({
          user: receiver._id,
        }).lean();

      if (!student) {
        return {
          allowed: false,
          reason:
            "Student profile not found",
        };
      }

      /*
       * Existing assignment:
       *
       * student.mentor === mentor.name
       */
      const assignedMentorName =
        String(
          student.mentor || ""
        )
          .trim()
          .toLowerCase();

      const currentMentorName =
        String(
          mentor.name || ""
        )
          .trim()
          .toLowerCase();

      if (
        !assignedMentorName ||
        !currentMentorName ||
        assignedMentorName !==
          currentMentorName
      ) {
        return {
          allowed: false,
          reason:
            "You can only message your assigned students",
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
    OTHER ROLES
    =======================================================
    */

    return {
      allowed: false,
      reason:
        "Messaging is currently available only between assigned students and mentors",
    };
  } catch (error) {
    console.error(
      "❌ Message authorization error:",
      error
    );

    return {
      allowed: false,
      reason:
        "Unable to verify messaging permission",
    };
  }
}


/*
=========================================================
 EXPRESS MIDDLEWARE
=========================================================
*/

export async function requireMessagePermission(
  req,
  res,
  next
) {
  try {
    const receiverId =
      req.body?.receiver ||
      req.params?.userId;

    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message:
          "Receiver user ID is required",
      });
    }

    const result =
      await canMessage(
        req.user,
        receiverId
      );

    if (!result.allowed) {
      return res.status(403).json({
        success: false,
        message:
          result.reason ||
          "You are not allowed to message this user",
      });
    }

    /*
     * Make the authorization result
     * available to controllers.
     */
    req.messagePermission =
      result;

    next();
  } catch (error) {
    console.error(
      "❌ Message permission middleware error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to verify messaging permission",
    });
  }
}