import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  GraduationCap,
  Download,
  TrendingUp,
  Award,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
  Clock,
  Shield,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';

export default function StudentAcademics() {
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [academics, setAcademics] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [activeSemIdx, setActiveSemIdx] = useState(0);

  useEffect(() => {
    fetchAcademics();
  }, []);

  const fetchAcademics = async () => {
    setLoading(true);
    try {
      const [marksRes, attRes] = await Promise.allSettled([
        axiosClient.get('/academics/my-marks'),
        axiosClient.get('/academics/my-attendance'),
      ]);

      if (marksRes.status === 'fulfilled') {
        const marksData = marksRes.value.data?.data;
        setAcademics(marksData);
        if (marksData?.semesters?.length > 0) {
          setActiveSemIdx(marksData.semesters.length - 1);
        }
      }

      if (attRes.status === 'fulfilled') {
        setAttendance(attRes.value.data?.data);
      }
    } catch (err) {
      console.error('Error fetching academic data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReportCard = async () => {
    if (!academics?.student?._id) return;
    setDownloading(true);
    try {
      const res = await axiosClient.get(`/reports/student/${academics.student._id}/report-card/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${academics.student.usn}_ReportCard.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to download PDF report:', err);
      alert('Unable to generate PDF report at this moment.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen={false} message="Loading academic marks & report..." />;

  const student = academics?.student || {};
  const semesters = academics?.semesters || [];
  const activeSemester = semesters[activeSemIdx] || {};
  const subjects = activeSemester.subjects || [];

  // Chart data for SGPA trend
  const chartData = semesters.map((s) => ({
    name: `Sem ${s.semesterNumber}`,
    SGPA: s.sgpa || 0,
    Credits: s.totalCredits || 0,
  }));

  const attRecords = attendance?.records || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Download Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
            <GraduationCap className="w-6 h-6 text-role-primary dark:text-indigo-400" />
            Academic Progress &amp; Examination Marks
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Official evaluation record across Continuous Internal Evaluation (CIE) and Semester End Exams (SEE).
          </p>
        </div>

        <button
          onClick={handleDownloadReportCard}
          disabled={downloading || semesters.length === 0}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-role-primary hover:bg-role-primary text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition disabled:opacity-50"
        >
          {downloading ? (
            <LoadingSpinner size="sm" color="text-white" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Download PDF Report Card
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Cumulative CGPA</span>
          <p className="text-2xl font-black text-role-primary dark:text-indigo-400 mt-1">
            {student.cgpa !== undefined && student.cgpa !== null ? student.cgpa.toFixed(2) : '0.00'}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Scale of 10.0</span>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Total Earned Credits</span>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
            {academics?.totalEarnedCredits || student.totalCreditsEarned || 0}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Degree Credits</span>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Active Backlogs</span>
          <p
            className={`text-2xl font-black mt-1 ${
              (academics?.totalActiveBacklogs || 0) > 0 ? 'text-rose-600' : 'text-status-success'
            }`}
          >
            {academics?.totalActiveBacklogs || 0}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {(academics?.totalActiveBacklogs || 0) === 0 ? 'All Cleared 🎉' : 'Needs attention'}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Recorded Semesters</span>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
            {semesters.length}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Historical Records</span>
        </div>
      </div>

      {/* SGPA & Credits Progression Charts */}
      {semesters.length > 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-role-primary" /> SGPA Trend Over Semesters
            </h3>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis domain={[0, 10]} stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="SGPA" stroke="#6366f1" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-status-success" /> Semester Credits Load
            </h3>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis domain={[0, 30]} stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="Credits" fill="var(--status-success)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Semester Wise CIE Evaluation Breakdown */}
      {semesters.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-700">
            {semesters.map((sem, idx) => (
              <button
                key={sem.semesterNumber || idx}
                onClick={() => setActiveSemIdx(idx)}
                className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition ${
                  activeSemIdx === idx
                    ? 'bg-role-primary text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                Semester {sem.semesterNumber} {sem.sgpa ? `(SGPA: ${sem.sgpa.toFixed(2)})` : ''}
              </button>
            ))}
          </div>

          {/* Detailed Marks Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Semester {activeSemester.semesterNumber} Subject Breakdown
                </h3>
                <p className="text-xs text-slate-500">
                  Total Credits: {activeSemester.totalCredits || 0} • SGPA: {activeSemester.sgpa?.toFixed(2) || 'N/A'}
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-role-soft text-role-primary dark:bg-role-primary/50 dark:text-indigo-300">
                {subjects.length} Subjects Evaluated
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-100/70 dark:bg-slate-900/80 font-bold uppercase text-[11px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-3.5 py-3">Subject</th>
                    <th className="px-2.5 py-3 text-center">Credits</th>
                    <th className="px-2.5 py-3 text-center">CIE-1 (50)</th>
                    <th className="px-2.5 py-3 text-center">CIE-2 (50)</th>
                    <th className="px-2.5 py-3 text-center">CIE-3 (50)</th>
                    <th className="px-2.5 py-3 text-center">SEE (50)</th>
                    <th className="px-2.5 py-3 text-center font-bold">Total (100)</th>
                    <th className="px-2.5 py-3 text-center">Grade</th>
                    <th className="px-2.5 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {subjects.length > 0 ? (
                    subjects.map((sub, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition">
                        <td className="px-3.5 py-3">
                          <p className="font-bold text-slate-800 dark:text-slate-100">{sub.subjectName}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{sub.subjectCode}</p>
                        </td>
                        <td className="px-2.5 py-3 text-center font-semibold">{sub.credits}</td>
                        <td className="px-2.5 py-3 text-center">{sub.cie1 ?? '—'}</td>
                        <td className="px-2.5 py-3 text-center">{sub.cie2 ?? '—'}</td>
                        <td className="px-2.5 py-3 text-center">{sub.cie3 ?? '—'}</td>
                        <td className="px-2.5 py-3 text-center">{sub.finalMarks ?? '—'}</td>
                        <td className="px-2.5 py-3 text-center font-extrabold text-role-primary dark:text-indigo-400 bg-role-soft/30 dark:bg-role-soft-dark">
                          {sub.totalMarks ?? '—'}
                        </td>
                        <td className="px-2.5 py-3 text-center">
                          <span
                            className={`font-black ${
                              sub.grade === 'F' ? 'text-rose-600' : 'text-status-success dark:text-emerald-400'
                            }`}
                          >
                            {sub.grade || '—'}
                          </span>
                        </td>
                        <td className="px-2.5 py-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              sub.grade === 'F' || sub.isBacklog
                                ? 'bg-status-error text-status-error dark:bg-status-error dark:text-status-error'
                                : 'bg-status-success text-status-success dark:bg-status-emerald dark:text-emerald-300'
                            }`}
                          >
                            {sub.grade === 'F' || sub.isBacklog ? 'Backlog' : 'Pass'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-500 dark:text-slate-400">
                        No subject records available for Semester {activeSemester.semesterNumber}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
          <GraduationCap className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">No CIE records available.</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Official semester CIE evaluation marks have not been uploaded by your department yet.
          </p>
        </div>
      )}

      {/* Official Subject-wise Attendance Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-status-info dark:bg-status-blue text-status-info dark:text-blue-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Official Subject Attendance Record
              </h3>
              <p className="text-xs text-slate-500">
                Statutory attendance threshold is 75% per semester course.
              </p>
            </div>
          </div>

          {attendance && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">
                Overall:{' '}
                <strong
                  className={
                    attendance.overallPercentage < 75
                      ? 'text-rose-600 font-extrabold'
                      : 'text-status-success font-extrabold'
                  }
                >
                  {attendance.overallPercentage}%
                </strong>
              </span>
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                  attendance.overallPercentage < 75
                    ? 'bg-status-error text-status-error dark:bg-status-error dark:text-status-error'
                    : 'bg-status-success text-status-success dark:bg-status-emerald dark:text-emerald-300'
                }`}
              >
                {attendance.overallPercentage < 75 ? 'Shortage Alert' : 'Statutory Eligible'}
              </span>
            </div>
          )}
        </div>

        {attRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-100/70 dark:bg-slate-900/80 font-bold uppercase text-[11px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">Subject Code &amp; Name</th>
                  <th className="px-3 py-3 text-center">Semester</th>
                  <th className="px-3 py-3 text-center">Classes Attended</th>
                  <th className="px-3 py-3 text-center">Total Classes</th>
                  <th className="px-3 py-3 text-center">Attendance %</th>
                  <th className="px-4 py-3">Statutory Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {attRecords.map((att, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition">
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">
                      <span className="font-mono text-role-primary dark:text-indigo-400 mr-2">{att.subjectCode}</span>
                      {att.subjectName || ''}
                    </td>
                    <td className="px-3 py-3 text-center font-semibold">{att.semester}</td>
                    <td className="px-3 py-3 text-center font-semibold">{att.classesAttended}</td>
                    <td className="px-3 py-3 text-center">{att.totalClasses}</td>
                    <td className="px-3 py-3 text-center font-bold">
                      <span
                        className={
                          att.attendancePercentage < 75
                            ? 'text-rose-600 font-extrabold'
                            : 'text-status-success font-bold'
                        }
                      >
                        {att.attendancePercentage}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          att.attendancePercentage < 75
                            ? 'bg-status-error text-status-error dark:bg-status-error dark:text-status-error'
                            : 'bg-status-success text-status-success dark:bg-status-emerald dark:text-emerald-300'
                        }`}
                      >
                        {att.attendancePercentage < 75 ? (
                          <>
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>Shortage (&lt; 75%)</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3 shrink-0" />
                            <span>Eligible</span>
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
            <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="font-semibold text-slate-500 dark:text-slate-400">Attendance data not imported yet.</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Official attendance logs will appear here once ingested by the department.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
