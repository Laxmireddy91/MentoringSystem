import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import {
  Calendar,
  Clock,
  Plus,
  Star,
  CheckCircle,
  Video,
  MapPin,
  FileText,
  AlertCircle,
  UserCheck,
} from 'lucide-react';

export default function StudentSessions() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [mentor, setMentor] = useState(null);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Booking Form State
  const [bookingForm, setBookingForm] = useState({
    date: '',
    startTime: '10:00',
    endTime: '10:30',
    topic: '',
    mode: 'in-person',
    notes: '',
  });

  // Feedback Form State
  const [feedbackForm, setFeedbackForm] = useState({
    rating: 5,
    comments: '',
  });

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const [sessRes, profRes] = await Promise.allSettled([
        axiosClient.get('/sessions/my-sessions'),
        axiosClient.get('/students/profile'),
      ]);

      if (sessRes.status === 'fulfilled') setSessions(sessRes.value.data?.data || []);
      if (profRes.status === 'fulfilled') setMentor(profRes.value.data?.data?.mentor);
    } catch (err) {
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookSession = async (e) => {
    e.preventDefault();
    if (!mentor?._id) {
      alert('You must have an assigned mentor to book sessions.');
      return;
    }

    setSubmitting(true);
    try {
      await axiosClient.post('/sessions', {
        mentorId: mentor._id,
        ...bookingForm,
      });
      setIsBookModalOpen(false);
      setBookingForm({
        date: '',
        startTime: '10:00',
        endTime: '10:30',
        topic: '',
        mode: 'in-person',
        notes: '',
      });
      await fetchSessions();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to book session. Time slot might collide.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!selectedSession) return;

    setSubmitting(true);
    try {
      await axiosClient.post(`/students/sessions/${selectedSession._id}/feedback`, {
        rating: Number(feedbackForm.rating),
        comment: feedbackForm.comments || feedbackForm.comment,
        aspects: feedbackForm.aspects || { helpfulness: feedbackForm.rating, punctuality: 5, clarity: 5 },
        isAnonymous: !!feedbackForm.isAnonymous,
      });
      setIsFeedbackModalOpen(false);
      setSelectedSession(null);
      setFeedbackForm({ rating: 5, comments: '', isAnonymous: false });
      await fetchSessions();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen={false} message="Loading mentoring sessions..." />;

  const upcomingSessions = sessions.filter(
    (s) => s.status === 'scheduled' || s.status === 'pending'
  );
  const pastSessions = sessions.filter(
    (s) => s.status === 'completed' || s.status === 'cancelled'
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
            <Calendar className="w-6 h-6 text-role-primary dark:text-indigo-400" />
            Mentoring Sessions & Office Hours
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Schedule 1-on-1 consultations, review past discussions, and provide session feedback.
          </p>
        </div>

        <button
          onClick={() => setIsBookModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-role-primary hover:bg-role-primary text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Book Mentor Session
        </button>
      </div>

      {/* Mentor Info Card */}
      {mentor && (
        <div className="p-4 rounded-xl bg-role-soft/70 dark:bg-role-soft-dark border border-indigo-100 dark:border-role-primary/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-role-primary text-white flex items-center justify-center font-bold text-sm">
              {mentor.name?.[0]}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                Assigned Mentor: {mentor.name}
              </p>
              <p className="text-[11px] text-slate-500">
                {[mentor.department, mentor.officeRoom, mentor.email].filter(Boolean).join(' • ')}
              </p>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 bg-white dark:bg-slate-800 rounded-lg text-role-primary dark:text-indigo-400 font-semibold border border-role-primary dark:border-role-primary">
            Active
          </span>
        </div>
      )}

      {/* Upcoming Sessions Section */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-role-primary" /> Upcoming & Pending Sessions ({upcomingSessions.length})
        </h2>

        {upcomingSessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingSessions.map((s) => (
              <div
                key={s._id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                      {s.topic}
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        s.status === 'scheduled'
                          ? 'bg-status-success text-status-success dark:bg-status-emerald dark:text-emerald-300'
                          : 'bg-status-warning text-status-warning dark:bg-status-warning/40 dark:text-amber-300'
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <p className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-role-primary" />
                      {new Date(s.date).toLocaleDateString([], {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-role-primary" />
                      {s.startTime} - {s.endTime}
                    </p>
                    <p className="flex items-center gap-2">
                      {s.mode === 'online' ? (
                        <Video className="w-3.5 h-3.5 text-role-primary" />
                      ) : (
                        <MapPin className="w-3.5 h-3.5 text-role-primary" />
                      )}
                      Mode: <span className="capitalize font-medium text-slate-700 dark:text-slate-200">{s.mode}</span>
                    </p>
                    {s.notes && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-900/40 p-2 rounded-lg mt-2">
                        "{s.notes}"
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400">
            No upcoming sessions. Click "Book Mentor Session" above to reserve an office hours slot.
          </div>
        )}
      </div>

      {/* Past Sessions History Section */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-status-success" /> Completed Session History ({pastSessions.length})
        </h2>

        {pastSessions.length > 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-900/50 uppercase text-[11px] font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3">Date & Time</th>
                    <th className="px-4 py-3">Topic</th>
                    <th className="px-4 py-3">Action Items & Summary</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Feedback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {pastSessions.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="font-semibold text-slate-800 dark:text-slate-100">
                          {new Date(s.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{s.startTime} - {s.endTime}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">
                        {s.topic}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-xs">
                        {s.actionItems?.length > 0 ? (
                          <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                            {s.actionItems.map((ai, i) => (
                              <li key={i}>{typeof ai === 'string' ? ai : ai.task || ai.title}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="italic text-slate-500 dark:text-slate-400">No action items recorded</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {s.feedbackGiven ? (
                          <span className="text-status-success dark:text-emerald-400 font-semibold flex items-center justify-end gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Reviewed
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedSession(s);
                              setIsFeedbackModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-status-warning dark:bg-status-amber text-status-warning dark:text-amber-300 hover:bg-status-warning dark:hover:bg-status-warning/60 rounded-lg font-semibold text-xs border border-status-warning dark:border-amber-800 transition flex items-center gap-1 ml-auto"
                          >
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> Rate Session
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400">
            No completed mentoring sessions yet.
          </div>
        )}
      </div>

      {/* Book Office Hours Modal */}
      <Modal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        title="Schedule Mentoring Office Hours"
        size="md"
      >
        <form onSubmit={handleBookSession} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Discussion Topic / Agenda *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. CIE Performance Review, Project Guidance, Backlog Strategy"
              value={bookingForm.topic}
              onChange={(e) => setBookingForm({ ...bookingForm, topic: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus-role"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={bookingForm.date}
                onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Start Time *
              </label>
              <input
                type="time"
                required
                value={bookingForm.startTime}
                onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                End Time *
              </label>
              <input
                type="time"
                required
                value={bookingForm.endTime}
                onChange={(e) => setBookingForm({ ...bookingForm, endTime: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Session Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 cursor-pointer transition ${
                  bookingForm.mode === 'in-person'
                    ? 'border-role-primary bg-role-soft/50 text-role-primary dark:bg-role-soft-dark dark:text-indigo-300 font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <input
                  type="radio"
                  name="mode"
                  value="in-person"
                  checked={bookingForm.mode === 'in-person'}
                  onChange={() => setBookingForm({ ...bookingForm, mode: 'in-person' })}
                  className="hidden"
                />
                <MapPin className="w-4 h-4" /> In-Person (Faculty Office)
              </label>

              <label
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 cursor-pointer transition ${
                  bookingForm.mode === 'online'
                    ? 'border-role-primary bg-role-soft/50 text-role-primary dark:bg-role-soft-dark dark:text-indigo-300 font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <input
                  type="radio"
                  name="mode"
                  value="online"
                  checked={bookingForm.mode === 'online'}
                  onChange={() => setBookingForm({ ...bookingForm, mode: 'online' })}
                  className="hidden"
                />
                <Video className="w-4 h-4" /> Online (Video Call)
              </label>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Preparation Notes / Specific Questions (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="What specifically would you like to discuss with your mentor?"
              value={bookingForm.notes}
              onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus-role"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsBookModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-role-primary hover:bg-role-primary text-white font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting ? <LoadingSpinner size="sm" color="text-white" /> : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Submit Session Feedback Modal */}
      <Modal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        title="Session Feedback & Rating"
        size="sm"
      >
        <form onSubmit={handleSubmitFeedback} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-center">
              How helpful was this mentoring session?
            </label>
            <div className="flex items-center justify-center gap-2 py-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
                  className="p-1 text-2xl focus:outline-none hover:scale-125 transition"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= feedbackForm.rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300 dark:text-slate-600'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-center font-bold text-status-warning dark:text-amber-400">
              {feedbackForm.rating} of 5 Stars
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Comments / Key Takeaways *
            </label>
            <textarea
              required
              rows={3}
              placeholder="What did you learn or agree on during this session?"
              value={feedbackForm.comments}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, comments: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isAnonymous"
              checked={feedbackForm.isAnonymous || false}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, isAnonymous: e.target.checked })}
              className="rounded border-slate-300 text-role-primary focus-role"
            />
            <label htmlFor="isAnonymous" className="text-xs text-slate-600 dark:text-slate-400">
              Submit feedback anonymously (mentor will not see your name/USN)
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsFeedbackModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-role-primary hover:bg-role-primary text-white font-semibold shadow-sm transition disabled:opacity-50"
            >
              {submitting ? <LoadingSpinner size="sm" color="text-white" /> : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
