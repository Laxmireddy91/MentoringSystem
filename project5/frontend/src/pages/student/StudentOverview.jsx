import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import RiskBadge from '../../components/common/RiskBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import {
  GraduationCap,
  Calendar,
  Award,
  AlertTriangle,
  ArrowUpRight,
  UserCheck,
  CheckCircle2,
  Clock,
  BookOpen,
  Phone,
  Shield,
  Plus,
  Trash2,
  ExternalLink,
  Users,
  Edit3,
} from 'lucide-react';

export default function StudentOverview() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [risk, setRisk] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [goals, setGoals] = useState([]);

  // Modals state
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [courseForm, setCourseForm] = useState({
    courseName: '',
    platform: 'NPTEL',
    completionDate: '',
    certificateUrl: '',
    status: 'Completed',
  });
  const [savingCourse, setSavingCourse] = useState(false);

  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [emergencyForm, setEmergencyForm] = useState({
    fatherName: '',
    motherName: '',
    guardianRelationship: '',
    guardianPhone: '',
    guardianEmail: '',
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
      email: '',
    },
  });
  const [savingEmergency, setSavingEmergency] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [profRes, riskRes, sessRes, goalsRes] = await Promise.allSettled([
        axiosClient.get('/students/profile'),
        axiosClient.get('/risk/my-analysis'),
        axiosClient.get('/sessions/my-sessions'),
        axiosClient.get('/goals'),
      ]);

      if (profRes.status === 'fulfilled') {
        const studentData = profRes.value.data?.data || profRes.value.data;
        setProfile(studentData);
        if (studentData?.student?.parentDetails) {
          const pd = studentData.student.parentDetails;
          setEmergencyForm({
            fatherName: pd.fatherName || '',
            motherName: pd.motherName || '',
            guardianRelationship: pd.guardianRelationship || '',
            guardianPhone: pd.guardianPhone || '',
            guardianEmail: pd.guardianEmail || '',
            emergencyContact: {
              name: pd.emergencyContact?.name || '',
              relationship: pd.emergencyContact?.relationship || '',
              phone: pd.emergencyContact?.phone || '',
              email: pd.emergencyContact?.email || '',
            },
          });
        }
      }
      if (riskRes.status === 'fulfilled') setRisk(riskRes.value.data?.data || riskRes.value.data);
      if (sessRes.status === 'fulfilled') setSessions(sessRes.value.data?.data || sessRes.value.data || []);
      if (goalsRes.status === 'fulfilled') setGoals(goalsRes.value.data?.data || goalsRes.value.data || []);
    } catch (err) {
      console.error('Error fetching student overview:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourse = async (e) => {
    e.preventDefault();
    if (!courseForm.courseName.trim()) return;
    setSavingCourse(true);
    try {
      await axiosClient.post('/students/me/online-courses', courseForm);
      setIsCourseModalOpen(false);
      setCourseForm({
        courseName: '',
        platform: 'NPTEL',
        completionDate: '',
        certificateUrl: '',
        status: 'Completed',
      });
      await fetchDashboardData();
    } catch (err) {
      console.error('Error adding course:', err);
      alert(err.message || 'Failed to add online course');
    } finally {
      setSavingCourse(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Remove this course record?')) return;
    try {
      await axiosClient.delete(`/students/me/online-courses/${courseId}`);
      await fetchDashboardData();
    } catch (err) {
      console.error('Error removing course:', err);
      alert(err.message || 'Failed to remove online course');
    }
  };

  const handleUpdateEmergency = async (e) => {
    e.preventDefault();
    setSavingEmergency(true);
    try {
      await axiosClient.put('/students/me/emergency-contact', emergencyForm);
      setIsEmergencyModalOpen(false);
      await fetchDashboardData();
    } catch (err) {
      console.error('Error updating emergency contact:', err);
      alert(err.message || 'Failed to update emergency contact');
    } finally {
      setSavingEmergency(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen={false} message="Loading your academic dashboard..." />;

  const student = profile?.student || {};
  const mentor = student.mentorId?.userId || profile?.mentor || {};
  const mentorshipRecords = student.mentorshipRecords || [];
  const backlogRecords = student.backlogRecords || [];
  const onlineCourses = student.onlineCoursesAttended || [];
  const parentDetails = student.parentDetails || {};
  const emergencyContact = parentDetails.emergencyContact || {};
  const upcomingSessions = sessions.filter((s) => s.status === 'scheduled' || s.status === 'pending');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-1 bg-white/20 rounded-full text-xs font-semibold uppercase tracking-wider">
              {student.department} • Semester {student.semester || 1} • Sec {student.section || 'A'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">
              Welcome back, {student.userId?.name || 'Student'}! 👋
            </h1>
            <p className="text-indigo-100 text-sm mt-1">
              USN: <span className="font-mono font-bold text-white">{student.usn}</span> | Batch: {student.batch || '2022-2026'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/student/academics"
              className="px-4 py-2.5 bg-white text-role-primary hover:bg-role-soft font-semibold rounded-xl text-sm shadow-md transition flex items-center gap-1.5"
            >
              <BookOpen className="w-4 h-4" /> View Marks
            </Link>
            <Link
              to="/student/sessions"
              className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl text-sm backdrop-blur-sm transition flex items-center gap-1.5 border border-white/20"
            >
              <Calendar className="w-4 h-4" /> Book Session
            </Link>
          </div>
        </div>
      </div>

      {/* Risk Alert Banner if High or Critical */}
      {risk && (risk.riskCategory === 'High' || risk.riskCategory === 'Critical' || risk.riskLevel === 'High' || risk.riskLevel === 'Critical') && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-status-error/40 border border-rose-200 dark:border-rose-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <h4 className="font-bold text-rose-800 dark:text-status-error">
              Academic Intervention Needed ({risk.riskCategory || risk.riskLevel} Risk Score: {risk.riskScore}/100)
            </h4>
            <p className="text-status-error dark:text-rose-400 text-xs mt-0.5">
              {risk.reasons?.[0] || 'Your current academic metrics indicate a need for mentoring support.'}
            </p>
          </div>
          <Link
            to="/student/risk"
            className="px-3 py-1.5 text-xs font-semibold text-status-error dark:text-status-error bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-800 rounded-lg hover:bg-status-error dark:hover:bg-slate-700 transition shrink-0"
          >
            Details
          </Link>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Cumulative CGPA</span>
            <div className="p-2 rounded-xl bg-role-soft dark:bg-role-soft-dark text-role-primary dark:text-indigo-400">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
              {profile?.summary?.cgpa?.toFixed(2) || '0.00'}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">/ 10.0</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Total Semesters: {student.academics?.length || 0}</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Earned Credits</span>
            <div className="p-2 rounded-xl bg-status-success dark:bg-status-emerald text-status-success dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
              {profile?.summary?.totalEarnedCredits || 0}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Credits</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Degree Requirement Track</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Active Backlogs</span>
            <div className="p-2 rounded-xl bg-status-warning dark:bg-status-amber text-status-warning dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
              {profile?.summary?.totalActiveBacklogs || 0}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Subjects</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Clearance Records: {backlogRecords.length}</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Risk Level</span>
            <RiskBadge category={risk?.riskCategory || risk?.riskLevel || 'Low'} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
              {risk?.riskScore || 0}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">/ 100</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Evaluated: Real-time</p>
        </div>
      </div>

      {/* Two Column Section: Assigned Mentor & Upcoming Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mentor Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-role-primary dark:text-indigo-400" />
                Assigned Mentor
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-role-soft text-role-primary dark:bg-role-primary/40 dark:text-indigo-300">
                Faculty
              </span>
            </div>

            {mentor && mentor.name ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    {mentor.name[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100">{mentor.name}</h4>
                    <p className="text-xs text-slate-500">{mentor.department || 'Faculty Mentor'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{mentor.email}</p>
                  </div>
                </div>

                <div className="pt-2 text-xs space-y-1.5 text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-700/60">
                  <p>📞 Phone: <span className="text-slate-500 dark:text-slate-400">{mentor.phone || 'Available via portal'}</span></p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-4">No mentor assigned yet.</p>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex gap-2">
            <Link
              to="/student/messages"
              className="flex-1 py-2 text-center text-xs font-semibold bg-role-soft hover:bg-role-soft dark:bg-role-soft-dark dark:hover:bg-role-primary/60 text-role-primary dark:text-indigo-300 rounded-xl transition"
            >
              Direct Message
            </Link>
            <Link
              to="/student/sessions"
              className="flex-1 py-2 text-center text-xs font-semibold bg-role-primary hover:bg-role-primary text-white rounded-xl shadow-sm transition"
            >
              Book Slot
            </Link>
          </div>
        </div>

        {/* Upcoming Sessions & Badges */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Sessions */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-role-primary dark:text-indigo-400" />
                Upcoming Mentoring Sessions
              </h3>
              <Link to="/student/sessions" className="text-xs text-role-primary dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold">
                View All <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {upcomingSessions.length > 0 ? (
              <div className="space-y-2.5">
                {upcomingSessions.slice(0, 3).map((sess) => (
                  <div
                    key={sess._id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-role-soft dark:bg-role-primary/50 text-role-primary dark:text-indigo-300">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-100">{sess.title || sess.topic || 'Mentoring Session'}</p>
                        <p className="text-slate-500 dark:text-slate-400">
                          {new Date(sess.startTime || sess.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-status-warning text-status-warning dark:bg-status-warning/40 dark:text-amber-300">
                      {sess.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-xs">
                No upcoming sessions scheduled.{' '}
                <Link to="/student/sessions" className="text-role-primary dark:text-indigo-400 underline font-semibold">
                  Book one now
                </Link>
              </div>
            )}
          </div>

          {/* Badges & Goals */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                Earned Badges & Goals
              </h3>
              <Link to="/student/goals" className="text-xs text-role-primary dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold">
                All Goals ({goals.length}) <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {student.badges && student.badges.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {student.badges.map((b, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-xl bg-status-warning dark:bg-status-amber border border-status-warning dark:border-amber-800 text-status-warning dark:text-amber-300 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                  >
                    🏅 {b}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">Keep completing goals and maintaining grades to earn badges!</p>
            )}
          </div>
        </div>
      </div>

      {/* Mentorship Interaction History */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-role-primary dark:text-indigo-400" />
            Mentorship Meeting & Interaction Log
          </h3>
          <span className="text-xs font-semibold px-2.5 py-1 bg-role-soft dark:bg-role-primary/40 text-role-primary dark:text-indigo-300 rounded-lg">
            {mentorshipRecords.length} Recorded Interaction{mentorshipRecords.length === 1 ? '' : 's'}
          </span>
        </div>

        {mentorshipRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 px-3 font-semibold">Date</th>
                  <th className="py-2.5 px-3 font-semibold">Mentor</th>
                  <th className="py-2.5 px-3 font-semibold">Interaction Type</th>
                  <th className="py-2.5 px-3 font-semibold">Notes & Discussion</th>
                  <th className="py-2.5 px-3 font-semibold">Action / Outcome</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {mentorshipRecords.map((rec, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                    <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-700 dark:text-slate-200">
                      {rec.date ? new Date(rec.date).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{rec.mentorName || 'Mentor'}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-role-soft text-role-primary dark:bg-role-soft-dark dark:text-indigo-300">
                        {rec.type || rec.agenda || 'General'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">{rec.notes || rec.discussionPoints || '—'}</td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">{rec.outcome || rec.actionTaken || rec.actionItems || '—'}</td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {rec.mentorSigned || rec.status === 'Verified' ? (
                        <span className="text-status-success dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                        </span>
                      ) : (
                        <span className="text-slate-500 dark:text-slate-400">Logged</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">No 1-on-1 mentorship interactions logged yet.</p>
        )}
      </div>

      {/* Grid of Backlog History & Online Courses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Backlog Clearance History */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Backlog Clearance History
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 bg-status-warning dark:bg-status-warning/40 text-status-warning dark:text-amber-300 rounded-lg">
              {backlogRecords.length} Record{backlogRecords.length === 1 ? '' : 's'}
            </span>
          </div>

          {backlogRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                    <th className="py-2 px-2.5 font-semibold">Sem</th>
                    <th className="py-2 px-2.5 font-semibold">Course</th>
                    <th className="py-2 px-2.5 font-semibold">Code</th>
                    <th className="py-2 px-2.5 font-semibold">Status</th>
                    <th className="py-2 px-2.5 font-semibold">Attempts</th>
                    <th className="py-2 px-2.5 font-semibold">Cleared Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {backlogRecords.map((b, i) => {
                    const isCleared = b.isCleared ?? (b.status === 'Cleared');
                    return (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                        <td className="py-2 px-2.5 text-slate-600 dark:text-slate-300 font-bold">Sem {b.semester || b.semesterFailed || '—'}</td>
                        <td className="py-2 px-2.5 text-slate-700 dark:text-slate-200">{b.subject || b.subjectName || '—'}</td>
                        <td className="py-2 px-2.5 font-mono text-slate-500">{b.subjectCode || '—'}</td>
                        <td className="py-2 px-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              isCleared
                                ? 'bg-status-success text-status-success dark:bg-status-emerald dark:text-emerald-300'
                                : 'bg-status-error text-status-error dark:bg-status-error dark:text-status-error'
                            }`}
                          >
                            {b.status || (isCleared ? 'Cleared' : 'Active')}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 text-slate-600 dark:text-slate-300 text-center">{b.attempts || 1}</td>
                        <td className="py-2 px-2.5 text-slate-500 whitespace-nowrap">
                          {b.clearedDate ? new Date(b.clearedDate).toLocaleDateString([], { year: 'numeric', month: 'short' }) : (b.clearedSemester ? `Sem ${b.clearedSemester}` : '—')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-xs flex flex-col items-center justify-center gap-1">
              <CheckCircle2 className="w-6 h-6 text-status-success mb-1" />
              <p className="font-semibold text-slate-700 dark:text-slate-200">No Historical Backlogs</p>
              <p className="text-[11px]">All previous courses cleared on first attempt.</p>
            </div>
          )}
        </div>

        {/* Online Courses & MOOCs */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Award className="w-5 h-5 text-role-primary dark:text-indigo-400" />
              Online Certifications & MOOCs
            </h3>
            <button
              onClick={() => setIsCourseModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-role-primary hover:bg-role-primary text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add Course
            </button>
          </div>

          {onlineCourses.length > 0 ? (
            <div className="space-y-2.5">
              {onlineCourses.map((course) => (
                <div
                  key={course._id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-800 dark:text-slate-100">{course.courseName}</h4>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-role-soft text-role-primary dark:bg-role-primary/60 dark:text-indigo-300">
                        {course.platform}
                      </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                      Status: <span className="font-medium text-slate-700 dark:text-slate-200">{course.status}</span>
                      {course.completionDate && ` • Completed: ${new Date(course.completionDate).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {course.certificateUrl && (
                      <a
                        href={course.certificateUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-role-primary hover:bg-role-soft dark:hover:bg-slate-700 transition"
                        title="View Certificate"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => handleDeleteCourse(course._id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-700 transition"
                      title="Delete Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">No online certifications logged yet. Click "Add Course" above.</p>
          )}
        </div>
      </div>

      {/* Guardian & Emergency Contact Section */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Shield className="w-5 h-5 text-status-success dark:text-emerald-400" />
              Guardian & Emergency Contact Information
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Securely stored for institutional mentoring communication and campus emergency protocols.
            </p>
          </div>
          <button
            onClick={() => setIsEmergencyModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit Details
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200/60 dark:border-slate-700">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Father / Primary Guardian</span>
            <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{parentDetails.fatherName || '—'}</p>
            <p className="text-slate-500 mt-1">📞 {parentDetails.guardianPhone || 'Not set'}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200/60 dark:border-slate-700">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Mother Name</span>
            <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{parentDetails.motherName || '—'}</p>
            <p className="text-slate-500 mt-1">Relationship: {parentDetails.guardianRelationship || 'Parent'}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200/60 dark:border-slate-700">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Guardian Email</span>
            <p className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{parentDetails.guardianEmail || '—'}</p>
            <p className="text-slate-500 mt-1">Official Notifications</p>
          </div>

          <div className="p-3.5 rounded-xl bg-status-success/50 dark:bg-status-emerald border border-status-success dark:border-emerald-800">
            <span className="text-[11px] font-semibold text-status-success dark:text-emerald-300 block mb-1">Emergency Contact</span>
            <p className="font-bold text-status-success dark:text-emerald-200 text-sm">
              {emergencyContact.name ? `${emergencyContact.name} (${emergencyContact.relationship || 'Contact'})` : '—'}
            </p>
            <p className="text-status-success dark:text-emerald-400 mt-1 flex items-center gap-1 font-mono">
              <Phone className="w-3 h-3" /> {emergencyContact.phone || 'Not configured'}
            </p>
          </div>
        </div>
      </div>

      {/* Modal: Add Online Course */}
      <Modal isOpen={isCourseModalOpen} onClose={() => setIsCourseModalOpen(false)} title="Add Online Course / Certification">
        <form onSubmit={handleAddCourse} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Course Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Full Stack Web Development"
              value={courseForm.courseName}
              onChange={(e) => setCourseForm({ ...courseForm, courseName: e.target.value })}
              className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 focus:outline-none focus:ring-2 focus-role"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Platform</label>
              <select
                value={courseForm.platform}
                onChange={(e) => setCourseForm({ ...courseForm, platform: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 focus:outline-none focus:ring-2 focus-role"
              >
                <option value="NPTEL">NPTEL</option>
                <option value="Coursera">Coursera</option>
                <option value="edX">edX</option>
                <option value="Udemy">Udemy</option>
                <option value="Infosys Springboard">Infosys Springboard</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Status</label>
              <select
                value={courseForm.status}
                onChange={(e) => setCourseForm({ ...courseForm, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 focus:outline-none focus:ring-2 focus-role"
              >
                <option value="Completed">Completed</option>
                <option value="In Progress">In Progress</option>
                <option value="Enrolled">Enrolled</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Completion Date</label>
              <input
                type="date"
                value={courseForm.completionDate}
                onChange={(e) => setCourseForm({ ...courseForm, completionDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 focus:outline-none focus:ring-2 focus-role"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Certificate URL (Optional)</label>
              <input
                type="url"
                placeholder="https://..."
                value={courseForm.certificateUrl}
                onChange={(e) => setCourseForm({ ...courseForm, certificateUrl: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 focus:outline-none focus:ring-2 focus-role"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t dark:border-slate-700">
            <button
              type="button"
              onClick={() => setIsCourseModalOpen(false)}
              className="px-4 py-2 border rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingCourse}
              className="px-4 py-2 bg-role-primary hover:bg-role-primary text-white font-semibold rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {savingCourse ? 'Saving...' : 'Save Course'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Emergency Details */}
      <Modal isOpen={isEmergencyModalOpen} onClose={() => setIsEmergencyModalOpen(false)} title="Update Guardian & Emergency Contact">
        <form onSubmit={handleUpdateEmergency} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Father Name</label>
              <input
                type="text"
                value={emergencyForm.fatherName}
                onChange={(e) => setEmergencyForm({ ...emergencyForm, fatherName: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 focus:outline-none focus:ring-2 focus-role"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Mother Name</label>
              <input
                type="text"
                value={emergencyForm.motherName}
                onChange={(e) => setEmergencyForm({ ...emergencyForm, motherName: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 focus:outline-none focus:ring-2 focus-role"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Guardian Relation</label>
              <input
                type="text"
                placeholder="Father / Mother / Guardian"
                value={emergencyForm.guardianRelationship}
                onChange={(e) => setEmergencyForm({ ...emergencyForm, guardianRelationship: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 focus:outline-none focus:ring-2 focus-role"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Guardian Phone</label>
              <input
                type="text"
                value={emergencyForm.guardianPhone}
                onChange={(e) => setEmergencyForm({ ...emergencyForm, guardianPhone: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 focus:outline-none focus:ring-2 focus-role"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Guardian Email</label>
              <input
                type="email"
                value={emergencyForm.guardianEmail}
                onChange={(e) => setEmergencyForm({ ...emergencyForm, guardianEmail: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 focus:outline-none focus:ring-2 focus-role"
              />
            </div>
          </div>

          <div className="pt-2 border-t dark:border-slate-700">
            <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-2">Emergency Contact Person</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Contact Name</label>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={emergencyForm.emergencyContact.name}
                  onChange={(e) =>
                    setEmergencyForm({
                      ...emergencyForm,
                      emergencyContact: { ...emergencyForm.emergencyContact, name: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 focus:outline-none focus:ring-2 focus-role"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Relationship</label>
                <input
                  type="text"
                  placeholder="e.g. Uncle / Sibling"
                  value={emergencyForm.emergencyContact.relationship}
                  onChange={(e) =>
                    setEmergencyForm({
                      ...emergencyForm,
                      emergencyContact: { ...emergencyForm.emergencyContact, relationship: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 focus:outline-none focus:ring-2 focus-role"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Emergency Phone</label>
                <input
                  type="text"
                  placeholder="Phone number"
                  value={emergencyForm.emergencyContact.phone}
                  onChange={(e) =>
                    setEmergencyForm({
                      ...emergencyForm,
                      emergencyContact: { ...emergencyForm.emergencyContact, phone: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 focus:outline-none focus:ring-2 focus-role"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Emergency Email</label>
                <input
                  type="email"
                  placeholder="Email address"
                  value={emergencyForm.emergencyContact.email}
                  onChange={(e) =>
                    setEmergencyForm({
                      ...emergencyForm,
                      emergencyContact: { ...emergencyForm.emergencyContact, email: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 focus:outline-none focus:ring-2 focus-role"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t dark:border-slate-700">
            <button
              type="button"
              onClick={() => setIsEmergencyModalOpen(false)}
              className="px-4 py-2 border rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingEmergency}
              className="px-4 py-2 bg-status-success hover:bg-status-success text-white font-semibold rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {savingEmergency ? 'Saving...' : 'Update Details'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
