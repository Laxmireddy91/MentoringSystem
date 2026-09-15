import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import JSZip from "jszip";

import Sidebar from "../components/Sidebar";
import Messages from "../components/Messages";
import api from "../api";

/* =========================================================
   HELPERS
========================================================= */

function download(
  name,
  content,
  type = "text/csv"
) {
  const blob = new Blob([content], {
    type,
  });

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;
  link.download = name;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

function csv(rows) {
  if (!rows || !rows.length) {
    return "";
  }

  const keys = Object.keys(rows[0]);

  return [
    keys.join(","),
    ...rows.map((row) =>
      keys
        .map(
          (key) =>
            `"${String(
              row[key] ?? ""
            ).replaceAll('"', '""')}"`
        )
        .join(",")
    ),
  ].join("\n");
}

function average(values) {
  const numbers = values
    .map(Number)
    .filter((value) =>
      Number.isFinite(value)
    );

  if (!numbers.length) {
    return 0;
  }

  return Math.round(
    numbers.reduce(
      (sum, value) =>
        sum + value,
      0
    ) / numbers.length
  );
}

function safeId(item) {
  return (
    item?.id ||
    item?._id ||
    ""
  );
}

function normalizeRecord(item) {
  if (!item) return item;

  return {
    ...item,
    id: safeId(item),
  };
}

function blankMentorshipRow() {
  return {
    date: "",
    code: "",
    details: "",
    actionTaken: "",
    studentSigned: false,
    mentorSigned: false,
  };
}

function blankBacklogRow() {
  return {
    courseName: "",
    yearOfPass: "",
    extMarks: "",
    remarks: "",
  };
}

function reportDraft(student) {
  const mentorship = Array.isArray(student?.mentorshipRecords)
    ? student.mentorshipRecords.slice(0, 6).map((row) => ({
        ...blankMentorshipRow(),
        ...row,
      }))
    : [];

  const backlogs = Array.isArray(student?.backlogRecords)
    ? student.backlogRecords.slice(0, 20).map((row) => ({
        ...blankBacklogRow(),
        ...row,
      }))
    : [];

  const subjects = (Array.isArray(student?.subjects) ? student.subjects : []).map((subject) => ({
    code: subject?.code ?? "",
    subject: subject?.subject ?? "",
    cie1: subject?.cie1 ?? "",
    cie2: subject?.cie2 ?? "",
    cie3: subject?.cie3 ?? "",
    beforeRvSee: subject?.beforeRvSee ?? "",
    afterRvSee: subject?.afterRvSee ?? "",
    final: subject?.final ?? "",
    set: subject?.set ?? "",
    total: subject?.total ?? subjectCalculatedTotal(subject),
    grade: ["Pass", "Fail"].includes(subject?.grade)
      ? subject.grade
      : gradeFromTotal(subject?.total ?? subjectCalculatedTotal(subject)),
    _id: subject?._id,
    id: subject?.id,
  }));

  const subjectTotals = subjects
    .map((subject) => Number(subject.total))
    .filter((value) => Number.isFinite(value));

  const derivedTotalMarks = subjectTotals.length
    ? subjectTotals.reduce((sum, value) => sum + value, 0)
    : "";

  const derivedPercentage = subjectTotals.length
    ? Number(((derivedTotalMarks / (subjectTotals.length * 100)) * 100).toFixed(2))
    : "";

  return {
    name: student?.name ?? "",
    usn: student?.usn ?? "",
    dept: student?.dept ?? "",
    year: student?.year ?? "",
    mentor: student?.mentor ?? "",
    subjects,
    mentorshipRecords: Array.from({ length: 6 }, (_, index) =>
      mentorship[index] || blankMentorshipRow()
    ),
    backlogRecords: Array.from({ length: 6 }, (_, index) =>
      backlogs[index] || blankBacklogRow()
    ),
    sgpa: student?.sgpa ?? "",
    cgpa: student?.cgpa ?? "",
    onlineCoursesAttended: Boolean(Number(student?.onlineCoursesAttended || 0)),
    totalMarks: student?.totalMarks ?? derivedTotalMarks,
    percentage: student?.percentage ?? derivedPercentage,
  };
}

function assetUrl(filePath = "") {
  if (!filePath) return "";
  if (/^https?:\/\//i.test(filePath)) return filePath;
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  return `${apiBase.replace(/\/api\/?$/, "")}${filePath.startsWith("/") ? filePath : `/${filePath}`}`;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read the selected file"));
    reader.readAsDataURL(file);
  });
}

/* =========================================================
   ROLE INFORMATION
========================================================= */

const roleInfo = {
  student: {
    label: "Student",
    title: "Student Dashboard",
    accent: "blue",
    quote:
      "Your progress is built one consistent step at a time.",
  },

  mentor: {
    label: "Mentor",
    title: "Mentor Dashboard",
    accent: "purple",
    quote:
      "Guide progress, record evidence, and keep every student connected.",
  },

  hod: {
    label: "Head of Department",
    title: "Head of Department Dashboard",
    accent: "violet",
    quote:
      "Department insight becomes meaningful when it leads to action.",
  },


};

/* =========================================================
   EMPTY DATA
========================================================= */

const emptyData = {
  students: [],
  mentors: [],
  sessions: [],
  notifications: [],
  reports: [],
  tasks: [],
  profiles: {},
  stats: {},
};

/* =========================================================
   SUBJECT HELPERS
========================================================= */

function subjectRecords(student) {
  if (
    Array.isArray(student?.subjects)
  ) {
    return student.subjects;
  }

  return [];
}

function gradeFromTotal(total) {
  const value = Number(total);
  if (!Number.isFinite(value) || value <= 0) return "";
  return value >= 40 ? "Pass" : "Fail";
}

function subjectCalculatedTotal(subject = {}) {
  const values = [
    subject.cie1,
    subject.cie2,
    subject.cie3,
    subject.final,
    subject.set,
  ].map(Number);

  const hasAnyMark = values.some((value) => Number.isFinite(value) && value > 0);
  if (!hasAnyMark) return "";

  return Math.round(values.reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0) / 5);
}

/* =========================================================
   MAIN DASHBOARD
========================================================= */

export default function Dashboard({
  role,
  section = "overview",
}) {
  const navigate = useNavigate();

  const info =
    roleInfo[role] ||
    roleInfo.student;

  const [data, setData] =
    useState(emptyData);

  const [tab, setTab] =
    useState(section);

  const [search, setSearch] =
    useState("");

const [studentPage, setStudentPage] =
  useState(1);

const studentsPerPage = 10;
const [mentorPage, setMentorPage] =
  useState(1);

const mentorsPerPage = 10;
  const [toast, setToast] =
    useState("");

  const [modal, setModal] =
    useState(null);

const [help, setHelp] = useState(false);
const [chatMessages, setChatMessages] = useState([
  {
    from: "bot",
    text: "Hi! I'm MentorConnect Help. Ask me about the dashboard, reports, sessions, performance, achievements, notifications, or profile.",
  },
]);
const [chatInput, setChatInput] = useState("");

const faqAnswers = [
  {
    keywords: ["dashboard", "home", "overview"],
    answer:
      "The Dashboard gives you a quick overview of your academic information, sessions, notifications, performance, and other important updates.",
  },
  {
    keywords: ["report", "reports"],
    answer:
      "Open Reports Centre to view or manage student reports and supporting documents. Students can upload certificates and achievements there.",
  },
  {
    keywords: ["achievement", "certificate", "document", "upload"],
    answer:
      "You can upload certificates and achievement documents from Reports Centre. Multiple documents can be selected and uploaded together.",
  },
  {
    keywords: ["session", "meeting", "mentor"],
    answer:
      "Sessions contain mentoring meeting information. Check the Sessions or Schedule section to view available mentoring session details.",
  },
  {
    keywords: ["performance", "marks", "cie", "grade", "academic"],
    answer:
      "Performance and Academic sections show the student's academic progress, marks, subjects, and related performance information.",
  },
  {
    keywords: ["notification", "notifications", "alert"],
    answer:
      "Notifications show important updates and messages related to your mentoring activities and academic information.",
  },
  {
    keywords: ["profile", "personal", "details"],
    answer:
      "Open Profile to view or update the information available for your account.",
  },
  {
    keywords: ["risk", "at risk"],
    answer:
      "The Student Risk Monitor uses rule-based analysis of academic information to identify students who may need additional attention.",
  },
  {
    keywords: ["help", "what can you do", "faq"],
    answer:
      "I can answer common questions about Dashboard, Reports, Achievements, Sessions, Performance, Notifications, Profile, and Student Risk Monitor.",
  },
];

const getFaqAnswer = (question) => {
  const text = question.toLowerCase().trim();

  if (!text) {
    return "Please type a question first.";
  }

  const match = faqAnswers.find((faq) =>
    faq.keywords.some((keyword) => text.includes(keyword))
  );

  if (match) {
    return match.answer;
  }

  return "Sorry, I don't have an answer for that yet. Try asking about Dashboard, Reports, Achievements, Sessions, Performance, Notifications, Profile, or Risk Monitor.";
};

const sendChatMessage = () => {
  const question = chatInput.trim();

  if (!question) return;

  const answer = getFaqAnswer(question);

  setChatMessages((current) => [
    ...current,
    {
      from: "user",
      text: question,
    },
    {
      from: "bot",
      text: answer,
    },
  ]);

  setChatInput("");
};



  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [analytics, setAnalytics] =
    useState(null);

const [leaderboardYear, setLeaderboardYear] =
  useState("All");

const [leaderboardSection, setLeaderboardSection] =
  useState("All");

const [riskStudents, setRiskStudents] =
  useState([]);

const [riskLoading, setRiskLoading] =
  useState(false);

const [riskError, setRiskError] =
  useState("");

  /* =======================================================
     LOAD DASHBOARD
  ======================================================= */

  const loadDashboard =
    async () => {
      try {
        setLoading(true);

        const response =
          await api.workspace.dashboard();

        setData({
          ...emptyData,
          ...response,

          students:
            response.students?.map(
              normalizeRecord
            ) || [],

          mentors:
            response.mentors?.map(
              normalizeRecord
            ) || [],

          sessions:
            response.sessions?.map(
              normalizeRecord
            ) || [],

          notifications:
            response.notifications?.map(
              normalizeRecord
            ) || [],

          reports:
            response.reports?.map(
              normalizeRecord
            ) || [],

          tasks:
            response.tasks?.map(
              normalizeRecord
            ) || [],
        });
      } catch (error) {
        console.error(
          "Dashboard loading error:",
          error
        );

        if (
          error.message
            .toLowerCase()
            .includes("authentication") ||
          error.message
            .toLowerCase()
            .includes("token") ||
          error.message
            .toLowerCase()
            .includes("unauthorized")
        ) {
          localStorage.removeItem(
            "mentorconnect_token"
          );

          localStorage.removeItem(
            "mentorconnect_user"
          );

          navigate("/login", {
            replace: true,
          });

          return;
        }

        notify(
          error.message ||
            "Unable to load dashboard"
        );
      } finally {
        setLoading(false);
      }
    };


    const loadRiskStudents =
  async () => {
    if (
      role !== "mentor" &&
      role !== "hod"
    ) {
      return;
    }

    try {
      setRiskLoading(true);
      setRiskError("");

      const response =
        await api.risk.allStudents();

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Unable to load student risk analysis."
        );
      }

      setRiskStudents(
        Array.isArray(
          response.students
        )
          ? response.students
          : []
      );
    } catch (error) {
      console.error(
        "Risk analysis error:",
        error
      );

      setRiskError(
        error?.message ||
          "Unable to load student risk analysis."
      );
    } finally {
      setRiskLoading(false);
    }
  };


  useEffect(() => {
  if (
    role === "mentor" ||
    role === "hod"
  ) {
    loadRiskStudents();
  }
}, [role]);
  /* =======================================================
     LOAD DASHBOARD ON OPEN
  ======================================================= */

  useEffect(() => {
    loadDashboard();
  }, [role]);

  /* =======================================================
     UPDATE ACTIVE TAB
  ======================================================= */

  useEffect(() => {
    setTab(section);
  }, [section]);

  /* =======================================================
     TOAST
  ======================================================= */

  const notify = (message) => {
    setToast(message);

    window.clearTimeout(
      window.__mentorConnectToast
    );

    window.__mentorConnectToast =
      window.setTimeout(() => {
        setToast("");
      }, 2500);
  };

  /* =======================================================
     NAVIGATION
  ======================================================= */

  const go = (target) => {
    setTab(target);

    navigate(
      `/${role}${
        target === "overview"
          ? ""
          : `/${target}`
      }`
    );
  };

  /* =======================================================
     REFRESH
  ======================================================= */

  const refreshDashboard =
    async () => {
      try {
        const response =
          await api.workspace.dashboard();

        setData({
          ...emptyData,
          ...response,

          students:
            response.students?.map(
              normalizeRecord
            ) || [],

          mentors:
            response.mentors?.map(
              normalizeRecord
            ) || [],

          sessions:
            response.sessions?.map(
              normalizeRecord
            ) || [],

          notifications:
            response.notifications?.map(
              normalizeRecord
            ) || [],

          reports:
            response.reports?.map(
              normalizeRecord
            ) || [],

          tasks:
            response.tasks?.map(
              normalizeRecord
            ) || [],
        });
      } catch (error) {
        console.error(error);

        notify(
          error.message ||
            "Unable to refresh dashboard"
        );
      }
    };

  /* =======================================================
     ANALYTICS
  ======================================================= */

  useEffect(() => {
    if (
      role !== "hod"
  
    ) {
      return;
    }

    const loadAnalytics =
      async () => {
        try {
          const response =
            await api.workspace.analytics();

          setAnalytics(response);
        } catch (error) {
          console.error(
            "Analytics error:",
            error
          );
        }
      };

    loadAnalytics();
  }, [role]);

  /* =======================================================
     COUNTS
  ======================================================= */



  /* =======================================================
   COUNTS
======================================================= */

