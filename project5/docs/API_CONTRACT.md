# 📜 MentorConnect — Single Authoritative API Contract

This document defines the contract for all REST API endpoints in **MentorConnect (Smart Mentoring System)**. All frontend calls and backend handlers must strictly conform to this specification.

---

## 🔐 1. Authentication & Security Endpoints (`/api/auth`)

| Method | Endpoint | Allowed Roles | Description | Request Body | Success Response | Error Codes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new user (Student/Mentor/Parent) | `{ name, email, password, role, department, phone, usn?, semester?, section?, employeeId?, designation?, studentUsn?, relation? }` | `201 Created`: `{ success: true, data: { user, profile, token }, message }` | `400`, `429` |
| `POST` | `/api/auth/login` | Public | Authenticate with Email/USN & Password | `{ email (or USN/EmpID), password, twoFactorCode? }` | `200 OK`: `{ success: true, data: { user, profile, token }, message }` or `{ requires2FA: true }` | `400`, `403`, `429` |
| `POST` | `/api/auth/refresh` | Public | Refresh JWT access token | Cookie or `{ refreshToken }` | `200 OK`: `{ success: true, data: { token, user } }` | `401` |
| `POST` | `/api/auth/logout` | Public | Invalidate refresh token cookie | None | `200 OK`: `{ success: true, data: null }` | `200` |
| `GET` | `/api/auth/verify-email/:token` | Public | Verify user email address | URL param `token` | `200 OK`: `{ success: true, message: "Email verified successfully" }` | `400` |
| `POST` | `/api/auth/verify-email` | Public | Verify user email address (body) | `{ token }` | `200 OK`: `{ success: true, message: "Email verified successfully" }` | `400` |
| `POST` | `/api/auth/forgot-password` | Public | Request password reset email | `{ email }` | `200 OK`: `{ success: true, message: "If this email exists in our system, a password reset link has been sent." }` (Token delivered via email only) | `400`, `429` |
| `POST` | `/api/auth/reset-password` | Public | Set new password with reset token | `{ token, newPassword }` | `200 OK`: `{ success: true, message: "Password has been reset successfully." }` | `400`, `429` |
| `GET` | `/api/auth/me` | Authenticated | Get current authenticated user session | None | `200 OK`: `{ success: true, data: { user, profile } }` | `401` |
| `POST` | `/api/auth/change-password` | Authenticated | Change user account password | `{ currentPassword, newPassword }` | `200 OK`: `{ success: true, message }` | `400`, `401` |
| `POST` | `/api/auth/2fa/setup` | Authenticated | Generate TOTP secret & QR code | None | `200 OK`: `{ success: true, data: { secret, qrCodeUrl } }` | `401` |
| `POST` | `/api/auth/2fa/verify` | Authenticated | Verify and enable 2FA | `{ code }` | `200 OK`: `{ success: true, message }` | `400`, `401` |
| `POST` | `/api/auth/2fa/disable` | Authenticated | Disable 2FA | `{ password }` | `200 OK`: `{ success: true, message }` | `400`, `401` |
| `GET` | `/api/auth/login-activity` | Authenticated | Get recent login activity logs | None | `200 OK`: `{ success: true, data: LoginActivity[] }` | `401` |

---

## 🎓 2. Student Endpoints (`/api/students`)

