import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import RiskBadge from '../../components/common/RiskBadge';
import {
  GraduationCap,
  Download,
  Calendar,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Phone,
  Mail,
  MapPin,
  Award,
  Clock,
  Shield,
  FileSpreadsheet,
  Globe,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { SUPPORTED_LANGUAGES, t } from '../../utils/i18n';

export default function ParentOverview() {
  const [loading, setLoading] = useState(true);
  const [wardData, setWardData] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const { lang, setLang } = useLanguage();

  useEffect(() => {
    fetchWardData();
  }, []);

  const fetchWardData = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/parent/my-ward');
      setWardData(res.data?.data || res.data || res);
    } catch (err) {
      console.error('Error fetching ward data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!wardData?.student?._id) return;
    setDownloading(true);
    try {
      const res = await axiosClient.get(`/reports/student/${wardData.student._id}/report-card/pdf`, {
        responseType: 'blob',
      });
      const blob = res.data instanceof Blob ? res.data : (res instanceof Blob ? res : new Blob([res], { type: 'application/pdf' }));
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${wardData.student.usn}_ReportCard.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert(t('noRecordsFound', lang));
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen={false} message={t('loadingWardRecords', lang)} />;

  const student = wardData?.student || {};
  const mentor = student?.mentorId || wardData?.mentor || {};
  const mentorUser = mentor?.userId || mentor || {};
  const summary = wardData?.summary || {};
  const semesters = wardData?.semesters || student?.academics || [];
  const latestSem = semesters[semesters.length - 1] || {};
  const mentorshipRecords = student?.mentorshipRecords || [];
  const backlogRecords = student?.backlogRecords || [];
  const onlineCourses = student?.onlineCoursesAttended || [];

  const activeBacklogs = summary.totalActiveBacklogs ?? student.totalBacklogs ?? 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner with Language Selector */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-700 via-indigo-800 to-purple-800 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-white/20">
              {t('parentPortalTitle', lang)}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-status-success/30 text-emerald-100 border border-status-success/40">
              {t('strictlyReadOnly', lang)}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">
            {t('wardName', lang)}: {student.userId?.name || student.name || 'Student'}
          </h1>
          <p className="text-indigo-100 text-xs sm:text-sm mt-1">
            {t('usn', lang)}: <span className="font-mono font-bold text-white">{student.usn}</span>{' '}
            &bull; {student.department} &bull; {t('semester', lang)}{' '}
            {student.semester || student.currentSemester || 1} (Sec {student.section || 'A'})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Language Selector Dropdown */}
          <div className="flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-1.5 backdrop-blur-sm border border-white/20 text-xs">
            <Globe className="h-4 w-4 text-white" />
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
              aria-label={t('language', lang)}
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="text-gray-900">
                  {l.native} ({l.label})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleDownloadReport}
            disabled={downloading}
            className="px-4 py-2.5 bg-white text-role-primary hover:bg-role-soft font-semibold rounded-xl text-xs sm:text-sm shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
          >
            {downloading ? <LoadingSpinner size="sm" /> : <Download className="w-4 h-4" />}
            {t('downloadPdfReport', lang)}
          </button>
        </div>
      </div>

      {/* Read-Only Notice Box */}
      <div className="rounded-xl border border-indigo-100 bg-role-soft/70 p-4 text-xs text-role-primary dark:border-role-primary/40 dark:bg-role-soft-dark dark:text-indigo-200 shadow-sm flex items-start gap-2.5">
        <Shield className="h-4 w-4 text-role-primary dark:text-indigo-400 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {t('parentPortalNotice', lang)}
        </p>
      </div>

      {/* Ward Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CGPA Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
              {t('overallCGPA', lang)}
            </span>
            <div className="p-2 rounded-xl bg-role-soft dark:bg-role-soft-dark text-role-primary dark:text-indigo-400">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
              {(summary.cgpa ?? student.cgpa ?? 0).toFixed(2)}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">/ 10.0</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t('latestSgpa', lang)}: {latestSem.sgpa?.toFixed(2) || '—'}
          </p>
        </div>

        {/* Degree Credits Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
              {t('degreeCredits', lang)}
            </span>
            <div className="p-2 rounded-xl bg-role-soft dark:bg-role-soft-dark text-role-primary dark:text-purple-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
              {summary.totalEarnedCredits ?? student.earnedCredits ?? student.totalCredits ?? 0}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{t('credits', lang)}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{t('earnedTowardsGraduation', lang)}</p>
        </div>

        {/* Active Backlogs Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
              {t('activeBacklogs', lang)}
            </span>
            <div className="p-2 rounded-xl bg-status-warning dark:bg-status-amber text-status-warning dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
              {activeBacklogs}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{t('subject', lang)}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {activeBacklogs === 0 ? t('allClear', lang) : t('remedialCoaching', lang)}
          </p>
        </div>

        {/* Academic Standing Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
              {t('academicStanding', lang)}
            </span>
            <RiskBadge category={summary.riskLevel || student.riskProfile?.riskLevel || student.riskCategory || 'Low'} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold capitalize text-slate-800 dark:text-slate-100">
              {summary.riskLevel || student.riskProfile?.riskLevel || student.riskCategory || 'Low'}{' '}
              {t('riskSuffix', lang)}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{t('assessedContinuously', lang)}</p>
        </div>
      </div>

      {/* Assigned Mentor Contact Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-role-primary" />
          {t('assignedFacultyMentor', lang)}
        </h3>

        {mentorUser?.name || mentor?.name ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-lg">
                {(mentorUser.name || mentor.name || 'M')[0]}
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{mentorUser.name || mentor.name}</p>
                <p className="text-xs text-slate-500">{mentor.designation || t('facultyMentor', lang)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{mentor.department || student.department}</p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-role-primary" />
                {mentorUser.email || mentor.email || t('notProvided', lang)}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-role-primary" />
                {mentorUser.phone || mentor.phone || t('notProvided', lang)}
              </p>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <p className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-role-primary" />
                {mentor.officeRoom || t('notConfigured', lang)}
              </p>
              {mentor.consultationHours ? (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t('consultationHours', lang)}: {mentor.consultationHours}
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('noMentorAssigned', lang)}</p>
        )}
      </div>

      {/* Mentorship & Backlog Records Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mentorship Records */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-role-primary" />
            {t('mentorshipInteractionNotes', lang)} ({mentorshipRecords.length})
          </h3>

          {mentorshipRecords.length > 0 ? (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {mentorshipRecords.map((m, i) => (
                <div key={i} className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      {m.agenda || m.type || t('recentSessions', lang)}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                      {m.date ? new Date(m.date).toLocaleDateString() : '—'}
                    </span>
                  </div>
                  {(m.discussionPoints || m.notes) && (
                    <p className="text-slate-600 dark:text-slate-300">{m.discussionPoints || m.notes}</p>
                  )}
                  {(m.actionItems || m.actionTaken || m.outcome) && (
                    <div className="p-2 bg-role-soft/50 dark:bg-role-soft-dark rounded-lg text-role-primary dark:text-indigo-300 text-[11px]">
                      <strong>{t('actionPlan', lang)}:</strong> {m.actionItems || m.actionTaken || m.outcome}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">{t('noMentorshipRecorded', lang)}</p>
          )}
        </div>

        {/* Backlog Clearance History */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-role-primary" />
            {t('backlogClearanceTracking', lang)} ({backlogRecords.length})
          </h3>

          {backlogRecords.length > 0 ? (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {backlogRecords.map((b, i) => {
                const isCleared = b.isCleared ?? (b.status === 'Cleared');
                const semFailed = b.semesterFailed ?? b.semester;
                const clearedSem = b.clearedSemester || (b.clearedDate ? new Date(b.clearedDate).toLocaleDateString() : null);
                return (
                  <div key={i} className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{b.subjectCode || '—'}</span>{' '}
                      - {b.subjectName || b.subject || t('subject', lang)}
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {t('failedInSem', lang)} {semFailed || '—'}{' '}
                        {clearedSem ? `• ${t('cleared', lang)}: ${clearedSem}` : ''}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isCleared ? 'bg-status-success text-status-success dark:bg-status-emerald dark:text-emerald-300' : 'bg-status-error text-status-error dark:bg-status-error dark:text-status-error'}`}>
                      {isCleared ? t('clearedLabel', lang) : t('pending', lang)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">{t('noBacklogsRecorded', lang)}</p>
          )}
        </div>
      </div>

      {/* Online Certifications */}
      {onlineCourses.length > 0 && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Award className="w-5 h-5 text-role-primary" />
            {t('verifiedCertifications', lang)} ({onlineCourses.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {onlineCourses.map((c, i) => (
              <div key={i} className="p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-100">{c.courseName}</span>
                  <span className="px-1.5 py-0.5 bg-role-soft dark:bg-role-soft-dark text-role-primary dark:text-indigo-300 rounded text-[10px] font-bold">
                    {c.platform || 'MOOC'}
                  </span>
                </div>
                {c.completionDate && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {t('completed', lang)}: {new Date(c.completionDate).toLocaleDateString()}
                  </p>
                )}
                {c.certificateUrl && (
                  <a
                    href={c.certificateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-role-primary dark:text-indigo-400 hover:underline font-semibold text-[11px] pt-1"
                  >
                    🔗 {t('viewCertificate', lang)}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Latest Semester Subject Breakdown */}
      {latestSem.subjects && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-role-primary" />
              {t('semester', lang)} {latestSem.semesterNumber} {t('semesterMarksSummary', lang)}
            </h3>
            <span className="text-xs font-bold text-role-primary dark:text-indigo-400">
              SGPA: {latestSem.sgpa?.toFixed(2) || '—'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-900/50 uppercase text-[11px] font-semibold text-slate-500 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-3 py-2.5">{t('subject', lang)}</th>
                  <th className="px-2 py-2.5 text-center">{t('credits2', lang)}</th>
                  <th className="px-2 py-2.5 text-center">{t('cieTotal', lang)}</th>
                  <th className="px-2 py-2.5 text-center">{t('seeMark', lang)}</th>
                  <th className="px-2 py-2.5 text-center font-bold">{t('finalMark', lang)}</th>
                  <th className="px-2 py-2.5 text-center">{t('grade', lang)}</th>
                  <th className="px-2 py-2.5 text-center">{t('result', lang)}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {latestSem.subjects.map((s, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2.5">
                      <p className="font-bold text-slate-800 dark:text-slate-100">{s.subjectName}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{s.subjectCode}</p>
                    </td>
                    <td className="px-2 py-2.5 text-center">{s.credits}</td>
                    <td className="px-2 py-2.5 text-center font-semibold">{s.cieTotal ?? '—'}</td>
                    <td className="px-2 py-2.5 text-center">{s.semesterExamMarks ?? '—'}</td>
                    <td className="px-2 py-2.5 text-center font-bold text-role-primary dark:text-indigo-400">{s.finalMarks ?? '—'}</td>
                    <td className="px-2 py-2.5 text-center font-black">{s.grade || '—'}</td>
                    <td className="px-2 py-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${s.grade === 'F' ? 'bg-status-error text-status-error' : 'bg-status-success text-status-success'}`}>
                        {s.grade === 'F' ? t('backlogResult', lang) : t('passResult', lang)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
