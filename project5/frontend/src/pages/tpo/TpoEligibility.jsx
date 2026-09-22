import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Briefcase,
  Search,
  Filter,
  ArrowLeft,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

export default function TpoEligibility() {
  const [searchParams] = useSearchParams();
  const driveIdParam = searchParams.get('driveId');

  const [drives, setDrives] = useState([]);
  const [selectedDriveId, setSelectedDriveId] = useState(driveIdParam || '');
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ELIGIBLE' | 'INELIGIBLE' | 'APPLIED'
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all drives for dropdown
  useEffect(() => {
    const fetchDrives = async () => {
      try {
        setLoading(true);
        const res = await axiosClient.get('/placement/drives');
        const list = res.data || res || [];
        setDrives(list);
        if (!selectedDriveId && list.length > 0) {
          setSelectedDriveId(list[0]._id);
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch drives');
      } finally {
        setLoading(false);
      }
    };
    fetchDrives();
  }, []);

  // Fetch eligibility when drive changes
  useEffect(() => {
    if (!selectedDriveId) return;

    const fetchEligibility = async () => {
      try {
        setEvaluating(true);
        setError('');
        const res = await axiosClient.get(`/placement/drives/${selectedDriveId}/eligibility`);
        setEvaluation(res.data || res);
      } catch (err) {
        setError(err.message || 'Failed to evaluate drive eligibility');
      } finally {
        setEvaluating(false);
      }
    };

    fetchEligibility();
  }, [selectedDriveId]);

  const handleUpdateAppStatus = async (applicationId, status) => {
    try {
      await axiosClient.patch(`/placement/applications/${applicationId}/status`, { status });
      // Re-fetch evaluation
      const res = await axiosClient.get(`/placement/drives/${selectedDriveId}/eligibility`);
      setEvaluation(res.data || res);
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const drive = evaluation?.drive;
  const summary = evaluation?.summary;
  const students = evaluation?.students || [];

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.usn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.name?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'ELIGIBLE') return s.isEligible;
    if (statusFilter === 'INELIGIBLE') return !s.isEligible;
    if (statusFilter === 'APPLIED') return s.hasApplied;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-5 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <Link
            to="/tpo/drives"
            className="rounded-lg p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Candidate Pool & Eligibility Engine
            </h1>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Explainable rule-based candidate qualification matching Department, CGPA, Backlogs, and Skills.
            </p>
          </div>
        </div>

        {/* Drive Selector */}
        <div className="min-w-[240px]">
          <select
            value={selectedDriveId}
            onChange={(e) => setSelectedDriveId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium focus:border-role-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            {drives.map((d) => (
              <option key={d._id} value={d._id}>
                {d.company} - {d.role}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-status-error text-status-error rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Summary KPI Cards */}
      {summary && drive && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Total Evaluated
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {summary.totalEvaluated}
              </span>
              <span className="text-xs text-gray-500">Department Students</span>
            </div>
          </div>

          <div className="rounded-xl border border-status-success bg-status-success/50 p-4 shadow-sm dark:border-emerald-900/40 dark:bg-status-emerald">
            <span className="text-xs font-semibold uppercase tracking-wider text-status-success dark:text-emerald-400">
              Eligible Candidates
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-status-success dark:text-emerald-300">
                {summary.eligibleCount}
              </span>
              <span className="text-xs font-semibold text-status-success">
                {summary.totalEvaluated
                  ? `${Math.round((summary.eligibleCount / summary.totalEvaluated) * 100)}% Qualified`
                  : '0%'}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-status-error bg-status-error/50 p-4 shadow-sm dark:border-red-900/40 dark:bg-status-red">
            <span className="text-xs font-semibold uppercase tracking-wider text-status-error dark:text-red-400">
              Ineligible
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-status-error dark:text-red-300">
                {summary.ineligibleCount}
              </span>
              <span className="text-xs text-status-error">Below Criteria</span>
            </div>
          </div>

          <div className="rounded-xl border border-status-info bg-status-info/50 p-4 shadow-sm dark:border-blue-900/40 dark:bg-status-blue">
            <span className="text-xs font-semibold uppercase tracking-wider text-status-info dark:text-blue-400">
              Applications Received
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-status-info dark:text-blue-300">
                {summary.appliedCount}
              </span>
              <span className="text-xs font-semibold text-status-info">Applied</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search candidate by USN or Name..."
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-role-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div className="flex gap-2">
          {['ALL', 'ELIGIBLE', 'INELIGIBLE', 'APPLIED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === st
                  ? 'bg-role-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Evaluation Results Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
        {evaluating ? (
          <div className="flex h-48 items-center justify-center">
            <LoadingSpinner size="md" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-3">USN & Candidate</th>
                  <th className="px-6 py-3">Department & Sem</th>
                  <th className="px-6 py-3">Academic Stats</th>
                  <th className="px-6 py-3">Qualification Verdict</th>
                  <th className="px-6 py-3">Rule-Based Explainable Reasons</th>
                  <th className="px-6 py-3 text-right">Application</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredStudents.length ? (
                  filteredStudents.map((s) => (
                    <tr key={s.studentId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4">
                        <div className="font-mono font-bold text-gray-900 dark:text-white">
                          {s.usn}
                        </div>
                        <div className="text-xs text-gray-500">{s.name}</div>
                      </td>

                      <td className="px-6 py-4 text-xs">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          {s.department}
                        </span>
                        <div className="text-gray-500">Sem {s.semester || '—'}</div>
                      </td>

                      <td className="px-6 py-4 text-xs">
                        <div className="flex items-center gap-1 font-semibold text-gray-900 dark:text-white">
                          <span>CGPA:</span>
                          <span
                            className={
                              s.cgpa >= (drive?.minCGPA || 0)
                                ? 'text-status-success'
                                : 'text-status-error'
                            }
                          >
                            {s.cgpa?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                        <div className="text-gray-500">
                          Backlogs:{' '}
                          <span
                            className={
                              s.activeBacklogs <= (drive?.maxBacklogs || 0)
                                ? 'text-gray-700 dark:text-gray-300'
                                : 'text-status-error font-bold'
                            }
                          >
                            {s.activeBacklogs}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {s.isEligible ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-status-success text-status-success dark:bg-status-success/40 dark:text-emerald-300">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Eligible
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-status-error text-status-error dark:bg-status-error/40 dark:text-red-300">
                            <XCircle className="h-3.5 w-3.5" />
                            Ineligible
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {s.reasons?.map((r, i) => {
                            const isPositive =
                              r.includes('satisfies requirement') ||
                              r.includes('matches criteria') ||
                              r.includes('within acceptable limit');
                            return (
                              <div
                                key={i}
                                className={`flex items-start gap-1 text-xs ${
                                  isPositive
                                    ? 'text-status-success dark:text-emerald-400'
                                    : 'text-status-error dark:text-red-400 font-medium'
                                }`}
                              >
                                <span>{isPositive ? '✓' : '✗'}</span>
                                <span>{r}</span>
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        {s.hasApplied ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-status-info text-status-info dark:bg-status-info/40 dark:text-blue-300">
                            Applied
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500 dark:text-gray-400">Not Applied</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      No candidate records found matching this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
