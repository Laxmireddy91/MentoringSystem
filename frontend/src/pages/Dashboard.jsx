import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Messages from "../components/Messages";
import Modal from "../components/Modal";
import api from "../api";

import Overview from "./dashboard/Overview";
import Profile from "./dashboard/Profile";
import Students from "./dashboard/Students";
import Mentors from "./dashboard/Mentors";
import Performance from "./dashboard/Performance";
import Reports from "./dashboard/Reports";
import Sessions from "./dashboard/Sessions";
import Tasks from "./dashboard/Tasks";
import Notifications from "./dashboard/Notifications";
import Analytics from "./dashboard/Analytics";

import { download, csv, average } from "../utils/formatters";
import {
  safeId,
  normalizeRecord,
  subjectRecords,
} from "../utils/dashboardUtils";

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

  const [help, setHelp] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [analytics, setAnalytics] =
    useState(null);

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

  const counts = useMemo(() => {
    const students =
      data.students || [];

    return {
      students:
        students.length,

      mentors:
        data.mentors.filter(
          (mentor) =>
            mentor.status ===
            "Active"
        ).length,

      performance:
        average(
          students.map(
            (student) =>
              student.total
          )
        ),

      backlog:
        students.reduce(
          (sum, student) =>
            sum +
            Number(
              student.backlog || 0
            ),
          0
        ),
    };
  }, [data]);

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
     ACADEMIC RECORDS
  ======================================================= */

  function AcademicRecords() {
    return (
      <Performance
        role={role}
        data={data}
        filteredStudents={filteredStudents}
        saving={saving}
        savePerformanceReport={savePerformanceReport}
      />
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
      return (
        <Overview
          role={role}
          info={info}
          data={data}
          counts={counts}
          tabs={tabs}
          labels={labels}
          riskLoading={riskLoading}
          riskError={riskError}
          riskStudents={riskStudents}
          go={go}
          exportCurrent={exportCurrent}
        />
      );
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
      return (
        <Profile
          role={role}
          info={info}
          data={data}
          saveProfile={saveProfile}
          saving={saving}
        />
      );
    }

    if (tab === "students") {
      return (
        <Students
          mentor={
            role === "mentor"
          }
          role={role}
          search={search}
          setSearch={setSearch}
          loading={loading}
          filteredStudents={filteredStudents}
          setModal={setModal}
          deleteStudent={deleteStudent}
          addStudent={addStudent}
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
        <Performance
          role={role}
          data={data}
          filteredStudents={filteredStudents}
          saving={saving}
          savePerformanceReport={savePerformanceReport}
        />
      );
    }

    if (
      tab === "sessions" ||
      tab === "schedule"
    ) {
      return (
        <Sessions
          role={role}
          info={info}
          data={data}
          setModal={setModal}
          deleteSession={deleteSession}
        />
      );
    }

    if (tab === "mentors") {
      return (
        <Mentors
          search={search}
          setSearch={setSearch}
          filteredMentors={filteredMentors}
          setModal={setModal}
          deleteMentor={deleteMentor}
          addMentor={addMentor}
        />
      );
    }

    if (tab === "reports") {
      return (
        <Reports
          role={role}
          data={data}
          filteredStudents={filteredStudents}
          saving={saving}
          savePerformanceReport={savePerformanceReport}
          notify={notify}
          refreshDashboard={refreshDashboard}
        />
      );
    }

    if (
      tab ===
      "notifications"
    ) {
      return (
        <Notifications
          data={data}
          markNotificationRead={markNotificationRead}
        />
      );
    }

    if (tab === "tasks") {
      return (
        <Tasks
          info={info}
          data={data}
          setModal={setModal}
          toggleTask={toggleTask}
          deleteTask={deleteTask}
        />
      );
    }

    if (
      tab === "departments" ||
      tab === "faculty"
    ) {
      return (
        <Analytics
          type={tab}
          analytics={analytics}
          counts={counts}
        />
      );
    }

    return (
      <Overview
        role={role}
        info={info}
        data={data}
        counts={counts}
        tabs={tabs}
        labels={labels}
        riskLoading={riskLoading}
        riskError={riskError}
        riskStudents={riskStudents}
        go={go}
        exportCurrent={exportCurrent}
      />
    );
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
          onClick={() =>
            setHelp(false)
          }
        >

          <div
            className="mc-modal mc-help-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              className="mc-close"
              onClick={() =>
                setHelp(false)
              }
            >
              ×
            </button>

            <h2>
              MentorConnect Help
            </h2>

            <p>
              Use the role tabs to access each workspace. Data is loaded from the backend and stored in MongoDB. Changes made through the dashboard are synchronized with the backend.
            </p>

            <button
              className="mc-primary"
              onClick={() =>
                setHelp(false)
              }
            >
              Got it
            </button>

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
