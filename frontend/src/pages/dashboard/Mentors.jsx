import React from "react";

import CardTitle from "../../components/CardTitle";
import { safeId } from "../../utils/dashboardUtils";

/* =======================================================
   MENTORS

   Extracted from Dashboard.jsx without behavior changes.
   All state, data, and callbacks it needs are passed in as
   props from Dashboard.jsx, which still owns them.
======================================================= */

export default function Mentors({
  search,
  setSearch,
  filteredMentors,
  setModal,
  deleteMentor,
  addMentor,
}) {
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
