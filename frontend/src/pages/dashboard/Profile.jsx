import React from "react";

import CardTitle from "../../components/CardTitle";

/* =======================================================
   PROFILE

   Extracted from Dashboard.jsx without behavior changes.
   All state, data, and callbacks it needs are passed in as
   props from Dashboard.jsx, which still owns them.
======================================================= */

export default function Profile({
  role,
  info,
  data,
  saveProfile,
  saving,
}) {
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
