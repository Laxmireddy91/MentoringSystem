# 🎓 MentorConnect — Smart Academic Mentoring & Risk Evaluation System

[![Node.js](https://img.shields.io/badge/Node.js-v20.x-green.svg)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-v4.x-black.svg)](https://expressjs.com)
[![React](https://img.shields.io/badge/React-v18.x-blue.svg)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-v5.x-purple.svg)](https://vitejs.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-emerald.svg)](https://www.mongodb.com)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--Time-white.svg)](https://socket.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-cyan.svg)](https://tailwindcss.com)

**MentorConnect** is an enterprise-grade, comprehensive academic mentoring platform built for universities and colleges. It bridges students, faculty mentors, department heads, and parents with automated academic risk analysis, Continuous Internal Evaluation (CIE) calculation, collision-free office hours scheduling, real-time messaging, PDF report cards, and bulk Excel/CSV data imports.

---

## 🌟 Key System Features

### 1. 👥 Four-Tier Role Architecture
- **Student Portal**: Read-only marks breakdown, SGPA/CGPA trends, office-hours booking, SMART goals with milestone checklists, certificate portfolio with ZIP download, and real-time mentor messaging.
- **Faculty Mentor Console**: Assigned mentee roster with risk indicators, marks evaluation modal with auto-SGPA computation, office hours availability configuration, session completion logging with action items, and student feedback reviews.
- **HOD Leadership Console**: Department governance metrics, semester-wise pass rate analysis, bulk student CSV/Excel onboarding, mentor allocation & quota balancing, configurable risk engine weights/thresholds, merit leaderboard, and security audit logs.
- **Parent Portal**: Ward overview, earned credits, semester marks summary, assigned mentor contact details, and PDF progress report card downloads.

### 2. ⚡ Automated Academic Calculations & Immutability
- **VTU/Standard Academic Rules**: CIE computed as Best 2 of 3 internal tests scaled to 40 marks + 10 Assignment marks = 50 CIE marks + 50 SEE marks = 100 Final marks.
- **10-Point Letter Grading**: O (10 pts, 90-100), A+ (9 pts, 80-89), A (8 pts, 70-79), B+ (7 pts, 60-69), B (6 pts, 55-59), C (5 pts, 50-54), P (4 pts, 40-49), F (0 pts, <40 / Backlog).
- **Marks Immutability**: Students have strict read-only access. Only assigned mentors and HOD can modify marks, automatically generating an immutable `PerformanceSnapshot` audit record.

### 3. 🚨 Multi-Factor Rule-Based Risk Engine
- **Pure Academic Weighted Formula**:
  $$\text{Risk Score} = (0.40 \times \text{CIE Score}) + (0.40 \times \text{Backlog Penalty}) + (0.20 \times \text{GPA Trend})$$
- Tiers: **Low** (0-29), **Medium** (30-59), **High** (60-79), **Critical** (80-100 or $\ge 3$ active backlogs).
- Generates actionable trigger explanations and automated remedial recommendations.
- Weights and thresholds are dynamically configurable in the HOD console with one-click cohort recalculation.

### 4. 📅 Collision-Free Mentoring Sessions & Office Hours
- Mentors set weekly recurring office hours slots.
- Students book open slots with collision detection to prevent double booking.
- Real-time session status lifecycle (`scheduled`, `in_progress`, `completed`, `cancelled`) with mentor discussion notes and mentee action items.
- Post-session 1-5 star feedback and reviews.

### 5. 💬 Real-Time Messaging & FAQ Chatbot
- JWT-authenticated real-time direct chat via **Socket.IO** between students and their assigned mentors.
- Message history, unread counts, and live typing indicators.
- Embedded **Ask MentorBot** interactive FAQ widget for instant academic policy and platform guidance.

### 6. 📄 Automated Document Services
- **PDFKit**: Generates official branded institutional Progress Report Cards.
- **ExcelJS**: Generates formatted Department Performance and Analytics spreadsheets (`.xlsx`).
- **Archiver**: Bundles student achievement certificates into downloadable `.zip` archives.
- **Bulk Importers**: Seamless CSV and Excel ingestion of student rosters with duplicate detection.

---

## 🔑 Demo Login Credentials

The system includes a pre-seeded institutional dataset:

| Role | Email / Identifier | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **HOD** | `hod.cs@college.edu` | `Password@123` | Full Department Governance, Rules & Audit Logs |
| **Faculty Mentor** | `ramesh.kumar@college.edu` | `Password@123` | Mentee Marks, Office Hours & Feedback |
| **Student** | `aarav.sharma@college.edu` (USN: `1MS21CS001`) | `Password@123` | Read-only Marks, Sessions, Goals & Chat |
| **Parent** | Phone: `9876543210` / `parent.aarav@gmail.com` | `Password@123` | Ward Academic Progress & Mentor Contact |

---

## 🏗️ Technology Stack

- **Backend**: Node.js, Express.js, MongoDB, Mongoose, Socket.IO, Winston Logger, Zod, PDFKit, ExcelJS, Archiver, Multer, Helmet, Rate-Limit.
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Recharts, React Router v6, Axios, PWA Service Worker.
- **Testing**: Jest & Supertest (Backend — 64 tests), Vitest & React Testing Library (Frontend — 11 tests).
- **DevOps**: Docker, Docker Compose, Nginx.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.x or v20.x
- **MongoDB**: Local MongoDB instance or MongoDB Atlas URI

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
npm run seed      # Seeds initial demo users, marks, goals, and sessions
npm run dev       # Starts server on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev       # Starts Vite dev server on http://localhost:5173
```

### 3. Running Test Suites
```bash
# Run backend tests (13 test suites, 64 tests)
cd backend && npm test

# Run frontend tests (3 test suites, 11 tests)
cd frontend && npm test
```

### 4. Running with Docker Compose
```bash
docker-compose up --build
```
Access the frontend on `http://localhost:80` and backend API on `http://localhost:5000`.

---

## 📚 API Endpoints Summary

```
POST   /api/auth/register           - Register new account
POST   /api/auth/login              - Authenticate and receive JWT tokens
POST   /api/auth/refresh            - Refresh access token
POST   /api/auth/logout             - Invalidate session
GET    /api/academics/my-marks      - View student marks breakdown
PUT    /api/academics/student/:id/semester/:sem - Submit marks (Mentor/HOD)
GET    /api/risk/my-analysis        - Student risk assessment
GET    /api/risk/settings           - Get risk engine weights (HOD)
PUT    /api/risk/settings           - Update risk engine weights (HOD)
POST   /api/risk/recalculate-all    - Batch recalculate risk scores (HOD)
POST   /api/sessions                - Book mentoring session
GET    /api/sessions/my-sessions    - List booked sessions
PATCH  /api/sessions/:id/status     - Update session status
POST   /api/sessions/feedback       - Submit session review
GET    /api/messages/thread/:id     - Get chat history
POST   /api/messages                - Send chat message
GET    /api/reports/student/:id/report-card/pdf - Download PDF report card
GET    /api/reports/department/excel - Export department report (.xlsx)
GET    /api/achievements/export/zip - Download certificates ZIP
POST   /api/imports/students/csv    - Bulk CSV student import
POST   /api/imports/students/excel  - Bulk Excel student import
GET    /api/hod/overview            - Department governance overview
GET    /api/hod/audit-logs          - System audit trail
GET    /api/parent/my-ward          - Parent ward academic report
```

---

## 📄 License & Compliance

Licensed under the MIT License. Designed in compliance with standard academic guidelines and institutional accreditation norms.
