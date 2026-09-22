import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Cpu,
  Layers,
  History,
  ShieldAlert,
} from 'lucide-react';

export default function CoordinatorOverview() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [capacity, setCapacity] = useState(null);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [metricsRes, capacityRes] = await Promise.all([
        axiosClient.get('/coordinator/metrics'),
        axiosClient.get('/allocation/capacity'),
      ]);
      setMetrics(metricsRes.data || metricsRes);
      setCapacity(capacityRes.data || capacityRes);
    } catch (err) {
      setError(err.message || 'Failed to load coordinator metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const isShortage = capacity?.shortage?.isShortage;
  const shortageAmount = capacity?.shortage?.shortageAmount || 0;
  const unassignedCount = metrics?.students?.unassigned || 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
              <Cpu className="h-3.5 w-3.5" />
              <span>Mentoring Coordination & Allocation Control</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold">Coordinator Central Hub</h1>
            <p className="mt-1 text-sm text-blue-100">
              Department-level oversight of mentor capacity, workload distribution, and automated batch allocations.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/coordinator/allocation"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-role-primary shadow hover:bg-status-info transition"
            >
              <span>Launch Allocation Engine</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="rounded-lg bg-status-error border border-status-error p-4 text-sm text-status-error flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-status-error flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Shortage Alert Banner */}
      {isShortage && (
        <div className="rounded-xl border border-status-error bg-status-error p-5 text-status-error shadow-sm flex items-start gap-3">
          <ShieldAlert className="h-6 w-6 text-status-error flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-base text-status-error">Department Capacity Shortage Detected</h3>
            <p className="text-sm text-status-error mt-1">
              There are <strong className="font-bold">{shortageAmount}</strong> more students needing mentorship than total available mentor capacity. 
              Increase individual mentor capacities or register additional faculty mentors before confirming full allocation.
            </p>
          </div>
        </div>
      )}

      {/* Unassigned / Late Admission Notice */}
      {unassignedCount > 0 && (
        <div className="rounded-xl border border-status-warning bg-status-warning p-5 text-status-warning shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserX className="h-6 w-6 text-status-warning flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-sm text-status-warning">
                {unassignedCount} Student{unassignedCount > 1 ? 's' : ''} Pending Mentor Assignment
              </h4>
              <p className="text-xs text-status-warning mt-0.5">
                Includes newly admitted students or late entrants. You can use incremental allocation without altering existing assignments.
              </p>
            </div>
          </div>
          <Link
            to="/coordinator/allocation"
            className="text-xs font-semibold rounded-lg bg-status-warning text-white px-3 py-1.5 hover:bg-status-warning transition"
          >
            Allocate Now
          </Link>
        </div>
      )}

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Students</span>
            <span className="rounded-lg bg-status-info p-2 text-status-info dark:bg-status-info/40 dark:text-blue-400">
              <Users className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {metrics?.students?.total || 0}
            </span>
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
              <span>Department: {metrics?.department || 'ALL'}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Assigned Mentees</span>
            <span className="rounded-lg bg-status-success p-2 text-status-success dark:bg-status-success/40 dark:text-emerald-400">
              <UserCheck className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {metrics?.students?.assigned || 0}
            </span>
            <div className="mt-1 flex items-center gap-2 text-xs text-status-success">
              <span>
                {metrics?.students?.total
                  ? `${Math.round(((metrics.students.assigned || 0) / metrics.students.total) * 100)}% coverage`
                  : '0% coverage'}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Unassigned / Late</span>
            <span className="rounded-lg bg-status-warning p-2 text-status-warning dark:bg-status-warning/40 dark:text-amber-400">
              <UserX className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {metrics?.students?.unassigned || 0}
            </span>
            <div className="mt-1 flex items-center gap-2 text-xs text-status-warning">
              <span>Awaiting allocation</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Capacity Utilization</span>
            <span className="rounded-lg bg-role-soft p-2 text-role-primary dark:bg-role-primary/40 dark:text-purple-400">
              <TrendingUp className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {capacity?.capacity?.utilizationPercentage || 0}%
            </span>
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
              <span>
                {capacity?.capacity?.totalAssigned || 0} / {capacity?.capacity?.totalCapacity || 0} slots
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mentor Workload Snapshot Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Mentor Workload & Remaining Capacity</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Live capacity breakdown per faculty mentor in {metrics?.department || 'authorized department'}.
            </p>
          </div>
          <Link
            to="/coordinator/allocation"
            className="text-xs font-semibold text-role-primary hover:text-role-primary dark:text-indigo-400"
          >
            Adjust Allocations &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              <tr>
                <th className="px-6 py-3">Mentor Name</th>
                <th className="px-6 py-3">Employee ID</th>
                <th className="px-6 py-3">Department</th>
                <th className="px-6 py-3">Assigned Mentees</th>
                <th className="px-6 py-3">Max Capacity</th>
                <th className="px-6 py-3">Available Slots</th>
                <th className="px-6 py-3">Load %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {capacity?.mentors?.length ? (
                capacity.mentors.map((m) => {
                  const loadPct = m.maxMentees > 0 ? Math.round((m.assignedCount / m.maxMentees) * 100) : 0;
                  return (
                    <tr key={m._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        {m.name}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">
                        {m.employeeId || '—'}
                      </td>
                      <td className="px-6 py-4">{m.department}</td>
                      <td className="px-6 py-4 font-semibold text-role-primary dark:text-indigo-400">
                        {m.assignedCount}
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        {m.maxMentees}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            m.availableSlots <= 0
                              ? 'bg-status-error text-status-error dark:bg-status-error/40 dark:text-red-300'
                              : 'bg-status-success text-status-success dark:bg-status-success/40 dark:text-emerald-300'
                          }`}
                        >
                          {m.availableSlots} slots
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                            <div
                              className={`h-2 rounded-full ${
                                loadPct >= 100 ? 'bg-status-error' : loadPct >= 80 ? 'bg-status-warning' : 'bg-status-success'
                              }`}
                              style={{ width: `${Math.min(loadPct, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{loadPct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No active mentors found in this department.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
