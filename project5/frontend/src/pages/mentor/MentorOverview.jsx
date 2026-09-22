import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import RiskBadge from '../../components/common/RiskBadge';
import {
  Users,
  AlertTriangle,
  Calendar,
  Award,
  TrendingUp,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts';

const RISK_COLORS = {
  Low: 'var(--status-success)',
  Medium: 'var(--status-warning)',
  High: 'var(--status-error)',
  Critical: 'var(--status-error)',
};

export default function MentorOverview() {
  const [loading, setLoading] = useState(true);
  const [mentees, setMentees] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({
    totalMentees: 0,
    criticalRiskCount: 0,
    highRiskCount: 0,
    upcomingSessionsCount: 0,
    averageCgpa: '0.00',
  });

  useEffect(() => {
    fetchMentorData();
  }, []);

  const fetchMentorData = async () => {
    setLoading(true);
    try {
      const [mRes, sRes] = await Promise.allSettled([
        axiosClient.get('/mentors/my-students'),
        axiosClient.get('/sessions/my-sessions'),
      ]);

      const studentList = mRes.status === 'fulfilled'
        ? (Array.isArray(mRes.value?.data?.data) ? mRes.value.data.data : (Array.isArray(mRes.value?.data) ? mRes.value.data : (Array.isArray(mRes.value) ? mRes.value : [])))
        : [];
      const sessionList = sRes.status === 'fulfilled'
        ? (Array.isArray(sRes.value?.data?.data) ? sRes.value.data.data : (Array.isArray(sRes.value?.data) ? sRes.value.data : (Array.isArray(sRes.value) ? sRes.value : [])))
        : [];

      setMentees(studentList);
      setSessions(sessionList);

      const critical = studentList.filter((s) => s.riskCategory === 'Critical' || s.riskProfile?.riskLevel === 'Critical').length;
      const high = studentList.filter((s) => s.riskCategory === 'High' || s.riskProfile?.riskLevel === 'High').length;
      const upcoming = sessionList.filter((s) => s.status === 'scheduled' || s.status === 'pending').length;
      const cgpaSum = studentList.reduce((acc, s) => acc + (s.computedCGPA || s.cgpa || 0), 0);
      const avg = studentList.length > 0 ? (cgpaSum / studentList.length).toFixed(2) : '0.00';

      setStats({
        totalMentees: studentList.length,
        criticalRiskCount: critical,
        highRiskCount: high,
        upcomingSessionsCount: upcoming,
        averageCgpa: avg,
      });
    } catch (err) {
      console.error('Error fetching mentor overview:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen={false} message="Loading mentor command center..." />;

  // Risk distribution data
  const riskCounts = { Low: 0, Medium: 0, High: 0, Critical: 0 };
  mentees.forEach((m) => {
    const cat = m.riskCategory || 'Low';
    if (riskCounts[cat] !== undefined) riskCounts[cat]++;
    else riskCounts.Low++;
  });

  const pieData = Object.keys(riskCounts)
    .filter((k) => riskCounts[k] > 0)
    .map((k) => ({ name: `${k} Risk`, value: riskCounts[k], color: RISK_COLORS[k] }));

  const criticalStudents = mentees.filter(
    (m) => m.riskCategory === 'Critical' || m.riskCategory === 'High'
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-indigo-500/20 text-indigo-200 border border-indigo-500/40">
            Faculty Mentoring Console
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">
            Academic Mentoring Overview
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1">
            Track student interventions, review marks submissions, and monitor at-risk academic indicators.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/mentor/students"
            className="px-4 py-2.5 bg-role-primary hover:bg-role-primary text-white font-semibold rounded-xl text-xs sm:text-sm shadow-md transition flex items-center gap-1.5"
          >
            <Users className="w-4 h-4" /> Manage Mentees
          </Link>
          <Link
            to="/mentor/sessions"
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs sm:text-sm backdrop-blur-sm transition flex items-center gap-1.5 border border-white/20"
          >
            <Calendar className="w-4 h-4" /> Office Hours
          </Link>
        </div>
      </div>

      {/* Critical Risk Alert Banner */}
      {stats.criticalRiskCount + stats.highRiskCount > 0 && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-status-error/40 border border-rose-200 dark:border-rose-900 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm">
              <h4 className="font-bold text-rose-800 dark:text-status-error">
                Intervention Alert: {stats.criticalRiskCount + stats.highRiskCount} Mentees Flagged At-Risk
              </h4>
              <p className="text-status-error dark:text-rose-400 text-xs mt-0.5">
                {stats.criticalRiskCount} Critical and {stats.highRiskCount} High risk students need remedial academic mentoring and backlog counseling.
              </p>
            </div>
          </div>
          <Link
            to="/mentor/students"
            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-800 text-status-error dark:text-status-error rounded-lg text-xs font-semibold hover:bg-status-error dark:hover:bg-slate-700 transition shrink-0"
          >
            Review Now
          </Link>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Assigned Mentees</span>
            <div className="p-2 rounded-xl bg-role-soft dark:bg-role-soft-dark text-role-primary dark:text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
              {stats.totalMentees}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Students</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Batch 2023 - 2027</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">At-Risk Count</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-status-error/50 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">
              {stats.criticalRiskCount + stats.highRiskCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Priority</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{stats.criticalRiskCount} in critical tier</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Upcoming Consults</span>
            <div className="p-2 rounded-xl bg-status-success dark:bg-status-emerald text-status-success dark:text-emerald-400">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
              {stats.upcomingSessionsCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Sessions</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Scheduled / Pending</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Avg Mentee CGPA</span>
            <div className="p-2 rounded-xl bg-status-warning dark:bg-status-amber text-status-warning dark:text-amber-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
              {stats.averageCgpa}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">/ 10.0</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Department cohort</p>
        </div>
      </div>

      {/* Two Column Visual Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution Chart */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-role-primary" />
            Mentee Risk Distribution
          </h3>
          {pieData.length > 0 ? (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
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
          ) : (
            <div className="h-60 flex items-center justify-center text-xs text-slate-500 dark:text-slate-400">
              No mentee data available for risk breakdown.
            </div>
          )}
        </div>

        {/* Priority Action Table (At-Risk Mentees) */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-rose-500" />
                Priority Mentees for Consultation
              </h3>
              <Link to="/mentor/students" className="text-xs text-role-primary dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold">
                All Mentees <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {criticalStudents.length > 0 ? (
              <div className="space-y-2.5">
                {criticalStudents.slice(0, 4).map((s) => (
                  <div
                    key={s._id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-100">{s.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{s.usn} • Sem {s.currentSemester || 1}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-bold text-slate-700 dark:text-slate-200 block">
                          CGPA: {s.cgpa?.toFixed(2) || '0.00'}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          {s.totalBacklogs || 0} Backlogs
                        </span>
                      </div>
                      <RiskBadge category={s.riskCategory || 'High'} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-status-success dark:text-emerald-400 flex flex-col items-center gap-1">
                <CheckCircle2 className="w-6 h-6" />
                <p className="font-bold">All mentees are in stable academic standing!</p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs">
            <span className="text-slate-500 dark:text-slate-400">Showing top intervention candidates</span>
            <Link to="/mentor/students" className="text-role-primary font-semibold hover:underline">
              Enter Marks &amp; Feedback →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
