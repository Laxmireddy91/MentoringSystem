import React, { useState } from "react";

import { safeId } from "../utils/dashboardUtils";

/* =========================================================
   MODAL

   Shared record-editing form used for creating/updating
   students, mentors, sessions and tasks. Extracted without
   behavior, styling or accessibility changes from Dashboard.jsx,
   which still owns the `modal` state and renders this component
   only while a modal is open.
========================================================= */

export default function Modal({
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
            set(
              key,
              event.target.value
            )
          }
          required={
            key === "mentor"
          }
        >
          <option value="">
            Select Mentor
          </option>

          {mentors
  .filter(
    (mentor) =>
      mentor.status ===
      "Active"
  )
  .map((mentor) => (
              <option
                key={
                  safeId(mentor) ||
                  mentor.name
                }
                value={
                  mentor.name || ""
                }
              >
                {mentor.name}
              </option>
            ))}
        </select>
      ) : (
        <input
          type={type}
          value={
            item[key] ??
            ""
          }
          onChange={(event) =>
            set(
              key,
              event.target.value
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
