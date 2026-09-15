# Smart Mentoring System — Security Checklist

## Authentication
- [x] JWT access tokens with short expiry
- [x] Refresh-token endpoint
- [x] Password hashing with bcrypt
- [x] Strong password validation on client and server
- [x] Login/register/forgot-password rate limiting
- [x] Temporary account lockout after repeated failures
- [x] Forgot/reset password with expiring token
- [x] Email verification flow (enable with `REQUIRE_EMAIL_VERIFICATION=true`)
- [x] Optional email OTP two-factor authentication

## Authorization
- [x] Role-based API authorization
- [x] Student academic record editing blocked server-side
- [x] Mentor/HOD academic editing protected server-side
- [x] Message authorization through REST `canMessage`
- [x] Socket.IO JWT verification
- [x] Socket rooms restricted to the authenticated user

## HTTP / API Security
- [x] Helmet security headers
- [x] CORS allowlist
- [x] Pino HTTP logging middleware
- [x] Production-safe error responses
- [x] Joi validation for login/register/message creation
- [x] Required environment-variable startup validation

## Files
- [x] Achievement upload migrated to multipart/form-data
- [x] Upload size and MIME checks
- [x] Sanitized filenames
- [ ] Add file magic-byte/content inspection for stronger upload validation

## Monitoring
- [x] LoginActivity model (last 5 login records exposed to the current user)
- [x] HOD audit log for protected academic edits/deletes
- [x] Message delivered/read status

## Remaining hardening
- [ ] Full end-to-end authentication/RBAC test suite
- [ ] HOD USN/account-recovery workflow
- [ ] Full audit coverage for every student/mentor mutation
- [ ] Device fingerprint parsing beyond user-agent storage
- [ ] Production refresh tokens in HttpOnly/Secure/SameSite cookies
- [ ] Complete structured logging migration for all legacy console statements
- [ ] Full Husky pre-commit workflow validation on a developer machine

## Deployment checklist
- Set `NODE_ENV=production`.
- Use strong random JWT secrets.
- Set `CLIENT_URL` to the production frontend only.
- Configure SMTP before enabling email verification or email OTP.
- Use HTTPS in production.
- Never commit `.env` or real credentials.
- Run the full authentication/RBAC test suite before deployment/demo.


## Additional completed hardening
- Refresh tokens are stored hashed and rotated on refresh; logout invalidates the current session.
- HOD account recovery endpoint is protected by role authorization and audited.
- Achievement uploads now perform basic content-signature validation in addition to MIME/size checks.
- Student academic report controls are disabled in the frontend, with backend role enforcement.
