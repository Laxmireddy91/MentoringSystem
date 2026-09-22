import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import DataTable from '../../components/common/DataTable';
import {
  ShieldCheck,
  Search,
  Filter,
  Clock,
  Terminal,
  User,
  Activity,
} from 'lucide-react';

export default function HodAuditLogs() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/hod/audit-logs');
      setLogs(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen={false} message="Loading immutable security audit trail..." />;

  const filteredLogs = logs.filter((l) => {
    const matchAction = actionFilter === 'ALL' || l.action === actionFilter;
    return matchAction;
  });

  const columns = [
    {
      header: 'Timestamp',
      accessorKey: 'createdAt',
      sortable: true,
      cell: (row) => (
        <span className="text-[11px] font-mono text-slate-500">
          {new Date(row.createdAt).toLocaleString([], {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </span>
      ),
    },
    {
      header: 'Action',
      accessorKey: 'action',
      sortable: true,
      cell: (row) => (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-role-soft text-role-primary dark:bg-role-soft-dark dark:text-indigo-300 font-mono">
          {row.action}
        </span>
      ),
    },
    {
      header: 'Actor / User',
      accessorKey: 'userId.name',
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-bold text-slate-800 dark:text-slate-100">{row.userId?.name || 'System / Anonymous'}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">{row.userId?.email || row.userEmail || '—'}</p>
        </div>
      ),
    },
    {
      header: 'Target Resource',
      accessorKey: 'resource',
      cell: (row) => (
        <span className="font-mono text-xs text-slate-700 dark:text-slate-300">
          {row.resource || 'Academic System'}
        </span>
      ),
    },
    {
      header: 'IP Address',
      accessorKey: 'ipAddress',
      cell: (row) => (
        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
          {row.ipAddress || '127.0.0.1'}
        </span>
      ),
    },
    {
      header: 'Details & Context',
      accessorKey: 'details',
      cell: (row) => (
        <span className="text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate block" title={typeof row.details === 'object' ? JSON.stringify(row.details) : row.details}>
          {typeof row.details === 'object' ? JSON.stringify(row.details) : row.details || 'Operation completed'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-role-primary dark:text-indigo-400" />
            Security Audit Trail &amp; Activity Logs
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Immutable regulatory compliance log tracking logins, marks revisions, and allocation changes.
          </p>
        </div>

        <div className="text-xs font-semibold px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-200">
          Total Logged Events: {logs.length}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex-1 min-w-[240px]">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search audit trail by actor, IP, action..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus-role"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200"
          >
            <option value="ALL">All Actions</option>
            <option value="LOGIN">LOGIN</option>
            <option value="MARKS_UPDATE">MARKS_UPDATE</option>
            <option value="MENTOR_ALLOCATION">MENTOR_ALLOCATION</option>
            <option value="RISK_SETTINGS_UPDATE">RISK_SETTINGS_UPDATE</option>
            <option value="BULK_IMPORT">BULK_IMPORT</option>
            <option value="STUDENT_CREATE">STUDENT_CREATE</option>
          </select>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filteredLogs}
        searchQuery={searchQuery}
        searchKeys={['action', 'userId.name', 'userId.email', 'ipAddress', 'resource']}
        pageSize={15}
        emptyMessage="No audit logs match current filters."
      />
    </div>
  );
}
