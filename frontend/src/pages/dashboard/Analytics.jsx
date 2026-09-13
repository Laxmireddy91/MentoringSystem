import React from "react";

import CardTitle from "../../components/CardTitle";

/* =======================================================
   ANALYTICS

   Extracted from Dashboard.jsx without behavior changes.
   All state, data, and callbacks it needs are passed in as
   props from Dashboard.jsx, which still owns them.
======================================================= */

export default function Analytics({
  type,
  analytics,
  counts,
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
