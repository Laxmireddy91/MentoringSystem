import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  Settings,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Sliders,
  Percent,
} from 'lucide-react';

export default function HodRiskSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    cieWeight: 40,
    backlogWeight: 40,
    trendWeight: 20,
    cieWarningThreshold: 50,
    lowCutoff: 30,
    mediumCutoff: 60,
    highCutoff: 80,
  });

  useEffect(() => {
    fetchRiskSettings();
  }, []);

  const fetchRiskSettings = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/risk/settings');
      if (res.data?.data) {
        setSettings(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching risk settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalWeight =
    Number(settings.cieWeight || 0) +
    Number(settings.backlogWeight || 0) +
    Number(settings.trendWeight || 0);

  const handleSaveAndRecalculate = async (e) => {
    e.preventDefault();
    if (totalWeight !== 100) {
      alert(`The sum of all 3 risk weights must equal 100%. Currently it is ${totalWeight}%.`);
      return;
    }

    setSaving(true);
    try {
      await axiosClient.put('/risk/settings', settings);
      await axiosClient.post('/risk/recalculate-all');
      alert('Risk engine rules saved and all student risk scores recalculated successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update risk settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setSettings({
      cieWeight: 40,
      backlogWeight: 40,
      trendWeight: 20,
      cieWarningThreshold: 50,
      lowCutoff: 30,
      mediumCutoff: 60,
      highCutoff: 80,
    });
  };

  if (loading) return <LoadingSpinner fullScreen={false} message="Loading risk engine configuration..." />;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
            <Sliders className="w-6 h-6 text-role-primary dark:text-indigo-400" />
            Automated Academic Risk Engine Configuration
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Customize multi-factor evaluation weights, academic triggers, and risk tier cutoffs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-200 transition flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
          </button>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveAndRecalculate} className="space-y-6">
        {/* Factor Weights Section */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Percent className="w-5 h-5 text-role-primary" /> Factor Weights Distribution
              </h2>
              <p className="text-xs text-slate-500">
                Sum of all 3 factor weights must equal exactly 100%.
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                totalWeight === 100
                  ? 'bg-status-success text-status-success dark:bg-status-emerald dark:text-emerald-300'
                  : 'bg-status-error text-status-error dark:bg-status-error dark:text-status-error'
              }`}
            >
              Total Weight: {totalWeight}%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                CIE Performance Weight
              </label>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={settings.cieWeight}
                  onChange={(e) => setSettings({ ...settings, cieWeight: Number(e.target.value) })}
                  className="w-20 p-2 text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                />
                <span className="text-sm font-bold text-slate-500 dark:text-slate-400">%</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">Continuous Internal Evaluation scoring</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Backlogs Penalty Weight
              </label>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={settings.backlogWeight}
                  onChange={(e) => setSettings({ ...settings, backlogWeight: Number(e.target.value) })}
                  className="w-20 p-2 text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                />
                <span className="text-sm font-bold text-slate-500 dark:text-slate-400">%</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">Active uncleared subjects burden</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                GPA Velocity &amp; Trend Weight
              </label>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={settings.trendWeight}
                  onChange={(e) => setSettings({ ...settings, trendWeight: Number(e.target.value) })}
                  className="w-20 p-2 text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                />
                <span className="text-sm font-bold text-slate-500 dark:text-slate-400">%</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">Semester-over-semester score trajectory</p>
            </div>
          </div>
        </div>

        {/* Warning Thresholds Section */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" /> Trigger Thresholds &amp; Cutoffs
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                CIE Warning Threshold
              </label>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.cieWarningThreshold}
                  onChange={(e) => setSettings({ ...settings, cieWarningThreshold: Number(e.target.value) })}
                  className="w-20 p-2 text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                />
                <span className="text-sm font-bold text-slate-500 dark:text-slate-400">%</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">Flags students scoring below this % in CIE tests</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                High / Critical Score Cutoff
              </label>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.highCutoff}
                  onChange={(e) => setSettings({ ...settings, highCutoff: Number(e.target.value) })}
                  className="w-20 p-2 text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-rose-600"
                />
                <span className="text-sm font-bold text-slate-500 dark:text-slate-400">pts</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">Scores &gt;= this cutoff enter Critical Risk tier</p>
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || totalWeight !== 100}
            className="px-6 py-3 bg-role-primary hover:bg-role-primary text-white font-bold rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50 text-sm"
          >
            {saving ? <LoadingSpinner size="sm" color="text-white" /> : <Save className="w-4 h-4" />}
            Save &amp; Recalculate Department Risk Scores
          </button>
        </div>
      </form>
    </div>
  );
}
