import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Globe,
  LogIn,
  Users,
  GraduationCap,
  Users2,
  Landmark,
  Award,
  Home as HomeIcon,
  CheckCircle2,
  FileCheck2,
  Briefcase,
  Cpu,
  ChevronDown,
  ArrowRight,
  UserPlus,
  Sun,
  Moon,
  Mail,
  Phone,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { SUPPORTED_LANGUAGES, t } from '../../utils/i18n';

/* ============================================================================
   Aggregate Department Data — SGBIT Engineering Branches
============================================================================ */
const DEPARTMENTS = [
  { code: 'CSE', name: 'Computer Science & Engg.', students: 620 },
  { code: 'ECE', name: 'Electronics & Comm. Engg.', students: 410 },
  { code: 'ISE', name: 'Information Science & Engg.', students: 340 },
  { code: 'ME', name: 'Mechanical Engineering', students: 380 },
  { code: 'CV', name: 'Civil Engineering', students: 290 },
  { code: 'EEE', name: 'Electrical & Electronics Engg.', students: 260 },
];

const TOTAL_STUDENTS = DEPARTMENTS.reduce((sum, d) => sum + d.students, 0);
const TOTAL_ACTIVE_MENTEES = 2180;

/* ============================================================================
   All 7 Project5 Institutional Roles — keys only; labels from i18n
============================================================================ */
const ROLE_KEYS = [
  { key: 'student',               icon: GraduationCap },
  { key: 'mentor',                icon: Users2 },
  { key: 'mentoring_coordinator', icon: Cpu },
  { key: 'hod',                   icon: Landmark },
  { key: 'exam_coordinator',      icon: FileCheck2 },
  { key: 'tpo',                   icon: Briefcase },
  { key: 'parent',                icon: HomeIcon },
];

const ROLE_PATHS = {
  student:               '/student/overview',
  mentor:                '/mentor/overview',
  mentoring_coordinator: '/coordinator/overview',
  hod:                   '/hod/overview',
  exam_coordinator:      '/exam-coordinator/requests',
  tpo:                   '/tpo/drives',
  parent:                '/parent/overview',
};

