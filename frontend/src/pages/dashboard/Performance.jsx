import React, { useEffect, useState } from "react";

import CardTitle from "../../components/CardTitle";
import ReportSection from "../../components/ReportSection";
import {
  safeId,
  gradeFromTotal,
  subjectCalculatedTotal,
  blankBacklogRow,
  reportDraft,
} from "../../utils/dashboardUtils";

/* =======================================================
   PERFORMANCE

   Extracted from Dashboard.jsx without behavior changes.
   All state, data, and callbacks it needs are passed in as
   props from Dashboard.jsx, which still owns them. This is
   also used for Academic Records, which Dashboard.jsx renders
   by calling this same component.
======================================================= */

export default function Performance({
  role,
  data,
  filteredStudents,
  saving,
  savePerformanceReport,
}) {
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
                setSelectedId(event.target.value);
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
