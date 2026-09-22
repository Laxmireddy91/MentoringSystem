import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import RiskBadge from '../../components/common/RiskBadge';
import {
  GraduationCap,
  Users,
  AlertTriangle,
  TrendingUp,
  FileSpreadsheet,
  Settings,
  ArrowUpRight,
  ShieldAlert,
  Award,
  Download,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export default function HodOverview() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchHodOverview();
  }, []);

  const fetchHodOverview = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/hod/overview');
      setMetrics(res.data?.data || res.data || res);
    } catch (err) {
      console.error('Error fetching HOD overview:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportDepartmentExcel = async () => {
    setExporting(true);
    try {
      const res = await axiosClient.get('/reports/department/excel', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Department_Performance_Report.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to generate Excel report.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen={false} message="Loading department governance metrics..." />;

  const stats = metrics?.summary || {
    totalStudents: 0,
    totalMentors: 0,
    averageDepartmentCgpa: '0.00',
    totalBacklogs: 0,
    criticalRiskCount: 0,
    highRiskCount: 0,
  };

  const semDistribution = (metrics?.semesterDistribution && Array.isArray(metrics.semesterDistribution))
    ? metrics.semesterDistribution
    : [];

  const riskDistribution = [
    { name: 'Low Risk', value: metrics?.riskDistribution?.low || 0, color: 'var(--status-success)' },
    { name: 'Medium Risk', value: metrics?.riskDistribution?.medium || 0, color: 'var(--status-warning)' },
    { name: 'High Risk', value: metrics?.riskDistribution?.high || 0, color: 'var(--status-error)' },
    { name: 'Critical Risk', value: metrics?.riskDistribution?.critical || 0, color: 'var(--status-error)' },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Leadership Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-purple-500/20 text-purple-200 border border-purple-500/40">
            HOD Department Command &amp; Control
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">
            Computer Science &amp; Engineering
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1">
            Departmental quality assurance, mentor allocation, risk intervention tracking, and regulatory audit compliance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportDepartmentExcel}
            disabled={exporting}
            className="px-4 py-2.5 bg-status-success hover:bg-status-success text-white font-semibold rounded-xl text-xs sm:text-sm shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
          >
            {exporting ? <LoadingSpinner size="sm" color="text-white" /> : <FileSpreadsheet className="w-4 h-4" />}
            Export Excel Report
          </button>
          <Link
            to="/hod/risk-settings"
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs sm:text-sm backdrop-blur-sm transition flex items-center gap-1.5 border border-white/20"
          >
            <Settings className="w-4 h-4" /> Risk Rules
          </Link>
        </div>
      </div>

      {/* Critical Department Alert if any */}
      {stats.criticalRiskCount > 0 && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-status-error/40 border border-rose-200 dark:border-rose-900 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm">
              <h4 className="font-bold text-rose-800 dark:text-status-error">
                Department Alert: {stats.criticalRiskCount} Students in Critical Academic Tier
              </h4>
              <p className="text-status-error dark:text-rose-400 text-xs mt-0.5">
                Students flagged with consecutive CIE failures or high backlog counts require immediate mentor review.
              </p>
            </div>
          </div>
          <Link
            to="/hod/students"
            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-800 text-status-error dark:text-status-error rounded-lg text-xs font-semibold hover:bg-status-error dark:hover:bg-slate-700 transition shrink-0"
          >
            Inspect Cohort
          </Link>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Enrolled Students</span>
            <div className="p-2 rounded-xl bg-role-soft dark:bg-role-soft-dark text-role-primary dark:text-indigo-400">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
              {stats.totalStudents}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Total</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Across 8 Semesters</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Faculty Mentors</span>
            <div className="p-2 rounded-xl bg-role-soft dark:bg-role-soft-dark text-role-primary dark:text-purple-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
              {stats.totalMentors}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Advisors</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">1:20 Avg Ratio</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Dept Avg CGPA</span>
            <div className="p-2 rounded-xl bg-status-success dark:bg-status-emerald text-status-success dark:text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
              {stats.averageDepartmentCgpa}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">/ 10.0</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Target: &gt;= 7.50</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Active Backlogs</span>
            <div className="p-2 rounded-xl bg-status-warning dark:bg-status-amber text-status-warning dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
              {stats.totalBacklogs}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Subjects</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Remedial coaching on</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Critical Flag</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-status-error/50 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">
              {stats.criticalRiskCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Urgent</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{stats.highRiskCount} High Risk</p>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Semester CGPA Distribution Bar Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-role-primary" />
              Semester-wise Academic Performance (Avg CGPA)
            </h3>
            <Link to="/hod/analytics" className="text-xs text-role-primary dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold">
              Full Analytics <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={semDistribution}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="semester" stroke="#94a3b8" fontSize={11} />
                <YAxis domain={[0, 10]} stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="avgCgpa" name="Average CGPA" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Donut */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Student Risk Status
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Real-time classification based on CIE, backlogs & academic trend.
            </p>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-700 text-center">
            <Link
              to="/hod/risk-settings"
              className="text-xs text-role-primary dark:text-indigo-400 font-semibold hover:underline"
            >
              Adjust Engine Weights &amp; Thresholds →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
