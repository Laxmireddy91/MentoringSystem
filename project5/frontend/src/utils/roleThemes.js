/**
 * Role Theme Token System — Project5 / Monitor IQ
 *
 * Each role gets a distinct, premium, muted institutional color identity.
 * These are used in two ways:
 *   1. CSS custom properties on :root (via index.css + RoleThemeApplier)
 *   2. JS-side tokens for pre-auth pages (LoginPage, ActivateAccountPage)
 *      where useAuth() may not yet have a user.
 *
 * Color rule: accent only. Backgrounds stay white/gray/navy.
 * Never neon, never overly saturated.
 */

export const ROLE_THEMES = {
  // ─── Student — Sapphire / Royal Blue ────────────────────────────────────
  // Academic, modern, energetic
  student: {
    primary:      '#1E4DB7',   // Sapphire Royal Blue
    dark:         '#163A8A',   // Hover / pressed
    soft:         'rgba(30, 77, 183, 0.10)',   // Icon bg, metric tint
    softDark:     'rgba(30, 77, 183, 0.18)',
    border:       'rgba(30, 77, 183, 0.22)',
    textLight:    '#1E4DB7',   // On white bg colored text
    textDarkMode: '#93C5FD',   // In dark mode on dark surfaces
    label:        'Student',
    tailwindRing: 'focus:ring-[#1E4DB7]',
  },

  // ─── Mentor — Deep Teal / Emerald ───────────────────────────────────────
  // Professional, supportive, trustworthy
  mentor: {
    primary:      '#0F766E',   // Deep Teal
    dark:         '#0A5F58',
    soft:         'rgba(15, 118, 110, 0.10)',
    softDark:     'rgba(15, 118, 110, 0.18)',
    border:       'rgba(15, 118, 110, 0.22)',
    textLight:    '#0F766E',
    textDarkMode: '#5EEAD4',
    label:        'Mentor',
    tailwindRing: 'focus:ring-[#0F766E]',
  },

  // ─── Mentoring Coordinator — Indigo / Deep Violet ───────────────────────
  // Administrative, analytical, structured
  mentoring_coordinator: {
    primary:      '#4338CA',   // Deep Indigo
    dark:         '#3730A3',
    soft:         'rgba(67, 56, 202, 0.10)',
    softDark:     'rgba(67, 56, 202, 0.18)',
    border:       'rgba(67, 56, 202, 0.22)',
    textLight:    '#4338CA',
    textDarkMode: '#A5B4FC',
    label:        'Coordinator',
    tailwindRing: 'focus:ring-[#4338CA]',
  },

  // ─── HOD — Burgundy / Deep Maroon ───────────────────────────────────────
  // Institutional, authoritative, distinguished
  hod: {
    primary:      '#7C1D1D',   // Deep Burgundy
    dark:         '#631616',
    soft:         'rgba(124, 29, 29, 0.10)',
    softDark:     'rgba(124, 29, 29, 0.18)',
    border:       'rgba(124, 29, 29, 0.22)',
    textLight:    '#7C1D1D',
    textDarkMode: '#FCA5A5',
    label:        'HOD',
    tailwindRing: 'focus:ring-[#7C1D1D]',
  },

  // ─── Exam Coordinator — Deep Navy / Steel Blue ──────────────────────────
  // Formal, structured, precise
  exam_coordinator: {
    primary:      '#1E3A5F',   // Deep Navy / Steel Blue
    dark:         '#162D4A',
    soft:         'rgba(30, 58, 95, 0.10)',
    softDark:     'rgba(30, 58, 95, 0.18)',
    border:       'rgba(30, 58, 95, 0.22)',
    textLight:    '#1E3A5F',
    textDarkMode: '#93C5FD',
    label:        'Exam Coordinator',
    tailwindRing: 'focus:ring-[#1E3A5F]',
  },

  // ─── TPO — Deep Forest Green ─────────────────────────────────────────────
  // Professional, career-oriented, growth
  tpo: {
    primary:      '#14532D',   // Forest Green
    dark:         '#0F3D22',
    soft:         'rgba(20, 83, 45, 0.10)',
    softDark:     'rgba(20, 83, 45, 0.18)',
    border:       'rgba(20, 83, 45, 0.22)',
    textLight:    '#14532D',
    textDarkMode: '#86EFAC',
    label:        'TPO',
    tailwindRing: 'focus:ring-[#14532D]',
  },

  // ─── Parent — Warm Gold / Bronze ─────────────────────────────────────────
  // Welcoming, trustworthy, approachable — NOT childish
  parent: {
    primary:      '#92400E',   // Deep Amber/Bronze
    dark:         '#78340B',
    soft:         'rgba(146, 64, 14, 0.10)',
    softDark:     'rgba(146, 64, 14, 0.18)',
    border:       'rgba(146, 64, 14, 0.22)',
    textLight:    '#92400E',
    textDarkMode: '#FDE68A',
    label:        'Parent',
    tailwindRing: 'focus:ring-[#92400E]',
  },

  // ─── Default fallback (before login) ────────────────────────────────────
  default: {
    primary:      '#162D4A',   // Monitor IQ institutional navy
    dark:         '#0F172A',
    soft:         'rgba(22, 45, 74, 0.10)',
    softDark:     'rgba(22, 45, 74, 0.18)',
    border:       'rgba(22, 45, 74, 0.20)',
    textLight:    '#162D4A',
    textDarkMode: '#94A3B8',
    label:        'Portal',
    tailwindRing: 'focus:ring-[#162D4A]',
  },
};

/**
 * Get the theme for a given role key.
 * Falls back to 'default' for unknown/null roles.
 */
export function getRoleTheme(role) {
  return ROLE_THEMES[role] || ROLE_THEMES.default;
}

/**
 * Apply a role theme as CSS custom properties on document.documentElement.
 * Call this whenever the active role changes.
 */
export function applyRoleTheme(role) {
  const theme = getRoleTheme(role);
  const root = document.documentElement;
  root.style.setProperty('--primary-color',      theme.primary);
  root.style.setProperty('--primary-dark',       theme.dark);
  root.style.setProperty('--primary-soft',       theme.soft);
  root.style.setProperty('--primary-soft-dark',  theme.softDark);
  root.style.setProperty('--primary-border',     theme.border);
  root.style.setProperty('--primary-text-light', theme.textLight);
  if (theme.textDarkMode) {
    root.style.setProperty('--primary-text-dark', theme.textDarkMode);
  }
  root.classList.remove(
    'theme-student',
    'theme-mentor',
    'theme-mentoring_coordinator',
    'theme-hod',
    'theme-exam_coordinator',
    'theme-tpo',
    'theme-parent'
  );
  if (role && role !== 'default') {
    root.classList.add(`theme-${role}`);
  }
}

/**
 * Clear any active role CSS custom properties and classes,
 * reverting document.documentElement back to the default institutional theme.
 */
export function clearRoleTheme() {
  const root = document.documentElement;
  root.style.removeProperty('--primary-color');
  root.style.removeProperty('--primary-dark');
  root.style.removeProperty('--primary-soft');
  root.style.removeProperty('--primary-soft-dark');
  root.style.removeProperty('--primary-border');
  root.style.removeProperty('--primary-text-light');
  root.style.removeProperty('--primary-text-dark');
  root.classList.remove(
    'theme-student',
    'theme-mentor',
    'theme-mentoring_coordinator',
    'theme-hod',
    'theme-exam_coordinator',
    'theme-tpo',
    'theme-parent'
  );
}
