import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Trophy, Medal, Award, GraduationCap, Star, TrendingUp } from 'lucide-react';

export default function HodLeaderboard() {
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/hod/leaderboard');
      setLeaderboard(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return (
        <div className="w-8 h-8 rounded-full bg-status-warning text-status-warning dark:bg-status-amber dark:text-amber-300 font-extrabold flex items-center justify-center text-sm shadow-xs border border-status-warning">
          🥇 1
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 font-extrabold flex items-center justify-center text-sm shadow-xs border border-slate-300">
          🥈 2
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-8 h-8 rounded-full bg-status-warning text-status-warning dark:bg-status-amber dark:text-amber-400 font-extrabold flex items-center justify-center text-sm shadow-xs border border-status-warning">
          🥉 3
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400 font-bold flex items-center justify-center text-xs">
        #{rank}
      </div>
    );
  };

  if (loading) return <LoadingSpinner fullScreen={false} message="Loading department academic rankings..." />;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
            <Trophy className="w-6 h-6 text-amber-500" />
            Department Academic Performance Leaderboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Top academic achievers ranked by cumulative Grade Point Average (CGPA) and distinction milestones.
          </p>
        </div>
      </div>

      {/* Leaderboard Table / Cards */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
            Ranked Achievers List
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">Total Ranked: {leaderboard.length}</span>
        </div>

        {leaderboard.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {leaderboard.map((item, idx) => (
              <div
                key={item._id || idx}
                className={`p-4 sm:p-5 flex items-center justify-between gap-4 transition hover:bg-slate-50 dark:hover:bg-slate-750 ${
                  idx === 0 ? 'bg-status-warning/30 dark:bg-status-amber' : ''
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  {getRankBadge(idx + 1)}

                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate flex items-center gap-2">
                      {item.name || item.userId?.name || 'Student'}
                      {idx === 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-status-warning text-status-warning dark:bg-status-amber dark:text-amber-300">
                          Department Rank 1
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      USN: <span className="font-bold text-slate-600 dark:text-slate-300">{item.usn}</span> • Sem {item.semester || 1} • {item.department}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 shrink-0 text-right">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Cumulative CGPA</span>
                    <span className="text-base sm:text-lg font-black text-role-primary dark:text-indigo-400">
                      {Number(item.computedCGPA || item.cgpa || 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="hidden sm:block">
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Backlogs</span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        (item.computedBacklogs || item.totalActiveBacklogs || 0) === 0
                          ? 'bg-status-success text-status-success dark:bg-status-emerald dark:text-emerald-300'
                          : 'bg-status-error text-status-error dark:bg-status-error dark:text-status-error'
                      }`}
                    >
                      {item.computedBacklogs || item.totalActiveBacklogs || 0} Backlogs
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400">
            No students found in the department leaderboard.
          </div>
        )}
      </div>
    </div>
  );
}
