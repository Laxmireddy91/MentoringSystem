import React from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({
  children,
  allowedRole,
}) {
  const location = useLocation();

  const token = localStorage.getItem(
    "mentorconnect_token"
  );

  const storedUser = localStorage.getItem(
    "mentorconnect_user"
  );

  /*
   * User is not logged in
   */
  if (!token || !storedUser) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  /*
   * Read stored user safely
   */
  let user;

  try {
    user = JSON.parse(storedUser);
  } catch (error) {
    console.error(
      "Invalid stored user:",
      error
    );

    localStorage.removeItem(
      "mentorconnect_token"
    );

    localStorage.removeItem(
      "mentorconnect_user"
    );

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  /*
   * Make sure we actually have a role
   */
  if (!user || !user.role) {
    localStorage.removeItem(
      "mentorconnect_token"
    );

    localStorage.removeItem(
      "mentorconnect_user"
    );

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  /*
   * Normalize role names.
   *
   * This also protects us if the backend
   * returns "Student", "STUDENT", etc.
   */
  const userRole =
    String(user.role)
      .toLowerCase()
      .trim();

  const requiredRole = allowedRole
    ? String(allowedRole)
        .toLowerCase()
        .trim()
    : null;

  /*
   * User has logged in but is trying
   * to access another role's dashboard.
   */
  if (
    requiredRole &&
    userRole !== requiredRole
  ) {
    return (
      <Navigate
        to={`/${userRole}`}
        replace
      />
    );
  }

  /*
   * Everything is valid.
   */
  return children;
}