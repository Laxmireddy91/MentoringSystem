import React from "react";

import CardTitle from "../../components/CardTitle";
import { safeId } from "../../utils/dashboardUtils";

/* =========================================================
   LOCAL HELPER

   Loading is a small, single-use presentational component
   specific to this file's own loading state and is not
   duplicated anywhere else, so it stays local here.
========================================================= */

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
   STUDENTS

   Extracted from Dashboard.jsx without behavior changes.
   All state, data, and callbacks it needs are passed in as
   props from Dashboard.jsx, which still owns them.
======================================================= */

export default function Students({
  mentor = false,
  role,
  search,
  setSearch,
  loading,
  filteredStudents,
  setModal,
  deleteStudent,
  addStudent,
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
