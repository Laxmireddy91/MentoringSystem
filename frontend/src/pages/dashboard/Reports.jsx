import React, { useEffect, useState } from "react";

import api from "../../api";

import Performance from "./Performance";
import CardTitle from "../../components/CardTitle";
import ReportSection from "../../components/ReportSection";
import AchievementList from "../../components/AchievementList";
import {
  safeId,
  fileToDataUrl,
  reportDraft,
} from "../../utils/dashboardUtils";

/* =======================================================
   REPORTS

   Extracted from Dashboard.jsx without behavior changes.
   All state, data, and callbacks it needs are passed in as
   props from Dashboard.jsx, which still owns them. The
   embedded Performance section (shown to mentor/HOD below the
   Reports Centre) is imported directly from ./Performance,
   the same component Dashboard.jsx uses elsewhere.
======================================================= */

export default function Reports({
  role,
  data,
  filteredStudents,
  saving,
  savePerformanceReport,
  notify,
  refreshDashboard,
}) {
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
    file: null,
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
    if (!achievement.file) {
      notify("Select a certificate or document");
      return;
    }
    if (achievement.file.size > 3 * 1024 * 1024) {
      notify("Document must be 3 MB or smaller");
      return;
    }

    try {
      setUploading(true);
      const fileData = await fileToDataUrl(achievement.file);
      await api.students.uploadAchievement(safeId(selectedStudent), {
        title: achievement.title.trim(),
        category: achievement.category.trim(),
        date: achievement.date,
        description: achievement.description.trim(),
        fileName: achievement.file.name,
        mimeType: achievement.file.type,
        fileData,
      });
      await refreshDashboard();
      setAchievement({ title: "", category: "", date: "", description: "", file: null });
      const input = document.getElementById("achievement-document-upload");
      if (input) input.value = "";
      notify("Achievement and document uploaded successfully");
    } catch (error) {
      console.error(error);
      notify(error.message || "Unable to upload achievement");
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
              <label>Certificate / Document<input id="achievement-document-upload" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,image/*" onChange={(event) => setAchievement((current) => ({ ...current, file: event.target.files?.[0] || null }))} /></label>
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
          <Performance
            role={role}
            data={data}
            filteredStudents={filteredStudents}
            saving={saving}
            savePerformanceReport={savePerformanceReport}
          />
        </div>
      )}
    </>
  );
}
