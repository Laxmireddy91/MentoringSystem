import User from "../models/User.js";
import Student from "../models/Student.js";
import Mentor from "../models/Mentor.js";

export async function updateProfile(req, res, next) {
  try {
    if (req.params.role !== req.user.role) {
      return res.status(403).json({
        message: "You can only update your own profile",
      });
    }

    const allowed = [
      "name",
      "email",
      "phone",
      "department",
      "designation",
      "semester",
      "usn",
    ];

    const patch = {};

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        patch[key] = req.body[key];
      }
    }

    if (patch.email) {
      patch.email = patch.email.trim().toLowerCase();

      const duplicate = await User.findOne({
        email: patch.email,
        _id: {
          $ne: req.user._id,
        },
      });

      if (duplicate) {
        return res.status(409).json({
          message: "Email is already in use",
        });
      }
    }

    if (patch.usn) {
      patch.usn = patch.usn.trim().toUpperCase();
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      patch,
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (req.user.role === "student") {
      await Student.findOneAndUpdate(
        {
          user: req.user._id,
        },
        {
          $set: {
            name: updatedUser.name,
            usn: updatedUser.usn,
            phone: updatedUser.phone,
            dept: updatedUser.department,
          },
        }
      );
    }

    if (req.user.role === "mentor") {
      await Mentor.findOneAndUpdate(
        {
          user: req.user._id,
        },
        {
          $set: {
            name: updatedUser.name,
            email: updatedUser.email,
          },
        }
      );
    }

    return res.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
}