| Method | Endpoint | Allowed Roles | Description | Request Body | Success Response | Error Codes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/students/me` (alias `/api/students/profile`) | `student` | Get self student profile, academics, assigned mentor, badges, risk summary | None | `200 OK`: `{ success: true, data: { student, mentor, academics, risk, badges } }` | `401`, `403` |
| `GET` | `/api/students/me/sessions` | `student` | Get student's booked mentoring sessions | Query: `status?` | `200 OK`: `{ success: true, data: Session[] }` | `401`, `403` |
| `POST` | `/api/students/sessions/:sessionId/feedback` | `student` | Submit feedback for completed mentoring session | `{ rating (1-5), comments }` | `200 OK`: `{ success: true, data: Feedback }` | `400`, `401`, `403`, `404` |

---

## 📊 3. Academic Records Endpoints (`/api/academics`)

| Method | Endpoint | Allowed Roles | Description | Request Body | Success Response | Error Codes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/academics/my-marks` | `student` | Get logged in student's academic marks across all semesters | None | `200 OK`: `{ success: true, data: { student, semesters, summary } }` | `401`, `403` |
| `GET` | `/api/academics/:studentId` | `student`, `mentor`, `hod`, `parent` | Get student marks (authorized relationship only) | None | `200 OK`: `{ success: true, data: { student, semesters, summary } }` | `401`, `403`, `404` |
| `PUT` | `/api/academics/marks/:studentId` | `mentor`, `hod` | Submit/update semester marks and auto-compute SGPA | `{ semesterNumber, subjects: [{ subjectCode, subjectName, credits, cie1, cie2, cie3, assignmentMarks, semesterExamMarks }] }` | `200 OK`: `{ success: true, data: { semester, cgpa, riskScore } }` | `400`, `401`, `403` |
| `PUT` | `/api/academics/student/:studentId/semester/:semesterNumber` | `mentor`, `hod` | Submit semester marks (alias) | `{ subjects: [...] }` | `200 OK`: `{ success: true, data: { semester, cgpa } }` | `400`, `401`, `403` |
| `GET` | `/api/academics/:studentId/timeline/:semester` | `student`, `mentor`, `hod`, `parent` | Get marks progression timeline for semester | None | `200 OK`: `{ success: true, data: TimelineItem[] }` | `401`, `403` |
| `GET` | `/api/academics/:studentId/comparison/:semester` | `student`, `mentor`, `hod` | Anonymous class marks percentile comparison | None | `200 OK`: `{ success: true, data: ComparisonData }` | `401`, `403` |

---

## 🚨 4. Academic Risk Engine Endpoints (`/api/risk`)

| Method | Endpoint | Allowed Roles | Description | Request Body | Success Response | Error Codes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/risk/my-analysis` | `student` | Get self real-time pure academic risk calculation (40% CIE, 40% Backlogs, 20% Trend) | None | `200 OK`: `{ success: true, data: { riskScore, riskCategory, contributingFactors, reasons, recommendations } }` | `401`, `403` |
| `GET` | `/api/risk/:studentId` | `student`, `mentor`, `hod`, `parent` | Get student risk profile | None | `200 OK`: `{ success: true, data: RiskProfile }` | `401`, `403`, `404` |
| `POST` | `/api/risk/:studentId/evaluate` | `mentor`, `hod` | Trigger re-evaluation of student risk | None | `200 OK`: `{ success: true, data: RiskProfile }` | `401`, `403` |
| `GET` | `/api/risk/settings` | `hod` | Get risk engine configuration weights | None | `200 OK`: `{ success: true, data: RiskSettings }` | `401`, `403` |
| `PUT` | `/api/risk/settings` | `hod` | Update risk engine weights (sum = 100%) | `{ cieWeight, backlogWeight, trendWeight, cieWarningThreshold, highCutoff }` | `200 OK`: `{ success: true, data: RiskSettings }` | `400`, `401`, `403` |
| `POST` | `/api/risk/recalculate-all` | `hod` | Batch recalculate risk scores for all students in cohort | None | `200 OK`: `{ success: true, data: { recalculatedCount } }` | `401`, `403` |

---

## 📅 5. Mentoring Sessions & Office Hours Endpoints (`/api/sessions`)

| Method | Endpoint | Allowed Roles | Description | Request Body | Success Response | Error Codes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/sessions/my-sessions` | `student`, `mentor` | Get all sessions for current user (upcoming & past) | None | `200 OK`: `{ success: true, data: Session[] }` | `401` |
| `GET` | `/api/sessions/calendar` | `student`, `mentor`, `hod` | Query calendar sessions by date range | Query: `start, end` | `200 OK`: `{ success: true, data: Session[] }` | `401` |
| `POST` | `/api/sessions` (or `/api/sessions/book`) | `student`, `mentor`, `hod` | Book collision-free office hours slot | `{ mentorId, date, startTime, endTime, topic, mode: 'in-person' \| 'online', notes? }` | `201 Created`: `{ success: true, data: Session }` | `400` (collision/invalid), `401` |
| `PATCH` | `/api/sessions/:sessionId/status` | `mentor`, `student`, `hod` | Update session lifecycle (`scheduled`, `in_progress`, `completed`, `cancelled`) | `{ status, notes?, actionItems? }` | `200 OK`: `{ success: true, data: Session }` | `400`, `401`, `403` |
| `POST` | `/api/sessions/feedback` | `student` | Submit mentee feedback for completed session | `{ sessionId, rating (1-5), comments }` | `200 OK`: `{ success: true, data: Feedback }` | `400`, `401` |
| `GET` | `/api/sessions/my-feedbacks` | `mentor` | Get all student feedback reviews received by mentor | None | `200 OK`: `{ success: true, data: Feedback[] }` | `401`, `403` |

