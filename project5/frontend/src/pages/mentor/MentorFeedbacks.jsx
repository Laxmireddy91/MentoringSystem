import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Award, Star, MessageSquare, User, Calendar, ThumbsUp } from 'lucide-react';

export default function MentorFeedbacks() {
  const [loading, setLoading] = useState(true);
  const [feedbackData, setFeedbackData] = useState({ ratingAverage: 5, totalRatings: 0, feedbacks: [] });

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/mentors/feedbacks');
      const data = res.data?.data;
      if (data && Array.isArray(data.feedbacks)) {
        setFeedbackData(data);
        setFeedbacks(data.feedbacks);
      } else if (Array.isArray(data)) {
        setFeedbacks(data);
        setFeedbackData({
          ratingAverage: data.length > 0 ? (data.reduce((s, f) => s + (f.rating || 5), 0) / data.length).toFixed(1) : 5,
          totalRatings: data.length,
          feedbacks: data,
        });
      }
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen={false} message="Loading student evaluations..." />;

  const totalReviews = feedbackData.totalRatings || feedbacks.length;
  const avgRating = Number(feedbackData.ratingAverage || 5).toFixed(1);

  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  feedbacks.forEach((f) => {
    const r = f.rating || 5;
    if (ratingCounts[r] !== undefined) ratingCounts[r]++;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
            <Award className="w-6 h-6 text-amber-500" />
            Mentee Feedback &amp; Session Evaluations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Anonymous and verified student ratings and qualitative comments on mentoring sessions.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-status-warning dark:bg-status-amber px-4 py-2 rounded-xl border border-status-warning dark:border-amber-900/60">
          <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
          <span className="text-lg font-extrabold text-status-warning dark:text-amber-300">{avgRating}</span>
          <span className="text-xs text-status-warning dark:text-amber-400">/ 5.0 Average</span>
        </div>
      </div>

      {/* Ratings Distribution Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-center flex flex-col justify-center">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Overall Mentorship Score</span>
          <div className="my-4 flex items-center justify-center gap-1">
            <span className="text-4xl font-black text-slate-800 dark:text-slate-100">{avgRating}</span>
            <div className="flex text-amber-400 ml-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-5 h-5 ${s <= Math.round(Number(avgRating)) ? 'fill-amber-400' : 'text-slate-200 dark:text-slate-700'}`}
                />
              ))}
            </div>
          </div>
          <p className="text-xs text-slate-500">Based on {totalReviews} completed session reviews</p>
        </div>

        <div className="md:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">Rating Breakdown</span>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratingCounts[star] || 0;
            const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-3 text-xs">
                <span className="w-12 font-bold text-slate-600 dark:text-slate-300">{star} Stars</span>
                <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  <div className="h-full bg-status-warning rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-8 text-right text-slate-500 dark:text-slate-400 font-mono">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feedbacks Feed */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-role-primary" /> Recent Student Reviews ({feedbacks.length})
        </h2>

        {feedbacks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {feedbacks.map((item) => (
              <div
                key={item._id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${s <= item.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-700'}`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed italic bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60">
                    "{item.comments || 'Session was very helpful and informative.'}"
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Mentee: {item.studentId?.name || 'Verified Student'}</span>
                  <span className="text-role-primary dark:text-indigo-400 font-semibold font-mono">
                    {item.sessionId?.topic || '1-on-1 Consultation'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400">
            No feedback entries received yet. Feedback will appear here after completed sessions.
          </div>
        )}
      </div>
    </div>
  );
}
