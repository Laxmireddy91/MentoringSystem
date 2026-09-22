import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Briefcase,
  GraduationCap,
  Calendar,
  BookOpen,
  Info,
  Layers,
  Award,
  FileText,
  FileCheck,
  Send,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  User,
  Building,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  BarChart2,
} from 'lucide-react';

export default function Student360Modal({ isOpen, onClose, studentId }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!isOpen || !studentId) return;

    const fetch360 = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await axiosClient.get(`/students/${studentId}/360`);
        setData(res.data?.data || res.data || res);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load Student 360 profile');
      } finally {
        setLoading(false);
      }
    };

    fetch360();
  }, [isOpen, studentId]);

  if (!isOpen) return null;

  const student = data?.student;
  const academicSummary = data?.academicSummary;
  const attention = data?.academicAttention;
  const attendance = data?.attendanceSummary;
  const brief = data?.mentorBrief;
  const achievements = data?.achievements || [];
  const sessions = data?.sessions || [];
  const mentorshipRecords = student?.mentorshipRecords || [];
  const placement = data?.placement;
  const examRequests = data?.examRequests || [];
  const documents = data?.documents || [];

  const studentName = student?.userId?.name || student?.name || 'Student';
  const studentEmail = student?.userId?.email || student?.email || 'N/A';
  const mentorName = student?.mentorId?.userId?.name || student?.mentorId?.name || 'Unassigned';

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Layers },
    { id: 'academics', label: 'Academics', icon: GraduationCap, badge: academicSummary?.totalActiveBacklogs > 0 ? academicSummary.totalActiveBacklogs : null, badgeColor: 'bg-rose-500' },
    { id: 'attendance', label: 'Attendance', icon: Calendar, badge: attendance?.hasAttendanceWarning ? '!' : null, badgeColor: 'bg-status-warning' },
    { id: 'achievements', label: 'Achievements', icon: Award, count: achievements.length },
    { id: 'placement', label: 'Placement', icon: Briefcase },
    { id: 'mentoring', label: 'Mentoring', icon: BookOpen, count: sessions.length + mentorshipRecords.length },
    { id: 'documents', label: 'Documents', icon: FileText, count: documents.length },
    { id: 'requests', label: 'Requests', icon: Send, count: examRequests.length },
  ];

  // Helper to check if any CIE marks exist
  const hasCieRecords = academicSummary?.semesters?.some(
    (sem) => sem.subjects && sem.subjects.some((subj) => subj.cie1 > 0 || subj.cie2 > 0 || subj.cie3 > 0)
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-role-primary" />
          <span>Student 360° Academic & Mentoring Console</span>
        </div>
      }
      maxWidth="max-w-6xl"
    >
      {loading ? (
        <div className="flex h-72 items-center justify-center">
          <LoadingSpinner size="lg" message="Loading Student 360 Console..." />
        </div>
      ) : error ? (
        <div className="p-4 bg-status-error dark:bg-status-red text-status-error dark:text-red-200 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-status-error flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : data ? (
        <div className="space-y-5 text-xs">
          {/* Institutional Student Header Banner */}
          <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 text-white shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-xl font-black text-white">{studentName}</h2>
                  <span className="rounded-lg bg-indigo-500/20 border border-indigo-400/40 px-2.5 py-0.5 font-mono text-xs font-bold text-indigo-200">
                    {student?.usn || 'NO USN'}
                  </span>
                  <span className="rounded-lg bg-slate-800/80 px-2.5 py-0.5 text-xs text-slate-300">
                    {student?.department || 'Department'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-indigo-200/90">
                  <span>Semester {student?.semester || 1} • Section {student?.section || 'A'}</span>
                  <span>•</span>
                  <span>Batch: {student?.batch || '2024-2028'}</span>
                  <span>•</span>
                  <span>Assigned Mentor: <strong className="text-white">{mentorName}</strong></span>
                  <span>•</span>
                  <span>{studentEmail}</span>
                </div>
              </div>

              {/* Top Key Performance Indicators */}
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-2.5 rounded-xl backdrop-blur-sm self-start lg:self-auto">
                <div className="text-center px-3">
                  <span className="text-[10px] uppercase tracking-wider text-indigo-300 block font-semibold">CGPA</span>
                  <span className="text-lg font-black text-white">
                    {academicSummary?.cgpa ? academicSummary.cgpa.toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div className="text-center px-3">
                  <span className="text-[10px] uppercase tracking-wider text-indigo-300 block font-semibold">Active Backlogs</span>
                  <span
                    className={`text-lg font-black ${
                      (academicSummary?.totalActiveBacklogs || 0) > 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {academicSummary?.totalActiveBacklogs || 0}
                  </span>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div className="text-center px-3">
                  <span className="text-[10px] uppercase tracking-wider text-indigo-300 block font-semibold">Attendance</span>
                  <span
                    className={`text-lg font-black ${
                      !attendance?.hasRecords
                        ? 'text-slate-500 dark:text-slate-400'
                        : attendance?.hasAttendanceWarning
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {attendance?.hasRecords ? `${attendance.overallPercentage}%` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-role-primary text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold text-white ${tab.badgeColor}`}>
                      {tab.badge}
                    </span>
                  )}
                  {tab.count !== undefined && tab.count > 0 && !tab.badge && (
                    <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                      isActive ? 'bg-role-primary text-indigo-100' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Factual Auto-Generated Mentor Executive Brief */}
              {brief && (
                <div className="rounded-2xl border border-indigo-100 dark:border-role-primary/50 bg-gradient-to-br from-indigo-50/70 to-purple-50/40 dark:from-indigo-950/30 dark:to-purple-950/20 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-role-primary dark:text-indigo-200 font-bold text-xs">
                      <Sparkles className="h-4 w-4 text-role-primary dark:text-indigo-400" />
                      <span>Factual Mentor Executive Brief</span>
                    </div>
                    <span className="text-[10px] font-semibold text-role-primary dark:text-indigo-400 bg-role-soft dark:bg-role-primary/60 px-2 py-0.5 rounded-full">
                      Deterministic DB Synthesis
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs">
                    {brief.summary}
                  </p>

                  {/* Recommendations */}
                  {brief.recommendedFocus && brief.recommendedFocus.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-indigo-100 dark:border-role-primary/40">
                      <span className="text-[11px] font-bold text-indigo-950 dark:text-indigo-200 block mb-1.5">
                        Recommended Mentoring Focus:
                      </span>
                      <div className="space-y-1">
                        {brief.recommendedFocus.map((focus, i) => (
                          <div key={i} className="flex items-start gap-2 text-[11px] text-slate-700 dark:text-slate-300">
                            <span className="text-role-primary font-bold">•</span>
                            <span>{focus}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Side-by-Side Cards: Academic Standing vs Independent Attendance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Academic Standing (CIE + Backlogs ONLY) */}
                <div
                  className={`rounded-2xl border p-4 shadow-sm ${
                    attention?.needsAttention
                      ? 'border-status-error bg-status-error/40 dark:border-red-900/40 dark:bg-status-red'
                      : 'border-status-success bg-status-success/40 dark:border-emerald-900/40 dark:bg-status-emerald'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <GraduationCap
                        className={`h-4 w-4 ${
                          attention?.needsAttention ? 'text-status-error' : 'text-status-success'
                        }`}
                      />
                      <span className="font-bold text-slate-900 dark:text-white">
                        Academic Standing Evaluation
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        attention?.needsAttention
                          ? 'bg-status-error text-status-error dark:bg-status-error/60 dark:text-red-200'
                          : 'bg-status-success text-status-success dark:bg-status-success/60 dark:text-emerald-200'
                      }`}
                    >
                      {attention?.needsAttention ? (
                        <>
                          <AlertTriangle className="h-3 w-3" />
                          <span>Students Needing Academic Attention</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Good Academic Standing</span>
                        </>
                      )}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                    Strict formula evaluates Continuous Internal Evaluation (CIE &lt; 25/50) and active backlog history only. Attendance is never factored in.
                  </p>

                  <div className="grid grid-cols-2 gap-2 my-2 py-2 border-y border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px]">CIE Test Benchmark</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {attention?.cieAverage ? `${attention.cieAverage.toFixed(1)} / 50` : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Active Backlogs</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {attention?.activeBacklogs ?? 0}
                      </span>
                    </div>
                  </div>

                  {/* Specific Attention Triggers */}
                  <div className="space-y-1 mt-2">
                    {attention?.reasons && attention.reasons.length > 0 ? (
                      attention.reasons.map((r, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                          <span className="text-rose-500 font-bold">•</span>
                          <span>{r}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-[11px] text-status-success dark:text-emerald-300 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" />
                        <span>All academic continuous evaluations and examinations meet standard benchmarks.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Independent Attendance Monitoring Signal */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-status-info" />
                      <span className="font-bold text-slate-900 dark:text-white">
                        Attendance Monitoring Signal
                      </span>
                    </div>
                    {attendance?.hasRecords ? (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          attendance?.hasAttendanceWarning
                            ? 'bg-status-warning text-status-warning dark:bg-status-warning/60 dark:text-amber-200'
                            : 'bg-status-info text-status-info dark:bg-status-info/60 dark:text-blue-200'
                        }`}
                      >
                        {attendance.overallPercentage}% Recorded
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        Not Ingested
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                    Independent statutory compliance tracking according to VTU and institutional attendance guidelines (minimum 75% requirement).
                  </p>

                  {attendance?.hasRecords ? (
                    <>
                      <div className="grid grid-cols-2 gap-2 my-2 py-2 border-y border-slate-200 dark:border-slate-800">
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Courses Tracked</span>
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                            {attendance?.records?.length || 0} Subjects
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Statutory Compliance</span>
                          <span
                            className={`text-xs font-bold ${
                              attendance?.hasAttendanceWarning ? 'text-status-warning' : 'text-status-success'
                            }`}
                          >
                            {attendance?.hasAttendanceWarning ? 'Shortage (< 75%)' : 'Eligible (>= 75%)'}
                          </span>
                        </div>
                      </div>

                      {attendance?.hasAttendanceWarning && (
                        <div className="mt-2 rounded-xl bg-status-warning dark:bg-status-amber p-2.5 text-[11px] text-status-warning dark:text-amber-300 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-status-warning mt-0.5" />
                          <span>
                            Notice: Mentee requires counselling to restore attendance above statutory 75% before semester exam eligibility closes.
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="py-6 text-center text-slate-500 dark:text-slate-400 text-xs flex flex-col items-center justify-center gap-1.5">
                      <Clock className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                      <span>Attendance data not imported yet.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Subsystem Summary Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-3">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                    <Award className="w-4 h-4 text-role-primary" />
                    <span className="font-semibold text-xs text-slate-700 dark:text-slate-200">Achievements</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-xs">
                    {brief?.achievements || `${achievements.length} submitted record(s)`}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-3">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                    <Briefcase className="w-4 h-4 text-role-primary" />
                    <span className="font-semibold text-xs text-slate-700 dark:text-slate-200">Placement Readiness</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-xs">
                    Status: <strong className="text-slate-800 dark:text-slate-200">{placement?.profile?.placementStatus || 'Seeking'}</strong> • {placement?.applications?.length || 0} applications
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-3">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                    <BookOpen className="w-4 h-4 text-status-success" />
                    <span className="font-semibold text-xs text-slate-700 dark:text-slate-200">Mentoring Interactions</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-xs">
                    {sessions.length + mentorshipRecords.length} session(s) logged in system
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACADEMICS */}
          {activeTab === 'academics' && (
            <div className="space-y-4">
              {/* Academic Metrics Header Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block uppercase">Cumulative CGPA</span>
                  <span className="text-lg font-black text-role-primary dark:text-indigo-400">
                    {academicSummary?.cgpa ? academicSummary.cgpa.toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block uppercase">Credits Earned</span>
                  <span className="text-lg font-black text-slate-800 dark:text-slate-100">
                    {academicSummary?.totalEarnedCredits || 0}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block uppercase">Current CIE Avg</span>
                  <span className="text-lg font-black text-slate-800 dark:text-slate-100">
                    {academicSummary?.currentCieAverage ? `${academicSummary.currentCieAverage} / 50` : '0.0 / 50'}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block uppercase">Active Backlogs</span>
                  <span className={`text-lg font-black ${(academicSummary?.totalActiveBacklogs || 0) > 0 ? 'text-rose-600' : 'text-status-success'}`}>
                    {academicSummary?.totalActiveBacklogs || 0}
                  </span>
                </div>
              </div>

              {/* Semester-wise Subject Marks & CIE Evaluations */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100 text-xs">
                    <GraduationCap className="w-4 h-4 text-role-primary" />
                    <span>Continuous Internal Evaluation (CIE) & Semester Academic Records</span>
                  </div>
                </div>

                {hasCieRecords ? (
                  <div className="space-y-4">
                    {academicSummary.semesters.map((sem) => (
                      <div key={sem.semesterNumber} className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
                        <div className="bg-slate-50 dark:bg-slate-800/60 px-4 py-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                            Semester {sem.semesterNumber}
                          </span>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500">
                            <span>SGPA: <strong>{sem.sgpa ? sem.sgpa.toFixed(2) : 'N/A'}</strong></span>
                            <span>Credits: <strong>{sem.creditsEarned || 0}</strong></span>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50/50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-semibold">
                              <tr>
                                <th className="px-3 py-2">Subject Code</th>
                                <th className="px-3 py-2">Subject Name</th>
                                <th className="px-3 py-2 text-center">Credits</th>
                                <th className="px-3 py-2 text-center">CIE 1 (50)</th>
                                <th className="px-3 py-2 text-center">CIE 2 (50)</th>
                                <th className="px-3 py-2 text-center">CIE 3 (50)</th>
                                <th className="px-3 py-2 text-center">Best 2 Avg</th>
                                <th className="px-3 py-2 text-center">Assign (10)</th>
                                <th className="px-3 py-2 text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {sem.subjects?.map((subj, idx) => {
                                const tests = [subj.cie1 || 0, subj.cie2 || 0, subj.cie3 || 0].sort((a, b) => b - a);
                                const best2 = tests.length >= 2 ? (tests[0] + tests[1]) / 2 : tests[0] || 0;
                                const isLow = best2 < 25;
                                return (
                                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                                    <td className="px-3 py-2 font-mono font-bold text-slate-700 dark:text-slate-300">
                                      {subj.subjectCode}
                                    </td>
                                    <td className="px-3 py-2 text-slate-800 dark:text-slate-200">
                                      {subj.subjectName}
                                    </td>
                                    <td className="px-3 py-2 text-center text-slate-600 dark:text-slate-400">
                                      {subj.credits || 3}
                                    </td>
                                    <td className="px-3 py-2 text-center text-slate-700 dark:text-slate-300">
                                      {subj.cie1 !== undefined ? subj.cie1 : '-'}
                                    </td>
                                    <td className="px-3 py-2 text-center text-slate-700 dark:text-slate-300">
                                      {subj.cie2 !== undefined ? subj.cie2 : '-'}
                                    </td>
                                    <td className="px-3 py-2 text-center text-slate-700 dark:text-slate-300">
                                      {subj.cie3 !== undefined ? subj.cie3 : '-'}
                                    </td>
                                    <td className="px-3 py-2 text-center font-bold">
                                      <span className={isLow ? 'text-rose-600 dark:text-rose-400' : 'text-status-success dark:text-emerald-400'}>
                                        {best2.toFixed(1)}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 text-center text-slate-600 dark:text-slate-400">
                                      {subj.assignmentMarks !== undefined ? subj.assignmentMarks : '-'}
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                      <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                          isLow
                                            ? 'bg-status-error text-status-error dark:bg-status-error dark:text-status-error'
                                            : 'bg-status-success text-status-success dark:bg-status-emerald dark:text-emerald-300'
                                        }`}
                                      >
                                        {isLow ? 'Below Benchmark' : 'Satisfactory'}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-xs flex flex-col items-center justify-center gap-1.5 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <GraduationCap className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    <span className="font-semibold">No CIE records available.</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Marks have not been ingested by HOD yet.</span>
                  </div>
                )}
              </div>

              {/* Backlog Records Inventory */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100 text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                    <span>Backlog History & Clearance Records</span>
                  </div>
                  <span className="text-slate-500 dark:text-slate-400 text-xs">
                    {academicSummary?.backlogRecords?.length || 0} Record(s)
                  </span>
                </div>

                {academicSummary?.backlogRecords && academicSummary.backlogRecords.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-semibold">
                        <tr>
                          <th className="px-3 py-2">Sem</th>
                          <th className="px-3 py-2">Subject Code</th>
                          <th className="px-3 py-2">Subject Name</th>
                          <th className="px-3 py-2 text-center">Attempts</th>
                          <th className="px-3 py-2 text-center">Status</th>
                          <th className="px-3 py-2">Cleared Date</th>
                          <th className="px-3 py-2">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {academicSummary.backlogRecords.map((b, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="px-3 py-2 font-semibold">Sem {b.semester}</td>
                            <td className="px-3 py-2 font-mono font-bold text-slate-700 dark:text-slate-300">
                              {b.subjectCode}
                            </td>
                            <td className="px-3 py-2 text-slate-800 dark:text-slate-200">{b.subject}</td>
                            <td className="px-3 py-2 text-center font-bold text-slate-700 dark:text-slate-300">
                              {b.attempts || 1}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  b.status === 'Cleared'
                                    ? 'bg-status-success text-status-success dark:bg-status-emerald dark:text-emerald-300'
                                    : 'bg-status-error text-status-error dark:bg-status-error dark:text-status-error'
                                }`}
                              >
                                {b.status}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-slate-500">
                              {b.clearedDate ? new Date(b.clearedDate).toLocaleDateString() : '-'}
                            </td>
                            <td className="px-3 py-2 text-slate-500">{b.remarks || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-6 text-center text-slate-500 dark:text-slate-400 text-xs flex flex-col items-center justify-center gap-1 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <CheckCircle2 className="w-6 h-6 text-status-success/60" />
                    <span className="font-semibold text-slate-600 dark:text-slate-400">No backlog records.</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Mentee has cleared all evaluated courses on time.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block uppercase">Overall Attendance</span>
                  <span className={`text-lg font-black ${
                    !attendance?.hasRecords ? 'text-slate-500 dark:text-slate-400' : attendance?.hasAttendanceWarning ? 'text-status-warning' : 'text-status-info'
                  }`}>
                    {attendance?.hasRecords ? `${attendance.overallPercentage}%` : '0%'}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block uppercase">Classes Attended</span>
                  <span className="text-lg font-black text-slate-800 dark:text-slate-100">
                    {attendance?.classesAttended || 0}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block uppercase">Total Classes Held</span>
                  <span className="text-lg font-black text-slate-800 dark:text-slate-100">
                    {attendance?.totalClasses || 0}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block uppercase">Statutory Standing</span>
                  <span className={`text-xs font-bold ${
                    !attendance?.hasRecords ? 'text-slate-500 dark:text-slate-400' : attendance?.hasAttendanceWarning ? 'text-status-warning' : 'text-status-success'
                  }`}>
                    {!attendance?.hasRecords ? 'No Ingested Data' : attendance?.hasAttendanceWarning ? 'Shortage (< 75%)' : 'Eligible (>= 75%)'}
                  </span>
                </div>
              </div>

              {/* Subject-wise Attendance Table */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100 text-xs">
                    <Calendar className="w-4 h-4 text-status-info" />
                    <span>Official Subject-Wise Attendance Roster</span>
                  </div>
                  {attendance?.records?.length > 0 && (
                    <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">
                      {attendance.records.length} Subject(s) Tracked
                    </span>
                  )}
                </div>

                {attendance?.hasRecords && attendance?.records?.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-semibold">
                          <tr>
                            <th className="px-3 py-2">Sem</th>
                            <th className="px-3 py-2">Subject Code</th>
                            <th className="px-3 py-2">Subject Name</th>
                            <th className="px-3 py-2 text-center">Attended / Total</th>
                            <th className="px-3 py-2 text-center">Percentage</th>
                            <th className="px-3 py-2 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {attendance.records.map((rec, idx) => {
                            const isShortage = rec.attendancePercentage < 75;
                            return (
                              <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                                <td className="px-3 py-2 font-semibold">Sem {rec.semester}</td>
                                <td className="px-3 py-2 font-mono font-bold text-slate-700 dark:text-slate-300">
                                  {rec.subjectCode}
                                </td>
                                <td className="px-3 py-2 text-slate-800 dark:text-slate-200">{rec.subjectName}</td>
                                <td className="px-3 py-2 text-center text-slate-700 dark:text-slate-300">
                                  {rec.classesAttended} / {rec.totalClasses}
                                </td>
                                <td className="px-3 py-2 text-center font-bold">
                                  <span className={isShortage ? 'text-status-warning' : 'text-status-success'}>
                                    {rec.attendancePercentage}%
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      isShortage
                                        ? 'bg-status-warning text-status-warning dark:bg-status-amber dark:text-amber-300'
                                        : 'bg-status-success text-status-success dark:bg-status-emerald dark:text-emerald-300'
                                    }`}
                                  >
                                    {isShortage ? 'Shortage (< 75%)' : 'Eligible'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {attendance?.hasAttendanceWarning && (
                      <div className="mt-4 rounded-xl bg-status-warning dark:bg-status-amber border border-status-warning dark:border-amber-900/40 p-3 text-xs text-status-warning dark:text-amber-200 flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-status-warning flex-shrink-0 mt-0.5" />
                        <div>
                          <strong className="block font-bold">Statutory Attendance Warning:</strong>
                          <span>Mentee has one or more subjects with attendance below 75%. Institutional counselling is required to ensure exam eligibility.</span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-xs flex flex-col items-center justify-center gap-1.5 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    <span className="font-semibold text-slate-600 dark:text-slate-400">Attendance data not imported yet.</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Attendance records will appear once uploaded by the Department HOD.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ACHIEVEMENTS */}
          {activeTab === 'achievements' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100 text-xs">
                    <Award className="w-4 h-4 text-role-primary" />
                    <span>Student Co-Curricular & Extra-Curricular Achievements</span>
                  </div>
                  <span className="text-slate-500 dark:text-slate-400 text-xs">{achievements.length} Total</span>
                </div>

                {achievements.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {achievements.map((ach, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">{ach.title}</h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              ach.isVerified || ach.status === 'approved'
                                ? 'bg-status-success text-status-success dark:bg-status-emerald dark:text-emerald-300'
                                : ach.status === 'rejected'
                                ? 'bg-status-error text-status-error dark:bg-status-error dark:text-status-error'
                                : 'bg-status-warning text-status-warning dark:bg-status-amber dark:text-amber-300'
                            }`}
                          >
                            {ach.isVerified || ach.status === 'approved' ? 'Verified' : ach.status === 'rejected' ? 'Rejected' : 'Pending Verification'}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-[11px]">{ach.description}</p>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                          <span>Category: <strong className="text-slate-600 dark:text-slate-300">{ach.category || 'General'}</strong></span>
                          <span>Level: <strong className="text-slate-600 dark:text-slate-300">{ach.level || 'Institutional'}</strong></span>
                          <span>{ach.date ? new Date(ach.date).toLocaleDateString() : ''}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-xs flex flex-col items-center justify-center gap-1.5 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <Award className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    <span className="font-semibold text-slate-600 dark:text-slate-400">No achievements submitted.</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">The student has not yet submitted any certificates or awards for verification.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: PLACEMENT */}
          {activeTab === 'placement' && (
            <div className="space-y-4">
              {/* Profile & Skills */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100 text-xs">
                    <Briefcase className="w-4 h-4 text-role-primary" />
                    <span>Placement Profile</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Placement Status</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {placement?.profile?.placementStatus || 'Seeking'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Target CTC</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {placement?.profile?.targetCTC ? `${placement.profile.targetCTC} LPA` : 'Not Specified'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Dream Companies</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {placement?.profile?.dreamCompany || 'Not Specified'}
                      </span>
                    </div>
                    {placement?.profile?.resumeUrl && (
                      <div className="pt-2">
                        <a
                          href={placement.profile.resumeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-role-primary hover:underline font-bold text-xs"
                        >
                          <ExternalLink className="w-3 h-3" /> View Uploaded Resume
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100 text-xs">
                    <Sparkles className="w-4 h-4 text-role-primary" />
                    <span>Registered Skills Inventory</span>
                  </div>

                  {placement?.profile?.skills && placement.profile.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {placement.profile.skills.map((skill, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-role-soft text-role-primary dark:bg-role-soft-dark dark:text-purple-300 border border-purple-100 dark:border-role-primary rounded-lg text-xs font-semibold"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-slate-500 dark:text-slate-400 text-xs flex flex-col items-center justify-center gap-1 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      <Sparkles className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                      <span>No skills registered yet by student.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Placement Applications */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100 text-xs">
                    <Briefcase className="w-4 h-4 text-role-primary" />
                    <span>Campus Drive Applications & Status</span>
                  </div>
                  <span className="text-slate-500 dark:text-slate-400 text-xs">{placement?.applications?.length || 0} Applications</span>
                </div>

                {placement?.applications && placement.applications.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-semibold">
                        <tr>
                          <th className="px-3 py-2">Company</th>
                          <th className="px-3 py-2">Role</th>
                          <th className="px-3 py-2">Job Type</th>
                          <th className="px-3 py-2">CTC (LPA)</th>
                          <th className="px-3 py-2 text-center">Status</th>
                          <th className="px-3 py-2">Applied Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {placement.applications.map((app, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="px-3 py-2 font-bold text-slate-800 dark:text-slate-200">
                              {app.driveId?.company || 'Company'}
                            </td>
                            <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                              {app.driveId?.role || '-'}
                            </td>
                            <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                              {app.driveId?.jobType || 'Full-time'}
                            </td>
                            <td className="px-3 py-2 text-slate-700 dark:text-slate-300 font-semibold">
                              {app.driveId?.ctc ? `${app.driveId.ctc} LPA` : '-'}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  app.status === 'Selected'
                                    ? 'bg-status-success text-status-success dark:bg-status-emerald dark:text-emerald-300'
                                    : app.status === 'Rejected'
                                    ? 'bg-status-error text-status-error dark:bg-status-error dark:text-status-error'
                                    : 'bg-status-info text-status-info dark:bg-status-blue dark:text-blue-300'
                                }`}
                              >
                                {app.status || 'Applied'}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-slate-500">
                              {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-xs flex flex-col items-center justify-center gap-1.5 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <Briefcase className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    <span className="font-semibold text-slate-600 dark:text-slate-400">No placement applications.</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Mentee has not applied for any active placement drives yet.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: MENTORING */}
          {activeTab === 'mentoring' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100 text-xs">
                    <BookOpen className="w-4 h-4 text-role-primary" />
                    <span>1-on-1 Mentoring Interaction History & Action Items</span>
                  </div>
                  <span className="text-slate-500 dark:text-slate-400 text-xs">
                    {sessions.length + mentorshipRecords.length} Logged Sessions
                  </span>
                </div>

                {sessions.length > 0 || mentorshipRecords.length > 0 ? (
                  <div className="space-y-3">
                    {/* Render standard Session objects */}
                    {sessions.map((sess, idx) => (
                      <div
                        key={`sess-${idx}`}
                        className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                            {sess.title || sess.agenda || 'Mentoring Session'}
                          </h4>
                          <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                            {sess.startTime ? new Date(sess.startTime).toLocaleDateString() : 'Recent'}
                          </span>
                        </div>
                        {sess.discussionPoints && (
                          <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                            {sess.discussionPoints}
                          </p>
                        )}
                        {sess.actionItems && (
                          <div className="text-role-primary dark:text-indigo-400 text-[11px] font-semibold">
                            Action: {sess.actionItems}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Render legacy mentorship records */}
                    {mentorshipRecords.map((mRec, idx) => (
                      <div
                        key={`mrec-${idx}`}
                        className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                            {mRec.type || 'Counseling Meeting'} by {mRec.mentorName || 'Faculty'}
                          </h4>
                          <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                            {mRec.date ? new Date(mRec.date).toLocaleDateString() : 'Recorded'}
                          </span>
                        </div>
                        {mRec.notes && (
                          <p className="text-slate-600 dark:text-slate-400 text-[11px]">{mRec.notes}</p>
                        )}
                        {mRec.actionTaken && (
                          <div className="text-role-primary dark:text-indigo-400 text-[11px] font-semibold">
                            Action Taken: {mRec.actionTaken}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-xs flex flex-col items-center justify-center gap-1.5 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    <span className="font-semibold text-slate-600 dark:text-slate-400">No mentoring history yet.</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">No 1-on-1 counseling sessions have been recorded for this mentee.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100 text-xs">
                    <FileText className="w-4 h-4 text-role-primary" />
                    <span>Student Institutional Document Vault</span>
                  </div>
                  <span className="text-slate-500 dark:text-slate-400 text-xs">{documents.length} File(s)</span>
                </div>

                {documents.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-semibold">
                        <tr>
                          <th className="px-3 py-2">Document Title</th>
                          <th className="px-3 py-2">Category</th>
                          <th className="px-3 py-2">File Size</th>
                          <th className="px-3 py-2">Upload Date</th>
                          <th className="px-3 py-2 text-center">Status</th>
                          <th className="px-3 py-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {documents.map((doc, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="px-3 py-2 font-bold text-slate-800 dark:text-slate-200">
                              {doc.title || doc.name}
                            </td>
                            <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                              {doc.documentType || 'Official Record'}
                            </td>
                            <td className="px-3 py-2 text-slate-500">
                              {doc.fileSize ? `${Math.round(doc.fileSize / 1024)} KB` : '-'}
                            </td>
                            <td className="px-3 py-2 text-slate-500">
                              {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : '-'}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-status-success text-status-success dark:bg-status-emerald dark:text-emerald-300">
                                Active
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right">
                              {doc.fileUrl && (
                                <a
                                  href={doc.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-role-primary hover:underline font-bold text-[11px]"
                                >
                                  View
                                </a>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-xs flex flex-col items-center justify-center gap-1.5 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    <span className="font-semibold text-slate-600 dark:text-slate-400">No documents uploaded.</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Mentee has not uploaded any official documents or certificates yet.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 8: REQUESTS */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100 text-xs">
                    <Send className="w-4 h-4 text-role-primary" />
                    <span>Academic & Institutional Student Requests</span>
                  </div>
                  <span className="text-slate-500 dark:text-slate-400 text-xs">{examRequests.length} Total</span>
                </div>

                {examRequests.length > 0 ? (
                  <div className="space-y-3">
                    {examRequests.map((req, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                            {req.requestType || 'Evaluation Request'} - {req.subjectCode || 'General'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              req.status === 'Approved'
                                ? 'bg-status-success text-status-success dark:bg-status-emerald dark:text-emerald-300'
                                : req.status === 'Rejected'
                                ? 'bg-status-error text-status-error dark:bg-status-error dark:text-status-error'
                                : 'bg-status-warning text-status-warning dark:bg-status-amber dark:text-amber-300'
                            }`}
                          >
                            {req.status || 'Pending'}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-[11px]">{req.reason || req.description}</p>
                        {req.resolutionRemarks && (
                          <div className="text-role-primary dark:text-indigo-400 text-[11px]">
                            Resolution: {req.resolutionRemarks}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-xs flex flex-col items-center justify-center gap-1.5 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <Send className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    <span className="font-semibold text-slate-600 dark:text-slate-400">No requests found.</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">No exam re-evaluation or clearance requests on file for this student.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
            <div className="text-slate-500 dark:text-slate-400 text-[11px]">
              Institutional Scope: Student 360° Console • Access Logged in Audit Trail
            </div>
            <button
              onClick={onClose}
              className="rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 transition"
            >
              Close Console
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
