import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import {
  FileCheck2,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Layers,
  FileText,
} from 'lucide-react';

export default function StudentExamRequests() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [vaultDocs, setVaultDocs] = useState([]);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    requestType: 'cie_retest',
    subjectCode: '',
    subjectName: '',
    semester: 5,
    reason: '',
    description: '',
  });

  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const [reqRes, docRes] = await Promise.all([
        axiosClient.get('/exam-requests/me'),
        axiosClient.get('/documents').catch(() => ({ data: [] })),
      ]);
      setRequests(reqRes.data || reqRes || []);
      setVaultDocs(docRes.data || docRes || []);
    } catch (err) {
      setError(err.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subjectCode.trim()) {
      alert('Subject Code is required.');
      return;
    }
    if (!form.reason.trim()) {
      alert('A valid reason is required.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');
      await axiosClient.post('/exam-requests', form);
      setSuccess('Permission request submitted successfully! Your mentor has been notified.');
      setIsSubmitModalOpen(false);
      setForm({
        requestType: 'cie_retest',
        subjectCode: '',
        subjectName: '',
        semester: 5,
        reason: '',
        description: '',
      });
      await fetchMyRequests();
    } catch (err) {
      setError(err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5 dark:border-gray-800">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <FileCheck2 className="h-6 w-6 text-role-primary dark:text-indigo-400" />
            <span>Digital Exam & CIE Retest Permission Requests</span>
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Submit formal requests for CIE makeup tests, attendance condonation, and examination permissions with live tracking.
          </p>
        </div>

        <button
          onClick={() => setIsSubmitModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-role-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-role-primary transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Permission Request</span>
        </button>
      </div>

      {success && (
        <div className="p-4 bg-status-success text-status-success rounded-lg text-sm flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-status-success flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-status-error text-status-error rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Requests List */}
      <div className="space-y-4">
        {requests.length ? (
          requests.map((r) => (
            <div
              key={r._id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 border-b border-gray-100 pb-4 dark:border-gray-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-role-soft text-role-primary dark:bg-role-primary/40 dark:text-indigo-300">
                      {r.requestType?.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Submitted: {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                    {r.subjectCode} - {r.subjectName || 'Course'}
                  </h3>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Semester {r.semester} • Reason: <strong>{r.reason}</strong>
                  </div>
                </div>

                <div>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                      r.status === 'approved'
                        ? 'bg-status-success text-status-success dark:bg-status-success/40 dark:text-emerald-300'
                        : r.status === 'rejected'
                        ? 'bg-status-error text-status-error dark:bg-status-error/40 dark:text-red-300'
                        : r.status === 'coordinator_review'
                        ? 'bg-status-info text-status-info dark:bg-status-info/40 dark:text-blue-300'
                        : 'bg-status-warning text-status-warning dark:bg-status-warning/40 dark:text-amber-300'
                    }`}
                  >
                    {r.status === 'coordinator_review'
                      ? 'Under Exam Coordinator Review'
                      : r.status === 'submitted'
                      ? 'Pending Mentor Review'
                      : r.status}
                  </span>
                </div>
              </div>

              {/* Remarks Box if Decided */}
              {r.coordinatorDecision?.remarks && (
                <div className="my-3 rounded-lg bg-status-success/60 p-3 text-xs text-status-success dark:bg-status-emerald dark:text-emerald-200 border border-status-success dark:border-emerald-800">
                  <span className="font-bold block mb-0.5">Official Exam Coordinator Order:</span>
                  <p>{r.coordinatorDecision.remarks}</p>
                </div>
              )}

              {r.mentorDecision?.remarks && !r.coordinatorDecision?.remarks && (
                <div className="my-3 rounded-lg bg-status-info/60 p-3 text-xs text-status-info dark:bg-status-blue dark:text-blue-200 border border-status-info dark:border-blue-800">
                  <span className="font-bold block mb-0.5">Mentor Note:</span>
                  <p>{r.mentorDecision.remarks}</p>
                </div>
              )}

              {/* Visual Multi-Stage Timeline */}
              <div className="pt-3">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-2">
                  Request Progression Timeline
                </span>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {r.timeline?.map((step, idx) => (
                    <React.Fragment key={idx}>
                      <div className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        <CheckCircle2 className="h-3.5 w-3.5 text-status-success" />
                        <span>{step.action}</span>
                        <span className="text-gray-500 dark:text-gray-400">({new Date(step.timestamp).toLocaleDateString()})</span>
                      </div>
                      {idx < r.timeline.length - 1 && (
                        <span className="text-gray-300 dark:text-gray-600">&rarr;</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-gray-500 dark:border-gray-800 dark:bg-gray-900">
            <FileText className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <p className="font-medium">No permission requests submitted yet.</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Click &quot;New Permission Request&quot; if you missed a CIE test or need formal examination permissions.
            </p>
          </div>
        )}
      </div>

      {/* New Request Modal */}
      {isSubmitModalOpen && (
        <Modal
          isOpen={isSubmitModalOpen}
          onClose={() => setIsSubmitModalOpen(false)}
          title="Submit CIE / Exam Permission Request"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Request Category *
              </label>
              <select
                value={form.requestType}
                onChange={(e) => setForm({ ...form, requestType: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-role-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="cie_retest">CIE Makeup / Retest Permission</option>
                <option value="attendance_condonation">Attendance Condonation (Medical / Sports)</option>
                <option value="exam_permission">Hall Ticket / Exam Permission</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Subject Code *
                </label>
                <input
                  type="text"
                  required
                  value={form.subjectCode}
                  onChange={(e) => setForm({ ...form, subjectCode: e.target.value.toUpperCase() })}
                  placeholder="e.g. 21CS51"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-role-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  value={form.subjectName}
                  onChange={(e) => setForm({ ...form, subjectName: e.target.value })}
                  placeholder="e.g. Software Engineering"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-role-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Semester
              </label>
              <select
                value={form.semester}
                onChange={(e) => setForm({ ...form, semester: parseInt(e.target.value) })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-role-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Reason / Justification *
              </label>
              <input
                type="text"
                required
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="e.g. Severe illness during CIE 2 test window"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-role-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Detailed Explanation
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Provide medical or personal context for your mentor and exam coordinator..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-role-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 hover:text-gray-900 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-role-primary px-4 py-2 text-xs font-semibold text-white hover:bg-role-primary transition disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
