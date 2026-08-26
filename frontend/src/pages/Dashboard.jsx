import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import Sidebar from "../components/Sidebar";
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
    "profile",
    "schedule",
    "reports",
    "notifications",
    "tasks",
  ];

  const mentorTabs = [
    "overview",
    "students",
    "performance",
    "sessions",
    "reports",
    "profile",
  ];

  const hodTabs = [
    "overview",
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

                {filteredStudents.map(
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

      </section>
    );
  }

  /* =======================================================
     ACADEMIC RECORDS
  ======================================================= */

  function AcademicRecords() {
    const profile =
      data.profiles?.student ||
      {};

    const student =
      data.students.find(
        (item) =>
          item.usn &&
          item.usn ===
            profile.usn
      ) ||
      data.students.find(
        (item) =>
          item.name &&
          item.name ===
            profile.name
      ) ||
      data.students[0];

    if (!student) {
      return (
        <section className="mc-card">
          <CardTitle
            title="Academic Records"
            sub="No academic record is available yet."
          />
        </section>
      );
    }

    const marks = [
      [
        "CIE I",
        student.cie1,
      ],

      [
        "CIE II",
        student.cie2,
      ],

      [
        "CIE III",
        student.cie3,
      ],

      [
        "Final Marks",
        student.final,
      ],

      [
        "SET Marks",
        student.set,
      ],

      [
        "Total Marks",
        student.total,
      ],
    ];

    return (
      <section className="mc-card academic-records">

        <CardTitle
          title="My Academic Records"
          sub="Marks entered by your mentor and reviewed by the HOD. This page is read-only for students."
        />

        <div className="mc-readonly-banner">

          <span>
            🔒
          </span>

          <div>
            <b>
              Student view — editing is disabled
            </b>

            <small>
              Your mentor/HOD can update academic records. You can only view the latest values.
            </small>
          </div>

        </div>


        <div className="mc-record-identity">

          <div>
            <span>
              Student
            </span>

            <b>
              {student.name}
            </b>
          </div>

          <div>
            <span>
              USN
            </span>

            <b>
              {student.usn ||
                "—"}
            </b>
          </div>

          <div>
            <span>
              Department
            </span>

            <b>
              {student.dept ||
                "—"}
            </b>
          </div>

          <div>
            <span>
              Semester / Year
            </span>

            <b>
              {student.year ||
                "—"}
            </b>
          </div>

        </div>


        <div className="mc-mark-summary">

          {marks.map(
            ([label, value]) => (
              <div
                key={label}
              >
                <span>
                  {label}
                </span>

                <strong>
                  {value ??
                    "—"}
                </strong>

                <small>
                  Marks
                </small>
              </div>
            )
          )}

          <div>
            <span>
              Grade
            </span>

            <strong>
              {student.grade ||
                "—"}
            </strong>

            <small>
              Current grade
            </small>
          </div>

        </div>


        <div className="mc-record-grid">

          <div className="mc-record-panel">

            <h3>
              Mentor Record
            </h3>

            <p>
              <b>
                Mentor:
              </b>{" "}
              {student.mentor ||
                "—"}
            </p>

            <p>
              <b>
                Performance:
              </b>{" "}
              {student.total ??
                0}
              /100
            </p>


            <p>
              <b>
                Backlogs:
              </b>{" "}
              {student.backlog ??
                0}
            </p>

            <span className="mc-status-ok">
              ✓ Marks available
            </span>

          </div>


          <div className="mc-record-panel">

            <h3>
              HOD Review
            </h3>

            <p>
              <b>
                Review status:
              </b>{" "}
              <span className="mc-status-ok">
                Published
              </span>
            </p>

            <p>
              <b>
                Record owner:
              </b>{" "}
              Department Academic Office
            </p>

            <p>
              <b>
                Last update:
              </b>{" "}
              {student.marksUpdatedAt
                ? new Date(
                    student.marksUpdatedAt
                  ).toLocaleString()
                : "Not available"}
            </p>

            <p>
              <b>
                Updated by:
              </b>{" "}
              {student.marksUpdatedBy ||
                "Mentor / HOD"}
            </p>

          </div>

        </div>


        <div className="mc-readonly-table">

          <h3>
            Detailed Mark Sheet
          </h3>

          <div className="mc-table-wrap">

            <table>

              <thead>
                <tr>
                  <th>
                    Assessment
                  </th>

                  <th>
                    Marks
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Editable By
                  </th>
                </tr>
              </thead>

              <tbody>

                {marks.map(
                  ([label, value]) => (
                    <tr
                      key={label}
                    >
                      <td>
                        <b>
                          {label}
                        </b>
                      </td>

                      <td>
                        <strong>
                          {value ??
                            "—"}
                        </strong>
                      </td>

                      <td>
                        <span className="mc-pill success">
                          Published
                        </span>
                      </td>

                      <td>
                        Mentor / HOD
                      </td>
                    </tr>
                  )
                )}

                <tr>
                  <td>
                    <b>
                      Grade
                    </b>
                  </td>

                  <td>
                    <span className="mc-grade">
                      {student.grade ||
                        "—"}
                    </span>
                  </td>

                  <td>
                    <span className="mc-pill success">
                      Published
                    </span>
                  </td>

                  <td>
                    Mentor / HOD
                  </td>
                </tr>

              </tbody>

            </table>

          </div>

        </div>


        <div className="mc-readonly-table">

          <h3>
            Subject-wise Academic Marks
          </h3>

          <p className="mc-subtext">
            Subject marks published by the mentor/HOD.
          </p>

          <div className="mc-table-wrap">

            <table className="marks">

              <thead>
                <tr>
                  <th>
                    Sl.
                  </th>

                  <th>
                    Subject
                  </th>

                  <th>
                    CIE I
                  </th>

                  <th>
                    CIE II
                  </th>

                  <th>
                    CIE III
                  </th>

                  <th>
                    Final
                  </th>

                  <th>
                    SET
                  </th>

                  <th>
                    Total
                  </th>

                  <th>
                    Grade
                  </th>
                </tr>
              </thead>

              <tbody>

                {subjectRecords(
                  student
                ).map(
                  (subject, index) => (
                    <tr
                      key={
                        safeId(
                          subject
                        ) ||
                        index
                      }
                    >
                      <td>
                        {index + 1}
                      </td>

                      <td>
                        <b>
                          {
                            subject.subject
                          }
                        </b>
                      </td>

                      <td>
                        {
                          subject.cie1
                        }
                      </td>

                      <td>
                        {
                          subject.cie2
                        }
                      </td>

                      <td>
                        {
                          subject.cie3
                        }
                      </td>

                      <td>
                        {
                          subject.final
                        }
                      </td>

                      <td>
                        {
                          subject.set
                        }
                      </td>

                      <td>
                        <strong>
                          {
                            subject.total
                          }
                        </strong>
                      </td>

                      <td>
                        <span className="mc-grade">
                          {
                            subject.grade
                          }
                        </span>
                      </td>
                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>

        </div>


        <div className="mc-record-note">
          Academic records are synchronized with the mentor/HOD workspace. Students cannot edit marks.
        </div>

      </section>
    );
  }

  /* =======================================================
     PERFORMANCE
  ======================================================= */

  function Performance() {
    const editable =
      role !== "student";

    const visible =
      editable
        ? filteredStudents
        : filteredStudents.filter(
            (student) =>
              student.usn ===
              data.profiles?.student
                ?.usn
          );

    return (
      <section className="mc-card">

        <CardTitle
          title="Performance Report"
          sub={
            editable
              ? "Maintain subject-wise CIE, Final, SET, Total and Grade records."
              : "View your published academic performance."
          }
        >

          {editable && (
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


        {editable && (
          <div className="mc-readonly-banner">

            <span>
              ✎
            </span>

            <div>
              <b>
                Mentor / HOD editing enabled
              </b>

              <small>
                Add subjects, rename subjects, enter marks and remove subjects.
              </small>
            </div>

          </div>
        )}


        {visible.map(
          (student) => (
            <div
              className="mc-academic-student-block"
              key={safeId(
                student
              )}
            >

              <div className="mc-academic-student-head">

                <div>

                  <span>
                    Student
                  </span>

                  <h3>
                    {student.name}
                  </h3>

                  <small>
                    USN:{" "}
                    {student.usn ||
                      "—"}{" "}
                    •{" "}
                    {student.dept ||
                      "—"}{" "}
                    •{" "}
                    {student.year ||
                      "—"}
                  </small>

                </div>

                {editable && (
                  <button
                    className="mc-outline-btn"
                    onClick={() =>
                      addSubject(
                        safeId(
                          student
                        )
                      )
                    }
                    disabled={saving}
                  >
                    + Add Subject
                  </button>
                )}

              </div>


              <div className="mc-table-wrap">

                <table className="marks">

                  <thead>
                    <tr>
                      <th>
                        Sl.
                      </th>

                      <th>
                        Subject
                      </th>

                      <th>
                        CIE I
                      </th>

                      <th>
                        CIE II
                      </th>

                      <th>
                        CIE III
                      </th>

                      <th>
                        Final
                      </th>

                      <th>
                        SET
                      </th>

                      <th>
                        Total
                      </th>

                      <th>
                        Grade
                      </th>

                      {editable && (
                        <th>
                          Action
                        </th>
                      )}
                    </tr>
                  </thead>


                  <tbody>

                    {subjectRecords(
                      student
                    ).map(
                      (
                        subject,
                        index
                      ) => (
                        <tr
                          key={
                            safeId(
                              subject
                            ) ||
                            index
                          }
                        >

                          <td>
                            {index + 1}
                          </td>


                          <td>

                            {editable ? (
                              <input
                                className="mc-cell-input subject-input"
                                value={
                                  subject.subject ||
                                  ""
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateSubject(
                                    safeId(
                                      student
                                    ),
                                    safeId(
                                      subject
                                    ),
                                    "subject",
                                    event
                                      .target
                                      .value
                                  )
                                }
                              />
                            ) : (
                              <b>
                                {
                                  subject.subject
                                }
                              </b>
                            )}

                          </td>


                          {[
                            "cie1",
                            "cie2",
                            "cie3",
                            "final",
                            "set",
                          ].map(
                            (key) => (
                              <td
                                key={
                                  key
                                }
                              >

                                {editable ? (
                                  <input
                                    className="mc-cell-input mark-input"
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={
                                      subject[
                                        key
                                      ] ??
                                      0
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      updateSubject(
                                        safeId(
                                          student
                                        ),
                                        safeId(
                                          subject
                                        ),
                                        key,
                                        event
                                          .target
                                          .value
                                      )
                                    }
                                  />
                                ) : (
                                  subject[
                                    key
                                  ] ??
                                  0
                                )}

                              </td>
                            )
                          )}


                          <td>
                            <strong>
                              {
                                subject.total ??
                                0
                              }
                            </strong>
                          </td>


                          <td>
                            <span className="mc-grade">
                              {
                                subject.grade ||
                                "—"
                              }
                            </span>
                          </td>


                          {editable && (
                            <td>
                              <button
                                className="mc-danger-link"
                                onClick={() =>
                                  removeSubject(
                                    safeId(
                                      student
                                    ),
                                    safeId(
                                      subject
                                    )
                                  )
                                }
                              >
                                Remove
                              </button>
                            </td>
                          )}

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>

            </div>
          )
        )}

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

          {filteredMentors.map(
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

              {filteredMentors.map(
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
    return (
      <section className="mc-card">

        <CardTitle
          title="Reports Centre"
          sub="Generate, preview and export academic reports"
        >

          <div className="mc-inline-actions">

            <button
              className="mc-outline-btn"
              onClick={() =>
                window.print()
              }
            >
              Print
            </button>

            <button
              className="mc-primary"
              onClick={
                exportCurrent
              }
            >
              Export CSV
            </button>

          </div>

        </CardTitle>


        <div className="mc-report-cards">

          {data.reports.map(
            (report) => (
              <div
                className="mc-report-card"
                key={safeId(
                  report
                )}
              >

                <span>
                  {
                    report.category
                  }
                </span>

                <h3>
                  {
                    report.title
                  }
                </h3>

                <p>
                  Owner:{" "}
                  {
                    report.owner
                  }{" "}
                  •{" "}
                  {
                    report.date
                  }
                </p>

                <b>
                  {
                    report.status
                  }
                </b>

                <div>

                  <button
                    className="mc-link"
                    onClick={() =>
                      notify(
                        `${report.title} preview opened`
                      )
                    }
                  >
                    Preview
                  </button>

                  <button
                    className="mc-link"
                    onClick={() =>
                      download(
                        `${String(
                          report.title ||
                            "report"
                        ).replaceAll(
                          " ",
                          "-"
                        )}.csv`,
                        csv(
                          data.students
                        )
                      )
                    }
                  >
                    Download
                  </button>

                </div>

              </div>
            )
          )}

        </div>

      </section>
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
      type === "departments"
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

        {type ===
          "departments" &&
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


        {/* =====================
            FOOTER
        ====================== */}

        <footer className="mc-footer">
          MentorConnect • Academic Mentoring & Performance Management
        </footer>

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
          saving={saving}
        />
      )}

    </div>
  );
}

/* =========================================================
   CARD TITLE
========================================================= */

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
      "mentor",
      "Mentor",
      "text",
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

                <input
                  type={type}
                  value={
                    item[key] ??
                    ""
                  }
                  onChange={(
                    event
                  ) =>
                    set(
                      key,
                      event
                        .target
                        .value
                    )
                  }
                  required={
                    [
                      "name",
                      "usn",
                      "title",
                      "date",
                      "course",
                    ].includes(
                      key
                    )
                  }
                />

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