import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [role, setRole] = useState("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();

    setError("");

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.auth.login({
        email: email.trim(),
        password,
        role,
      });

      /*
       * Backend should return:
       *
       * {
       *   success: true,
       *   token: "...",
       *   user: {...}
       * }
       */

      if (!response || !response.success) {
        throw new Error(
          response?.message ||
            "Login failed."
        );
      }

      if (!response.token) {
        throw new Error(
          "Login succeeded but no authentication token was received."
        );
      }

      if (!response.user) {
        throw new Error(
          "Login succeeded but user information was not received."
        );
      }

      /*
       * Save authentication information.
       */
      localStorage.setItem(
        "mentorconnect_token",
        response.token
      );

      localStorage.setItem(
        "mentorconnect_user",
        JSON.stringify(response.user)
      );

      /*
       * Get the actual role returned by
       * the backend.
       *
       * This is safer than trusting the
       * role selected on the login form.
       */
      const backendRole = String(
        response.user.role || role
      )
        .toLowerCase()
        .trim();

      /*
       * If the user came from a protected page,
       * we can optionally send them back there.
       *
       * Otherwise go to their dashboard.
       */
      const requestedPath =
        location.state?.from;

      if (
        requestedPath &&
        requestedPath.startsWith(
          `/${backendRole}`
        )
      ) {
        navigate(requestedPath, {
          replace: true,
        });
      } else {
        navigate(`/${backendRole}`, {
          replace: true,
        });
      }
    } catch (err) {
      console.error(
        "Login error:",
        err
      );

      setError(
        err?.message ||
          "Unable to login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const goToRegister = () => {
    navigate("/register");
  };

  const goHome = () => {
    navigate("/");
  };

  const forgotPassword = () => {
    setError(
      "Please contact your administrator to reset your password."
    );
  };

  return (
    <div className="auth-page">

      {/* Decorative elements */}

      <div className="auth-decoration left">
        ◯
      </div>

      <div className="auth-decoration right">
        ◯
      </div>


      {/* Login card */}

      <div className="auth-card">

        {/* Icon */}

        <div className="auth-icon">
          🎓
        </div>


        {/* Heading */}

        <h1>
          Welcome Back!
        </h1>

        <p>
          Login to continue to your account
        </p>


        {/* Error */}

        {error && (
          <div
            style={{
              background: "#ffe7e7",
              color: "#c62828",
              padding: "12px 14px",
              borderRadius: "8px",
              marginBottom: "16px",
              fontSize: "14px",
              lineHeight: "1.4",
            }}
          >
            {error}
          </div>
        )}


        {/* Form */}

        <form onSubmit={submit}>

          {/* Email */}

          <label htmlFor="login-email">
            Email
          </label>

          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            placeholder="Enter your email"
            autoComplete="email"
            disabled={loading}
            required
          />


          {/* Password */}

          <label htmlFor="login-password">
            Password
          </label>

          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            placeholder="Enter your password"
            autoComplete="current-password"
            disabled={loading}
            required
          />


          {/* Role row */}

          <div
            className="form-row"
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: "10px",
            }}
          >

            <label htmlFor="login-role">
              Role
            </label>

            <button
              type="button"
              className="forgot"
              onClick={forgotPassword}
              disabled={loading}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              Forgot Password?
            </button>

          </div>


          {/* Role */}

          <select
            id="login-role"
            value={role}
            onChange={(e) =>
              setRole(e.target.value)
            }
            disabled={loading}
          >

            <option value="student">
              Student
            </option>

            <option value="mentor">
              Mentor
            </option>

            <option value="hod">
              HOD
            </option>

            <option value="principal">
              Principal
            </option>

          </select>


          {/* Login */}

          <button
            className="auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>

        </form>


        {/* Register */}

        <p className="switch">

          Don't have an account?{" "}

          <button
            type="button"
            onClick={goToRegister}
            disabled={loading}
          >
            Register here
          </button>

        </p>


        {/* Home */}

        <button
          type="button"
          className="back-home"
          onClick={goHome}
          disabled={loading}
        >
          ← Back to Home
        </button>

      </div>

    </div>
  );
}