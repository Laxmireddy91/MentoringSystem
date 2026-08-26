import React from "react";
import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";

/*
 * Roles supported by the backend
 */
const roles = [
  "student",
  "mentor",
  "hod",
  "principal",
];

/*
 * Dashboard sections used by the application.
 *
 * If your Dashboard.jsx supports a section,
 * these routes will automatically render it.
 */
const sections = [
  "academic-records",
  "profile",
  "schedule",
  "notifications",
  "reports",
  "people",
  "tasks",
  "students",
  "performance",
  "attendance",
  "sessions",
  "mentors",
  "student-performance",
  "departments",
  "faculty",
];

/*
 * Protected dashboard component
 */
function ProtectedDashboard({
  role,
  section = "overview",
}) {
  return (
    <ProtectedRoute
      allowedRole={role}
    >
      <Dashboard
        role={role}
        section={section}
      />
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>

      {/* =========================
          PUBLIC ROUTES
      ========================== */}

      <Route
        path="/"
        element={<LandingPage />}
      />

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />


      {/* =========================
          ROLE DASHBOARDS
      ========================== */}

      {roles.map((role) => (
        <React.Fragment key={role}>

          {/* Main dashboard */}

          <Route
            path={`/${role}`}
            element={
              <ProtectedDashboard
                role={role}
                section="overview"
              />
            }
          />

          {/* Dashboard sections */}

          {sections.map((section) => (
            <Route
              key={`${role}-${section}`}
              path={`/${role}/${section}`}
              element={
                <ProtectedDashboard
                  role={role}
                  section={section}
                />
              }
            />
          ))}

        </React.Fragment>
      ))}


      {/* =========================
          FALLBACK
      ========================== */}

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />

    </Routes>
  );
}