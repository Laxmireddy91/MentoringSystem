import React from "react";

import CardTitle from "../../components/CardTitle";
import { safeId } from "../../utils/dashboardUtils";
import { subjectMarkAverages, clampPercentage } from "../../utils/chartUtils";

/* =======================================================
   OVERVIEW

   Extracted from Dashboard.jsx without behavior changes.
   All state, data, and callbacks it needs are passed in as
   props from Dashboard.jsx, which still owns them.
======================================================= */

export default function Overview({
  role,
  info,
  data,
  counts,
  tabs,
  labels,
  riskLoading,
  riskError,
  riskStudents,
  go,
  exportCurrent,
}) {
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

  /* =======================================================
     ACADEMIC OVERVIEW CHART DATA

     Real per-category mark averages (CIE I, CIE II, CIE III,
     Final, SET, Total), computed from the subjects of whichever
     students are visible to this role (the same `data.students`
     used above for `counts.performance`). Replaces the previous
     placeholder bars, which derived their heights from an
     arbitrary offset formula instead of actual marks. Averages
     safely fall back to 0 when there is no subject data yet.
  ======================================================= */

  const chartAverages = subjectMarkAverages(data.students);

  const chartBars = [
    chartAverages.cie1,
    chartAverages.cie2,
    chartAverages.cie3,
    chartAverages.final,
    chartAverages.set,
    chartAverages.total,
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
            {chartBars.map(
              (value, index) => (
                <div
                  key={index}
                >
                  <div className="mc-bar">
                    <i
                      style={{
                        height: `${clampPercentage(value)}%`,
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
          AI STUDENT RISK MONITOR
      ====================================================== */}

      {(role === "mentor" || role === "hod") && (
        <section className="mc-card mc-ai-risk-card">

          <CardTitle
            title="🤖 AI Student Risk Monitor"
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
