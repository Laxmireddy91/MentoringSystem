import React, { useEffect } from "react";
import socket from "./socket";
import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";

/*
 * Roles supported by the backend
 */
const roles = [
  "student",
  "mentor",
  "hod",
  
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
  "messages",
  "reports",
  "people",
  "tasks",
  "students",
  "performance",
  "sessions",
  "mentors",
  "student-performance",
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
  useEffect(() => {
  const handleConnect = () => {
    console.log(
      "🟢 Socket connected:",
      socket.id
    );

    const storedUser =
      localStorage.getItem(
        "mentorconnect_user"
      );

    if (!storedUser) {
      console.log(
        "⚠️ No logged-in user found"
      );
      return;
    }

    try {
      const user =
        JSON.parse(storedUser);

      const userId =
        user._id ||
        user.id;

      if (!userId) {
        console.log(
          "⚠️ User ID not found"
        );
        return;
      }

      socket.emit(
        "join",
        userId
      );

      console.log(
        "👤 Joining private room:",
        `user_${userId}`
      );

    } catch (error) {
      console.error(
        "❌ Could not read logged-in user:",
        error
      );
    }
  };

  const handleDisconnect = () => {
    console.log(
      "🔴 Socket disconnected"
    );
  };

  socket.on(
    "connect",
    handleConnect
  );

  socket.on(
    "disconnect",
    handleDisconnect
  );

  /*
   * If Socket.IO was already connected
   * before this effect was registered.
   */
  if (socket.connected) {
    handleConnect();
  }

  return () => {
    socket.off(
      "connect",
      handleConnect
    );

    socket.off(
      "disconnect",
      handleDisconnect
    );
  };
}, []);


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

      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />


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