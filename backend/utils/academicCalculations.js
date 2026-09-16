/* =========================================================
   ACADEMIC CALCULATIONS
   ---------------------------------------------------------
   subjects[] is the single source of truth for marks.
========================================================= */


/**
 * Calculate the total marks for one subject.
 *
 * Current project rule:
 * CIE1 + CIE2 + CIE3 + Final + SET
 * ---------------------------------
 *                 5
 */
export function calculateSubjectTotal(subject = {}) {
  const cie1 = Number(subject.cie1 || 0);
  const cie2 = Number(subject.cie2 || 0);
  const cie3 = Number(subject.cie3 || 0);
  const finalMark = Number(subject.final || 0);
  const set = Number(subject.set || 0);

  return Math.round(
    (cie1 + cie2 + cie3 + finalMark + set) / 5
  );
}


/**
 * Calculate grade from total marks.
 *
 * Current project rule:
 * 40 or above = Pass
 * Below 40   = Fail
 * 0          = Empty
 */
export function calculateSubjectGrade(total) {
  const marks = Number(total || 0);

  if (marks <= 0) {
    return "";
  }

  return marks >= 40 ? "Pass" : "Fail";
}


/**
 * Normalize one subject.
 *
 * The entered total and grade are NOT treated as
 * independent sources of truth.
 *
 * They are calculated from the subject marks.
 */
export function normalizeSubject(subject = {}) {
  const total = calculateSubjectTotal(subject);
  const grade = calculateSubjectGrade(total);

  return {
    ...subject,

    cie1: Number(subject.cie1 || 0),
    cie2: Number(subject.cie2 || 0),
    cie3: Number(subject.cie3 || 0),

    beforeRvSee: Number(
      subject.beforeRvSee || 0
    ),

    afterRvSee: Number(
      subject.afterRvSee || 0
    ),

    final: Number(subject.final || 0),
    set: Number(subject.set || 0),

    total,
    grade,
  };
}


/**
 * Normalize all subjects.
 *
 * subjects[] remains the single source of truth.
 */
export function normalizeSubjects(subjects = []) {
  return subjects.map((subject) =>
    normalizeSubject(subject)
  );
}