---

## 👨‍🏫 6. Faculty Mentor Endpoints (`/api/mentors`)

| Method | Endpoint | Allowed Roles | Description | Request Body | Success Response | Error Codes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/mentors/dashboard` (alias `/api/mentors/profile`, `/api/mentors/me`) | `mentor` | Get mentor overview stats & office hours | None | `200 OK`: `{ success: true, data: { mentor, stats } }` | `401`, `403` |
| `GET` | `/api/mentors/students` (alias `/api/mentors/my-students`) | `mentor` | Get assigned mentees list with risk & academic indicators | None | `200 OK`: `{ success: true, data: Student[] }` | `401`, `403` |
| `PUT` | `/api/mentors/office-hours` | `mentor` | Configure weekly recurring office hours availability | `{ officeHours: [{ dayOfWeek, startTime, endTime, slotDuration, maxBookings }] }` | `200 OK`: `{ success: true, data: Mentor }` | `400`, `401`, `403` |
| `GET` | `/api/mentors/feedbacks` | `mentor` | Get mentee feedback evaluations | None | `200 OK`: `{ success: true, data: Feedback[] }` | `401`, `403` |
| `GET` | `/api/mentors/:mentorId/office-hours` | Authenticated | Query mentor public office hours slots | None | `200 OK`: `{ success: true, data: OfficeHour[] }` | `401`, `404` |

---

## 🏛️ 7. HOD Department Governance Endpoints (`/api/hod`)

| Method | Endpoint | Allowed Roles | Description | Request Body | Success Response | Error Codes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/hod/overview` | `hod` | Department high-level summary metrics & cohort distributions | None | `200 OK`: `{ success: true, data: { summary, semesterDistribution, riskDistribution } }` | `401`, `403` |
| `GET` | `/api/hod/analytics` | `hod` | Department analytics, semester pass rates, challenging subjects, top students | None | `200 OK`: `{ success: true, data: AnalyticsData }` | `401`, `403` |
| `GET` | `/api/hod/students` | `hod` | All department students directory | Query: `semester?, riskCategory?, search?` | `200 OK`: `{ success: true, data: Student[] }` | `401`, `403` |
| `POST` | `/api/hod/students` | `hod` | Register individual new student | `{ name, email, password, usn, rollNumber, department, currentSemester, section, mentorId?, parentName?, parentPhone?, parentEmail? }` | `201 Created`: `{ success: true, data: Student }` | `400`, `401`, `403` |
| `PUT` | `/api/hod/students/:id` | `hod` | Update student profile details | Updated student fields | `200 OK`: `{ success: true, data: Student }` | `400`, `401`, `403` |
| `PATCH` | `/api/hod/students/:id/mentor` | `hod` | Reassign student's faculty mentor | `{ mentorId }` | `200 OK`: `{ success: true, data: Student }` | `400`, `401`, `403` |
| `DELETE` | `/api/hod/students/:id` | `hod` | Remove student record | None | `200 OK`: `{ success: true, message: "Student deleted" }` | `401`, `403`, `404` |
| `GET` | `/api/hod/mentors` | `hod` | All faculty mentors roster with advising quotas | None | `200 OK`: `{ success: true, data: Mentor[] }` | `401`, `403` |
| `POST` | `/api/hod/mentors` | `hod` | Onboard faculty mentor | `{ name, email, password, department, designation, officeRoom, maxCapacity }` | `201 Created`: `{ success: true, data: Mentor }` | `400`, `401`, `403` |
| `PUT` | `/api/hod/mentors/:id` | `hod` | Update mentor profile or quota | Updated mentor fields | `200 OK`: `{ success: true, data: Mentor }` | `400`, `401`, `403` |
| `POST` | `/api/hod/assign-mentees` (alias `/api/hod/mentors/allocate-bulk`) | `hod` | Bulk allocate students to a faculty mentor | `{ mentorId, studentIds: [string] }` | `200 OK`: `{ success: true, data: { allocatedCount } }` | `400`, `401`, `403` |
| `GET` | `/api/hod/leaderboard` | `hod` | Top CGPA honor roll rankings | None | `200 OK`: `{ success: true, data: LeaderboardEntry[] }` | `401`, `403` |
| `POST` | `/api/hod/users/:userId/unlock` | `hod` | Unlock locked user account | None | `200 OK`: `{ success: true, message: "Account unlocked" }` | `401`, `403` |
| `GET` | `/api/hod/audit-logs` | `hod` | Query immutable audit trail logs | Query: `action?, search?` | `200 OK`: `{ success: true, data: AuditLog[] }` | `401`, `403` |

