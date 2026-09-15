import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setMsg(""); setResetUrl(""); setLoading(true);
    try {
      const r = await api.auth.forgotPassword(email.trim());
      setMsg(r.message || "If the account exists, a reset link has been sent.");
      if (r.developmentToken) {
        const url = `${window.location.origin}/reset-password?token=${encodeURIComponent(r.developmentToken)}`;
        setResetUrl(url);
      }
    } catch (e) { setError(e.message || "Unable to process request"); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page"><div className="auth-card">
      <div className="auth-icon">🔐</div>
      <h1>Forgot Password</h1>
      <p>Enter your registered email and we'll help you reset your password.</p>
      {error && <div className="auth-error">{error}</div>}
      {msg && <div className="auth-success">{msg}</div>}
      {resetUrl && <div className="mc-dev-otp"><b>Development mode:</b><br/><a href={resetUrl}>Open password reset page</a></div>}
      <form onSubmit={submit}>
        <label htmlFor="forgot-email">Registered Email</label>
        <input id="forgot-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your registered email" autoComplete="email" required />
        <button className="auth-submit" type="submit" disabled={loading}>{loading ? "Sending..." : "Send Reset Link"}</button>
      </form>
      <button type="button" onClick={() => navigate("/login")}>← Back to Login</button>
    </div></div>
  );
}
