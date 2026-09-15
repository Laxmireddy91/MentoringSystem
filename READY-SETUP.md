# Smart Mentoring System — Ready Security Build

This build includes the existing Student/Mentor/HOD dashboard project plus:

- Working Forgot Password reset-token flow
- Password reset token hashing and expiry
- Email OTP two-factor login
- 2FA enable/verify/disable from the dashboard Security tab
- 6-digit OTPs with 5-minute expiry
- OTP hash storage and login OTP attempt protection
- Refresh-token rotation and logout invalidation
- Login rate limiting and account lockout
- Email verification endpoints
- Helmet, CORS allowlist, Socket.IO JWT authentication
- Development email fallback so Forgot Password and OTP can be tested even when SMTP is not configured

## Run

### Backend

```powershell
cd backend
npm install
npm run dev
```

### Frontend

Open another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:5000

## Forgot Password in development

If SMTP is not configured, the backend does not crash. It prints the reset link/token in the backend console and returns a development reset token to the frontend. The Forgot Password page shows an **Open password reset page** link.

For real Gmail delivery, configure the SMTP variables from `backend/.env.example` in your own local `.env`.

## 2FA in development

1. Log in normally.
2. Open Dashboard → **Security & 2FA**.
3. Click **Enable 2FA**.
4. Enter the displayed development OTP.
5. Log out and log in again.
6. The login page requests the 6-digit OTP. In development without SMTP, the OTP is shown in the login response/UI for testing.

## Important

Do not commit `.env` or Gmail App Passwords. The ZIP intentionally contains `.env.example`, not a real `.env`.
