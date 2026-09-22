# MentorConnect Development Roadmap & Phase Tracking

## Completed Phases

- [x] **Phase 1 — Core Authentication, RBAC & User Management**
  - Institutional role hierarchy: Student, Mentor, Mentoring Coordinator, HOD, Exam Coordinator, TPO, Parent.
  - JWT token lifecycle, refresh token rotation, bcrypt password hashing.
  - Institutional pre-registration via `StudentRecord`, self-activation with token validation.
  - Parent account linking and activation workflow.

- [x] **Phase 2 — Student/Faculty Management & Late-Admission Support**
  - HOD student & faculty roster ingestion (CSV/Excel).
  - Individual student registration for late-admission scenarios without Excel upload.
  - Department analytics, leaderboard, and user account management.

- [x] **Phase 3 — Mentor Allocation Engine & Mentoring Coordinator Workflows**
  - Deterministic, capacity-constrained allocation algorithm with soft section affinity.
  - Capacity calculation excluding inactive faculty.
  - Preview-confirm allocation workflow (DB isolation during preview, persistence upon confirm).
  - AllocationBatch versioning, audit logging, and notifications.
  - Manual student reassignment with capacity enforcement.
  - Incremental allocation for late-admission students without reallocating existing students.

- [x] **Phase 4 — CIE & Attendance Ingestion**
  - Single source of truth: official CIE in `Student.academics` (semester-wise), official attendance in `Attendance` collection.
  - Header normalization for flexible Excel (.xlsx/.xls) and CSV ingestion (`Subject Code`, `CIE 1`, `Total Classes`, etc.).
  - 4-tier row validation classification: `VALID`, `WARNING`, `ERROR`, `DUPLICATE`.
  - Import safety: Preview does not persist to database; Confirm persists only eligible rows (`VALID` & `WARNING`), excluding errors and duplicates.
  - Non-destructive semester upsert: updating a subject merges with existing subjects in the semester without erasing them.
  - Late-admission student support: newly admitted students can receive marks and attendance without manual mentor entry.
  - Attendance calculation: handles `totalClasses === 0` safely (0%, no NaN/Infinity) and enforces `classesAttended <= totalClasses`.
  - Security & RBAC: Only HOD can import attendance and CIE marks; mentors and parents have strictly read-only access to assigned mentees/wards.
  - Dedicated attendance APIs: `/api/academics/my-attendance` and `/api/academics/attendance/:studentId` with ownership verification.
  - Import history & audit trail: rich metadata stored in `AuditLog` (`importType`, `filename`, `totalRows`, `validRows`, `warningRows`, `errorRows`, `duplicateRows`, `importedRows`, `failedRows`).
  - Notifications: dispatched to students and mentors upon CIE/attendance ingestion, with statutory low-attendance alerts (< 75%).
  - HOD Ingestion Console: 4-tab interactive frontend UI (`HodImports.jsx`) with summary KPI cards, preview filters, and historical logs.
  - Clean empty states: newly admitted students without records show `"No CIE records available."` and `"Attendance data not imported yet."`.

---

## Remaining Phases (Pending Implementation)

- [ ] **Phase 5 — Student 360° Academic & Mentoring Console Enhancements**
  - Holistic mentee profile view with real-time academic risk alerts.
  - Strict academic attention engine (based on CIE < 25/50 & backlogs only; attendance kept independent).
  - Auto-generated mentor executive brief narrative.

- [ ] **Phase 6 — Student Goal Tracking & Mentoring Session Lifecycle**
  - Student goals with milestones, deadlines, and mentor feedback.
  - 1-on-1 mentoring session booking, slot conflict detection, completion notes, and mentee feedback.

- [ ] **Phase 7 — Student Achievements & Document Vault**
  - Student achievement submission with faculty verification workflow.
  - Document vault with strict access control (marks cards, certificates, IDs).

- [ ] **Phase 8 — TPO Campus Placement Engine & Exam Coordinator Workflows**
  - Placement drive creation, automated rule-based student eligibility checking, and application tracking.
  - Exam coordinator grade re-evaluation requests and clearance workflows.