const counts = useMemo(() => {
  const students = data.students || [];
  const mentors = data.mentors || [];

  return {
    students: students.length,

    mentors: mentors.length,

    performance: average(
      students.map((student) => student.total)
    ),

    backlog: students.reduce(
      (sum, student) =>
        sum + Number(student.backlog || 0),
      0
    ),
  };
}, [data.students, data.mentors]);

const leaderboardStudents = useMemo(() => {
const students = data.students || [];

  return students
    .filter((student) => {
      const yearMatch =
        leaderboardYear === "All" ||
        student.year === leaderboardYear;

      const sectionMatch =
        leaderboardSection === "All" ||
        String(student.section || "").toUpperCase() ===
          leaderboardSection;

      return yearMatch && sectionMatch;
    })
    .map((student) => {
      const total = Number(student.total || 0);

      return {
        ...student,
        leaderboardScore: total,
      };
    })
    .filter(
      (student) =>
        Number.isFinite(student.leaderboardScore)
    )
    .sort(
      (a, b) =>
        b.leaderboardScore -
        a.leaderboardScore
    )
    .slice(0, 10);
}, [
  data.students,
  leaderboardYear,
  leaderboardSection,
]);
    

   
  /* =======================================================
     TABS
  ======================================================= */

const studentTabs = [
  "overview",
  "academic-records",
  "schedule",
  "reports",
  "notifications",
  "messages",
  "tasks",
  "profile",
];

  const mentorTabs = [
    "overview",
    "students",
    "performance",
    "sessions",
    "messages",
    "reports",
    "profile",
  ];

const hodTabs = [
  "overview",
  "analytics",
  "mentors",
  "student-performance",
  "students",
  "reports",
  "profile",
];



  const tabs =
    {
      student: studentTabs,
      mentor: mentorTabs,
      hod: hodTabs,

    }[role] ||
    studentTabs;

  const labels = {
    "academic-records":
      "Academic Records",

    "student-performance":
      "Student Performance",

    students:
      role === "mentor"
        ? "My Students"
        : "Student Management",

    mentors: "Mentor Data",

    performance:
      "Performance Report",

    sessions:
      "Mentoring Sessions",

    analytics:
    "Department Analytics",

    departments:
      "Department Analytics",

    faculty:
      "Faculty Overview",

    profile:
      "My Profile",

    reports:
      "Reports Centre",

    notifications:
      "Notifications",

    tasks:
      "Task Tracker",

    schedule:
      "Schedule",
  };

  /* =======================================================
     SEARCH
  ======================================================= */

  const filteredStudents =
    data.students.filter(
      (student) =>
        Object.values(student)
          .join(" ")
          .toLowerCase()
          .includes(
            search.toLowerCase()
          )
    );

    const totalStudentPages =
  Math.ceil(
    filteredStudents.length /
      studentsPerPage
  );

const paginatedStudents =
  filteredStudents.slice(
    (studentPage - 1) *
      studentsPerPage,
    studentPage *
      studentsPerPage
  );



  const filteredMentors =
    data.mentors.filter(
      (mentor) =>
        Object.values(mentor)
          .join(" ")
          .toLowerCase()
          .includes(
            search.toLowerCase()
          )
    );


    const totalMentorPages =
  Math.ceil(
    filteredMentors.length /
      mentorsPerPage
  );

