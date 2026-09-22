import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import RiskBadge from '../../components/common/RiskBadge';
import {
  AlertTriangle,
  ShieldCheck,
  TrendingDown,
  BookOpen,
  Calendar,
  CheckCircle,
  HelpCircle,
  Activity,
  ArrowRight,
} from 'lucide-react';

export default function StudentRiskAnalysis() {
  const [loading, setLoading] = useState(true);
  const [riskData, setRiskData] = useState(null);

  useEffect(() => {
    fetchRiskAnalysis();
  }, []);

  const fetchRiskAnalysis = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/risk/my-analysis');
      setRiskData(res.data?.data);
    } catch (err) {
      console.error('Error fetching risk analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen={false} message="Analyzing academic risk indicators..." />;

  const riskScore = riskData?.riskScore || 0;
  const riskCategory = riskData?.riskCategory || 'Low';
  const factors = riskData?.contributingFactors || {};
  const reasons = riskData?.reasons || [];
  const recommendations = riskData?.recommendations || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
            <AlertTriangle className="w-6 h-6 text-role-primary dark:text-indigo-400" />
            Automated Academic Risk & Performance Analysis
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time rule-based assessment evaluating internal marks, backlogs, and academic performance trend.
          </p>
        </div>

        <RiskBadge category={riskCategory} />
      </div>

      {/* Main Score & Gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between text-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Aggregated Risk Index
            </span>
            <div className="my-6">
              <div
                className={`w-32 h-32 mx-auto rounded-full border-8 flex flex-col items-center justify-center shadow-inner ${
                  riskCategory === 'Critical'
                    ? 'border-rose-500 bg-rose-50 dark:bg-status-error/30'
                    : riskCategory === 'High'
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30'
                    : riskCategory === 'Medium'
                    ? 'border-status-warning bg-status-warning dark:bg-status-amber'
                    : 'border-status-success bg-status-success dark:bg-status-emerald'
                }`}
              >
                <span className="text-3xl font-black text-slate-800 dark:text-slate-100">
                  {riskScore}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">/ 100 max</span>
              </div>
            </div>

            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Status: <span className="capitalize">{riskCategory} Risk</span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {riskScore <= 25
                ? 'Excellent performance! Maintain current consistency.'
                : riskScore <= 50
                ? 'Moderate stability. Monitor your CIE tests and backlog clearance.'
                : 'Urgent intervention recommended. Book an advising slot.'}
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
            <Link
              to="/student/sessions"
              className="w-full py-2.5 px-4 bg-role-primary hover:bg-role-primary text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center justify-center gap-1.5"
            >
              <Calendar className="w-4 h-4" /> Book Mentor Consultation
            </Link>
          </div>
        </div>

        {/* Breakdown of 3 Core Factors */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-role-primary dark:text-indigo-400" />
            Evaluation Weights & Factor Breakdown
          </h2>

          <div className="space-y-3.5">
            {/* CIE Factor */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700/60">
              <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                <span className="text-slate-700 dark:text-slate-200">
                  Continuous Internal Evaluation (CIE) — <span className="text-slate-500 dark:text-slate-400 font-normal">40% Weight</span>
                </span>
                <span className="text-role-primary dark:text-indigo-400 font-bold">
                  {factors.cieScore !== undefined ? `${factors.cieScore}/40 pts` : 'Calculated'}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-role-primary rounded-full"
                  style={{ width: `${Math.min(100, ((factors.cieScore || 0) / 40) * 100)}%` }}
                />
              </div>
            </div>

            {/* Backlogs Factor */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700/60">
              <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                <span className="text-slate-700 dark:text-slate-200">
                  Active Backlogs Penalty — <span className="text-slate-500 dark:text-slate-400 font-normal">40% Weight</span>
                </span>
                <span className="text-status-warning dark:text-amber-400 font-bold">
                  {factors.backlogScore !== undefined ? `${factors.backlogScore}/40 pts` : 'Calculated'}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${Math.min(100, ((factors.backlogScore || 0) / 40) * 100)}%` }}
                />
              </div>
            </div>

            {/* Trend Factor */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700/60">
              <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                <span className="text-slate-700 dark:text-slate-200">
                  Semester GPA Velocity & Trend — <span className="text-slate-500 dark:text-slate-400 font-normal">20% Weight</span>
                </span>
                <span className="text-role-primary dark:text-purple-400 font-bold">
                  {factors.trendScore !== undefined ? `${factors.trendScore}/20 pts` : 'Calculated'}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-role-primary rounded-full"
                  style={{ width: `${Math.min(100, ((factors.trendScore || 0) / 20) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Flagged Triggers & Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Identified Triggers */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500" /> Triggered Warning Indicators
          </h3>
          {reasons.length > 0 ? (
            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              {reasons.map((r, i) => (
                <li key={i} className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-50/50 dark:bg-status-error/20 border border-rose-100 dark:border-rose-900/40">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 rounded-xl bg-status-success dark:bg-status-emerald text-xs text-status-success dark:text-emerald-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              No severe academic risk flags detected. All core metrics meet university standards.
            </div>
          )}
        </div>

        {/* Recommendations */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-role-primary dark:text-indigo-400" /> Actionable Recommendations
          </h3>
          {recommendations.length > 0 ? (
            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              {recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 p-2.5 rounded-xl bg-role-soft/50 dark:bg-role-soft-dark border border-indigo-100 dark:border-role-primary/40">
                  <ArrowRight className="w-3.5 h-3.5 text-role-primary shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Continue your structured study plan and stay in touch with your faculty mentor.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
