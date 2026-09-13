/* =========================================================
   DASHBOARD UTILITIES

   Pure, framework-independent helper functions used across the
   dashboard. These were previously defined once in Dashboard.jsx
   and then copy-pasted (unchanged) into several files under
   pages/dashboard/ to avoid a circular import. They are now
   defined once here and imported wherever they are needed.
========================================================= */

/**
 * Returns the best available identifier for a record coming from
 * the API (Mongo-style "_id" or a plain "id"), or "" if neither
 * is present.
 */
export function safeId(item) {
  return (
    item?.id ||
    item?._id ||
    ""
  );
}

/**
 * Ensures a record has a normalized "id" field copied from
 * whichever identifier the API returned.
 */
export function normalizeRecord(item) {
  if (!item) return item;

  return {
    ...item,
    id: safeId(item),
  };
}

/**
 * Returns a student's subject records as an array, or an empty
 * array when none exist.
 */
export function subjectRecords(student) {
  if (
    Array.isArray(student?.subjects)
  ) {
    return student.subjects;
  }

  return [];
}

/**
 * Derives a Pass/Fail grade from a total mark. Returns "" when
 * the total isn't a usable positive number.
 */
export function gradeFromTotal(total) {
  const value = Number(total);
  if (!Number.isFinite(value) || value <= 0) return "";
  return value >= 40 ? "Pass" : "Fail";
}

/**
 * Calculates a subject's total as the average of its five mark
 * components. Returns "" when none of the components have a
 * usable positive value.
 */
export function subjectCalculatedTotal(subject = {}) {
  const values = [
    subject.cie1,
    subject.cie2,
    subject.cie3,
    subject.final,
    subject.set,
  ].map(Number);

  const hasAnyMark = values.some((value) => Number.isFinite(value) && value > 0);
  if (!hasAnyMark) return "";

  return Math.round(values.reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0) / 5);
}

export function blankMentorshipRow() {
  return {
    date: "",
    code: "",
    details: "",
    actionTaken: "",
    studentSigned: false,
    mentorSigned: false,
  };
}

export function blankBacklogRow() {
  return {
    courseName: "",
    yearOfPass: "",
    extMarks: "",
    remarks: "",
  };
}

/**
 * Builds an editable draft of a student's digital performance
 * report (subjects, mentorship records, backlog records) from
 * whatever partial data the student record currently has.
 */
export function reportDraft(student) {
  const mentorship = Array.isArray(student?.mentorshipRecords)
    ? student.mentorshipRecords.slice(0, 6).map((row) => ({
        ...blankMentorshipRow(),
        ...row,
      }))
    : [];

  const backlogs = Array.isArray(student?.backlogRecords)
    ? student.backlogRecords.slice(0, 20).map((row) => ({
        ...blankBacklogRow(),
        ...row,
      }))
    : [];

  const subjects = (Array.isArray(student?.subjects) ? student.subjects : []).map((subject) => ({
    code: subject?.code ?? "",
    subject: subject?.subject ?? "",
    cie1: subject?.cie1 ?? "",
    cie2: subject?.cie2 ?? "",
    cie3: subject?.cie3 ?? "",
    beforeRvSee: subject?.beforeRvSee ?? "",
    afterRvSee: subject?.afterRvSee ?? "",
    final: subject?.final ?? "",
    set: subject?.set ?? "",
    total: subject?.total ?? subjectCalculatedTotal(subject),
    grade: ["Pass", "Fail"].includes(subject?.grade)
      ? subject.grade
      : gradeFromTotal(subject?.total ?? subjectCalculatedTotal(subject)),
    _id: subject?._id,
    id: subject?.id,
  }));

  const subjectTotals = subjects
    .map((subject) => Number(subject.total))
    .filter((value) => Number.isFinite(value));

  const derivedTotalMarks = subjectTotals.length
    ? subjectTotals.reduce((sum, value) => sum + value, 0)
    : "";

  const derivedPercentage = subjectTotals.length
    ? Number(((derivedTotalMarks / (subjectTotals.length * 100)) * 100).toFixed(2))
    : "";

  return {
    name: student?.name ?? "",
    usn: student?.usn ?? "",
    dept: student?.dept ?? "",
    year: student?.year ?? "",
    mentor: student?.mentor ?? "",
    subjects,
    mentorshipRecords: Array.from({ length: 6 }, (_, index) =>
      mentorship[index] || blankMentorshipRow()
    ),
    backlogRecords: Array.from({ length: 6 }, (_, index) =>
      backlogs[index] || blankBacklogRow()
    ),
    sgpa: student?.sgpa ?? "",
    cgpa: student?.cgpa ?? "",
    onlineCoursesAttended: Boolean(Number(student?.onlineCoursesAttended || 0)),
    totalMarks: student?.totalMarks ?? derivedTotalMarks,
    percentage: student?.percentage ?? derivedPercentage,
  };
}

/**
 * Resolves a file path returned by the API into an absolute URL
 * that can be opened directly (e.g. an uploaded achievement
 * document).
 */
export function assetUrl(filePath = "") {
  if (!filePath) return "";
  if (/^https?:\/\//i.test(filePath)) return filePath;
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  return `${apiBase.replace(/\/api\/?$/, "")}${filePath.startsWith("/") ? filePath : `/${filePath}`}`;
}

/**
 * Reads a browser File object into a base64 data URL.
 */
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read the selected file"));
    reader.readAsDataURL(file);
  });
}