---

## 👨‍👩‍👧 8. Parent Portal Endpoints (`/api/parent`)

| Method | Endpoint | Allowed Roles | Description | Request Body | Success Response | Error Codes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/parent/my-ward` (alias `/api/parent/child`) | `parent` | Get linked ward's academic progression, mentor details, and risk standing | None | `200 OK`: `{ success: true, data: { student, mentor, summary: { cgpa, totalActiveBacklogs, totalEarnedCredits, riskLevel, riskScore } } }` | `401`, `403`, `404` |
| `GET` | `/api/parent/child/semester/:semester` | `parent` | Get ward's semester marks breakdown | None | `200 OK`: `{ success: true, data: SemesterMarks }` | `401`, `403`, `404` |

---

## 💬 9. Real-Time Messaging Endpoints (`/api/messages`)

| Method | Endpoint | Allowed Roles | Description | Request Body | Success Response | Error Codes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/messages/conversations` | Authenticated | Get conversations list with unread counters | None | `200 OK`: `{ success: true, data: Conversation[] }` | `401` |
| `POST` | `/api/messages` | `student`, `mentor` | Send direct message (Student ↔ assigned Mentor only) | `{ receiverId, content }` | `201 Created`: `{ success: true, data: Message }` | `400`, `401`, `403` (unauthorized relationship) |
| `GET` | `/api/messages/user/:otherUserId` (alias `/api/messages/thread/:id`) | Authenticated | Get chat history with recipient | None | `200 OK`: `{ success: true, data: Message[] }` | `401`, `403` |

---

## 🏆 10. Achievements & Certificates Endpoints (`/api/achievements`)

| Method | Endpoint | Allowed Roles | Description | Request Body | Success Response | Error Codes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/achievements` | `student` | Upload achievement and certificates (multipart/form-data) | FormData: `title, description, category, issuer, issueDate`, files under `files` or `certificates` | `201 Created`: `{ success: true, data: Achievement }` | `400`, `401`, `403` |
| `GET` | `/api/achievements/my-achievements` (alias `/api/achievements`) | `student` | Get self uploaded achievements list | None | `200 OK`: `{ success: true, data: Achievement[] }` | `401`, `403` |
| `GET` | `/api/achievements/student/:studentId` | `student`, `mentor`, `hod` | Get achievements for student | None | `200 OK`: `{ success: true, data: Achievement[] }` | `401`, `403` |
| `PATCH` | `/api/achievements/:id/verify` | `mentor`, `hod` | Verify student achievement | `{ isVerified: boolean }` | `200 OK`: `{ success: true, data: Achievement }` | `401`, `403`, `404` |
| `DELETE` | `/api/achievements/:id` | `student` | Delete achievement record | None | `200 OK`: `{ success: true, message: "Achievement deleted" }` | `401`, `403`, `404` |
| `GET` | `/api/achievements/bundle/:studentId` (alias `/api/achievements/export/zip`) | `student`, `mentor`, `hod` | Stream downloadable ZIP archive of certificates | None | `200 OK`: Binary ZIP stream `application/zip` | `401`, `403`, `404` |

---

## 🎯 11. SMART Goals Endpoints (`/api/goals`)

| Method | Endpoint | Allowed Roles | Description | Request Body | Success Response | Error Codes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/goals` (alias `/api/goals/my-goals`) | `student` | Get self active & completed SMART goals | None | `200 OK`: `{ success: true, data: StudentGoal[] }` | `401`, `403` |
| `GET` | `/api/goals/student/:studentId` | `student`, `mentor`, `hod` | Get student goals list | None | `200 OK`: `{ success: true, data: StudentGoal[] }` | `401`, `403` |
| `POST` | `/api/goals` | `student` | Create new SMART goal | `{ title, description?, category, targetValue, currentValue?, unit?, deadline, milestones: [{ title, completed }] }` | `201 Created`: `{ success: true, data: StudentGoal }` | `400`, `401`, `403` |
| `PATCH` | `/api/goals/:id` | `student` | Update goal progress or status | Partial goal updates | `200 OK`: `{ success: true, data: StudentGoal }` | `400`, `401`, `403` |
| `PATCH` | `/api/goals/:id/milestones/:index/toggle` | `student` | Toggle completion status of milestone | None | `200 OK`: `{ success: true, data: StudentGoal }` | `400`, `401`, `403`, `404` |
| `DELETE` | `/api/goals/:id` | `student` | Delete goal | None | `200 OK`: `{ success: true, message: "Goal deleted" }` | `401`, `403`, `404` |

