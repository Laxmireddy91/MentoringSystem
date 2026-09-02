import "dotenv/config";
import bcrypt from "bcryptjs";

import { connectDB } from "../config/db.js";

import User from "../models/User.js";
import Student from "../models/Student.js";
import Mentor from "../models/Mentor.js";
import Session from "../models/Session.js";
import Notification from "../models/Notification.js";
import Task from "../models/Task.js";
import Report from "../models/Report.js";

const students = [
  [
    "1MS22CS001",
    "Aarav Sharma",
    "Computer Science & Engineering",
    "3rd Year",
    "Dr. Rajesh Kumar",
    80,
    0,
  ],
  [
    "1MS22CS002",
    "Ananya Rao",
    "Computer Science & Engineering",
    "3rd Year",
    "Dr. Rajesh Kumar",
    71,
    1,
  ],
  [
    "1MS23IS003",
    "Rohan Patel",
    "Information Science",
    "2nd Year",
    "Prof. Priya Sharma",
    86,
    0,
  ],
  [
    "1MS21EC004",
    "Meera Nair",
    "Electronics & Communication",
    "4th Year",
    "Prof. Sneha Reddy",
    68,
    2,
  ],
  [
    "1MS22CS005",
    "Vikram Singh",
    "Computer Science & Engineering",
    "3rd Year",
    "Dr. Vikram Singh",
    61,
    3,
  ],
];

await connectDB();


await Promise.all([
  User.deleteMany({}),
  Student.deleteMany({}),
  Mentor.deleteMany({}),
  Session.deleteMany({}),
  Notification.deleteMany({}),
  Task.deleteMany({}),
  Report.deleteMany({}),
]);

const password = await bcrypt.hash(
  "Password@123",
  12
);

/*
 * Demo accounts
 *
 * Roles:
 * student
 * mentor
 * hod
 */

const studentUser = await User.create({
  name: "Aarav Sharma",
  email: "aarav@student.edu",
  password,
  role: "student",
  usn: "1MS22CS001",
  department:
    "Computer Science & Engineering",
  designation: "Student",
});

const mentorUser = await User.create({
  name: "Dr. Rajesh Kumar",
  email: "rajesh@mentorconnect.edu",
  password,
  role: "mentor",
  department:
    "Computer Science & Engineering",
  designation: "Mentor",
});

const hodUser = await User.create({
  name: "Dr. Meena Joshi",
  email: "hod@mentorconnect.edu",
  password,
  role: "hod",
  department:
    "Computer Science & Engineering",
  designation: "Head of Department",
});

/*
 * Create student records
 */

for (const [
  usn,
  name,
  dept,
  year,
  mentor,
  total,
  backlog,
] of students) {
  await Student.create({
    usn,
    name,
    dept,
    year,
    mentor,

    cie1: 80,
    cie2: 78,
    cie3: 82,
    final: 80,
    set: 75,

    total,

    grade:
      total >= 80
        ? "A"
        : total >= 70
        ? "B+"
        : "C",

    backlog,

    subjects: [],

    user:
      usn === "1MS22CS001"
        ? studentUser._id
        : undefined,

    marksUpdatedBy:
      mentorUser.name,
  });
}

/*
 * Create mentor records
 */

await Mentor.insertMany([
  {
    mentorId: "M001",
    name: "Dr. Rajesh Kumar",
    students: 20,
    performance: 8.2,
    status: "Active",
    lastActive: "2026-08-20",
    email: "rajesh.kumar@mentorconnect.edu",
  },

  {
    mentorId: "M002",
    name: "Prof. Priya Sharma",
    students: 18,
    performance: 8.5,
    status: "Active",
    lastActive: "2026-08-21",
    email: "priya.sharma@mentorconnect.edu",
  },

  {
    mentorId: "M003",
    name: "Dr. Amit Patel",
    students: 22,
    performance: 8.1,
    status: "Active",
    lastActive: "2026-08-22",
    email: "amit.patel@mentorconnect.edu",
  },

  {
    mentorId: "M004",
    name: "Prof. Sneha Reddy",
    students: 19,
    performance: 8.4,
    status: "Active",
    lastActive: "2026-08-23",
    email: "sneha.reddy@mentorconnect.edu",
  },

  {
    mentorId: "M005",
    name: "Dr. Vikram Singh",
    students: 16,
    performance: 7.9,
    status: "Active",
    lastActive: "2026-08-24",
    email: "vikram.singh@mentorconnect.edu",
  },
]);

/*
 * Mentoring sessions
 */

await Session.insertMany([
  {
    title: "Monthly Mentor Review",
    date: "2026-08-22",
    time: "10:30",
    owner: "Dr. Rajesh Kumar",
    status: "Scheduled",
  },

  {
    title: "Student Progress Follow-up",
    date: "2026-08-24",
    time: "14:00",
    owner: "Prof. Priya Sharma",
    status: "Scheduled",
  },

  {
    title: "Department Academic Meeting",
    date: "2026-08-28",
    time: "11:00",
    owner: "HOD Office",
    status: "Scheduled",
  },
]);

/*
 * Notifications
 */

await Notification.insertMany([
  {
    title: "Performance review window is open",
    text: "Update CIE and final marks before the monthly review.",
    type: "Academic",
  },

  {
    title: "Mentoring follow-up required",
    text: "Review pending student progress and update the mentoring record.",
    type: "Mentoring",
  },

  {
    title: "Mentoring report submitted",
    text: "Prof. Priya Sharma submitted the August mentoring report.",
    type: "Report",
    read: true,
  },
]);

/*
 * Tasks
 */

await Task.insertMany([
  {
    title: "Review pending performance records",
    due: "2026-08-20",
    owner: "Mentor",
    priority: "High",
  },

  {
    title: "Complete monthly mentoring report",
    due: "2026-08-25",
    owner: "Mentor",
    priority: "Medium",
  },

  {
    title: "Review student progress",
    due: "2026-08-29",
    owner: "HOD",
    priority: "High",
    done: false,
  },
]);

/*
 * Reports
 */

await Report.insertMany([
  {
    title: "Department Performance Report",
    category: "Academic",
    date: "2026-08-18",
    owner: "HOD",
    status: "Ready",
  },

  {
    title: "Mentoring Activity Report",
    category: "Mentoring",
    date: "2026-08-17",
    owner: "Mentor Office",
    status: "Ready",
  },

  {
    title: "At-Risk Student Report",
    category: "Student Support",
    date: "2026-08-15",
    owner: "Mentor Office",
    status: "Review",
  },
]);

console.log(
  "Seed complete."
);

console.log(
  "Demo password: Password@123"
);

console.log(
  "Available roles: student, mentor, hod"
);

process.exit(0);