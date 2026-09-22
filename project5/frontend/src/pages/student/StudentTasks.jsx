import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  CheckSquare,
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
  User,
  Filter,
  Check,
  ChevronDown,
} from 'lucide-react';

export default function StudentTasks() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, priorityFilter]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;

      const res = await axiosClient.get('/tasks', { params });
      const data = res.data?.data;
      if (data && Array.isArray(data.tasks)) {
        setTasks(data.tasks);
      } else if (Array.isArray(data)) {
        setTasks(data);
      } else {
        setTasks([]);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    setUpdatingId(taskId);
    try {
      await axiosClient.patch(`/tasks/${taskId}/status`, { status: newStatus });
      await fetchTasks();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update task status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-status-error text-status-error dark:bg-status-error/60 dark:text-status-error border-rose-200';
      case 'high':
        return 'bg-status-warning text-status-warning dark:bg-status-amber dark:text-amber-300 border-status-warning';
      case 'medium':
        return 'bg-status-info text-status-info dark:bg-status-blue dark:text-blue-300 border-status-info';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-status-success text-status-success dark:bg-status-emerald dark:text-emerald-300';
      case 'in_progress':
        return 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300';
      case 'cancelled':
        return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
      default:
        return 'bg-status-warning text-status-warning dark:bg-status-amber dark:text-amber-300';
    }
  };

  const pendingCount = tasks.filter((t) => t.status === 'pending').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-role-primary dark:text-indigo-400" />
            My Action Items &amp; Assigned Tasks
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track academic action plans, coursework deliverables, and mentor recommendations.
          </p>
        </div>

        {/* Stats Pills */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-status-warning dark:bg-status-amber text-status-warning dark:text-amber-300 text-xs font-semibold border border-status-warning dark:border-amber-900/60">
            {pendingCount} Pending
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 text-xs font-semibold border border-sky-200 dark:border-sky-900/60">
            {inProgressCount} In Progress
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-status-success dark:bg-status-emerald text-status-success dark:text-emerald-300 text-xs font-semibold border border-status-success dark:border-emerald-900/60">
            {completedCount} Completed
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter by:
          </span>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/50 p-1 rounded-xl">
            {['all', 'pending', 'in_progress', 'completed'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg font-semibold capitalize transition ${
                  statusFilter === st
                    ? 'bg-white dark:bg-slate-800 text-role-primary dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-slate-500 font-semibold">Priority:</label>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <LoadingSpinner fullScreen={false} message="Loading your tasks..." />
      ) : tasks.length > 0 ? (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task._id}
              className={`p-5 rounded-2xl bg-white dark:bg-slate-800 border transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                task.status === 'completed'
                  ? 'border-slate-200 dark:border-slate-800 opacity-80'
                  : 'border-slate-200 dark:border-slate-700 hover:border-role-primary dark:hover:border-role-primary'
              }`}
            >
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getPriorityBadge(
                      task.priority
                    )}`}
                  >
                    {task.priority} Priority
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(
                      task.status
                    )}`}
                  >
                    {task.status?.replace('_', ' ')}
                  </span>
                  {task.dueDate && (
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3" /> Due:{' '}
                      {new Date(task.dueDate).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                </div>

                <h3
                  className={`text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 ${
                    task.status === 'completed' ? 'line-through text-slate-500 dark:text-slate-400' : ''
                  }`}
                >
                  {task.title}
                </h3>

                {task.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-3xl">
                    {task.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" /> Assigned by: {task.assignedBy?.name || 'Faculty Mentor'}
                  </span>
                  {task.completedAt && (
                    <span className="flex items-center gap-1 text-status-success dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3 h-3" /> Completed on:{' '}
                      {new Date(task.completedAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  )}
                </div>
              </div>

              {/* Status Action Selector */}
              <div className="flex items-center gap-2 shrink-0">
                {task.status !== 'completed' ? (
                  <button
                    onClick={() => handleUpdateStatus(task._id, 'completed')}
                    disabled={updatingId === task._id}
                    className="px-3.5 py-2 bg-status-success hover:bg-status-success text-white font-semibold rounded-xl text-xs shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {updatingId === task._id ? (
                      <LoadingSpinner size="sm" color="text-white" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    Mark Complete
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpdateStatus(task._id, 'in_progress')}
                    disabled={updatingId === task._id}
                    className="px-3.5 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs transition disabled:opacity-50"
                  >
                    Reopen Task
                  </button>
                )}

                {task.status === 'pending' && (
                  <button
                    onClick={() => handleUpdateStatus(task._id, 'in_progress')}
                    disabled={updatingId === task._id}
                    className="px-3 py-2 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 text-sky-700 dark:text-sky-300 font-semibold rounded-xl text-xs transition"
                  >
                    Start Working
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
          <CheckSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No tasks found</p>
          <p>You have no tasks matching the selected filters.</p>
        </div>
      )}
    </div>
  );
}
