export const ROLES = {
  STUDENT: 'student',
  MENTOR: 'mentor',
  MENTORING_COORDINATOR: 'mentoring_coordinator',
  HOD: 'hod',
  EXAM_COORDINATOR: 'exam_coordinator',
  TPO: 'tpo',
  PARENT: 'parent',
};

export const ALLOCATION_DEFAULTS = {
  MAX_MENTEES_PER_MENTOR: 20,
  MATCH_BY_DEPT: true,
  EVEN_DISTRIBUTION: true,
};

export const RISK_DEFAULTS = {
  CGPA_THRESHOLD: 6.0,
  BACKLOG_THRESHOLD: 2,
  CIE_THRESHOLD: 50,
  ATTENDANCE_THRESHOLD: 75,
};
