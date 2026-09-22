# MentorConnect — User Guide & Role Operations Manual

Welcome to **MentorConnect (Smart Mentoring System)**! This guide explains the core features, step-by-step workflows, and best practices for each user role in the platform.

---

## 1. Student Portal

### 🎓 Dashboard Overview
- **Metrics Bar**: View your current semester, cumulative CGPA (10.0 scale), earned credits, active backlogs, and real-time Academic Risk status.
- **Assigned Faculty Mentor**: Instant access to your designated mentor's name, department, office room, and email.
- **Earned Badges**: Automatically unlocked milestone badges for academic excellence, backlog clearance, and goal completion.

### 📊 Academics & Marks Breakdown
- View semester-by-semester subject breakdown table including CIE-1, CIE-2, CIE-3 (best 2 scaled to 40 marks), Assignments (10 marks), Total CIE (50 marks), Semester End Exam (50 marks), and Final marks (100 marks).
- View official Letter Grade (O, A+, A, B+, B, C, P, F) and Grade Points (10 down to 0).
- **Download PDF Report Card**: Click the "Download PDF Report Card" button to generate and save an official institutional progress report with university header.

### 📅 Booking Office Hours
1. Navigate to **Mentoring Sessions**.
2. Click **Book Mentor Session**.
3. Select an available date, start time, and end time.
4. Choose the session mode (**In-Person** at faculty office or **Online** video call).
5. Specify your discussion agenda or specific questions.
6. The system automatically validates collision-free booking with mentor's office hours.

### 🎯 Setting SMART Goals & Earning Badges
- Click **Set New Goal** to create academic, career, skill, or personal targets with target completion dates.
- Break goals down into actionable milestones with interactive checklist toggles.
- Reaching milestones automatically updates your progress bar and triggers gamified badges.

### 🏆 Achievements Portfolio & ZIP Export
- Upload hackathon victories, online certifications, research publications, and sports medals.
- Attach certificate PDFs or image scans.
- Export your entire verified certificate portfolio into a single downloaded **ZIP archive**.

### 💬 Real-Time Messaging & FAQ Chatbot
- Chat one-on-one with your assigned mentor with real-time Socket.IO delivery, read receipts, and typing indicators.
- Use the floating **Ask MentorBot** widget anytime to get instant answers regarding CIE calculations, SGPA formulas, risk tier guidelines, and booking rules.

---

## 2. Faculty Mentor Console

### 👥 Mentee Roster & Risk Monitoring
- View all assigned students in your cohort with immediate visibility into their earned credits, CGPA, backlogs, and Academic Risk level.
- Filter mentees by risk category (**Critical**, **High**, **Medium**, **Low**) and semester.
- View parent/guardian contact information for emergency pastoral care.

### 📝 Marks Entry & SGPA Auto-Computation
1. Under **Assigned Mentees**, click **Marks** next to any student.
2. Select the semester to evaluate.
3. Enter subject codes, names, credits, CIE test marks (out of 50), assignments (out of 10), and SEE marks (out of 50).
4. Click **Save & Compute SGPA**. The system automatically computes best 2 of 3 CIE, total marks, letter grades, semester SGPA, cumulative CGPA, and logs an immutable `PerformanceSnapshot`.

### 🗓️ Office Hours & Session Completion
- Configure your recurring weekly office hours availability (e.g., Monday 10:00 AM - 12:00 PM) and slot durations.
- Mark sessions as `In-Progress` or `Completed`.
- When completing a session, record mentor discussion summaries and assign action items directly to the student.

### ⭐ Mentee Feedback & Rating Reviews
- Inspect feedback ratings (1-5 stars) and qualitative commentary submitted by students after completed sessions.

---

## 3. Head of Department (HOD) Leadership Console

### 🏛️ Department Governance & Metrics
- Department overview displays total enrolled students, total faculty mentors, average departmental CGPA, total active backlogs, and critical risk counts.
- Inspect semester-wise average CGPA distribution and overall cohort risk distribution charts.

### 📋 Student Directory & Bulk Imports
- Register individual students or use **Bulk Import** to upload large cohorts using `.csv` or `.xlsx` files.
- The bulk importer validates duplicate USNs/emails, links students with default credentials, and returns a detailed summary of created and skipped records.
- Reallocate or change student-to-mentor assignments anytime.

### 👨‍🏫 Faculty Mentor Allocation & Workload Balancing
- View each mentor's allocated mentee count vs. maximum advising quota (e.g. 20/25 mentees).
- Use **Allocate Mentees (Multi-Select)** to distribute unallocated students in bulk to faculty mentors.

### 📈 Department Analytics & Leaderboard
- Inspect pass rates across semesters and identify subjects with high failure or backlog rates for remedial intervention.
- View the **Department Merit Honor Roll (Top CGPA)** leaderboard.
- Click **Export Complete Dataset (.xlsx)** to download department-wide performance sheets.

### ⚙️ Configurable Risk Engine Rules
- Adjust weights for **CIE Score (40%)**, **Backlogs Penalty (40%)**, and **GPA Trend (20%)** ensuring total equals 100%.
- Adjust warning thresholds (e.g. CIE < 50%) and risk cutoffs.
- Click **Save & Recalculate Department Risk Scores** to trigger a batch recalculation across all students.

### 🛡️ Security Audit Trail
- Inspect immutable activity logs recording every authentication event, marks modification, mentor allocation, and rule update with timestamp and actor IP.

---

## 4. Parent / Guardian Portal

### 👨‍👩‍👧 Ward Academic Progress
- Parents log in using their registered mobile number or email.
- View earned degree credits, latest semester SGPA, cumulative CGPA, and risk standing.
- View assigned faculty mentor contact details (phone, email, office room) for direct academic communication.
- Download official PDF progress report cards.