---

## 📋 12. Task Management Endpoints (`/api/tasks`)

| Method | Endpoint | Allowed Roles | Description | Request Body | Success Response | Error Codes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/tasks` | Authenticated | List tasks assigned to or created by current user | Query: `status?, priority?, studentId?` | `200 OK`: `{ success: true, data: Task[] }` | `401` |
| `POST` | `/api/tasks` | `mentor`, `hod` | Create task / action item for student | `{ assignedTo, studentId?, title, description?, dueDate?, priority: 'low' \| 'medium' \| 'high' \| 'urgent' }` | `201 Created`: `{ success: true, data: Task }` | `400`, `401`, `403` |
| `PATCH` | `/api/tasks/:id` | Authenticated | Update task status or details | `{ status: 'pending' \| 'in_progress' \| 'completed' \| 'cancelled', title?, description?, dueDate?, priority? }` | `200 OK`: `{ success: true, data: Task }` | `400`, `401`, `403`, `404` |
| `DELETE` | `/api/tasks/:id` | `mentor`, `hod` | Delete task | None | `200 OK`: `{ success: true, message: "Task deleted" }` | `401`, `403`, `404` |

---

## 📄 13. Reports & Document Services (`/api/reports`)

| Method | Endpoint | Allowed Roles | Description | Request Body | Success Response | Error Codes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/reports/pdf/student/:studentId` (alias `/api/reports/student/:studentId/report-card/pdf`) | `student`, `mentor`, `hod`, `parent` | Stream official branded PDF Report Card | None | `200 OK`: Binary PDF stream `application/pdf` | `401`, `403`, `404` |
| `GET` | `/api/reports/department/excel` (alias `/api/reports/export/students`) | `hod`, `mentor` | Stream department performance Excel spreadsheet | None | `200 OK`: Binary Excel stream `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | `401`, `403` |
| `GET` | `/api/reports/export/mentors` | `hod` | Stream mentor allocation Excel spreadsheet | None | `200 OK`: Binary Excel stream | `401`, `403` |

---

## 📥 14. Bulk Imports (`/api/imports`)

| Method | Endpoint | Allowed Roles | Description | Request Body | Success Response | Error Codes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/imports/students` (alias `/api/imports/students/csv`, `/api/imports/students/excel`) | `hod` | Bulk import students from CSV or Excel file | FormData with `file` | `200 OK`: `{ success: true, data: { importedCount, skippedCount, errors } }` | `400`, `401`, `403` |
| `POST` | `/api/imports/marks` | `mentor`, `hod` | Bulk import marks from CSV or Excel file | FormData with `file` | `200 OK`: `{ success: true, data: { importedCount, errors } }` | `400`, `401`, `403` |

---

## 🔔 15. Notifications (`/api/notifications`)

| Method | Endpoint | Allowed Roles | Description | Request Body | Success Response | Error Codes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | Authenticated | List user notifications | Query: `limit?` | `200 OK`: `{ success: true, data: Notification[] }` | `401` |
| `PATCH` | `/api/notifications/:id/read` | Authenticated | Mark notification as read | None | `200 OK`: `{ success: true, data: Notification }` | `401`, `404` |
| `PATCH` | `/api/notifications/read-all` | Authenticated | Mark all notifications as read | None | `200 OK`: `{ success: true, data: { updatedCount } }` | `401` |
