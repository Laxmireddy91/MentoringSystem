import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  TrendingUp,
  Award,
  AlertTriangle,
  Download,
  FileSpreadsheet,
  CheckCircle,
  BarChart2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

export default function HodAnalytics() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/hod/analytics');
      setAnalytics(res.data?.data || res.data || res);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const res = await axiosClient.get('/reports/department/excel', {
        responseType: 'blob',
      });
      const blob = res.data instanceof Blob ? res.data : (res instanceof Blob ? res : new Blob([res]));
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Department_Academic_Analytics.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export Excel analytics.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen={false} message="Computing department analytics & leaderboard..." />;

  const semesterPerformance = (analytics?.semesterPerformance && Array.isArray(analytics.semesterPerformance))
    ? analytics.semesterPerformance
    : [];

  const topStudents = analytics?.topStudents || [];
  const challengingSubjects = analytics?.challengingSubjects || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
            <BarChart2 className="w-6 h-6 text-role-primary dark:text-indigo-400" />
            Department Academic Analytics &amp; Leaderboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Cohort pass percentages, subject difficulty indexes, and academic merit rankings.
          </p>
        </div>

        <button
          onClick={handleExportExcel}
          disabled={exporting}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-status-success hover:bg-status-success text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition disabled:opacity-50"
        >
          {exporting ? <LoadingSpinner size="sm" color="text-white" /> : <FileSpreadsheet className="w-4 h-4" />}
          Export Complete Dataset (.xlsx)
        </button>
      </div>

      {/* Pass Rate & SGPA Comparison Chart */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-role-primary" />
          Semester Pass Rates (%) &amp; Average SGPA
        </h3>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={semesterPerformance}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="semester" stroke="#94a3b8" fontSize={11} />
              <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              />
              <Legend verticalAlign="bottom" height={36} />
              <Bar dataKey="passRate" name="Pass Rate (%)" fill="var(--status-success)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Column Grid: Leaderboard & Difficult Subjects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers Leaderboard */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Department Merit Honor Roll (Top CGPA)
            </h3>

            {topStudents.length > 0 ? (
              <div className="space-y-2.5">
                {topStudents.slice(0, 5).map((s, idx) => (
                  <div
                    key={s._id || idx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs ${
                          idx === 0
                            ? 'bg-status-warning text-status-warning'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-800'
                            : idx === 2
                            ? 'bg-status-warning text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        #{idx + 1}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-100">{s.name}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{s.usn} • Sem {s.currentSemester}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-black text-role-primary dark:text-indigo-400">
                        {s.cgpa?.toFixed(2) || '0.00'}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">CGPA</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                No student records available for leaderboard.
              </div>
            )}
          </div>
        </div>

        {/* Challenging Subjects & High Backlogs */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              Subjects Needing Remedial Focus
            </h3>

            {challengingSubjects.length > 0 ? (
              <div className="space-y-2.5">
                {challengingSubjects.slice(0, 5).map((sub, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-rose-50/50 dark:bg-status-error/20 border border-rose-100 dark:border-rose-900/50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-100">{sub.subjectName}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{sub.subjectCode}</p>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-rose-600">{sub.backlogCount || 4} Backlogs</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Avg: {sub.averageMarks || 38}/100</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-status-success flex flex-col items-center gap-1">
                <CheckCircle className="w-6 h-6" />
                <p className="font-bold">No abnormal failure spikes detected across subjects.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
