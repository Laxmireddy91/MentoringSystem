import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import {
  Target,
  Plus,
  CheckCircle2,
  Circle,
  Calendar,
  Award,
  Trash2,
  Flame,
  Check,
} from 'lucide-react';

export default function StudentGoals() {
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState([]);
  const [badges, setBadges] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Goal State
  const [goalForm, setGoalForm] = useState({
    title: '',
    description: '',
    category: 'academic',
    targetDate: '',
    milestones: ['', ''],
  });

  useEffect(() => {
    fetchGoalsAndBadges();
  }, []);

  const fetchGoalsAndBadges = async () => {
    setLoading(true);
    try {
      const [gRes, pRes] = await Promise.allSettled([
        axiosClient.get('/goals'),
        axiosClient.get('/students/profile'),
      ]);

      if (gRes.status === 'fulfilled') setGoals(gRes.value.data?.data || []);
      if (pRes.status === 'fulfilled') setBadges(pRes.value.data?.data?.student?.badges || []);
    } catch (err) {
      console.error('Error fetching goals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMilestone = async (goalId, milestoneIndex) => {
    try {
      await axiosClient.patch(`/goals/${goalId}/milestones/${milestoneIndex}/toggle`);
      await fetchGoalsAndBadges();
    } catch (err) {
      alert('Failed to update milestone status.');
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const filteredMilestones = goalForm.milestones
        .filter((m) => m.trim().length > 0)
        .map((title) => ({ title, completed: false }));

      await axiosClient.post('/goals', {
        title: goalForm.title,
        description: goalForm.description,
        category: goalForm.category,
        targetDate: goalForm.targetDate,
        milestones: filteredMilestones,
      });

      setIsCreateModalOpen(false);
      setGoalForm({
        title: '',
        description: '',
        category: 'academic',
        targetDate: '',
        milestones: ['', ''],
      });
      await fetchGoalsAndBadges();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create goal.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) return;
    try {
      await axiosClient.delete(`/goals/${goalId}`);
      await fetchGoalsAndBadges();
    } catch (err) {
      alert('Failed to delete goal.');
    }
  };

  if (loading) return <LoadingSpinner fullScreen={false} message="Loading your goals & badges..." />;

  const activeGoals = goals.filter((g) => g.status !== 'completed');
  const completedGoals = goals.filter((g) => g.status === 'completed');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
            <Target className="w-6 h-6 text-role-primary dark:text-indigo-400" />
            SMART Academic & Career Goals
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track measurable milestones, earn gamified achievements, and build high academic momentum.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-role-primary hover:bg-role-primary text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Set New Goal
        </button>
      </div>

      {/* Badges Gallery */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 dark:from-slate-800 dark:to-slate-800/60 border border-status-warning/50 dark:border-slate-700">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" /> Unlocked Badges & Milestones ({badges.length})
        </h2>

        {badges.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {badges.map((b, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-center shadow-xs hover:scale-105 transition"
              >
                <span className="text-3xl block mb-1">{b.icon || '🏅'}</span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{b.title}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{b.description || 'Milestone achieved'}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            No badges unlocked yet. Keep maintaining zero backlogs, scoring above 8.5 SGPA, and completing your goals!
          </p>
        )}
      </div>

      {/* Active Goals Grid */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" /> In-Progress Goals ({activeGoals.length})
        </h2>

        {activeGoals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeGoals.map((goal) => {
              const totalMilestones = goal.milestones?.length || 0;
              const completedCount = goal.milestones?.filter((m) => m.completed)?.length || 0;
              const progressPct = totalMilestones > 0 ? Math.round((completedCount / totalMilestones) * 100) : (goal.progress || 0);

              return (
                <div
                  key={goal._id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-role-soft text-role-primary dark:bg-role-primary/40 dark:text-indigo-300">
                        {goal.category}
                      </span>
                      <button
                        onClick={() => handleDeleteGoal(goal._id)}
                        className="text-slate-500 dark:text-slate-400 hover:text-rose-500 p-1 rounded-lg"
                        title="Delete Goal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mt-2">
                      {goal.title}
                    </h3>
                    {goal.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {goal.description}
                      </p>
                    )}

                    {/* Progress Bar */}
                    <div className="mt-4 space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-600 dark:text-slate-300">Progress</span>
                        <span className="text-role-primary dark:text-indigo-400">{progressPct}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                        <div
                          className="h-full bg-role-primary transition-all duration-300 rounded-full"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Milestones Checklist */}
                    {goal.milestones?.length > 0 && (
                      <div className="mt-4 space-y-2 border-t border-slate-100 dark:border-slate-700/60 pt-3">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                          Milestones ({completedCount}/{totalMilestones})
                        </span>
                        {goal.milestones.map((m, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleToggleMilestone(goal._id, idx)}
                            className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200 cursor-pointer p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/40 transition"
                          >
                            {m.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-status-success shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                            )}
                            <span className={m.completed ? 'line-through text-slate-500 dark:text-slate-400' : ''}>
                              {m.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {goal.targetDate && (
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      Target Date: {new Date(goal.targetDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400">
            No active goals. Set your target for this semester by clicking "Set New Goal".
          </div>
        )}
      </div>

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-status-success" /> Completed Goals ({completedGoals.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedGoals.map((g) => (
              <div
                key={g._id}
                className="p-4 rounded-2xl bg-status-success/50 dark:bg-status-emerald border border-status-success dark:border-emerald-900 flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm line-through text-slate-500">
                    {g.title}
                  </h4>
                  <p className="text-xs text-status-success dark:text-emerald-400 font-semibold">
                    Completed 100%
                  </p>
                </div>
                <Check className="w-5 h-5 text-status-success" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Goal Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Set a New SMART Goal"
        size="md"
      >
        <form onSubmit={handleCreateGoal} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Goal Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Score 9.0+ SGPA in Semester 5, Clear Data Structures Backlog"
              value={goalForm.title}
              onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus-role"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={goalForm.category}
                onChange={(e) => setGoalForm({ ...goalForm, category: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              >
                <option value="academic">Academic (CIE / SGPA)</option>
                <option value="career">Career / Placement</option>
                <option value="skill">Technical Skill / Cert</option>
                <option value="personal">Personal Development</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Date
              </label>
              <input
                type="date"
                value={goalForm.targetDate}
                onChange={(e) => setGoalForm({ ...goalForm, targetDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description / Action Plan
            </label>
            <textarea
              rows={2}
              placeholder="Brief details on how you will achieve this goal..."
              value={goalForm.description}
              onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Actionable Milestones
              </label>
              <button
                type="button"
                onClick={() => setGoalForm({ ...goalForm, milestones: [...goalForm.milestones, ''] })}
                className="text-role-primary dark:text-indigo-400 font-bold hover:underline flex items-center gap-1"
              >
                + Add Step
              </button>
            </div>
            <div className="space-y-2">
              {goalForm.milestones.map((ms, idx) => (
                <input
                  key={idx}
                  type="text"
                  placeholder={`Milestone #${idx + 1} (e.g. Complete 50 LeetCode problems)`}
                  value={ms}
                  onChange={(e) => {
                    const copy = [...goalForm.milestones];
                    copy[idx] = e.target.value;
                    setGoalForm({ ...goalForm, milestones: copy });
                  }}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-role-primary hover:bg-role-primary text-white font-semibold shadow-sm transition disabled:opacity-50"
            >
              {submitting ? <LoadingSpinner size="sm" color="text-white" /> : 'Create Goal'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