export default function LandingPage() {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { lang, setLang } = useLanguage();
  const navigate = useNavigate();

  const [langOpen, setLangOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  const handleLangChange = (newCode) => {
    setLang(newCode);
    setLangOpen(false);
  };

  // Monitor IQ refined color palette (adaptive to light / dark theme)
  const C = {
    navy: isDark ? 'var(--primary-dark)' : 'var(--primary-color)',
    navySoft: isDark ? 'var(--primary-soft-dark)' : '#223458',
    navyText: isDark ? '#93C5FD' : 'var(--primary-color)',
    paper: isDark ? '#0B0F19' : '#FBF9F4',
    paperCard: isDark ? '#131B2E' : '#FFFFFF',
    paperAlt: isDark ? '#1E293B' : '#F4EFE6',
    border: isDark ? '#334155' : '#EAE5DB',
    borderSoft: isDark ? '#2D3748' : '#F0ECE4',
    text: isDark ? '#F1F5F9' : '#1E293B',
    textSub: isDark ? '#94A3B8' : '#475569',
    textMuted: isDark ? '#64748B' : '#6B7280',
    gold: '#B58A3D',
    goldSoft: isDark ? 'rgba(181, 138, 61, 0.15)' : '#FDF6E9',
    green: '#10b981',
    greenSoft: isDark ? 'rgba(47, 99, 80, 0.15)' : '#EDF6F2',
    blue: '#3b82f6',
    blueSoft: isDark ? 'rgba(47, 71, 112, 0.15)' : '#EDF2F9',
  };

  // Workflow checklist — titles & details from i18n
  const PROCESS_STATUS = [
    { titleKey: 'process1Title', detailKey: 'process1Detail' },
    { titleKey: 'process2Title', detailKey: 'process2Detail' },
    { titleKey: 'process3Title', detailKey: 'process3Detail' },
    { titleKey: 'process4Title', detailKey: 'process4Detail' },
    { titleKey: 'process5Title', detailKey: 'process5Detail' },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        background: C.paper,
        fontFamily: "'IBM Plex Sans', sans-serif",
        color: C.text,
        transition: 'background-color 0.2s ease, color 0.2s ease',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap');
        .register-serif { font-family: 'Fraunces', serif; }
        .register-mono { font-family: 'IBM Plex Mono', monospace; }
        .hover-lift { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .hover-lift:hover { transform: translateY(-3px); box-shadow: 0 14px 28px -14px rgba(22,35,61,0.22); }
        .btn { transition: transform 0.15s ease, background-color 0.15s ease; cursor: pointer; }
        .btn:hover { transform: translateY(-1px); }
        @media (prefers-reduced-motion: reduce) { .hover-lift, .btn { transition: none !important; } }
        @media (max-width: 768px) {
          .header-tagline { display: none !important; }
          .hero-grid { grid-template-columns: 1fr !important; text-align: center; }
          .hero-crest-container { justify-content: center !important; margin-top: 24px; }
          .middle-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ====================================================================
          1. Monitor IQ Header
      ==================================================================== */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: isDark ? 'rgba(15, 23, 42, 0.94)' : 'rgba(251, 249, 244, 0.94)',
          backdropFilter: 'blur(8px)',
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div
          style={{
            maxWidth: 1180,
            margin: '0 auto',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          {/* Brand Left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img
              src="/assets/logo.png"
              alt="SGBIT crest"
              style={{ width: 44, height: 44, objectFit: 'contain', flexShrink: 0 }}
            />
            <div>
              <div
                className="register-serif"
                style={{ fontSize: 15, fontWeight: 600, color: C.navyText, lineHeight: '19px' }}
              >
                {t('headerInstitution', lang)}
              </div>
              <div
                className="header-tagline register-mono"
                style={{ fontSize: 10.5, color: C.textMuted, letterSpacing: '0.03em' }}
              >
                {t('headerSubtitle', lang)}
              </div>
            </div>
          </div>

          {/* Controls Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Language Selector */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setLangOpen((v) => !v)}
                className="btn"
                aria-label={t('language', lang)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 11px',
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  background: C.paperCard,
                  fontSize: 12.5,
                  color: C.text,
                }}
              >
                <Globe size={14} />
                <span>{SUPPORTED_LANGUAGES.find((l) => l.code === lang)?.native || 'English'}</span>
                <ChevronDown size={13} />
              </button>
              {langOpen && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 38,
                    width: 160,
                    background: C.paperCard,
                    border: `1px solid ${C.border}`,
                    borderRadius: 10,
                    boxShadow: '0 12px 30px -12px rgba(22,35,61,0.3)',
                    zIndex: 50,
                    padding: 6,
                  }}
                >
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <div
                      key={l.code}
                      onClick={() => handleLangChange(l.code)}
                      style={{
                        padding: '8px 10px',
                        fontSize: 12.5,
                        borderRadius: 6,
                        cursor: 'pointer',
                        background: lang === l.code ? C.paperAlt : 'transparent',
                        color: C.text,
                        fontWeight: lang === l.code ? 600 : 400,
                      }}
                    >
                      {l.native}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="btn"
              aria-label={t('toggleTheme', lang)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px',
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: C.paperCard,
                color: C.text,
              }}
            >
                {isDark ? <Sun size={15} color={"var(--status-warning)"} /> : <Moon size={15} color={"var(--status-warning)"} />}
            </button>

            {/* Auth CTA Buttons */}
            {user ? (
              <button
                onClick={() => navigate(ROLE_PATHS[user.role] || '/dashboard')}
                className="btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: C.navy,
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                <LogIn size={14} />
                <span>{t('dashboard', lang)}</span>
              </button>
            ) : (
              <>
                <Link
                  to="/activate"
                  className="btn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    background: 'transparent',
                    color: C.text,
                    fontSize: 12.5,
                    fontWeight: 500,
                    textDecoration: 'none',
                  }}
                >
                  <UserPlus size={14} />
                  <span>{t('activate', lang)}</span>
                </Link>
                <Link
                  to="/login"
                  className="btn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: 'none',
                    background: C.navy,
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 500,
                    textDecoration: 'none',
                  }}
                >
                  <LogIn size={14} />
                  <span>{t('loginButton', lang)}</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ====================================================================
          2. Monitor IQ Hero Section
      ==================================================================== */}
      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '52px 24px 36px 24px' }}>
        <div
          className="hero-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 0.8fr',
            gap: 40,
            alignItems: 'center',
          }}
        >
          <div>
            <div
              className="register-mono"
              style={{
                fontSize: 12,
                color: C.gold,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 10,
                fontWeight: 600,
              }}
            >
              {t('heroKicker', lang)}
            </div>
            <h1
              className="register-serif"
              style={{
                fontSize: 38,
                color: C.navyText,
                margin: 0,
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
              }}
            >
              {t('heroTitle', lang)}
            </h1>
            <div
              style={{
                fontSize: 14,
                color: C.gold,
                fontWeight: 600,
                marginTop: 6,
                letterSpacing: '0.02em',
              }}
            >
              {t('heroInstitution', lang)}
            </div>
            <p
              style={{
                fontSize: 14,
                color: C.textSub,
                marginTop: 14,
                lineHeight: '22px',
                maxWidth: 520,
              }}
            >
              {t('heroDescription', lang)}
            </p>

            <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link
                to="/login"
                className="btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 20px',
                  borderRadius: 9,
                  background: C.navy,
                  color: '#FFFFFF',
                  fontSize: 13.5,
                  fontWeight: 500,
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(22,35,61,0.18)',
                }}
              >
                <span>{t('accessPortal', lang)}</span>
                <ArrowRight size={15} />
              </Link>
              <Link
                to="/activate"
                className="btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 18px',
                  borderRadius: 9,
                  border: `1px solid ${C.border}`,
                  background: C.paperCard,
                  color: C.text,
                  fontSize: 13.5,
                  fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                <UserPlus size={15} color={C.gold} />
                <span>{t('activateAccount', lang)}</span>
              </Link>
            </div>
          </div>

          <div className="hero-crest-container" style={{ display: 'flex', justifyContent: 'center' }}>
            <img
              src="/assets/logo.png"
              alt="SGBIT Crest"
              style={{
                width: 175,
                height: 175,
                objectFit: 'contain',
                filter: 'drop-shadow(0 12px 24px rgba(22,35,61,0.16))',
              }}
            />
          </div>
        </div>
      </section>

      {/* ====================================================================
          3. Aggregate Institutional Statistics (3 Clean Cards)
      ==================================================================== */}
      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '0 24px 36px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {/* Card 1: Navy Gradient */}
          <div
            className="hover-lift"
            style={{
              background: `linear-gradient(135deg, ${C.navy}, #223A63)`,
              borderRadius: 14,
              padding: 22,
              color: '#FFFFFF',
              boxShadow: '0 4px 14px rgba(22,35,61,0.12)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Users size={22} color="#F3E8D2" />
              </div>
              <div>
                <div className="register-serif" style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.1 }}>
                  {TOTAL_ACTIVE_MENTEES.toLocaleString()}
                </div>
                <div style={{ fontSize: 12.5, color: '#E2E8F0', marginTop: 3 }}>
                  {t('statActiveMentees', lang)}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Students Monitored */}
          <div
            className="hover-lift"
            style={{
              background: C.paperCard,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: 22,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: C.goldSoft,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <GraduationCap size={22} color={C.gold} />
              </div>
              <div>
                <div
                  className="register-serif"
                  style={{ fontSize: 28, fontWeight: 700, color: C.text, lineHeight: 1.1 }}
                >
                  {TOTAL_STUDENTS.toLocaleString()}
                </div>
                <div style={{ fontSize: 12.5, color: C.textSub, marginTop: 3 }}>
                  {t('statStudentsMonitored', lang)}
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Institutional Roles */}
          <div
            className="hover-lift"
            style={{
              background: C.paperCard,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: 22,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: C.greenSoft,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Landmark size={22} color={C.green} />
              </div>
              <div>
                <div
                  className="register-serif"
                  style={{ fontSize: 28, fontWeight: 700, color: C.text, lineHeight: 1.1 }}
                >
                  {t('statRoles', lang)}
                </div>
                <div style={{ fontSize: 12.5, color: C.textSub, marginTop: 3 }}>
                  {t('statInstitutionalWorkspaces', lang)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          4. Middle Section (Students by Branch + Mentoring Processes)
      ==================================================================== */}
      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '0 24px 36px 24px' }}>
        <div className="middle-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
          {/* Left Card: Department BarChart */}
          <div
            style={{
              background: C.paperCard,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: 22,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 3 }}>
              {t('studentsByDepartment', lang)}
            </div>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 14 }}>
              {t('departmentDistributionDesc', lang)}
            </div>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={DEPARTMENTS} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={C.borderSoft} vertical={false} />
                <XAxis
                  dataKey="code"
                  tick={{ fontSize: 11, fill: C.textSub }}
                  axisLine={{ stroke: C.border }}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: C.textSub }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    background: C.paperCard,
                    color: C.text,
                    boxShadow: '0 8px 20px -8px rgba(22,35,61,0.2)',
                  }}
                  formatter={(value, name, props) => [`${value} ${t('tooltipStudents', lang)}`, props.payload.name]}
                />
                <Bar dataKey="students" fill={C.blue} radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Right Card: Process Checklist */}
          <div
            style={{
              background: C.paperCard,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: 22,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 14 }}>
              {t('institutionalMentoringWorkflows', lang)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {PROCESS_STATUS.map((p, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <CheckCircle2
                    size={16}
                    color={C.green}
                    style={{ marginTop: 2, flexShrink: 0 }}
                  />
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: C.text }}>{t(p.titleKey, lang)}</div>
                    <div style={{ fontSize: 11.5, color: C.textMuted, marginTop: 1 }}>{t(p.detailKey, lang)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          5. Guiding Philosophy (Swamiji & Institutional Motto)
      ==================================================================== */}
      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '0 24px 36px 24px' }}>
        <div
          style={{
            display: 'flex',
            gap: 22,
            alignItems: 'center',
            flexWrap: 'wrap',
            background: C.paperAlt,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: 20,
          }}
        >
          <img
            src="/assets/swamiji.jpg"
            alt={t('institutionAltText', lang)}
            style={{
              width: 90,
              height: 90,
              objectFit: 'cover',
              borderRadius: '9999px',
              border: `3px solid ${C.gold}`,
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: 240 }}>
            <div
              className="register-serif"
              style={{ fontSize: 18, fontWeight: 600, color: C.navyText, lineHeight: 1.3 }}
            >
              {t('philosophyQuote', lang)}
            </div>
            <p style={{ fontSize: 12.5, color: C.textSub, marginTop: 6, lineHeight: '19px', maxWidth: 640 }}>
              {t('philosophyDesc', lang)}
            </p>
          </div>
        </div>
      </section>

      {/* ====================================================================
          6. Institutional Role Portal Access (All 7 Roles)
      ==================================================================== */}
      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '0 24px 52px 24px' }}>
        <div
          style={{
            background: C.paperCard,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: '28px 22px',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div className="register-serif" style={{ fontSize: 21, fontWeight: 600, color: C.navyText }}>
              {t('accessInstitutionalWorkspace', lang)}
            </div>
            <p style={{ fontSize: 13, color: C.textSub, marginTop: 5 }}>
              {t('selectRolePrompt', lang)}
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 12,
            }}
          >
            {ROLE_KEYS.map((r) => {
              const Icon = r.icon;
              const isSelected = selectedRole === r.key;
              return (
                <button
                  key={r.key}
                  onClick={() => setSelectedRole(r.key)}
                  className="btn hover-lift"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    padding: '16px 10px',
                    borderRadius: 12,
                    border: `1.5px solid ${isSelected ? C.gold : C.border}`,
                    background: isSelected ? C.goldSoft : C.paperCard,
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  <Icon size={22} color={isSelected ? C.gold : C.textSub} />
                  <span style={{ fontSize: 12.5, fontWeight: isSelected ? 600 : 500, color: C.text }}>
                    {t(`roleLabel_${r.key}`, lang)}
                  </span>
                  <span style={{ fontSize: 10.5, color: C.textMuted, lineHeight: '14px' }}>
                    {t(`roleDesc_${r.key}`, lang)}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedRole && (
            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <button
                onClick={() => navigate(`/login?role=${selectedRole}`)}
                className="btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  maxWidth: 400,
                  width: '100%',
                  padding: '12px 20px',
                  borderRadius: 9,
                  border: 'none',
                  background: C.navy,
                  color: '#fff',
                  fontSize: 13.5,
                  fontWeight: 500,
                  boxShadow: '0 4px 12px rgba(22,35,61,0.2)',
                }}
              >
                <span>
                  {t('continueAs', lang)} {t(`roleLabel_${selectedRole}`, lang)} →
                </span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ====================================================================
          7. Monitor IQ Deep Navy Footer
      ==================================================================== */}
      <footer style={{ background: C.navy, color: '#F1F5F9', padding: '28px 24px' }}>
        <div
          style={{
            maxWidth: 1180,
            margin: '0 auto',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: 16,
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src="/assets/logo.png"
              alt="SGBIT Crest"
              style={{ width: 28, height: 28, objectFit: 'contain' }}
            />
            <span style={{ fontSize: 12.5, fontWeight: 500, color: '#FFFFFF' }}>
              {t('footerInstitution', lang)}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 20, fontSize: 12, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Mail size={13} color="#94A3B8" /> support@sgbit.edu.in
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Phone size={13} color="#94A3B8" /> +91 831 240 7107
            </span>
          </div>
          <span style={{ fontSize: 11.5, color: '#8B93A8' }}>
            &copy; {new Date().getFullYear()} {t('footerCopyright', lang)}
          </span>
        </div>
      </footer>
    </div>
  );
}
