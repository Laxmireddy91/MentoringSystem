# Security Policy & Safeguards — MentorConnect

MentorConnect implements defense-in-depth security principles across all architectural tiers to safeguard student records, examination marks, and institutional communications.

---

## 1. Authentication & Session Architecture

- **JWT Dual-Token Flow**:
  - Short-lived **Access Token** (15 minutes) signed with HMAC-SHA256 (`JWT_ACCESS_SECRET`).
  - Long-lived **Refresh Token** (7 days) signed with HMAC-SHA256 (`JWT_REFRESH_SECRET`) stored strictly in **`HttpOnly`**, `Secure`, `SameSite=Strict` cookies.
- **Argon2 / Bcrypt Password Hashing**: Passwords hashed with Bcrypt (cost factor 10) with unique salt generation.
- **Login Rate Limiting**: Maximum 5 failed login attempts per IP per 15-minute window (`express-rate-limit`).
- **Two-Factor Authentication (2FA)**: Time-based one-time password / email OTP verification support.
- **Session Revocation**: Stored refresh token hashing and invalidation on logout or security password change.

---

## 2. Role-Based Access Control (RBAC) & Marks Immutability

- **4 Enforced Roles**: `student`, `mentor`, `hod`, `parent`.
- **Marks Immutability for Students**: Students have strict read-only access to their marks and examination results. Only authorized faculty mentors assigned to that student or the Department HOD can submit marks.
- **Performance Snapshots**: Every marks modification automatically generates an immutable audit snapshot (`PerformanceSnapshot`) capturing previous SGPA, new SGPA, delta, modifying user, and reason.
- **Scoped Socket.IO Communication**: Socket handshake verifies JWT tokens; student-mentor chat channels strictly enforce that students can only exchange messages with their assigned mentor.

---

## 3. Threat Mitigation & API Hardening

- **Helmet Security Headers**: Sets `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection`, and Content Security Policy.
- **NoSQL Injection Defense**: `mongo-sanitize` middleware removes keys beginning with `$` or containing `.`.
- **Cross-Site Scripting (XSS)**: Input sanitization via `xss-clean` and React JSX output encoding.
- **CORS Protection**: Whitelisted origins via `CORS_ORIGIN` environment variable with credential support.
- **File Upload Security**: Multer file type whitelisting (PDF, PNG, JPG, CSV, XLSX only) and max size limit (10MB).
- **Zod Schema Validation**: All incoming request bodies are validated against strict Zod schemas before hitting controllers.
- **Immutable Audit Logging**: Every critical operation (marks revision, allocation, user creation, rule update) is stored in the `AuditLog` collection.

---

## 4. Reporting Security Vulnerabilities

To report any security findings or vulnerability disclosures:
1. Contact the security team at `security@mentorconnect.edu`.
2. Do not open public issues for sensitive vulnerabilities.
3. Provide reproducible steps and environment details.
