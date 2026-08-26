import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
    department:
      "Computer Science & Engineering",
    phone: "",
    usn: "",
    semester: "",
  });

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const change = (e) => {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const submit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    /*
     * Basic validation
     */

    if (!form.name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!form.email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!form.password) {
      setError("Please enter a password.");
      return;
    }

    if (form.password.length < 6) {
      setError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    if (
      form.password !==
      form.confirmPassword
    ) {
      setError(
        "Password and confirm password do not match."
      );
      return;
    }

    if (!form.department.trim()) {
      setError(
        "Please select your department."
      );
      return;
    }

    /*
     * Students need a USN.
     */

    if (
      form.role === "student" &&
      !form.usn.trim()
    ) {
      setError(
        "USN is required for student registration."
      );
      return;
    }

    setLoading(true);

    try {
      /*
       * Send registration data to backend.
       *
       * Do NOT send confirmPassword.
       */

      const response =
        await api.auth.register({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
          department:
            form.department.trim(),
          phone: form.phone.trim(),
          usn:
            form.role === "student"
              ? form.usn.trim()
              : "",
          semester:
            form.semester.trim(),
        });

      if (
        !response ||
        !response.success
      ) {
        throw new Error(
          response?.message ||
            "Registration failed."
        );
      }

      /*
       * Backend normally returns a token
       * and user after successful registration.
       */

      if (response.token) {
        localStorage.setItem(
          "mentorconnect_token",
          response.token
        );
      }

      if (response.user) {
        localStorage.setItem(
          "mentorconnect_user",
          JSON.stringify(
            response.user
          )
        );
      }

      /*
       * Determine the role returned
       * by the backend.
       */

      const backendRole =
        response.user?.role ||
        form.role;

      /*
       * If the backend automatically
       * logs the new user in, go directly
       * to their dashboard.
       *
       * Otherwise show success and
       * send them to login.
       */

      if (response.token) {
        setSuccess(
          "Account created successfully. Redirecting..."
        );

        setTimeout(() => {
          navigate(
            `/${String(
              backendRole
            ).toLowerCase()}`,
            {
              replace: true,
            }
          );
        }, 500);
      } else {
        setSuccess(
          "Account created successfully. Please login."
        );

        setTimeout(() => {
          navigate("/login", {
            replace: true,
          });
        }, 1000);
      }
    } catch (err) {
      console.error(
        "Registration error:",
        err
      );

      setError(
        err?.message ||
          "Unable to create your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">

      <div className="register-card">

        {/* =========================
            FORM SECTION
        ========================== */}

        <div className="register-form">

          <h1>
            Create Account
          </h1>

          <p>
            Fill in the details to create
            your new account.
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


          {/* Success */}

          {success && (
            <div
              style={{
                background: "#e8f5e9",
                color: "#2e7d32",
                padding: "12px 14px",
                borderRadius: "8px",
                marginBottom: "16px",
                fontSize: "14px",
                lineHeight: "1.4",
              }}
            >
              {success}
            </div>
          )}


          <form onSubmit={submit}>

            <div className="two-col">

              {/* =====================
                  NAME
              ====================== */}

              <div>
                <label htmlFor="name">
                  Full Name
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={change}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  disabled={loading}
                  required
                />
              </div>


              {/* =====================
                  EMAIL
              ====================== */}

              <div>
                <label htmlFor="email">
                  Email
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={change}
                  placeholder="Enter your email"
                  autoComplete="email"
                  disabled={loading}
                  required
                />
              </div>


              {/* =====================
                  PASSWORD
              ====================== */}

              <div>
                <label htmlFor="password">
                  Password
                </label>

                <div
                  className="password-box"
                >

                  <input
                    id="password"
                    name="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={form.password}
                    onChange={change}
                    placeholder="Create password"
                    autoComplete="new-password"
                    disabled={loading}
                    required
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (current) =>
                          !current
                      )
                    }
                    disabled={loading}
                  >
                    {showPassword
                      ? "Hide"
                      : "Show"}
                  </button>

                </div>
              </div>


              {/* =====================
                  CONFIRM PASSWORD
              ====================== */}

              <div>
                <label htmlFor="confirmPassword">
                  Confirm Password
                </label>

                <div
                  className="password-box"
                >

                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={
                      form.confirmPassword
                    }
                    onChange={change}
                    placeholder="Confirm password"
                    autoComplete="new-password"
                    disabled={loading}
                    required
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        (current) =>
                          !current
                      )
                    }
                    disabled={loading}
                  >
                    {showConfirmPassword
                      ? "Hide"
                      : "Show"}
                  </button>

                </div>
              </div>


              {/* =====================
                  ROLE
              ====================== */}

              <div>
                <label htmlFor="role">
                  Role
                </label>

                <select
                  id="role"
                  name="role"
                  value={form.role}
                  onChange={change}
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
              </div>


              {/* =====================
                  DEPARTMENT
              ====================== */}

              <div>
                <label htmlFor="department">
                  Department
                </label>

                <select
                  id="department"
                  name="department"
                  value={form.department}
                  onChange={change}
                  disabled={loading}
                >

                  <option>
                    Computer Science & Engineering
                  </option>

                  <option>
                    Information Science
                  </option>

                  <option>
                    Electronics & Communication
                  </option>

                  <option>
                    Electrical & Electronics
                  </option>

                  <option>
                    Mechanical Engineering
                  </option>

                  <option>
                    Civil Engineering
                  </option>

                </select>
              </div>


              {/* =====================
                  PHONE
              ====================== */}

              <div>
                <label htmlFor="phone">
                  Phone
                </label>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={change}
                  placeholder="Enter phone number"
                  autoComplete="tel"
                  disabled={loading}
                />
              </div>


              {/* =====================
                  SEMESTER
              ====================== */}

              <div>
                <label htmlFor="semester">
                  Semester / Year
                </label>

                <input
                  id="semester"
                  name="semester"
                  type="text"
                  value={form.semester}
                  onChange={change}
                  placeholder="Example: 6"
                  disabled={loading}
                />
              </div>


              {/* =====================
                  USN
              ====================== */}

              {form.role ===
                "student" && (
                <div>
                  <label htmlFor="usn">
                    USN
                  </label>

                  <input
                    id="usn"
                    name="usn"
                    type="text"
                    value={form.usn}
                    onChange={change}
                    placeholder="Example: 1SB22CS001"
                    disabled={loading}
                    required
                  />
                </div>
              )}

            </div>


            {/* =========================
                SUBMIT
            ========================== */}

            <button
              className="auth-submit"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Creating account..."
                : "Register"}
            </button>

          </form>


          {/* =========================
              LOGIN LINK
          ========================== */}

          <p className="switch">

            Already have an account?{" "}

            <button
              type="button"
              onClick={() =>
                navigate("/login")
              }
              disabled={loading}
            >
              Login here
            </button>

          </p>


          {/* =========================
              HOME
          ========================== */}

          <button
            type="button"
            className="back-home"
            onClick={() =>
              navigate("/")
            }
            disabled={loading}
          >
            ← Back to Home
          </button>

        </div>


        {/* =========================
            RIGHT ART SECTION
        ========================== */}

        <div className="register-art">

          <div className="book-art">
            📚
          </div>

          <h2>
            Learn. Connect. Grow.
          </h2>

          <p>
            A smarter way to manage
            academic mentoring.
          </p>

        </div>

      </div>

    </div>
  );
}