import { average } from "./formatters";

/* =========================================================
   CHART UTILITIES

   Helpers that turn real dashboard data (student subject
   records) into the values the Overview chart displays. Used to
   replace the Overview "Academic Overview" bars, which
   previously derived their heights from an arbitrary formula
   instead of the students' actual marks.
========================================================= */

/**
 * Collects every value stored under `field` across all subjects
 * of all given students, ignoring students/subjects with no
 * usable value. Safe to call with undefined, null or an empty
 * array.
 */
function collectSubjectValues(students, field) {
  const list = Array.isArray(students) ? students : [];

  const values = [];

  list.forEach((student) => {
    const subjects = Array.isArray(student?.subjects)
      ? student.subjects
      : [];

    subjects.forEach((subject) => {
      const value = subject?.[field];

      if (value !== undefined && value !== null && value !== "") {
        values.push(value);
      }
    });
  });

  return values;
}

/**
 * Computes the average CIE I/II/III, Final, SET and Total marks
 * across every subject of the given students. Returns 0 for any
 * category with no data, so the chart can render safely even
 * when students/subjects are missing.
 */
export function subjectMarkAverages(students) {
  return {
    cie1: average(collectSubjectValues(students, "cie1")),
    cie2: average(collectSubjectValues(students, "cie2")),
    cie3: average(collectSubjectValues(students, "cie3")),
    final: average(collectSubjectValues(students, "final")),
    set: average(collectSubjectValues(students, "set")),
    total: average(collectSubjectValues(students, "total")),
  };
}

/**
 * Clamps a mark average into the 0-100 range so it can safely be
 * used as a bar height percentage even if source data is out of
 * the expected range.
 */
export function clampPercentage(value) {
  const number = Number(value) || 0;
  return Math.min(100, Math.max(0, number));
}