const paginatedMentors =
  filteredMentors.slice(
    (mentorPage - 1) *
      mentorsPerPage,
    mentorPage *
      mentorsPerPage
  );

  /* =======================================================
     EXPORT
  ======================================================= */

  function exportCurrent() {
    const rows =
      data.students || [];

    download(
      `${role}-mentorconnect-students.csv`,
      csv(rows)
    );

    notify(
      "CSV exported successfully"
    );
  }

  /* =======================================================
     ADD STUDENT
  ======================================================= */

  function addStudent() {
    setModal({
      type: "student",

      item: {
        name: "",
        usn: "",
        phone: "",
        dept:
          "Computer Science & Engineering",
        year: "3rd Year",
        section: "A",
        mentor:
          role === "mentor"
            ? data.profiles?.mentor
                ?.name || ""
            : "",
        cie1: 0,
        cie2: 0,
        cie3: 0,
        final: 0,
        set: 0,
        total: 0,
        grade: "",
        backlog: 0,
        parentName: "",
parentRelation: "",
parentPhone: "",
parentEmail: "",
emergencyContact: "",

        subjects: [],
      },
    });
  }

  /* =======================================================
     SAVE STUDENT
  ======================================================= */

  async function saveStudent(item) {
    try {
      setSaving(true);

      const id =
        safeId(item);

      const payload = {
        name: item.name,
        usn: item.usn,
        phone: item.phone,
        parentName: item.parentName || "",
parentRelation: item.parentRelation || "",
parentPhone: item.parentPhone || "",
parentEmail: item.parentEmail || "",
emergencyContact: item.emergencyContact || "",
        dept: item.dept,
        year: item.year,
        section: item.section || "A",
        mentor: item.mentor,
        cie1:
          Number(
            item.cie1 || 0
          ),
        cie2:
          Number(
            item.cie2 || 0
          ),
        cie3:
          Number(
            item.cie3 || 0
          ),
        final:
          Number(
            item.final || 0
          ),
        set:
          Number(
            item.set || 0
          ),
        total:
          Number(
            item.total || 0
          ),
        grade:
          item.grade || "",
        backlog:
          Number(
            item.backlog || 0
          ),
        subjects:
          item.subjects || [],
      };

      if (id) {
        await api.students.update(
          id,
          payload
        );
      } else {
        await api.students.create(
          payload
        );
      }

      await refreshDashboard();

      setModal(null);

      notify(
        "Student saved successfully"
      );
    } catch (error) {
      console.error(error);

      notify(
        error.message ||
          "Unable to save student"
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     DELETE STUDENT
  ======================================================= */

  async function deleteStudent(
    id
  ) {
    if (role === "mentor") {
      notify(
        "Mentors cannot delete student records"
      );
      return;
    }

    if (
      !window.confirm(
        "Delete this student record?"
      )
    ) {
      return;
    }

    try {
      setSaving(true);

      await api.students.delete(
        id
      );

      await refreshDashboard();

      notify(
        "Student deleted successfully"
      );
    } catch (error) {
      console.error(error);

      notify(
        error.message ||
          "Unable to delete student"
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     ADD SUBJECT
  ======================================================= */

  async function addSubject(
    studentId
  ) {
    const student =
      data.students.find(
        (item) =>
          safeId(item) ===
          studentId
      );

    if (!student) {
      return;
    }

    const subjects = [
      ...subjectRecords(student),

      {
        subject:
          "New Subject",

        cie1: 0,
        cie2: 0,
        cie3: 0,
        final: 0,
        set: 0,
        total: 0,
        grade: "F",
      },
    ];

    try {
      setSaving(true);

      await api.students.updateSubjects(
        studentId,
        subjects
      );

      await refreshDashboard();

      notify(
        "New subject added"
      );
    } catch (error) {
      console.error(error);

      notify(
        error.message ||
          "Unable to add subject"
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     UPDATE SUBJECT
  ======================================================= */

  async function updateSubject(
    studentId,
    subjectId,
    key,
    value
  ) {
    const student =
      data.students.find(
        (item) =>
          safeId(item) ===
          studentId
      );

    if (!student) {
      return;
    }

    const currentSubjects =
      subjectRecords(student);

    const subjects =
      currentSubjects.map(
        (subject) => {
          const currentId =
            safeId(subject);

          if (
            currentId !==
              subjectId &&
            currentId !==
              String(subjectId)
          ) {
            return subject;
          }

          return {
            ...subject,

            [key]:
              key === "subject"
                ? value
                : Number(
                    value || 0
                  ),
          };
        }
      );

    try {
      await api.students.updateSubjects(
        studentId,
        subjects
      );

      await refreshDashboard();
    } catch (error) {
      console.error(error);

      notify(
        error.message ||
          "Unable to update marks"
      );
    }
  }

  /* =======================================================
     SAVE DIGITAL PERFORMANCE REPORT
  ======================================================= */

  async function savePerformanceReport(studentId, report) {
    try {
      setSaving(true);

      await api.students.updatePerformanceReport(
        studentId,
        report
      );

      await refreshDashboard();
      notify("Performance report saved successfully");
      return true;
    } catch (error) {
      console.error(error);
      notify(error.message || "Unable to save performance report");
      return false;
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     REMOVE SUBJECT
  ======================================================= */

  async function removeSubject(
    studentId,
    subjectId
  ) {
    if (
      !window.confirm(
        "Remove this subject from the academic record?"
      )
    ) {
      return;
    }

    const student =
      data.students.find(
        (item) =>
          safeId(item) ===
          studentId
      );

    if (!student) {
      return;
    }

    const subjects =
      subjectRecords(
        student
      ).filter(
        (subject) =>
          safeId(subject) !==
            subjectId &&
          safeId(subject) !==
            String(subjectId)
      );

    try {
      setSaving(true);

      await api.students.updateSubjects(
        studentId,
        subjects
      );

      await refreshDashboard();

      notify(
        "Subject removed"
      );
    } catch (error) {
      console.error(error);

      notify(
        error.message ||
          "Unable to remove subject"
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     ADD MENTOR
  ======================================================= */

  function addMentor() {
    setModal({
      type: "mentor",

      item: {
        mentorId: "",
        name: "",
        students: 0,
        performance: 0,
        lastActive:
          new Date()
            .toISOString()
            .slice(0, 10),
        status: "Active",
        email: "",
      },
    });
  }

  /* =======================================================
     SAVE MENTOR
  ======================================================= */

  async function saveMentor(
    item
  ) {
    try {
      setSaving(true);

      const id =
        safeId(item);

      const payload = {
        mentorId:
          item.mentorId,
        name: item.name,
        students:
          Number(
            item.students || 0
          ),
        performance:
          Number(
            item.performance ||
              0
          ),
        lastActive:
          item.lastActive,
        status:
          item.status ||
          "Active",
        email:
          item.email,
      };

      if (id) {
        await api.mentors.update(
          id,
          payload
        );
      } else {
        await api.mentors.create(
          payload
        );
      }

      await refreshDashboard();

      setModal(null);

      notify(
        "Mentor saved successfully"
      );
    } catch (error) {
      console.error(error);

      notify(
        error.message ||
          "Unable to save mentor"
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     DELETE MENTOR
  ======================================================= */

  async function deleteMentor(
    id
  ) {
    if (
      !window.confirm(
        "Delete this mentor?"
      )
    ) {
      return;
    }

    try {
      setSaving(true);

      await api.mentors.delete(
        id
      );

      await refreshDashboard();

      notify(
        "Mentor deleted successfully"
      );
    } catch (error) {
      console.error(error);

      notify(
        error.message ||
          "Unable to delete mentor"
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     SAVE SESSION
  ======================================================= */

  async function saveSession(
    item
  ) {
    try {
      setSaving(true);

      const id =
        safeId(item);

      const payload = {
        title: item.title,
        date: item.date,
        time: item.time,
        owner:
          item.owner ||
          data.profiles?.[role]
            ?.name ||
          info.label,
        status:
          item.status ||
          "Scheduled",
      };

      if (id) {
        await api.sessions.update(
          id,
          payload
        );
      } else {
        await api.sessions.create(
          payload
        );
      }

      await refreshDashboard();

      setModal(null);

      notify(
        "Session saved successfully"
      );
    } catch (error) {
      console.error(error);

      notify(
        error.message ||
          "Unable to save session"
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     DELETE SESSION
  ======================================================= */

  async function deleteSession(
    id
  ) {
    if (
      !window.confirm(
        "Cancel this mentoring session?"
      )
    ) {
      return;
    }

    try {
      setSaving(true);

      await api.sessions.delete(
        id
      );

      await refreshDashboard();

      notify(
        "Session cancelled"
      );
    } catch (error) {
      console.error(error);

      notify(
        error.message ||
          "Unable to cancel session"
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     MARK NOTIFICATION READ
  ======================================================= */

  async function markNotificationRead(
    id
  ) {
    try {
      await api.notifications.markRead(
        id
      );

      await refreshDashboard();

      notify(
        "Notification marked as read"
      );
    } catch (error) {
      console.error(error);

      notify(
        error.message ||
          "Unable to update notification"
      );
    }
  }

  /* =======================================================
     SAVE TASK
  ======================================================= */

  async function saveTask(
    item
  ) {
    try {
      setSaving(true);

      const id =
        safeId(item);

      const payload = {
        title: item.title,
        due: item.due,
        owner:
          item.owner ||
          info.label,
        priority:
          item.priority ||
          "Medium",
        done:
          Boolean(item.done),
      };

      if (id) {
        await api.tasks.update(
          id,
          payload
        );
      } else {
        await api.tasks.create(
          payload
        );
      }

      await refreshDashboard();

      setModal(null);

      notify(
        "Task saved successfully"
      );
    } catch (error) {
      console.error(error);

      notify(
        error.message ||
          "Unable to save task"
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     TOGGLE TASK
  ======================================================= */

  async function toggleTask(
    task
  ) {
    try {
      await api.tasks.update(
        safeId(task),
        {
          title:
            task.title,
          due:
            task.due,
          owner:
            task.owner,
          priority:
            task.priority,
          done:
            !task.done,
        }
      );

      await refreshDashboard();
    } catch (error) {
      console.error(error);

      notify(
        error.message ||
          "Unable to update task"
      );
    }
  }

  /* =======================================================
     DELETE TASK
  ======================================================= */

  async function deleteTask(
    id
  ) {
    if (
      !window.confirm(
        "Delete this task?"
      )
    ) {
      return;
    }

    try {
      await api.tasks.delete(
        id
      );

      await refreshDashboard();

      notify(
        "Task deleted"
      );
    } catch (error) {
      console.error(error);

      notify(
        error.message ||
          "Unable to delete task"
      );
    }
  }

  /* =======================================================
     SAVE PROFILE
  ======================================================= */

  async function saveProfile(
    event
  ) {
    event.preventDefault();

    try {
      setSaving(true);

      const formData =
        new FormData(
          event.currentTarget
        );

      const profile =
        Object.fromEntries(
          formData.entries()
        );

      const response =
        await api.profiles.update(
          role,
          profile
        );

      if (
        response?.user
      ) {
        localStorage.setItem(
          "mentorconnect_user",
          JSON.stringify(
            response.user
          )
        );
      }

      await refreshDashboard();

      notify(
        "Profile updated successfully"
      );
    } catch (error) {
      console.error(error);

      notify(
        error.message ||
          "Unable to update profile"
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     OVERVIEW
  ======================================================= */

  function Overview() {
    const stats =
      role === "student"
        ? [
            [
              "Total Subjects",
              String(
                data.students[0]
                  ?.subjects
                  ?.length || 0
              ),
              "Current semester",
            ],

            [
              "CIE Average",
              `${counts.performance}%`,
              "Across assessments",
            ],

            [
              "Backlogs",
              String(
                data.students[0]
                  ?.backlog || 0
              ),
              "Needs attention",
            ],
          ]
        : role === "mentor"
        ? [
            [
              "Assigned Students",
              String(
                counts.students
              ),
              "Students visible to you",
            ],

            [
              "Average Performance",
              `${counts.performance}%`,
              "Across students",
            ],

            [
              "Sessions",
              String(
                data.sessions.length
              ),
              "Available sessions",
            ],

            [
              "Follow-ups",
              String(
                data.tasks.filter(
                  (task) =>
                    !task.done
                ).length
              ),
              "Pending actions",
            ],
          ]
        : role === "hod"
        ? [
            [
              "Total Students",
              String(
                counts.students
              ),
              "Department students",
            ],

            [
              "Active Mentors",
              String(
                counts.mentors
              ),
              "Department mentors",
            ],

            [
              "Avg. Performance",
              `${counts.performance}%`,
              "Department average",
            ],

            [
              "Backlogs",
              String(
                counts.backlog
              ),
              "Across department",
            ],
          ]
        : [
            [
              "Total Students",
              String(
                counts.students
              ),
              "Institution-wide data",
            ],

            [
              "Active Mentors",
              String(
                counts.mentors
              ),
              "Mentor records",
            ],

            [
              "Performance",
              `${counts.performance}%`,
              "Overall average",
            ],
          ];

    return (
      <>
        <section className="mc-hero-card">
          <div>
            <span className="mc-eyebrow">
              {info.label.toUpperCase()} PORTAL
            </span>

            <h2>
              {info.title}
            </h2>

            <p>
              “{info.quote}”
            </p>
          </div>

          <button
            className="mc-outline-btn"
            onClick={
              exportCurrent
            }
          >
            Export All Data
          </button>
        </section>

        <div className="mc-stats">
          {stats.map(
            ([title, value, subtitle]) => (
              <div
                className="mc-stat"
                key={title}
              >
                <span>
                  {title}
                </span>

                <strong>
                  {value}
                </strong>

                <small>
                  {subtitle}
                </small>
              </div>
            )
          )}
        </div>

        {role ===
          "student" && (
          <section className="mc-record-preview">
            <div>
              <span className="mc-eyebrow">
                READ-ONLY ACADEMIC VIEW
              </span>

              <h3>
                Your published marks are available
              </h3>

              <p>
                View CIE I, CIE II,
                CIE III, Final,
                SET, Total Marks
                and Grade entered
                by your mentor/HOD.
              </p>
            </div>

            <button
              className="mc-primary"
              onClick={() =>
                go(
                  "academic-records"
                )
              }
            >
              View Academic Records →
            </button>
          </section>
        )}

        <div className="mc-grid-2">

          <section className="mc-card">

            <CardTitle
              title={
                  role === "hod"
                  ? "Department Overview"
                  : role ===
                    "mentor"
                  ? "Mentor Overview"
                  : "Academic Overview"
              }
              sub="Live workspace summary"
            />

            <div className="mc-bars">
              {[
                counts.performance,
                Math.min(100, counts.performance + 7),
                Math.min(100, counts.performance + 12),
                Math.max(45, counts.performance - 5),
                Math.min(100, counts.performance + 4),
                counts.performance,
              ].map(
                (value, index) => (
                  <div
                    key={index}
                  >
                    <div className="mc-bar">
                      <i
                        style={{
                          height: `${value}%`,
                        }}
                      />
                    </div>

                    <small>
                      {
                        [
                          "CIE",
                          "MID",
                          "FINAL",
                          "FINAL",
                          "SET",
                          "TOTAL",
                        ][index]
                      }
                    </small>
                  </div>
                )
              )}

            </div>

          </section>


          <section className="mc-card">

            <CardTitle
              title="Quick Actions"
              sub="Frequently used tools"
            />

            <div className="mc-action-grid">

              {tabs
                .slice(1, 5)
                .map(
                  (item) => (
                    <button
                      key={item}
                      onClick={() =>
                        go(item)
                      }
                    >
                      <b>
                        {labels[item] ||
                          item}
                      </b>

                      <small>
                        Open workspace →
                      </small>
                    </button>
                  )
                )}

            </div>

          </section>

        </div>


        <div className="mc-grid-2">
                  {/* =====================================================
            STUDENT RISK MONITOR
        ====================================================== */}

        {(role === "mentor" || role === "hod") && (
          <section className="mc-card mc-ai-risk-card">

            <CardTitle
            title="Student Risk Monitor - Rule-Based Analysis"
              sub="Early-warning analysis based on academic performance"
            />

            {riskLoading ? (
              <div className="mc-ai-loading">
                Analyzing student performance...
              </div>
            ) : riskError ? (
              <div className="mc-ai-error">
                {riskError}
              </div>
            ) : (
              <>
                {/* Risk Summary */}

                <div className="mc-risk-summary">

                  <div className="mc-risk-box high">
                    <span>High Risk</span>

                    <strong>
                      {
                        riskStudents.filter(
                          (student) =>
                            student.level === "High"
                        ).length
                      }
                    </strong>

                    <small>
                      Immediate attention
                    </small>
                  </div>


                  <div className="mc-risk-box medium">
                    <span>Medium Risk</span>

                    <strong>
                      {
                        riskStudents.filter(
                          (student) =>
                            student.level === "Medium"
                        ).length
                      }
                    </strong>

                    <small>
                      Needs monitoring
                    </small>
                  </div>


                  <div className="mc-risk-box low">
                    <span>Low Risk</span>

                    <strong>
                      {
                        riskStudents.filter(
                          (student) =>
                            student.level === "Low"
                        ).length
                      }
                    </strong>

                    <small>
                      Performing well
                    </small>
                  </div>

                </div>


                {/* Students */}

                {riskStudents.length === 0 ? (
                  <div className="mc-ai-empty">
                    No student risk data available.
                  </div>
                ) : (
                  <div className="mc-ai-risk-list">

                    {riskStudents
                      .filter(
                        (student) =>
                          student.level === "High" ||
                          student.level === "Medium"
                      )
                      .slice(0, 5)
                      .map((student) => (

                        <div
                          className="mc-ai-risk-row"
                          key={student.id}
                        >

                          <div className="mc-ai-student">

                            <strong>
                              {student.name}
                            </strong>

                            <small>
                              {student.usn || "No USN"}
                            </small>

                          </div>


                          <div>
                            <span className="mc-ai-label">
                              Performance
                            </span>

                            <strong>
                              {student.total || 0}/100
                            </strong>
                          </div>


                          <div>
                            <span className="mc-ai-label">
                              Backlogs
                            </span>

                            <strong>
                              {student.backlog || 0}
                            </strong>
                          </div>


                          <div>

                            <span
                              className={
                                `mc-ai-risk-pill ${
                                  student.level === "High"
                                    ? "high"
                                    : "medium"
                                }`
                              }
                            >
                              {student.level === "High"
                                ? "🔴 HIGH"
                                : "🟠 MEDIUM"}
                            </span>

                          </div>

                        </div>

                      ))}

                  </div>
                )}

              </>
            )}

          </section>
        )}

          <section className="mc-card">

            <CardTitle
              title="Recent Activity"
              sub="Latest updates"
            />

            {data.notifications
              .slice(0, 5)
              .map(
                (notification) => (
                  <div
                    className="mc-activity"
                    key={safeId(
                      notification
                    )}
                  >
                    <span>
                      {String(
                        notification.type ||
                          "N"
                      ).slice(0, 1)}
                    </span>

                    <div>
                      <b>
                        {
                          notification.title
                        }
                      </b>

                      <small>
                        {
                          notification.text
                        }
                      </small>
                    </div>

                    <em>
                      {notification.read
                        ? "Read"
                        : "New"}
                    </em>
                  </div>
                )
              )}

          </section>


          <section className="mc-card">

            <CardTitle
              title="Upcoming"
              sub="Your next important dates"
            />

            {data.sessions
              .slice(0, 5)
              .map(
                (session) => (
                  <div
                    className="mc-event"
                    key={safeId(
                      session
                    )}
                  >
                    <div className="mc-date">
                      <b>
                        {session.date
                          ? new Date(
                              session.date
                            ).getDate()
                          : "—"}
                      </b>

                      <small>
                        {session.date
                          ? new Date(
                              session.date
                            ).toLocaleString(
                              "en",
                              {
                                month:
                                  "short",
                              }
                            )
                          : ""}
                      </small>
                    </div>

                    <div>
                      <b>
                        {
                          session.title
                        }
                      </b>

                      <small>
                        {
                          session.time
                        }{" "}
                        •{" "}
                        {
                          session.owner
                        }
                      </small>
                    </div>
                  </div>
                )
              )}

          </section>

        </div>
      </>
    );
  }

  /* =======================================================
     PROFILE
  ======================================================= */

  function Profile() {
    const profile =
      data.profiles?.[role] ||
      {};

    return (
      <section className="mc-card">

        <CardTitle
          title="My Profile"
          sub="Update your account and professional information"
        />

        <form
          className="mc-form"
          onSubmit={
            saveProfile
          }
        >

          <div className="mc-avatar-big">
            {(
              profile.name ||
              info.label
            )
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="mc-form-grid">

            {[
              [
                "name",
                "Full Name",
              ],

              [
                "usn",
                "USN",
              ],

              [
                "email",
                "Email",
              ],

              [
                "phone",
                "Phone",
              ],

              [
                "department",
                "Department",
              ],

              [
                "designation",
                "Designation",
              ],

              [
                "semester",
                "Semester / Year",
              ],
            ].map(
              ([key, label]) => (
                <label
                  key={key}
                >
                  {label}

                  <input
                    name={key}
                    defaultValue={
                      profile[
                        key
                      ] || ""
                    }
                  />
                </label>
              )
            )}

          </div>
          {/* =====================================================
    PARENT / GUARDIAN INFORMATION
===================================================== */}

{role === "student" && (() => {
  const student =
    data.students.find(
      (item) =>
        item.usn &&
        profile.usn &&
        item.usn === profile.usn
    ) ||
    data.students.find(
      (item) =>
        item.name &&
        profile.name &&
        item.name === profile.name
    );

  if (!student) {
    return null;
  }

  return (
    <div
      style={{
        marginTop: "24px",
        paddingTop: "24px",
        borderTop: "1px solid #e5e7eb",
      }}
    >
      <div style={{ marginBottom: "16px" }}>
        <h3
          style={{
            margin: 0,
            fontSize: "18px",
          }}
        >
          👨‍👩‍👧 Parent / Guardian Information
        </h3>

        <p
          style={{
            margin: "6px 0 0",
            color: "#6b7280",
            fontSize: "13px",
          }}
        >
          Guardian information used for student support
          and emergency communication.
        </p>
      </div>

      <div className="mc-form-grid">

        <label>
          Parent / Guardian Name
          <input
            value={student.parentName || ""}
            readOnly
          />
        </label>

        <label>
          Relationship
          <input
            value={student.parentRelation || ""}
            readOnly
          />
        </label>

        <label>
          Parent Phone
          <input
            value={student.parentPhone || ""}
            readOnly
          />
        </label>

        <label>
          Parent Email
          <input
            value={student.parentEmail || ""}
            readOnly
          />
        </label>

        <label>
          Emergency Contact
          <input
            value={student.emergencyContact || ""}
            readOnly
          />
        </label>

      </div>
    </div>
  );
})()}

          <button
            className="mc-primary"
            type="submit"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : "Save Profile"}
          </button>

        </form>

      </section>
    );
  }

  /* =======================================================
     STUDENTS
  ======================================================= */

  function Students({
    mentor = false,
  }) {
    return (
      <section className="mc-card">

        <CardTitle
          title={
            mentor
              ? "My Students"
              : "Student Management"
          }
          sub="Search, review and maintain student academic records"
        >

          {role !==
            "student" && (
            <button
              className="mc-primary"
              onClick={
                addStudent
              }
            >
              + Add Student
            </button>
          )}

        </CardTitle>


        <div className="mc-toolbar">

          <input
            placeholder="Search by name, USN, mentor or department"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />

          <select
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          >
            <option value="">
              All records
            </option>

            <option value="Computer Science">
              CSE
            </option>

            <option value="Information Science">
              ISE
            </option>

            <option value="Electronics">
              ECE
            </option>
          </select>

        </div>


        {loading ? (
          <Loading />
        ) : (
          <div className="mc-table-wrap">

            <table>

              <thead>
                <tr>
                  <th>
                    USN
                  </th>

                  <th>
                    Student
                  </th>

                  <th>
                    Mentor
                  </th>

                  <th>
                    Performance
                  </th>

                  <th>
                    Backlogs
                  </th>

                  <th>
                    Grade
                  </th>

                  <th>
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>

                {paginatedStudents.map(
                  (student) => (
                    <tr
                      key={safeId(
                        student
                      )}
                    >

                      <td>
                        <b>
                          {student.usn ||
                            "—"}
                        </b>
                      </td>

                      <td>
                        <b>
                          {
                            student.name
                          }
                        </b>

                        <small>
                          {
                            student.year
                          }{" "}
                          •{" "}
                          {
                            student.dept
                          }
                        </small>
                      </td>

                      <td>
                        {
                          student.mentor ||
                          "—"
                        }
                      </td>

                      <td>
                        {
                          student.total ??
                          0
                        }
                        /100
                      </td>

                      <td>
                        {
                          student.backlog ??
                          0
                        }
                      </td>

                      <td>
                        <span className="mc-grade">
                          {
                            student.grade ||
                            "—"
                          }
                        </span>
                      </td>

                      <td>

                        <button
                          className="mc-link"
                          onClick={() =>
                            setModal({
                              type:
                                "student",
                              item:
                                student,
                            })
                          }
                        >
                          Edit
                        </button>

                        {role !==
                          "mentor" && (
                          <button
                            className="mc-danger-link"
                            onClick={() =>
                              deleteStudent(
                                safeId(
                                  student
                                )
                              )
                            }
                          >
                            Delete
                          </button>
                        )}

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>
          </div>
        )}

        {totalStudentPages > 1 && (
          <div className="mc-pagination">
            <button
              className="mc-link"
              disabled={studentPage === 1}
              onClick={() =>
                setStudentPage(
                  (page) => page - 1
                )
              }
            >
              Previous
            </button>

            <span>
              Page {studentPage} of {totalStudentPages}
            </span>

            <button
              className="mc-link"
              disabled={
                studentPage === totalStudentPages
              }
              onClick={() =>
                setStudentPage(
                  (page) => page + 1
                )
              }
            >
              Next
            </button>
          </div>
        )}

      </section>

    );
  }

  /* =======================================================
     ACADEMIC RECORDS
  ======================================================= */

  function AcademicRecords() {
    return <Performance />;
  }

  /* =======================================================
     PERFORMANCE
  ======================================================= */

  function Performance() {
    const editable = role === "student" || role === "mentor" || role === "hod";

    const visible = role === "student"
      ? data.students.filter(
          (student) =>
            (student.usn && student.usn === data.profiles?.student?.usn) ||
            (student.name && student.name === data.profiles?.student?.name)
        )
      : filteredStudents;

    const defaultStudent = visible[0] || null;
    const [selectedId, setSelectedId] = useState(safeId(defaultStudent));
    const [draft, setDraft] = useState(() => reportDraft(defaultStudent));

    useEffect(() => {
      const nextId = visible.some((student) => safeId(student) === selectedId)
        ? selectedId
        : safeId(defaultStudent);

      setSelectedId(nextId);

      const selected =
        visible.find((student) => safeId(student) === nextId) || defaultStudent;

      setDraft(reportDraft(selected));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible.length, selectedId, defaultStudent?.id]);

    const selectedStudent =
      visible.find((student) => safeId(student) === selectedId) || defaultStudent;

    const updateDraft = (key, value) => {
      setDraft((current) => ({ ...current, [key]: value }));
    };

    const updateSubjectDraft = (index, key, value) => {
      setDraft((current) => ({
        ...current,
        subjects: current.subjects.map((subject, subjectIndex) =>
          subjectIndex === index
            ? {
                ...subject,
                [key]: [
                  "cie1",
                  "cie2",
                  "cie3",
                  "beforeRvSee",
                  "afterRvSee",
                  "final",
                  "set",
                  "total",
                ].includes(key)
                  ? (value === "" ? "" : Number(value))
                  : value,
              }
            : subject
        ),
      }));
    };

    const addSubjectDraft = () => {
      setDraft((current) => ({
        ...current,
        subjects: [
          ...current.subjects,
          {
            code: "",
            subject: "",
            cie1: "",
            cie2: "",
            cie3: "",
            beforeRvSee: "",
            afterRvSee: "",
            final: "",
            set: "",
            total: "",
            grade: "",
          },
        ],
      }));
    };

    const removeSubjectDraft = (index) => {
      setDraft((current) => ({
        ...current,
        subjects: current.subjects.filter((_, subjectIndex) => subjectIndex !== index),
      }));
    };

    const updateMentorship = (index, key, value) => {
      setDraft((current) => ({
        ...current,
        mentorshipRecords: current.mentorshipRecords.map((row, rowIndex) =>
          rowIndex === index ? { ...row, [key]: value } : row
        ),
      }));
    };

    const updateBacklog = (index, key, value) => {
      setDraft((current) => ({
        ...current,
        backlogRecords: current.backlogRecords.map((row, rowIndex) =>
          rowIndex === index ? { ...row, [key]: value } : row
        ),
      }));
    };

    const clearBacklog = (index) => {
      setDraft((current) => ({
        ...current,
        backlogRecords: current.backlogRecords.filter((_, rowIndex) => rowIndex !== index),
      }));
    };

    const addBacklogDraft = () => {
      setDraft((current) => ({
        ...current,
        backlogRecords: [...current.backlogRecords, blankBacklogRow()],
      }));
    };

    const save = async () => {
      if (!selectedStudent) return;
      await savePerformanceReport(safeId(selectedStudent), draft);
    };

    if (!selectedStudent) {
      return (
        <section className="mc-card mc-digital-report">
          <CardTitle
            title="PERFORMANCE REPORT"
          />
        </section>
      );
    }

    return (
      <section className="mc-card mc-digital-report">
        <CardTitle
          title="PERFORMANCE REPORT"
        >
          <div className="mc-inline-actions">
            <button className="mc-outline-btn" onClick={() => window.print()}>Print Report</button>
            {editable && (
              <button className="mc-primary" onClick={save} disabled={saving}>
                {saving ? "Saving..." : "Save Report"}
              </button>
            )}
          </div>
        </CardTitle>

        {role !== "student" && visible.length > 1 && (
          <div className="mc-report-toolbar">
            <label>
              Select Student
              <select
                value={selectedId}
                onChange={(event) => {
                  const nextStudent = visible.find(
                    (student) => safeId(student) === event.target.value
                  );
                  setSelectedId(value);
                  setDraft(reportDraft(nextStudent));
                }}
              >
                {visible.map((student) => (
                  <option key={safeId(student)} value={safeId(student)}>
                    {student.name || "Unnamed Student"} • {student.usn || "No USN"}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        <div className="mc-report-identity-grid editable-identity">
          <label>
            <span>Student</span>
            <input value={draft.name} onChange={(event) => updateDraft("name", event.target.value)} placeholder="Enter student name" />
          </label>
          <label>
            <span>USN</span>
            <input value={draft.usn} onChange={(event) => updateDraft("usn", event.target.value.toUpperCase())} placeholder="Enter USN" />
          </label>
          <label>
            <span>Department</span>
            <input value={draft.dept} onChange={(event) => updateDraft("dept", event.target.value)} placeholder="Enter department" />
          </label>
          <label>
            <span>Year / Semester</span>
            <input value={draft.year} onChange={(event) => updateDraft("year", event.target.value)} placeholder="Enter year / semester" />
          </label>
          <label>
            <span>Mentor</span>
            <input value={draft.mentor} onChange={(event) => updateDraft("mentor", event.target.value)} placeholder="Enter mentor name" />
          </label>
        </div>

        <ReportSection title="PERFORMANCE REPORT">
          <div className="mc-table-wrap mc-report-table-wrap">
            <table className="mc-digital-report-table editable performance-report-table">
              <thead>
                <tr>
                  <th>Sl. No.</th>
                  <th>Course Code</th>
                  <th>Course Name</th>
                  <th>CIE I</th>
                  <th>CIE II</th>
                  <th>CIE III</th>
                  <th>Before RV SEE</th>
                  <th>After RV SEE</th>
                  <th>Final</th>
                  <th>SET</th>
                  <th>Total (100)</th>
                  <th>Grade</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {draft.subjects.map((subject, index) => {
                  const calculatedSubjectTotal = subjectCalculatedTotal(subject);
                  const shownTotal = subject.total === "" || subject.total === undefined
                    ? calculatedSubjectTotal
                    : subject.total;
                  const shownGrade = subject.grade || gradeFromTotal(shownTotal);

                  return (
                    <tr key={safeId(subject) || `new-${index}`}>
                      <td>{index + 1}</td>
                      <td>
                        <input
                          className="mc-report-input"
                          value={subject.code || ""}
                          onChange={(event) => updateSubjectDraft(index, "code", event.target.value)}
                          placeholder="Enter code"
                        />
                      </td>
                      <td>
                        <input
                          className="mc-report-input subject"
                          value={subject.subject || ""}
                          onChange={(event) => updateSubjectDraft(index, "subject", event.target.value)}
                          placeholder="Enter course name"
                        />
                      </td>
                      {["cie1", "cie2", "cie3", "beforeRvSee", "afterRvSee", "final", "set"].map((key) => (
                        <td key={key}>
                          <input
                            className="mc-report-input number"
                            type="number"
                            min="0"
                            max="100"
                            value={subject[key] ?? ""}
                            onChange={(event) => updateSubjectDraft(index, key, event.target.value)}
                            placeholder="0"
                          />
                        </td>
                      ))}
                      <td>
                        <input
                          className="mc-report-input number"
                          type="number"
                          min="0"
                          max="100"
                          value={subject.total ?? ""}
                          onChange={(event) => updateSubjectDraft(index, "total", event.target.value)}
                          placeholder={calculatedSubjectTotal || "0"}
                        />
                      </td>
                      <td>
                        <select
                          className="mc-report-input grade-select"
                          value={subject.grade || ""}
                          onChange={(event) => updateSubjectDraft(index, "grade", event.target.value)}
                        >
                          <option value="">Select</option>
                          <option value="Pass">Pass</option>
                          <option value="Fail">Fail</option>
                        </select>
                        {!subject.grade && shownGrade && (
                          <small className="mc-inline-hint">Suggested: {shownGrade}</small>
                        )}
                      </td>
                      <td>
                        <button type="button" className="mc-danger-link" onClick={() => removeSubjectDraft(index)}>Remove</button>
                      </td>
                    </tr>
                  );
                })}
                {!draft.subjects.length && (
                  <tr><td colSpan="13" className="mc-empty-cell">No subjects added yet. Click “+ Add Subject” to enter course code, course name and marks details.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <button className="mc-outline-btn mc-add-row" onClick={addSubjectDraft}>+ Add Subject</button>

          <div className="mc-report-inline-fields">
            <label>SGPA<input type="number" min="0" max="10" step="0.01" value={draft.sgpa} onChange={(event) => updateDraft("sgpa", event.target.value)} placeholder="Enter SGPA" /></label>
            <label>CGPA<input type="number" min="0" max="10" step="0.01" value={draft.cgpa} onChange={(event) => updateDraft("cgpa", event.target.value)} placeholder="Enter CGPA" /></label>
            <label>
              Online Courses Attended
              <select value={draft.onlineCoursesAttended ? "yes" : "no"} onChange={(event) => updateDraft("onlineCoursesAttended", event.target.value === "yes")}>
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </label>
          </div>

          <div className="mc-report-total-row">
            <label>
              Total Marks
              <input type="number" min="0" value={draft.totalMarks ?? ""} onChange={(event) => updateDraft("totalMarks", event.target.value)} placeholder="Enter total marks" />
            </label>
            <label>
              Percentage (%)
              <input type="number" min="0" max="100" step="0.01" value={draft.percentage ?? ""} onChange={(event) => updateDraft("percentage", event.target.value)} placeholder="Enter percentage" />
            </label>
          </div>
        </ReportSection>

        <ReportSection title="BACKLOG INFORMATION">
          <div className="mc-table-wrap mc-report-table-wrap">
            <table className="mc-digital-report-table editable">
              <thead><tr><th>Sl. No.</th><th>Course Name</th><th>Year of Pass</th><th>Ext. Marks</th><th>Remarks</th><th>Action</th></tr></thead>
              <tbody>
                {draft.backlogRecords.map((row, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td><input className="mc-report-input" value={row.courseName || ""} onChange={(event) => updateBacklog(index, "courseName", event.target.value)} placeholder="Course name" /></td>
                    <td><input className="mc-report-input" value={row.yearOfPass || ""} onChange={(event) => updateBacklog(index, "yearOfPass", event.target.value)} placeholder="Year" /></td>
                    <td><input className="mc-report-input number" type="number" min="0" max="100" value={row.extMarks || ""} onChange={(event) => updateBacklog(index, "extMarks", event.target.value)} placeholder="Marks" /></td>
                    <td><input className="mc-report-input" value={row.remarks || ""} onChange={(event) => updateBacklog(index, "remarks", event.target.value)} placeholder="Remarks" /></td>
                    <td><button type="button" className="mc-danger-link" onClick={() => clearBacklog(index)}>Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" className="mc-outline-btn mc-add-row" onClick={addBacklogDraft}>+ Add Backlog</button>
        </ReportSection>

        <ReportSection title="MENTORSHIP REPORT">
          <div className="mc-table-wrap mc-report-table-wrap">
            <table className="mc-digital-report-table editable">
              <thead>
                <tr><th>Sl. No.</th><th>Date</th><th>Code</th><th>Mentoring Details</th><th>Action Taken</th><th>Student Sign.</th><th>Mentor Sign.</th></tr>
              </thead>
              <tbody>
                {draft.mentorshipRecords.map((row, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td><input className="mc-report-input" type="date" value={row.date || ""} onChange={(event) => updateMentorship(index, "date", event.target.value)} /></td>
                    <td><input className="mc-report-input" value={row.code || ""} onChange={(event) => updateMentorship(index, "code", event.target.value)} placeholder="CIE-1" /></td>
                    <td><textarea className="mc-report-input report-textarea" value={row.details || ""} onChange={(event) => updateMentorship(index, "details", event.target.value)} placeholder="Enter mentoring details" /></td>
                    <td><textarea className="mc-report-input report-textarea" value={row.actionTaken || ""} onChange={(event) => updateMentorship(index, "actionTaken", event.target.value)} placeholder="Enter action taken" /></td>
                    <td><label className="mc-check"><input type="checkbox" checked={Boolean(row.studentSigned)} onChange={(event) => updateMentorship(index, "studentSigned", event.target.checked)} /> Signed</label></td>
                    <td><label className="mc-check"><input type="checkbox" checked={Boolean(row.mentorSigned)} onChange={(event) => updateMentorship(index, "mentorSigned", event.target.checked)} /> Signed</label></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ReportSection>

      </section>
    );
  }

  /* =======================================================
     SESSIONS
  ======================================================= */

  function Sessions() {
    const profile =
      data.profiles?.[role] ||
      {};

    return (
      <section className="mc-card">

        <CardTitle
          title="Mentoring Sessions"
          sub="Schedule, update and manage mentoring meetings"
        >

          <button
            className="mc-primary"
            onClick={() =>
              setModal({
                type: "session",

                item: {
                  title: "",
                  date: "",
                  time: "10:00",
                  owner:
                    profile.name ||
                    info.label,
                  status:
                    "Scheduled",
                },
              })
            }
          >
            + Schedule Session
          </button>

        </CardTitle>


        <div className="mc-session-grid">

          {data.sessions.map(
            (session) => (
              <div
                className="mc-session"
                key={safeId(
                  session
                )}
              >

                <span>
                  {
                    session.status
                  }
                </span>

                <h3>
                  {
                    session.title
                  }
                </h3>

                <p>
                  {
                    session.date
                  }{" "}
                  at{" "}
                  {
                    session.time
                  }
                </p>

                <small>
                  Owner:{" "}
                  {
                    session.owner
                  }
                </small>

                <div>

                  <button
                    className="mc-link"
                    onClick={() =>
                      setModal({
                        type:
                          "session",
                        item:
                          session,
                      })
                    }
                  >
                    Edit
                  </button>

                  <button
                    className="mc-danger-link"
                    onClick={() =>
                      deleteSession(
                        safeId(
                          session
                        )
                      )
                    }
                  >
                    Cancel
                  </button>

                </div>

              </div>
            )
          )}

        </div>

        {totalMentorPages > 1 && (
          <div className="mc-pagination">
            <button
              className="mc-link"
              disabled={mentorPage === 1}
              onClick={() =>
                setMentorPage(
                  (page) => page - 1
                )
              }
            >
              Previous
            </button>

            <span>
              Page {mentorPage} of {totalMentorPages}
            </span>

            <button
              className="mc-link"
              disabled={
                mentorPage === totalMentorPages
              }
              onClick={() =>
                setMentorPage(
                  (page) => page + 1
                )
              }
            >
              Next
            </button>
          </div>
        )}

      </section>
    );
  }

  /* =======================================================
     MENTORS
  ======================================================= */

  function Mentors() {
    return (
      <section className="mc-card">

        <CardTitle
          title="Mentor Data Access"
          sub="Monitor mentor load, performance and activity"
        >

          <button
            className="mc-primary"
            onClick={
              addMentor
            }
          >
            + New Mentor
          </button>

        </CardTitle>


        <div className="mc-toolbar">

          <input
            placeholder="Search mentor by name or ID"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />

          <select
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          >

            <option value="">
              All Status
            </option>

            <option>
              Active
            </option>

            <option>
              Inactive
            </option>

          </select>

        </div>


        <div className="mc-mentor-cards">

          {paginatedMentors.map(
            (mentor) => (

              
              <div
                className="mc-mentor"
                key={safeId(
                  mentor
                )}
              >

                <div className="mc-mini-avatar">
                  {(
                    mentor.name ||
                    "M"
                  )
                    .split(" ")
                    .map(
                      (part) =>
                        part[0]
                    )
                    .slice(0, 2)
                    .join("")}
                </div>

                <b>
                  {
                    mentor.name
                  }
                </b>

                <small>
                  {
                    mentor.mentorId ||
                    safeId(
                      mentor
                    )
                  }{" "}
                  • Students:{" "}
                  {
                    mentor.students ??
                    0
                  }
                </small>

                <small>
                  Avg. Performance:{" "}
                  {
                    mentor.performance ??
                    0
                  }
                  /10
                </small>

                <span
                  className={`mc-pill ${
                    mentor.status ===
                    "Active"
                      ? "success"
                      : "danger"
                  }`}
                >
                  {
                    mentor.status
                  }
                </span>

                <div>

                  <button
                    className="mc-link"
                    onClick={() =>
                      setModal({
                        type:
                          "mentor",
                        item:
                          mentor,
                      })
                    }
                  >
                    Edit
                  </button>

                  <button
                    className="mc-danger-link"
                    onClick={() =>
                      deleteMentor(
                        safeId(
                          mentor
                        )
                      )
                    }
                  >
                    Delete
                  </button>

                </div>

              </div>
            )
          )}

        </div>


        <div className="mc-table-wrap">

          <table>

            <thead>
              <tr>
                <th>
                  Mentor ID
                </th>

                <th>
                  Name
                </th>

                <th>
                  Students Assigned
                </th>

                <th>
                  Performance
                </th>

                <th>
                  Last Activity
                </th>

                <th>
                  Status
                </th>
              </tr>
            </thead>

            <tbody>

              {paginatedMentors.map(
                (mentor) => (
                  <tr
                    key={safeId(
                      mentor
                    )}
                  >

                    <td>
                      {
                        mentor.mentorId ||
                        safeId(
                          mentor
                        )
                      }
                    </td>

                    <td>
                      {
                        mentor.name
                      }
                    </td>

                    <td>
                      {
                        mentor.students ??
                        0
                      }
                    </td>

                    <td>
                      {
                        mentor.performance ??
                        0
                      }
                      /10
                    </td>

                    <td>
                      {
                        mentor.lastActive ||
                        "—"
                      }
                    </td>

                    <td>
                      {
                        mentor.status ||
                        "—"
                      }
                    </td>

                  </tr>
                )
              )}

            </tbody>

          </table>

        </div>

      </section>
    );
  }

  /* =======================================================
     REPORTS
  ======================================================= */

  function Reports() {
    const visible = role === "student"
      ? data.students.filter(
          (student) =>
            (student.usn && student.usn === data.profiles?.student?.usn) ||
            (student.name && student.name === data.profiles?.student?.name)
        )
      : filteredStudents;

    const [selectedId, setSelectedId] = useState(safeId(visible[0]));
    const selectedStudent =
      visible.find((student) => safeId(student) === selectedId) || visible[0] || null;
    const [draft, setDraft] = useState(() => reportDraft(selectedStudent));
  const [achievement, setAchievement] = useState({
  title: "",
  category: "",
  date: "",
  description: "",
  files: [],
});
    const [uploading, setUploading] = useState(false);
    const [mentorDocuments, setMentorDocuments] = useState([]);

    useEffect(() => {
      if (!visible.some((student) => safeId(student) === selectedId)) {
        setSelectedId(safeId(visible[0]));
      }
    }, [visible.length, selectedId, visible[0]?.id]);

    useEffect(() => {
      const current = visible.find((student) => safeId(student) === selectedId) || visible[0] || null;
      setDraft(reportDraft(current));
    }, [selectedId, visible.length, visible[0]?.id]);

    useEffect(() => {
      let cancelled = false;

      const loadMentorDocuments = async () => {
        if (role !== "mentor" || !selectedStudent) {
          setMentorDocuments([]);
          return;
        }

        setMentorDocuments([]);

        try {
          const response = await api.students.getAchievements(safeId(selectedStudent));
          if (!cancelled) {
            setMentorDocuments(Array.isArray(response?.achievements) ? response.achievements : []);
          }
        } catch (error) {
          console.error("Unable to load student documents for mentor:", error);
          if (!cancelled) {
            setMentorDocuments(Array.isArray(selectedStudent.achievements) ? selectedStudent.achievements : []);
          }
        }
      };

      loadMentorDocuments();

      return () => {
        cancelled = true;
      };
    }, [role, selectedId, selectedStudent?.id]);

    const updateDraft = (key, value) => {
      setDraft((current) => ({ ...current, [key]: value }));
    };

    const saveReportCentre = async () => {
      if (!selectedStudent) return;
      await savePerformanceReport(safeId(selectedStudent), draft);
    };

  const upload = async () => {
  if (!selectedStudent) return;

  if (!achievement.title.trim()) {
    notify("Enter an achievement title");
    return;
  }

  if (!achievement.files.length) {
    notify("Select at least one certificate or document");
    return;
  }

  const oversizedFile = achievement.files.find(
    (file) => file.size > 3 * 1024 * 1024
  );

  if (oversizedFile) {
    notify(`${oversizedFile.name} is larger than 3 MB`);
    return;
  }

  try {
    setUploading(true);

    for (const file of achievement.files) {
      const fileData = await fileToDataUrl(file);

      await api.students.uploadAchievement(
        safeId(selectedStudent),
        {
          title: achievement.title.trim(),
          category: achievement.category.trim(),
          date: achievement.date,
          description: achievement.description.trim(),
          fileName: file.name,
          mimeType: file.type,
          fileData,
        }
      );
    }

    await refreshDashboard();

    setAchievement({
      title: "",
      category: "",
      date: "",
      description: "",
      files: [],
    });

    const input = document.getElementById(
      "achievement-document-upload"
    );

    if (input) {
      input.value = "";
    }

    notify(
      `${achievement.files.length} document${
        achievement.files.length > 1 ? "s" : ""
      } uploaded successfully`
    );
  } catch (error) {
    console.error(error);
    notify(error.message || "Unable to upload achievements");
  } finally {
    setUploading(false);
  }
};

    const removeAchievement = async (achievementId) => {
      if (!selectedStudent || !achievementId) return;
      if (!window.confirm("Remove this achievement and its document?")) return;
      try {
        setUploading(true);
        await api.students.deleteAchievement(safeId(selectedStudent), achievementId);
        await refreshDashboard();
        notify("Achievement removed");
      } catch (error) {
        console.error(error);
        notify(error.message || "Unable to remove achievement");
      } finally {
        setUploading(false);
      }
    };

    if (!selectedStudent) {
      return (
        <section className="mc-card mc-digital-report">
          <CardTitle title="Reports Centre" />
          <div className="mc-achievement-empty"><h4>No student record available.</h4></div>
        </section>
      );
    }

    // Mentor Reports Centre is intentionally document-only. Student uploads
    // are read from the same student record after refresh and are shown here.
    if (role === "mentor") {
      return (
        <section className="mc-card mc-digital-report mc-mentor-reports-centre">
          <CardTitle title="Reports Centre" />

          {visible.length > 1 && (
            <div className="mc-report-toolbar">
              <label>
                Select Student
                <select
                  value={selectedId}
                  onChange={(event) => setSelectedId(event.target.value)}
                >
                  {visible.map((student) => (
                    <option key={safeId(student)} value={safeId(student)}>
                      {student.name || "Unnamed Student"} • {student.usn || "No USN"}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          <div className="mc-report-documents-only">
            <div className="mc-report-documents-header">
              <div>
                <h3>Uploaded Student Documents</h3>
                <p>Certificates and documents uploaded by the selected student are shown here.</p>
              </div>
              <span className="mc-pill">{mentorDocuments.length} document{mentorDocuments.length === 1 ? "" : "s"}</span>
            </div>

            <AchievementList
              achievements={mentorDocuments}
              readOnly={true}
            />

            {!mentorDocuments.length && (
              <div className="mc-achievement-empty">
                <h4>No documents uploaded yet.</h4>
                <p>When the student uploads a certificate or document from their Reports Centre, it will appear here automatically.</p>
              </div>
            )}
          </div>
        </section>
      );
    }

    return (
      <>
        <section className="mc-card mc-digital-report">
          <CardTitle
            title="Reports Centre"
            sub="Enter and edit student information and manage supporting documents."
          >
            <div className="mc-inline-actions">
              <button className="mc-outline-btn" onClick={() => window.print()}>Print</button>
              <button className="mc-primary" onClick={saveReportCentre} disabled={saving}>
                {saving ? "Saving..." : "Save Report Centre"}
              </button>
            </div>
          </CardTitle>

          {role !== "student" && visible.length > 1 && (
            <div className="mc-report-toolbar">
              <label>
                Select Student
                <select
                  value={selectedId}
                  onChange={(event) => setSelectedId(event.target.value)}
                >
                  {visible.map((student) => (
                    <option key={safeId(student)} value={safeId(student)}>
                      {student.name || "Unnamed Student"} • {student.usn || "No USN"}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          <ReportSection title="STUDENT INFORMATION" description="All student details below can be entered or edited.">
            <div className="mc-report-identity-grid editable-identity">
              <label>
                <span>Student</span>
                <input value={draft.name} onChange={(event) => updateDraft("name", event.target.value)} placeholder="Enter student name" />
              </label>
              <label>
                <span>USN</span>
                <input value={draft.usn} onChange={(event) => updateDraft("usn", event.target.value.toUpperCase())} placeholder="Enter USN" />
              </label>
              <label>
                <span>Department</span>
                <input value={draft.dept} onChange={(event) => updateDraft("dept", event.target.value)} placeholder="Enter department" />
              </label>
              <label>
                <span>Year / Semester</span>
                <input value={draft.year} onChange={(event) => updateDraft("year", event.target.value)} placeholder="Enter year / semester" />
              </label>
              <label>
                <span>Mentor</span>
                <input value={draft.mentor} onChange={(event) => updateDraft("mentor", event.target.value)} placeholder="Enter mentor name" />
              </label>
            </div>
          </ReportSection>

          <ReportSection title="REPORT DOCUMENTS" description="Upload certificates, achievements and supporting academic documents.">
            <div className="mc-achievement-form">
              <div className="mc-achievement-form-grid">
                <label>Achievement / Certification Title<input value={achievement.title} onChange={(event) => setAchievement((current) => ({ ...current, title: event.target.value }))} placeholder="e.g. Best Project Award" /></label>
                <label>Category<input value={achievement.category} onChange={(event) => setAchievement((current) => ({ ...current, category: event.target.value }))} placeholder="Award / Certification / Co-curricular" /></label>
                <label>Date<input type="date" value={achievement.date} onChange={(event) => setAchievement((current) => ({ ...current, date: event.target.value }))} /></label>
<label>
  Certificate / Documents

  <input
    id="achievement-document-upload"
    type="file"
    multiple
    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,image/*"
    onChange={(event) =>
      setAchievement((current) => ({
        ...current,
        files: Array.from(event.target.files || []),
      }))
    }
  />
</label>


{achievement.files.length > 0 && (
  <div className="mc-selected-files">
    <strong>
      Selected files ({achievement.files.length})
    </strong>

    {achievement.files.map((file, index) => (
      <div
        key={`${file.name}-${index}`}
        className="mc-selected-file"
      >
        <span>{file.name}</span>

        <button
          type="button"
          onClick={() =>
            setAchievement((current) => ({
              ...current,
              files: current.files.filter(
                (_, fileIndex) => fileIndex !== index
              ),
            }))
          }
        >
          Remove
        </button>
      </div>
    ))}
  </div>
)}
                <label className="full">Description<textarea value={achievement.description} onChange={(event) => setAchievement((current) => ({ ...current, description: event.target.value }))} placeholder="Brief description of the achievement" /></label>
              </div>
              <div className="mc-achievement-form-footer">
                <small>Allowed: PDF, Word, Excel, PowerPoint, TXT, JPG, PNG, WEBP • Maximum 3 MB</small>
                <button className="mc-primary" onClick={upload} disabled={uploading}>{uploading ? "Uploading..." : "Upload Achievement"}</button>
              </div>
            </div>

            <AchievementList
              achievements={selectedStudent.achievements || []}
              onDelete={removeAchievement}
              readOnly={false}
            />
          </ReportSection>

        </section>

        {(role === "mentor" || role === "hod") && (
          <div className="mc-report-embedded-performance">
            <Performance />
          </div>
        )}
      </>
    );
  }

  /* =======================================================
     NOTIFICATIONS
  ======================================================= */

  function Notifications() {
    return (
      <section className="mc-card">

        <CardTitle
          title="Notifications"
          sub="Alerts, reports and academic updates"
        />

        <div className="mc-notices">

          {data.notifications.map(
            (notification) => (
              <div
                className={`mc-notice ${
                  notification.read
                    ? "read"
                    : ""
                }`}
                key={safeId(
                  notification
                )}
              >

                <div>

                  <span>
                    {
                      notification.type ||
                      "General"
                    }
                  </span>

                  <h3>
                    {
                      notification.title
                    }
                  </h3>

                  <p>
                    {
                      notification.text
                    }
                  </p>

                </div>

                <button
                  className="mc-link"
                  onClick={() =>
                    markNotificationRead(
                      safeId(
                        notification
                      )
                    )
                  }
                >
                  {notification.read
                    ? "Read"
                    : "Mark read"}
                </button>

              </div>
            )
          )}

        </div>

      </section>
    );
  }

  /* =======================================================
     TASKS
  ======================================================= */

  function Tasks() {
    return (
      <section className="mc-card">

        <CardTitle
          title="Task Tracker"
          sub="Follow-ups, reports and pending actions"
        >

          <button
            className="mc-primary"
            onClick={() =>
              setModal({
                type: "task",

                item: {
                  title: "",
                  due: "",
                  owner:
                    info.label,
                  priority:
                    "Medium",
                  done: false,
                },
              })
            }
          >
            + Add Task
          </button>

        </CardTitle>


        <div className="mc-tasks">

          {data.tasks.map(
            (task) => (
              <div
                className={`mc-task ${
                  task.done
                    ? "done"
                    : ""
                }`}
                key={safeId(
                  task
                )}
              >

                <button
                  onClick={() =>
                    toggleTask(
                      task
                    )
                  }
                >
                  {task.done
                    ? "✓"
                    : "○"}
                </button>

                <div>

                  <b>
                    {
                      task.title
                    }
                  </b>

                  <small>
                    Due{" "}
                    {
                      task.due ||
                      "—"
                    }{" "}
                    •{" "}
                    {
                      task.owner
                    }
                  </small>

                </div>

                <span
                  className={`mc-priority ${String(
                    task.priority ||
                      "Medium"
                  ).toLowerCase()}`}
                >
                  {
                    task.priority
                  }
                </span>

                <button
                  className="mc-danger-link"
                  onClick={() =>
                    deleteTask(
                      safeId(
                        task
                      )
                    )
                  }
                >
                  Delete
                </button>

              </div>
            )
          )}

        </div>

      </section>
    );
  }

  /* =======================================================
     ANALYTICS
  ======================================================= */

  function Analytics({
    type,
  }) {
const title =
  type === "analytics"
    ? "Department Analytics"
    : type === "departments"
    ? "Department Analytics"
    : type === "faculty"
    ? "Faculty Overview"
    : "Student Performance";

    const departments =
      analytics?.departments ||
      [];

    const faculty =
      analytics?.faculty ||
      [];

    const performance =
      analytics?.performance ||
      analytics?.summary ||
      {};

    return (
      <section className="mc-card">

        <CardTitle
          title={title}
          sub="Live backend analytics and decision support"
        />

       {(type === "analytics" ||
  type === "departments") &&
  departments.length >
    0 && (
            <div className="mc-table-wrap">

              <table>

                <thead>
                  <tr>
                    <th>
                      Department
                    </th>

                    <th>
                      Students
                    </th>

                    <th>
                      Performance
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {departments.map(
                    (
                      department,
                      index
                    ) => (
                      <tr
                        key={
                          department._id ||
                          department.id ||
                          department.department ||
                          index
                        }
                      >

                        <td>
                          {
                            department.department ||
                            department.name ||
                            "—"
                          }
                        </td>

                        <td>
                          {
                            department.students ??
                            department.totalStudents ??
                            0
                          }
                        </td>


                        <td>
                          {
                            department.performance ??
                            department.averagePerformance ??
                            0
                          }
                          %
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}


        {/* =====================================================
            DEPARTMENT-WISE STUDENT LEADERBOARD
        ====================================================== */}

        {type === "analytics" && (
          <section
            className="mc-card"
            style={{ marginTop: "24px" }}
          >
            <CardTitle
              title="Student Leaderboard"
              sub="Top-performing students across different years and sections"
            />

            <div
              className="mc-toolbar"
              style={{ marginBottom: "20px" }}
            >
              <select
                value={leaderboardYear}
                onChange={(event) =>
                  setLeaderboardYear(
                    event.target.value
                  )
                }
              >
                <option value="All">
                  All Years
                </option>
                <option value="1st Year">
                  1st Year
                </option>
                <option value="2nd Year">
                  2nd Year
                </option>
                <option value="3rd Year">
                  3rd Year
                </option>
                <option value="4th Year">
                  4th Year
                </option>
              </select>

              <select
                value={leaderboardSection}
                onChange={(event) =>
                  setLeaderboardSection(
                    event.target.value
                  )
                }
              >
                <option value="All">
                  All Sections
                </option>
                <option value="A">
                  Section A
                </option>
                <option value="B">
                  Section B
                </option>
                <option value="C">
                  Section C
                </option>
              </select>
            </div>

            {leaderboardStudents.length === 0 ? (
              <div className="mc-empty">
                No student performance data
                available for the selected
                filters.
              </div>
            ) : (
              <div className="mc-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Student</th>
                      <th>USN</th>
                      <th>Year</th>
                      <th>Section</th>
                      <th>Total</th>
                    </tr>
                  </thead>

                  <tbody>
                    {leaderboardStudents.map(
                      (student, index) => (
                        <tr
                          key={
                            safeId(student) ||
                            index
                          }
                        >
                          <td>
                            <strong>
                              #{index + 1}
                            </strong>
                          </td>

                          <td>
                            {student.name ||
                              "—"}
                          </td>

                          <td>
                            {student.usn ||
                              "—"}
                          </td>

                          <td>
                            {student.year ||
                              "—"}
                          </td>

                          <td>
                            {student.section ||
                              "—"}
                          </td>

                          <td>
                            <strong>
                              {
                                student.leaderboardScore
                              }
                            </strong>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        <div className="mc-kpi-grid"></div>



        {type ===
          "faculty" &&
          faculty.length >
            0 && (
            <div className="mc-table-wrap">

              <table>

                <thead>
                  <tr>
                    <th>
                      Faculty
                    </th>

                    <th>
                      Department
                    </th>

                    <th>
                      Role
                    </th>

                    <th>
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {faculty.map(
                    (
                      member,
                      index
                    ) => (
                      <tr
                        key={
                          member._id ||
                          member.id ||
                          index
                        }
                      >

                        <td>
                          {
                            member.name ||
                            "—"
                          }
                        </td>

                        <td>
                          {
                            member.department ||
                            "—"
                          }
                        </td>

                        <td>
                          {
                            member.role ||
                            member.designation ||
                            "Faculty"
                          }
                        </td>

                        <td>
                          {
                            member.status ||
                            "Active"
                          }
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}


        <div className="mc-kpi-grid">

          <div>
            <span>
              Total Students
            </span>

            <b>
              {performance.totalStudents ??
                analytics?.totalStudents ??
                counts.students}
            </b>

            <div className="mc-progress">
              <i
                style={{
                  width: "80%",
                }}
              />
            </div>
          </div>


          <div>
            <span>
              Average Performance
            </span>

            <b>
              {performance.averagePerformance ??
                analytics?.averagePerformance ??
                counts.performance}
              %
            </b>

            <div className="mc-progress">
              <i
                style={{
                  width: `${Math.min(
                    100,
                    Number(
                      performance.averagePerformance ??
                        counts.performance
                    )
                  )}%`,
                }}
              />
            </div>
          </div>


          <div>
            <span>
              Backlogs
            </span>

            <b>
              {performance.backlogs ??
                analytics?.backlogs ??
                counts.backlog}
            </b>

            <div className="mc-progress">
              <i
                style={{
                  width: "35%",
                }}
              />
            </div>
          </div>

        </div>

      </section>
    );
  }

  /* =======================================================
     LOADING
  ======================================================= */

  function Loading() {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
        }}
      >
        Loading dashboard...
      </div>
    );
  }

  /* =======================================================
     RENDER SECTION
  ======================================================= */

  function renderSection() {
    if (tab === "overview") {
      return <Overview />;
    }

    if (tab === "messages") {
    return <Messages role={role} />;
  }

    if (
      tab ===
      "academic-records"
    ) {
      return (
        <AcademicRecords />
      );
    }

    if (tab === "profile") {
      return <Profile />;
    }

    if (tab === "students") {
      return (
        <Students
          mentor={
            role === "mentor"
          }
        />
      );
    }

    if (
      tab ===
        "performance" ||
      tab ===
        "student-performance"
    ) {
      return (
        <Performance />
      );
    }

    if (
      tab === "sessions" ||
      tab === "schedule"
    ) {
      return (
        <Sessions />
      );
    }

    if (tab === "mentors") {
      return <Mentors />;
    }

    if (tab === "reports") {
      return <Reports />;
    }

    if (
      tab ===
      "notifications"
    ) {
      return (
        <Notifications />
      );
    }

    if (tab === "tasks") {
      return <Tasks />;
    }

if (
  tab === "analytics" ||
  tab === "departments" ||
  tab === "faculty"
) {
  return (
    <Analytics
      type={tab}
    />
  );
}

    return <Overview />;
  }

  /* =======================================================
     MAIN UI
  ======================================================= */

  return (
    <div
      className={`mc-shell ${info.accent}`}
    >

      <Sidebar
        role={role}
      />


      <main className="mc-main">

        {/* =====================
            TOP BAR
        ====================== */}

        <header className="mc-topbar">

          <div>

            <span className="mc-breadcrumb">
              MENTORCONNECT /{" "}
              {info.label.toUpperCase()}
            </span>

            <h1>
              {tab ===
              "overview"
                ? info.title
                : labels[tab] ||
                  tab}
            </h1>

            <p>
              {tab ===
              "overview"
                ? info.quote
                : "Manage, review and update your workspace from one place."}
            </p>

          </div>


          <div className="mc-top-actions">

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search workspace..."
            />


            <button
              onClick={() =>
                go(
                  "notifications"
                )
              }
              className="mc-icon-btn"
            >
              ◌

              <sup>
                {
                  data.notifications.filter(
                    (notification) =>
                      !notification.read
                  ).length
                }
              </sup>
            </button>


            <button
              onClick={() =>
                setHelp(true)
              }
              className="mc-help"
            >
              ?
            </button>


            <button
              className="mc-user"
              onClick={() =>
                go("profile")
              }
            >
              {info.label
                .charAt(0)
                .toUpperCase()}
            </button>

          </div>

        </header>


        {/* =====================
            NAVIGATION
        ====================== */}

        <nav className="mc-tabs">

          {tabs.map(
            (item) => (
              <button
                className={
                  tab === item
                    ? "active"
                    : ""
                }
                key={item}
                onClick={() =>
                  go(item)
                }
              >
                {labels[item] ||
                  item
                    .charAt(0)
                    .toUpperCase() +
                    item.slice(1)}
              </button>
            )
          )}

        </nav>


        {/* =====================
            CONTENT
        ====================== */}

        {loading &&
        tab ===
          "overview" ? (
          <Loading />
        ) : (
          renderSection()
        )}


      </main>


      {/* =====================
          TOAST
      ====================== */}

      {toast && (
        <div className="mc-toast">
          ✓ {toast}
        </div>
      )}


      {/* =====================
          HELP MODAL
      ====================== */}


      {help && (
  <div
    className="mc-overlay"
    onClick={() => setHelp(false)}
  >
    <div
      className="mc-modal mc-help-chat"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        className="mc-close"
        onClick={() => setHelp(false)}
      >
        ×
      </button>

      <h2>MentorConnect Help</h2>

      <p>
        Ask questions about the MentorConnect system.
      </p>

      <div className="mc-chat-messages">
        {chatMessages.map((message, index) => (
          <div
            key={index}
            className={
              message.from === "user"
                ? "mc-chat-message user"
                : "mc-chat-message bot"
            }
          >
            <strong>
              {message.from === "user" ? "You" : "Help"}
            </strong>

            <div>{message.text}</div>
          </div>
        ))}
      </div>

      <div className="mc-chat-input">
        <input
          type="text"
          value={chatInput}
          placeholder="Ask a question..."
          onChange={(event) =>
            setChatInput(event.target.value)
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              sendChatMessage();
            }
          }}
        />

        <button
          type="button"
          className="mc-primary"
          onClick={sendChatMessage}
        >
          Send
        </button>
      </div>

      <div className="mc-chat-suggestions">
        <button
          type="button"
          onClick={() =>
            setChatInput("How do I upload an achievement?")
          }
        >
          Upload achievement
        </button>

        <button
          type="button"
          onClick={() =>
            setChatInput("How can I check performance?")
          }
        >
          Performance
        </button>

        <button
          type="button"
          onClick={() =>
            setChatInput("What is Student Risk Monitor?")
          }
        >
          Risk Monitor
        </button>
      </div>
    </div>
  </div>
)}


      {/* =====================
          FORM MODAL
      ====================== */}

      {modal && (
        <Modal
          modal={modal}
          close={() =>
            setModal(null)
          }
          saveStudent={
            saveStudent
          }
          saveMentor={
            saveMentor
          }
          saveSession={
            saveSession
          }
          saveTask={
            saveTask
          }
          mentors={
         data.mentors
       }
          saving={saving}
        />
      )}

    </div>
  );
}

/* =========================================================
   CARD TITLE
========================================================= */

function ReportSection({ title, description, children }) {
  return (
    <section className="mc-report-section">
      <div className="mc-report-section-head">
        <div>
          <h3>{title}</h3>
          {description && <p>{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function AchievementList({
  achievements = [],
  onDelete,
  readOnly = false,
}) {
  const [downloading, setDownloading] = useState(false);

  if (!achievements.length) {
    return null;
  }

  const downloadBundle = async () => {
    try {
      setDownloading(true);

      const zip = new JSZip();

      let addedFiles = 0;

      for (let index = 0; index < achievements.length; index++) {
        const item = achievements[index];

        if (!item.filePath) {
          continue;
        }

        const url = assetUrl(item.filePath);

        if (!url) {
          continue;
        }

        const response = await fetch(url);

        if (!response.ok) {
          console.error(
            `Unable to download ${item.fileName || "document"}`
          );
          continue;
        }

        const blob = await response.blob();

        const originalName =
          item.fileName ||
          `achievement-document-${index + 1}`;

        zip.file(originalName, blob);

        addedFiles++;
      }

      if (!addedFiles) {
     alert("No downloadable documents found");
        return;
      }

      const zipBlob = await zip.generateAsync({
        type: "blob",
      });

      const downloadUrl =
        window.URL.createObjectURL(zipBlob);

      const link = document.createElement("a");

      link.href = downloadUrl;
      link.download = "achievement-certificates.zip";

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error(
        "Achievement bundle error:",
        error
      );

      alert(
        "Unable to create the achievement bundle."
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="mc-achievement-list">

      <div className="mc-achievement-bundle-header">
        <div>
          <strong>
            Uploaded Achievements
          </strong>

          <small>
            {achievements.length} document
            {achievements.length === 1 ? "" : "s"}
          </small>
        </div>

        <button
          type="button"
          className="mc-primary"
          onClick={downloadBundle}
          disabled={downloading}
        >
          {downloading
            ? "Creating ZIP..."
            : "Download All (.zip)"}
        </button>
      </div>

      {achievements.map((item, index) => {
        const id =
          safeId(item) || index;

        const url =
          assetUrl(item.filePath);

        return (
          <article
            className="mc-achievement-item"
            key={id}
          >
            <div className="mc-achievement-main">

              <div>
                <strong>
                  {item.title ||
                    "Achievement"}
                </strong>

                {item.category && (
                  <span className="mc-pill">
                    {item.category}
                  </span>
                )}
              </div>

              {item.date && (
                <small>
                  {item.date}
                </small>
              )}

              {item.fileName && (
                <small>
                  📎 {item.fileName}
                </small>
              )}

              {item.description && (
                <p>
                  {item.description}
                </p>
              )}
            </div>

            {url && (
              <div className="mc-achievement-actions">

                <a
                  className="mc-outline-btn"
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open Document
                </a>

                {!readOnly &&
                  onDelete && (
                    <button
                      className="mc-danger-link"
                      onClick={() =>
                        onDelete(id)
                      }
                    >
                      Remove
                    </button>
                  )}

              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

function CardTitle({
  title,
  sub,
  children,
}) {
  return (
    <div className="mc-card-title">

      <div>

        <h2>
          {title}
        </h2>

        <p>
          {sub}
        </p>

      </div>

      {children}

    </div>
  );
}

/* =========================================================
   MODAL
========================================================= */
function Modal({
  modal,
  close,
  saveStudent,
  saveMentor,
  saveSession,
  saveTask,
  saving,
  mentors = [],
}) {

  const [item, setItem] =
    useState(
      modal.item || {}
    );

  const set = (
    key,
    value
  ) => {
    setItem(
      (current) => ({
        ...current,
        [key]: value,
      })
    );
  };

  const submit = async (
    event
  ) => {
    event.preventDefault();

    if (
      modal.type ===
      "student"
    ) {
      await saveStudent(
        item
      );

      return;
    }

    if (
      modal.type ===
      "mentor"
    ) {
      await saveMentor(
        item
      );

      return;
    }

    if (
      modal.type ===
      "session"
    ) {
      await saveSession(
        item
      );

      return;
    }

    if (
      modal.type ===
      "task"
    ) {
      await saveTask(
        item
      );
    }
  };


  /* =========================
     STUDENT FIELDS
  ========================== */

  const studentFields = [
    [
      "name",
      "Student Name",
      "text",
    ],

    [
      "usn",
      "USN",
      "text",
    ],

    [
      "phone",
      "Phone",
      "text",
    ],

[
  "parentName",
  "Parent / Guardian Name",
  "text",
],

[
  "parentRelation",
  "Relationship",
  "text",
],

[
  "parentPhone",
  "Parent Phone",
  "tel",
],

[
  "parentEmail",
  "Parent Email",
  "email",
],

[
  "emergencyContact",
  "Emergency Contact",
  "tel",
],
    [
      "dept",
      "Department",
      "text",
    ],

    [
      "year",
      "Year",
      "text",
    ],

    [
  "section",
  "Section",
  "section-select",
],

 [
  "mentor",
  "Mentor",
  "mentor-select",
],


    [
      "backlog",
      "Backlogs",
      "number",
    ],

    [
      "cie1",
      "CIE I",
      "number",
    ],

    [
      "cie2",
      "CIE II",
      "number",
    ],

    [
      "cie3",
      "CIE III",
      "number",
    ],

    [
      "final",
      "Final",
      "number",
    ],

    [
      "set",
      "SET",
      "number",
    ],

    [
      "grade",
      "Grade",
      "text",
    ],
  ];


  /* =========================
     MENTOR FIELDS
  ========================== */

  const mentorFields = [
    [
      "mentorId",
      "Mentor ID",
      "text",
    ],

    [
      "name",
      "Mentor Name",
      "text",
    ],

    [
      "email",
      "Email",
      "email",
    ],

    [
      "students",
      "Students Assigned",
      "number",
    ],

    [
      "performance",
      "Performance / 10",
      "number",
    ],

    [
      "lastActive",
      "Last Active",
      "date",
    ],
  ];


  /* =========================
     SESSION FIELDS
  ========================== */

  const sessionFields = [
    [
      "title",
      "Session Title",
      "text",
    ],

    [
      "date",
      "Date",
      "date",
    ],

    [
      "time",
      "Time",
      "time",
    ],

    [
      "owner",
      "Owner",
      "text",
    ],
  ];


  /* =========================
     TASK FIELDS
  ========================== */

  const taskFields = [
    [
      "title",
      "Task Title",
      "text",
    ],

    [
      "due",
      "Due Date",
      "date",
    ],

    [
      "owner",
      "Owner",
      "text",
    ],
  ];


  let fields =
    studentFields;

  if (
    modal.type ===
    "mentor"
  ) {
    fields =
      mentorFields;
  }

  if (
    modal.type ===
    "session"
  ) {
    fields =
      sessionFields;
  }

  if (
    modal.type ===
    "task"
  ) {
    fields =
      taskFields;
  }


  return (
    <div
      className="mc-overlay"
      onClick={close}
    >

      <form
        className="mc-modal"
        onSubmit={submit}
        onClick={(event) =>
          event.stopPropagation()
        }
      >

        <button
          type="button"
          className="mc-close"
          onClick={close}
        >
          ×
        </button>


        <h2>

          {modal.type ===
            "student" &&
            "Student Record"}

          {modal.type ===
            "mentor" &&
            "Mentor Record"}

          {modal.type ===
            "session" &&
            "Mentoring Session"}


          {modal.type ===
            "task" &&
            "Task"}

        </h2>


        <p>
          Enter details and save the record.
        </p>


        <div className="mc-form-grid">

         
         {fields.map(
  ([
    key,
    label,
    type,
  ]) => (
    <label
      key={key}
    >

      {label}

   {type === "mentor-select" ? (
  <select
    value={item[key] ?? ""}
    onChange={(event) =>
      set(key, event.target.value)
    }
    required={key === "mentor"}
  >
    <option value="">
      Select Mentor
    </option>

    {mentors
      .filter(
        (mentor) =>
          mentor.status === "Active"
      )
      .map((mentor) => (
        <option
          key={
            safeId(mentor) ||
            mentor.name
          }
          value={mentor.name || ""}
        >
          {mentor.name}
        </option>
      ))}
  </select>
) : type === "section-select" ? (
  <select
    value={item[key] ?? "A"}
    onChange={(event) =>
      set(key, event.target.value)
    }
  >
    <option value="A">
      Section A
    </option>
    <option value="B">
      Section B
    </option>
    <option value="C">
      Section C
    </option>
  </select>
) : (
  <input
    type={type}
    value={item[key] ?? ""}
    onChange={(event) =>
      set(
        key,
        event.target.value
      )
    }
    required={[
      "name",
      "usn",
      "title",
      "date",
      "course",
    ].includes(key)}
  />
)}
    </label>
  )
)}


          {/* =====================
              STATUS
          ====================== */}

          {[
            "mentor",
            "session",
          ].includes(
            modal.type
          ) && (
            <label>
              Status

              <select
                value={
                  item.status ||
                  "Active"
                }
                onChange={(
                  event
                ) =>
                  set(
                    "status",
                    event
                      .target
                      .value
                  )
                }
              >

                {modal.type ===
                "mentor" ? (
                  <>
                    <option>
                      Active
                    </option>

                    <option>
                      Inactive
                    </option>
                  </>
                ) : (
                  <>
                    <option>
                      Scheduled
                    </option>

                    <option>
                      Completed
                    </option>

                    <option>
                      Cancelled
                    </option>
                  </>
                )}

              </select>

            </label>
          )}


          {/* =====================
              TASK PRIORITY
          ====================== */}

          {modal.type ===
            "task" && (
            <label>
              Priority

              <select
                value={
                  item.priority ||
                  "Medium"
                }
                onChange={(
                  event
                ) =>
                  set(
                    "priority",
                    event
                      .target
                      .value
                  )
                }
              >

                <option>
                  High
                </option>

                <option>
                  Medium
                </option>

                <option>
                  Low
                </option>

              </select>

            </label>
          )}

        </div>


        <div className="mc-modal-actions">

          <button
            type="button"
            className="mc-outline-btn"
            onClick={close}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="mc-primary"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : "Save Record"}
          </button>

        </div>

      </form>

    </div>
  );
}