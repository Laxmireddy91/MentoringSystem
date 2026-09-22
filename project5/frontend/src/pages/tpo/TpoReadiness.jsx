import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Award, Briefcase, TrendingUp, Users, CheckCircle } from 'lucide-react';

export default function TpoReadiness() {
  const [loading, setLoading] = useState(true);
  const [drives, setDrives] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await axiosClient.get('/placement/drives');
        setDrives(res.data || res || []);
      } catch (err) {
        setError(err.message || 'Failed to load placement readiness');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const activeDrives = drives.filter((d) => d.status === 'active');
  const totalCTC = drives.reduce((acc, d) => {
    const val = parseFloat(d.ctc);
    return !isNaN(val) ? acc + val : acc;
  }, 0);
  const avgCTC = drives.length ? (totalCTC / drives.length).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Institutional Placement Readiness & Analytics
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Cross-departmental hiring performance metrics, active corporate recruitment drives, and readiness indicators.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-status-error text-status-error rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Total Drives Published</span>
            <span className="rounded-lg bg-status-info p-2 text-status-info dark:bg-status-info/40 dark:text-blue-400">
              <Briefcase className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {drives.length}
            </span>
            <div className="mt-1 text-xs text-status-info">
              {activeDrives.length} currently open for applications
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Average Offered Package</span>
            <span className="rounded-lg bg-status-success p-2 text-status-success dark:bg-status-success/40 dark:text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {avgCTC} LPA
            </span>
            <div className="mt-1 text-xs text-gray-500">Based on published drives</div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Recruitment Sectors</span>
            <span className="rounded-lg bg-role-soft p-2 text-role-primary dark:bg-role-primary/40 dark:text-purple-400">
              <Award className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              IT, Core & Fintech
            </span>
            <div className="mt-1 text-xs text-gray-500">Multi-disciplinary outreach</div>
          </div>
        </div>
      </div>

      {/* Active Drives Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-white">Active Corporate Hiring Pipelines</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              <tr>
                <th className="px-6 py-3">Company</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">CTC</th>
                <th className="px-6 py-3">Min CGPA</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {drives.map((d) => (
                <tr key={d._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{d.company}</td>
                  <td className="px-6 py-4">{d.role}</td>
                  <td className="px-6 py-4 text-status-success font-semibold">{d.ctc || '—'}</td>
                  <td className="px-6 py-4">&ge; {d.minCGPA || 0}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-status-success text-status-success dark:bg-status-success/40 dark:text-emerald-300 capitalize">
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
