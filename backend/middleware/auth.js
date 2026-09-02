import jwt from "jsonwebtoken";
import User from "../models/User.js";

/* =========================================================
   AUTHENTICATION / PROTECT
========================================================= */

export async function protect(req, res, next) {
  try {
    const authorization =
      req.headers.authorization;

    /* -----------------------------------------------------
       CHECK AUTHORIZATION HEADER
    ----------------------------------------------------- */

    if (!authorization) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });
    }

    if (
      !authorization.startsWith(
        "Bearer "
      )
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid authorization format",
      });
    }

    const token =
      authorization.substring(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication token missing",
      });
    }

    /* -----------------------------------------------------
       VERIFY TOKEN
    ----------------------------------------------------- */

    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );

    if (!decoded?.id) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid authentication token",
      });
    }

    /* -----------------------------------------------------
       FIND USER
    ----------------------------------------------------- */

    const user =
      await User.findById(
        decoded.id
      ).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "User account not found",
      });
    }

    /* -----------------------------------------------------
       ACTIVE CHECK
    ----------------------------------------------------- */

    if (user.active === false) {
      return res.status(403).json({
        success: false,
        message:
          "Your account is inactive",
      });
    }

    /* -----------------------------------------------------
       ATTACH USER TO REQUEST
    ----------------------------------------------------- */

    req.user = {
      id: user._id.toString(),

      _id: user._id,

      name: user.name,

      email: user.email,

      role: user.role,

      department:
        user.department || "",

      phone:
        user.phone || "",

      usn:
        user.usn || "",

      designation:
        user.designation || "",

      semester:
        user.semester || "",

      active: user.active,
    };

    next();
  } catch (error) {
    console.error(
      "❌ AUTH ERROR:",
      error.message
    );

    /* -----------------------------------------------------
       TOKEN EXPIRED
    ----------------------------------------------------- */

    if (
      error.name ===
      "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication token expired",
      });
    }

    /* -----------------------------------------------------
       INVALID TOKEN
    ----------------------------------------------------- */

    if (
      error.name ===
      "JsonWebTokenError"
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid authentication token",
      });
    }

    /* -----------------------------------------------------
       GENERAL ERROR
    ----------------------------------------------------- */

    return res.status(500).json({
      success: false,
      message:
        "Authentication failed",
    });
  }
}

/* =========================================================
   AUTH ALIAS
   Some routes may use `auth`
========================================================= */

export const auth = protect;

/* =========================================================
   ROLE AUTHORIZATION
========================================================= */

export function allowRoles(
  ...allowedRoles
) {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required",
        });
      }

      const currentRole =
        String(
          req.user.role || ""
        )
          .trim()
          .toLowerCase();

      const normalizedAllowedRoles =
        allowedRoles.map(
          (role) =>
            String(role)
              .trim()
              .toLowerCase()
        );

      if (
        !normalizedAllowedRoles.includes(
          currentRole
        )
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You do not have permission to access this resource",
        });
      }

      next();
    } catch (error) {
      console.error(
        "❌ ROLE AUTH ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Role authorization failed",
      });
    }
  };
}