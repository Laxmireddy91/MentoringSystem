import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import {
  CheckSquare,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  User,
  Filter,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

export default function HodTasks() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [students, setStudents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const [form, setForm] = useState({
    studentId: '',
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [statusFilter]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [tasksRes, studentsRes] = await Promise.allSettled([
        axiosClient.get('/tasks'),
        axiosClient.get('/hod/students', { params: { limit: 200 } }),
      ]);

      if (tasksRes.status === 'fulfilled') {
        const data = tasksRes.value.data?.data;
        setTasks(data?.tasks || data || []);
      }

      if (studentsRes.status === 'fulfilled') {
        const studentData = studentsRes.value.data?.data;
        setStudents(Array.isArray(studentData) ? studentData : studentData?.students || []);
      }
    } catch (err) {
      console.error('Error loading HOD tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await axiosClient.get('/tasks', { params });
      const data = res.data?.data;
      setTasks(data?.tasks || data || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setForm({
      studentId: students.length > 0 ? students[0]._id : '',
      title: '',
      description: '',
      dueDate: '',
      priority: 'medium',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task) => {
    setEditingTask(task);
    setForm({
      studentId: task.studentId?._id || task.studentId || '',
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      priority: task.priority || 'medium',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingTask) {
        await axiosClient.put(`/tasks/${editingTask._id}`, {
          title: form.title,
          description: form.description,
          dueDate: form.dueDate,
          priority: form.priority,
        });
      } else {
        await axiosClient.post('/tasks', {
          studentId: form.studentId,
          title: form.title,
          description: form.description,
          dueDate: form.dueDate,
          priority: form.priority,
        });
      }
      setIsModalOpen(false);
      await fetchTasks();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save task.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await axiosClient.delete(`/tasks/${taskId}`);
      await fetchTasks();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete task.');
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

  if (loading) return <LoadingSpinner fullScreen={false} message="Loading department task registry..." />;

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
            Department Task &amp; Action Plan Oversight
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Assign department-level mandates and monitor academic task completion across mentors and mentees.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-role-primary hover:bg-role-primary text-white font-semibold rounded-xl text-xs sm:text-sm shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Create Department Task
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Pending Tasks</span>
          <p className="text-2xl font-extrabold text-status-warning dark:text-amber-400 mt-1">{pendingCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">In Progress</span>
          <p className="text-2xl font-extrabold text-sky-600 dark:text-sky-400 mt-1">{inProgressCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Completed</span>
          <p className="text-2xl font-extrabold text-status-success dark:text-emerald-400 mt-1">{completedCount}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-xs">
        <div className="flex items-center gap-2">
          <label className="text-slate-500 font-semibold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter Status:
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
          >
            <option value="all">All Tasks</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <span className="text-slate-500 dark:text-slate-400 font-medium">Total Registered: {tasks.length}</span>
      </div>

      {/* Task List */}
      {tasks.length > 0 ? (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task._id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
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
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-role-soft text-role-primary dark:bg-role-soft-dark dark:text-indigo-300">
                    Student: {task.studentId?.usn || 'N/A'} ({task.assignedTo?.name || 'Student'})
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

                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">{task.title}</h3>
                {task.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-3xl">
                    {task.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  <span>Created by: {task.assignedBy?.name || 'Administrator'}</span>
                  {task.completedAt && (
                    <span className="text-status-success dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Completed:{' '}
                      {new Date(task.completedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleOpenEditModal(task)}
                  className="p-2 text-slate-500 dark:text-slate-400 hover:text-role-primary hover:bg-role-soft dark:hover:bg-role-soft-dark rounded-xl transition"
                  title="Edit Task"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(task._id)}
                  className="p-2 text-slate-500 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition"
                  title="Delete Task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
          <CheckSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No department tasks</p>
          <p>No tasks currently registered matching the filter.</p>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTask ? 'Edit Task' : 'Create Department Task'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {!editingTask && (
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Assign to Department Student *
              </label>
              <select
                required
                value={form.studentId}
                onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              >
                <option value="" disabled>
                  -- Select Student --
                </option>
                {students.map((st) => (
                  <option key={st._id} value={st._id}>
                    {st.usn} - {st.userId?.name || 'Student'} (Sem {st.semester}, Sec {st.section})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Remedial Assessment Submission"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Instructions
            </label>
            <textarea
              rows={3}
              placeholder="Provide directives or completion criteria..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-role-primary hover:bg-role-primary text-white font-semibold shadow-sm transition disabled:opacity-50"
            >
              {submitting ? <LoadingSpinner size="sm" color="text-white" /> : 'Save Task'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
