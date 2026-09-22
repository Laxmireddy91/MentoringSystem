import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import {
  Calendar,
  Clock,
  Settings,
  CheckCircle,
  XCircle,
  PlayCircle,
  Video,
  MapPin,
  Plus,
  Trash2,
} from 'lucide-react';

export default function MentorSessions() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [officeHours, setOfficeHours] = useState([]);
  const [isHoursModalOpen, setIsHoursModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Complete Session Form
  const [completeForm, setCompleteForm] = useState({
    notes: '',
    actionItems: ['', ''],
  });

  // Office Hours Form
  const [hoursForm, setHoursForm] = useState([
    { dayOfWeek: 'Monday', startTime: '10:00', endTime: '12:00', slotDuration: 30, maxBookings: 4 },
    { dayOfWeek: 'Wednesday', startTime: '14:00', endTime: '16:00', slotDuration: 30, maxBookings: 4 },
    { dayOfWeek: 'Friday', startTime: '15:00', endTime: '17:00', slotDuration: 30, maxBookings: 4 },
  ]);

  useEffect(() => {
    fetchSessionsAndHours();
  }, []);

  const fetchSessionsAndHours = async () => {
    setLoading(true);
    try {
      const [sRes, mRes] = await Promise.allSettled([
        axiosClient.get('/sessions/my-sessions'),
        axiosClient.get('/mentors/profile'),
      ]);

      if (sRes.status === 'fulfilled') setSessions(sRes.value.data?.data || []);
      if (mRes.status === 'fulfilled' && mRes.value.data?.data?.mentor?.officeHours?.length > 0) {
        setOfficeHours(mRes.value.data.data.mentor.officeHours);
        setHoursForm(mRes.value.data.data.mentor.officeHours);
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (sessionId, status) => {
    try {
      await axiosClient.patch(`/sessions/${sessionId}/status`, { status });
      await fetchSessionsAndHours();
    } catch (err) {
      alert('Failed to update session status.');
    }
  };

  const handleCompleteSession = async (e) => {
    e.preventDefault();
    if (!selectedSession) return;

    setSubmitting(true);
    try {
      const filteredItems = completeForm.actionItems.filter((i) => i.trim().length > 0);
      await axiosClient.patch(`/sessions/${selectedSession._id}/status`, {
        status: 'completed',
        notes: completeForm.notes,
        actionItems: filteredItems,
      });

      setIsCompleteModalOpen(false);
      setSelectedSession(null);
      setCompleteForm({ notes: '', actionItems: ['', ''] });
      await fetchSessionsAndHours();
    } catch (err) {
      alert('Failed to record session completion.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveOfficeHours = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axiosClient.put('/mentors/office-hours', {
        officeHours: hoursForm,
      });
      setOfficeHours(hoursForm);
      setIsHoursModalOpen(false);
      alert('Office hours updated successfully!');
    } catch (err) {
      alert('Failed to update office hours.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen={false} message="Loading mentoring calendar..." />;

  const pendingOrScheduled = sessions.filter(
    (s) => s.status === 'scheduled' || s.status === 'pending' || s.status === 'in_progress'
  );
  const completedSessions = sessions.filter((s) => s.status === 'completed' || s.status === 'cancelled');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
            <Calendar className="w-6 h-6 text-role-primary dark:text-indigo-400" />
            Mentoring Sessions & Availability
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage incoming mentee consultation bookings, log session outcomes, and configure office hours.
          </p>
        </div>

        <button
          onClick={() => setIsHoursModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-role-primary hover:bg-role-primary text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition"
        >
          <Settings className="w-4 h-4" /> Configure Office Hours
        </button>
      </div>

      {/* Office Hours Status Card */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
            Current Weekly Office Hours Availability:
          </span>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {officeHours.length > 0 ? (
              officeHours.map((h, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-white dark:bg-slate-800 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-xs"
                >
                  📅 <strong className="text-role-primary dark:text-indigo-400">{h.dayOfWeek}:</strong> {h.startTime} - {h.endTime}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500 dark:text-slate-400">No office hours scheduled. Click configure to set your slots.</span>
            )}
          </div>
        </div>
      </div>

      {/* Active / Upcoming Sessions List */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-role-primary" /> Active & Upcoming Bookings ({pendingOrScheduled.length})
        </h2>

        {pendingOrScheduled.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingOrScheduled.map((s) => (
              <div
                key={s._id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                        {s.topic}
                      </h3>
                      <p className="text-xs text-role-primary dark:text-indigo-400 font-semibold mt-0.5">
                        Mentee: {s.studentId?.name || 'Student'} ({s.studentId?.usn || 'USN'})
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        s.status === 'in_progress'
                          ? 'bg-role-soft text-role-primary dark:bg-role-soft-dark dark:text-purple-300'
                          : s.status === 'scheduled'
                          ? 'bg-status-success text-status-success dark:bg-status-emerald dark:text-emerald-300'
                          : 'bg-status-warning text-status-warning dark:bg-status-amber dark:text-amber-300'
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <p className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-role-primary" />
                      {new Date(s.date).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })} • {s.startTime} - {s.endTime}
                    </p>
                    <p className="flex items-center gap-2">
                      {s.mode === 'online' ? <Video className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                      Mode: <span className="capitalize font-semibold">{s.mode}</span>
                    </p>
                    {s.notes && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-900/40 p-2 rounded-lg mt-1">
                        Student Note: "{s.notes}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleUpdateStatus(s._id, 'cancelled')}
                    className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Cancel
                  </button>

                  {s.status === 'scheduled' && (
                    <button
                      onClick={() => handleUpdateStatus(s._id, 'in_progress')}
                      className="px-3 py-1.5 bg-role-soft dark:bg-role-soft-dark text-role-primary dark:text-purple-300 hover:bg-role-soft rounded-lg text-xs font-semibold transition flex items-center gap-1"
                    >
                      <PlayCircle className="w-3.5 h-3.5" /> Start
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setSelectedSession(s);
                      setIsCompleteModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 bg-role-primary hover:bg-role-primary text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Complete &amp; Log Notes
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400">
            No upcoming session bookings at this moment.
          </div>
        )}
      </div>

      {/* Complete Session Modal */}
      <Modal
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        title={`Complete Mentoring Session: ${selectedSession?.topic}`}
        size="md"
      >
        <form onSubmit={handleCompleteSession} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Discussion Summary & Advice Provided *
            </label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Reviewed CIE-2 marks, advised on remedial assignments, discussed career roadmap..."
              value={completeForm.notes}
              onChange={(e) => setCompleteForm({ ...completeForm, notes: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Action Items for Mentee
              </label>
              <button
                type="button"
                onClick={() =>
                  setCompleteForm({ ...completeForm, actionItems: [...completeForm.actionItems, ''] })
                }
                className="text-role-primary dark:text-indigo-400 font-bold hover:underline"
              >
                + Add Item
              </button>
            </div>
            <div className="space-y-2">
              {completeForm.actionItems.map((item, idx) => (
                <input
                  key={idx}
                  type="text"
                  placeholder={`Action Item #${idx + 1}`}
                  value={item}
                  onChange={(e) => {
                    const copy = [...completeForm.actionItems];
                    copy[idx] = e.target.value;
                    setCompleteForm({ ...completeForm, actionItems: copy });
                  }}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsCompleteModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-role-primary hover:bg-role-primary text-white font-semibold shadow-sm transition disabled:opacity-50"
            >
              {submitting ? <LoadingSpinner size="sm" color="text-white" /> : 'Finish & Save'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Office Hours Config Modal */}
      <Modal
        isOpen={isHoursModalOpen}
        onClose={() => setIsHoursModalOpen(false)}
        title="Configure Weekly Office Hours"
        size="lg"
      >
        <form onSubmit={handleSaveOfficeHours} className="space-y-4 text-xs">
          <p className="text-slate-500">
            Specify the days and time slots when your mentees can reserve one-on-one consultation sessions.
          </p>

          <div className="space-y-3 max-h-80 overflow-y-auto">
            {hoursForm.map((slot, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center"
              >
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-0.5">Day</label>
                  <select
                    value={slot.dayOfWeek}
                    onChange={(e) => {
                      const copy = [...hoursForm];
                      copy[idx].dayOfWeek = e.target.value;
                      setHoursForm(copy);
                    }}
                    className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                  >
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-0.5">Start Time</label>
                  <input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => {
                      const copy = [...hoursForm];
                      copy[idx].startTime = e.target.value;
                      setHoursForm(copy);
                    }}
                    className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-0.5">End Time</label>
                  <input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => {
                      const copy = [...hoursForm];
                      copy[idx].endTime = e.target.value;
                      setHoursForm(copy);
                    }}
                    className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                  />
                </div>

                <div className="flex items-center gap-2 pt-3 sm:pt-0">
                  <div className="flex-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-0.5">Duration</label>
                    <select
                      value={slot.slotDuration || 30}
                      onChange={(e) => {
                        const copy = [...hoursForm];
                        copy[idx].slotDuration = Number(e.target.value);
                        setHoursForm(copy);
                      }}
                      className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value={15}>15 mins</option>
                      <option value={30}>30 mins</option>
                      <option value={45}>45 mins</option>
                      <option value={60}>60 mins</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHoursForm(hoursForm.filter((_, i) => i !== idx))}
                    className="text-slate-500 dark:text-slate-400 hover:text-rose-500 p-1.5 mt-3"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() =>
              setHoursForm([
                ...hoursForm,
                { dayOfWeek: 'Tuesday', startTime: '11:00', endTime: '13:00', slotDuration: 30, maxBookings: 4 },
              ])
            }
            className="w-full py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-xl font-semibold text-slate-700 dark:text-slate-200 transition"
          >
            + Add Another Office Hours Slot
          </button>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsHoursModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-role-primary hover:bg-role-primary text-white font-semibold shadow-sm transition disabled:opacity-50"
            >
              {submitting ? <LoadingSpinner size="sm" color="text-white" /> : 'Save Availability'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
