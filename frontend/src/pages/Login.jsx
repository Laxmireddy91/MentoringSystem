import React, { useState } from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";
import api from "../api";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [role, setRole] =
    useState("student");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] = useState("");
  const [twoFAChallenge, setTwoFAChallenge] = useState("");
  const [twoFACode, setTwoFACode] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const [loginMethod, setLoginMethod] = useState("direct");


  /* =========================================================
     LOGIN
  ========================================================= */

  const submit = async (e) => {
    e.preventDefault();

    setError("");

    if (!email.trim()) {
      setError(
        "Please enter your email."
      );
      return;
    }

    if (!password) {
      setError(
        "Please enter your password."
      );
      return;
    }

    setLoading(true);

    try {
      const response =
        await api.auth.login({
          email: email.trim(),
          password,
          role,
          loginMethod,
        });


      /* =====================================================
         CHECK RESPONSE
      ===================================================== */

      if (
        !response ||
        !response.success
      ) {
        throw new Error(
          response?.message ||
            "Login failed."
        );
      }

      if (response.requires2FA) {
        setTwoFAChallenge(response.challenge);
        setOtpMessage(response.developmentCode ? `OTP sent to your email. Development OTP: ${response.developmentCode}` : "OTP sent to your registered email. It expires in 5 minutes.");
        setError("");
        setLoading(false);
        return;
      }

      if (!response.token) {
        throw new Error("Login succeeded but no authentication token was received.");
      }

      if (!response.user) {
        throw new Error(
          "Login succeeded but user information was not received."
        );
      }


      /* =====================================================
         SAVE AUTHENTICATION
      ===================================================== */

      localStorage.setItem("mentorconnect_token", response.token);
      if (response.refreshToken) localStorage.setItem("mentorconnect_refresh_token", response.refreshToken);

      localStorage.setItem(
        "mentorconnect_user",
        JSON.stringify(
          response.user
        )
      );


      /* =====================================================
         GET BACKEND ROLE
      ===================================================== */

      const backendRole =
        String(
          response.user.role ||
            role
        )
          .toLowerCase()
          .trim();


      /* =====================================================
         ALLOWED ROLES
      ===================================================== */

      const allowedRoles = [
        "student",
        "mentor",
        "hod",
      ];

      if (
        !allowedRoles.includes(
          backendRole
        )
      ) {
        localStorage.removeItem(
          "mentorconnect_token"
        );

        localStorage.removeItem(
          "mentorconnect_user"
        );

        throw new Error(
          "This account role is not supported."
        );
      }


      /* =====================================================
         REDIRECT
      ===================================================== */

      const requestedPath =
        location.state?.from;

      if (
        requestedPath &&
        requestedPath.startsWith(
          `/${backendRole}`
        )
      ) {
        navigate(
          requestedPath,
          {
            replace: true,
          }
        );
      } else {
        navigate(
          `/${backendRole}`,
          {
            replace: true,
          }
        );
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


  const submitTwoFA = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(twoFACode)) { setError("Enter the 6-digit OTP."); return; }
    try {
      const response = await api.auth.verifyLogin2FA(twoFAChallenge, twoFACode);
      localStorage.setItem("mentorconnect_token", response.token);
      if (response.refreshToken) localStorage.setItem("mentorconnect_refresh_token", response.refreshToken);
      localStorage.setItem("mentorconnect_user", JSON.stringify(response.user));
      navigate(`/${response.user.role}`, { replace: true });
    } catch (err) { setError(err.message || "Invalid OTP"); }
  };

  /* =========================================================
     NAVIGATION
  ========================================================= */

  const goToRegister = () => {
    navigate("/register");
  };


  const goHome = () => {
    navigate("/");
  };


  const forgotPassword = () => navigate("/forgot-password");


  /* =========================================================
     UI
  ========================================================= */

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


        {!twoFAChallenge && (
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            <button
              type="button"
              onClick={() => setLoginMethod("direct")}
              disabled={loading}
              style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: loginMethod === "direct" ? "2px solid #4f46e5" : "1px solid #d1d5db", background: loginMethod === "direct" ? "#eef2ff" : "#fff", cursor: "pointer" }}
            >
              Direct Login
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod("otp")}
              disabled={loading}
              style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: loginMethod === "otp" ? "2px solid #4f46e5" : "1px solid #d1d5db", background: loginMethod === "otp" ? "#eef2ff" : "#fff", cursor: "pointer" }}
            >
              OTP Login
            </button>
          </div>
        )}

        {twoFAChallenge && (
          <div style={{ marginBottom: 20, padding: 16, borderRadius: 12, background: "#f5f7ff", border: "1px solid #dfe4ff" }}>
            <h3 style={{ margin: "0 0 6px" }}>Two-Factor Authentication</h3>
            <p style={{ margin: "0 0 12px", fontSize: 14 }}>Enter the 6-digit OTP sent to your registered email.</p>
            {otpMessage && <div style={{ marginBottom: 12, fontSize: 13 }}>{otpMessage}</div>}
            <form onSubmit={submitTwoFA}>
              <input value={twoFACode} onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Enter 6-digit OTP" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required />
              <button type="submit" disabled={loading}>{loading ? "Verifying..." : "Verify OTP & Continue"}</button>
            </form>
          </div>
        )}

        {/* Error */}

        {error && (
          <div
            style={{
              background:
                "#ffe7e7",

              color:
                "#c62828",

              padding:
                "12px 14px",

              borderRadius:
                "8px",

              marginBottom:
                "16px",

              fontSize:
                "14px",

              lineHeight:
                "1.4",
            }}
          >
            {error}
          </div>
        )}


        {/* Login form — hidden after OTP challenge is issued */}

        {!twoFAChallenge && <form
          onSubmit={submit}
        >

          {/* Email */}

          <label
            htmlFor="login-email"
          >
            Email
          </label>

          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(
                e.target.value
              )
            }
            placeholder="Enter your email"
            autoComplete="email"
            disabled={loading}
            required
          />


          {/* Password */}

          <label
            htmlFor="login-password"
          >
            Password
          </label>

          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
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
              alignItems:
                "center",
              gap: "10px",
            }}
          >

            <label
              htmlFor="login-role"
            >
              Role
            </label>

            <button
              type="button"
              className="forgot"
              onClick={
                forgotPassword
              }
              disabled={loading}
              style={{
                background:
                  "none",

                border:
                  "none",

                cursor:
                  "pointer",

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
              setRole(
                e.target.value
              )
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

        </form>}


        {/* Register */}

        <p className="switch">

          Don't have an account?{" "}

          <button
            type="button"
            onClick={
              goToRegister
            }
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