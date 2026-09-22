/**
 * System-wide Constants for Smart Mentoring System (MentorConnect)
 * Institutional roles must ONLY be assigned by the backend from the database.
 * The client NEVER selects or sends a role.
 */
module.exports = {
  // ─────────────────────────────────────────────────────────────────
  // ROLES — exactly 7 institutional roles
  // ─────────────────────────────────────────────────────────────────
  ROLES: {
    STUDENT: 'student',
    MENTOR: 'mentor',
    MENTORING_COORDINATOR: 'mentoring_coordinator',
    HOD: 'hod',
    EXAM_COORDINATOR: 'exam_coordinator',
    TPO: 'tpo',
    PARENT: 'parent',
  },

  // ─────────────────────────────────────────────────────────────────
  // Student Cohort & Academic Lifecycle
  // ─────────────────────────────────────────────────────────────────
  ENTRY_TYPE: {
    REGULAR: 'REGULAR',
    LATERAL: 'LATERAL',
  },

  STUDENT_STATUS: {
    ACTIVE: 'ACTIVE',
    GRADUATED: 'GRADUATED',
    INACTIVE: 'INACTIVE',
    DROPPED: 'DROPPED',
  },

  // ─────────────────────────────────────────────────────────────────
  // Academic Attention Levels (UI terminology; backend field = riskProfile)
  // ─────────────────────────────────────────────────────────────────
  RISK_LEVELS: {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
    CRITICAL: 'Critical',
  },

  // ─────────────────────────────────────────────────────────────────
  // Session
  // ─────────────────────────────────────────────────────────────────
  SESSION_STATUS: {
    SCHEDULED: 'scheduled',
    CONFIRMED: 'confirmed',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    RESCHEDULED: 'rescheduled',
  },

  SESSION_TYPES: {
    ACADEMIC: 'academic',
    CAREER: 'career',
    PERSONAL: 'personal',
    GENERAL: 'general',
  },

  // ─────────────────────────────────────────────────────────────────
  // Notifications
  // ─────────────────────────────────────────────────────────────────
  NOTIFICATION_CATEGORIES: {
    ACADEMIC: 'academic',
    SESSION: 'session',
    MESSAGE: 'message',
    SYSTEM: 'system',
    GOAL: 'goal',
    RISK: 'risk',
    ACHIEVEMENT: 'achievement',
    DOCUMENT: 'document',
    PLACEMENT: 'placement',
    EXAM_REQUEST: 'exam_request',
    ALLOCATION: 'allocation',
    ACTIVATION: 'activation',
    ATTENDANCE: 'attendance',
  },

  // ─────────────────────────────────────────────────────────────────
  // Reports
  // ─────────────────────────────────────────────────────────────────
  REPORT_TYPES: {
    ACADEMIC: 'academic',
    MENTORING: 'mentoring',
    PERFORMANCE: 'performance',
    RISK: 'risk',
    ACHIEVEMENT: 'achievement',
  },

  // ─────────────────────────────────────────────────────────────────
  // Goals
  // ─────────────────────────────────────────────────────────────────
  GOAL_STATUS: {
    ON_TRACK: 'On Track',
    NEEDS_IMPROVEMENT: 'Needs Improvement',
    ACHIEVED: 'Achieved',
    OVERDUE: 'Overdue',
  },

  GOAL_CATEGORIES: {
    ACADEMIC: 'academic',
    TARGET_CGPA: 'target_cgpa',
    TARGET_CIE: 'target_cie',
    SKILL_DEVELOPMENT: 'skill_development',
    PLACEMENT: 'placement',
    CERTIFICATION: 'certification',
    CAREER: 'career',
    PERSONAL: 'personal',
  },

  // ─────────────────────────────────────────────────────────────────
  // Achievements
  // ─────────────────────────────────────────────────────────────────
  ACHIEVEMENT_CATEGORIES: {
    ACADEMIC: 'Academic',
    HACKATHON: 'Hackathon',
    CERTIFICATION: 'Certification',
    PUBLICATION: 'Publication',
    INTERNSHIP: 'Internship',
    WORKSHOP: 'Workshop',
    PAPER_PRESENTATION: 'Paper Presentation',
    SPORTS_CULTURAL: 'Sports & Cultural',
    OTHER: 'Other',
  },

  ACHIEVEMENT_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    CORRECTION_REQUESTED: 'correction_requested',
  },

  // ─────────────────────────────────────────────────────────────────
  // Document Vault
  // ─────────────────────────────────────────────────────────────────
  DOCUMENT_CATEGORIES: {
    ACADEMIC: 'Academic',
    EXAMINATION: 'Examination',
    PLACEMENT: 'Placement',
    ACHIEVEMENT: 'Achievement',
    INSTITUTIONAL: 'Institutional',
    OTHER: 'Other',
  },

  DOCUMENT_TYPES: {
    // Academic
    SEMESTER_RESULT: 'Semester Result',
    CONSOLIDATED_MARKS: 'Consolidated Marks Card',
    GRADE_CARD: 'Grade Card',
    CIE_REPORT: 'CIE Report',
    // Examination
    EXAM_APPLICATION: 'Examination Application',
    REVALUATION_APPLICATION: 'Revaluation Application',
    REVALUATION_RESULT: 'Revaluation Result',
    SUPPLEMENTARY_DOCS: 'Supplementary Examination Documents',
    MEDICAL_CERTIFICATE: 'Medical Certificate',
    // Placement
    RESUME: 'Resume',
    INTERNSHIP_OFFER: 'Internship Offer Letter',
    INTERNSHIP_COMPLETION: 'Internship Completion Certificate',
    PLACEMENT_DOCS: 'Placement Documents',
    // Achievement
    PARTICIPATION_CERT: 'Participation Certificate',
    ACHIEVEMENT_CERT: 'Achievement Certificate',
    AWARD: 'Award Certificate',
    // Institutional
    BONAFIDE: 'Bonafide Certificate',
    PERMISSION_LETTER: 'Permission Letter',
    // Other
    OTHER: 'Other',
  },

  DOCUMENT_VISIBILITY: {
    PRIVATE: 'private',
    MENTOR_VISIBLE: 'mentor_visible',
    INSTITUTION_VISIBLE: 'institution_visible',
  },

  DOCUMENT_STATUS: {
    ACTIVE: 'active',
    ARCHIVED: 'archived',
  },

  // ─────────────────────────────────────────────────────────────────
  // Exam / CIE Permission Requests
  // ─────────────────────────────────────────────────────────────────
  REQUEST_TYPES: {
    CIE_RETEST: 'cie_retest',
    ATTENDANCE_CONDONATION: 'attendance_condonation',
    EXAM_PERMISSION: 'exam_permission',
    MEDICAL_LEAVE: 'medical_leave',
    OTHER: 'other',
  },

  REQUEST_STATUS: {
    SUBMITTED: 'submitted',
    MENTOR_REVIEWED: 'mentor_reviewed',
    COORDINATOR_REVIEW: 'coordinator_review',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    CLARIFICATION_NEEDED: 'clarification_needed',
  },

  // ─────────────────────────────────────────────────────────────────
  // Placement
  // ─────────────────────────────────────────────────────────────────
  PLACEMENT_APPLICATION_STATUS: {
    APPLIED: 'applied',
    SHORTLISTED: 'shortlisted',
    INTERVIEW: 'interview',
    OFFER: 'offer',
    PLACED: 'placed',
    REJECTED: 'rejected',
    WITHDRAWN: 'withdrawn',
  },

  PLACEMENT_DRIVE_STATUS: {
    UPCOMING: 'upcoming',
    ACTIVE: 'active',
    CLOSED: 'closed',
    CANCELLED: 'cancelled',
  },

  // ─────────────────────────────────────────────────────────────────
  // Allocation
  // ─────────────────────────────────────────────────────────────────
  ALLOCATION_STATUS: {
    PREVIEW: 'preview',
    CONFIRMED: 'confirmed',
    CANCELLED: 'cancelled',
  },

  ASSIGNMENT_TYPE: {
    AUTOMATIC: 'automatic',
    MANUAL: 'manual',
  },

  // ─────────────────────────────────────────────────────────────────
  // Audit Actions
  // ─────────────────────────────────────────────────────────────────
  AUDIT_ACTIONS: {
    // Existing
    MARKS_UPDATED: 'MARKS_UPDATED',
    STUDENT_CREATED: 'STUDENT_CREATED',
    STUDENT_UPDATED: 'STUDENT_UPDATED',
    STUDENT_DELETED: 'STUDENT_DELETED',
    MENTOR_CREATED: 'MENTOR_CREATED',
    MENTOR_UPDATED: 'MENTOR_UPDATED',
    MENTOR_ASSIGNED: 'MENTOR_ASSIGNED',
    RISK_SETTINGS_UPDATED: 'RISK_SETTINGS_UPDATED',
    ACCOUNT_RECOVERED: 'ACCOUNT_RECOVERED',
    SESSION_CREATED: 'SESSION_CREATED',
    SESSION_STATUS_CHANGED: 'SESSION_STATUS_CHANGED',
    REPORT_GENERATED: 'REPORT_GENERATED',
    BULK_IMPORT: 'BULK_IMPORT',
    PASSWORD_RESET: 'PASSWORD_RESET',
    // New
    ACCOUNT_ACTIVATED: 'ACCOUNT_ACTIVATED',
    CIE_IMPORT: 'CIE_IMPORT',
    ATTENDANCE_IMPORT: 'ATTENDANCE_IMPORT',
    ALLOCATION_CONFIRMED: 'ALLOCATION_CONFIRMED',
    ALLOCATION_REASSIGNED: 'ALLOCATION_REASSIGNED',
    ACHIEVEMENT_APPROVED: 'ACHIEVEMENT_APPROVED',
    ACHIEVEMENT_REJECTED: 'ACHIEVEMENT_REJECTED',
    ACHIEVEMENT_CORRECTION: 'ACHIEVEMENT_CORRECTION',
    EXAM_REQUEST_SUBMITTED: 'EXAM_REQUEST_SUBMITTED',
    EXAM_REQUEST_APPROVED: 'EXAM_REQUEST_APPROVED',
    EXAM_REQUEST_REJECTED: 'EXAM_REQUEST_REJECTED',
    PLACEMENT_STATUS_CHANGED: 'PLACEMENT_STATUS_CHANGED',
    DOCUMENT_UPLOADED: 'DOCUMENT_UPLOADED',
    DOCUMENT_REPLACED: 'DOCUMENT_REPLACED',
    DOCUMENT_DELETED: 'DOCUMENT_DELETED',
    STAFF_RECORD_CREATED: 'STAFF_RECORD_CREATED',
    STUDENT_RECORD_CREATED: 'STUDENT_RECORD_CREATED',
    STUDENT_PROMOTED: 'STUDENT_PROMOTED',
    STUDENT_GRADUATED: 'STUDENT_GRADUATED',
  },
};
