import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import {
  FileCheck2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Calendar,
  MessageSquare,
  ShieldCheck,
  Search,
} from 'lucide-react';

export default function ExamRequests() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  // Decision Modal State
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [decisionAction, setDecisionAction] = useState('approve'); // 'approve' | 'reject'
  const [decisionRemarks, setDecisionRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/exam-requests/coordinator');
      setRequests(res.data || res || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch exam requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleOpenDecision = (req, action) => {
    setSelectedRequest(req);
    setDecisionAction(action);
    setDecisionRemarks('');
    setDecisionModalOpen(true);
  };

  const handleSubmitDecision = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;
    if (!decisionRemarks.trim()) {
      alert('Official remarks/scheduling details are required.');
      return;
    }

    try {
      setSubmitting(true);
      await axiosClient.patch(`/exam-requests/${selectedRequest._id}/decision`, {
        action: decisionAction,
        remarks: decisionRemarks,
      });
      setDecisionModalOpen(false);
      await fetchRequests();
    } catch (err) {
      alert(err.message || 'Failed to submit decision');
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

  const filteredRequests = requests.filter((r) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      r.studentId?.usn?.toLowerCase().includes(q) ||
      r.studentId?.userId?.name?.toLowerCase().includes(q) ||
      r.subjectCode?.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (filterStatus === 'PENDING') return r.status === 'coordinator_review';
    if (filterStatus === 'APPROVED') return r.status === 'approved';
    if (filterStatus === 'REJECTED') return r.status === 'rejected';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-5 dark:border-gray-800">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Digital CIE & Exam Permission Requests
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Multi-stage institutional approval workflow for makeup tests, attendance condonation, and examination clearances.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-status-error text-status-error rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by USN, Student name, or Subject Code..."
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-role-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div className="flex gap-2">
          {[
            { id: 'ALL', label: 'All Requests' },
            { id: 'PENDING', label: 'Pending Approval' },
            { id: 'APPROVED', label: 'Approved' },
            { id: 'REJECTED', label: 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterStatus === tab.id
                  ? 'bg-role-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Cards List */}
      <div className="space-y-4">
        {filteredRequests.length ? (
          filteredRequests.map((req) => (
            <div
              key={req._id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b border-gray-100 pb-4 dark:border-gray-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-role-soft text-role-primary dark:bg-role-primary/40 dark:text-indigo-300">
                      {req.requestType?.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Submitted: {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                    {req.subjectCode} - {req.subjectName || 'Course'}
                  </h3>

                  <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 mt-1">
                    <span>
                      Student: <strong className="text-gray-900 dark:text-white">{req.studentId?.userId?.name || 'Student'}</strong> ({req.studentId?.usn})
                    </span>
                    <span>•</span>
                    <span>Department: {req.studentId?.department}</span>
                    <span>•</span>
                    <span>Sem: {req.semester || req.studentId?.semester}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                      req.status === 'approved'
                        ? 'bg-status-success text-status-success dark:bg-status-success/40 dark:text-emerald-300'
                        : req.status === 'rejected'
                        ? 'bg-status-error text-status-error dark:bg-status-error/40 dark:text-red-300'
                        : 'bg-status-warning text-status-warning dark:bg-status-warning/40 dark:text-amber-300'
                    }`}
                  >
                    {req.status === 'coordinator_review' ? 'Pending Exam Coordinator Approval' : req.status}
                  </span>

                  {req.status === 'coordinator_review' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenDecision(req, 'approve')}
                        className="rounded-lg bg-status-success px-3 py-1.5 text-xs font-semibold text-white hover:bg-status-success transition"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleOpenDecision(req, 'reject')}
                        className="rounded-lg bg-status-error px-3 py-1.5 text-xs font-semibold text-white hover:bg-status-error transition"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Justification & Mentor Recommendation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3 text-xs border-b border-gray-100 dark:border-gray-800">
                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                  <span className="font-semibold text-gray-500 block mb-1">Student Reason & Justification</span>
                  <p className="text-gray-800 dark:text-gray-200">
                    {req.reason || req.description || 'No reason specified.'}
                  </p>
                </div>

                <div className="rounded-lg bg-status-info/70 p-3 dark:bg-status-blue">
                  <span className="font-semibold text-status-info dark:text-blue-300 block mb-1">
                    Mentor Recommendation & Remarks
                  </span>
                  <p className="text-status-info dark:text-blue-200">
                    {req.mentorDecision?.remarks || 'Mentor reviewed and recommended for makeup test.'}
                  </p>
                </div>
              </div>

              {/* Visual Multi-Stage Timeline */}
              <div className="pt-3">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-2">
                  Workflow Progression Timeline
                </span>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {req.timeline?.map((step, idx) => (
                    <React.Fragment key={idx}>
                      <div className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        <CheckCircle2 className="h-3.5 w-3.5 text-status-success" />
                        <span>{step.action}</span>
                        <span className="text-gray-500 dark:text-gray-400">({new Date(step.timestamp).toLocaleDateString()})</span>
                      </div>
                      {idx < req.timeline.length - 1 && (
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
            <FileCheck2 className="h-10 w-10 text-gray-500 dark:text-gray-400 mx-auto mb-3" />
            <p className="font-medium">No permission requests found matching filter.</p>
          </div>
        )}
      </div>

      {/* Decision Modal */}
      {decisionModalOpen && selectedRequest && (
        <Modal
          isOpen={decisionModalOpen}
          onClose={() => setDecisionModalOpen(false)}
          title={`${decisionAction === 'approve' ? 'Approve' : 'Reject'} Exam Request: ${selectedRequest.studentId?.usn} (${selectedRequest.subjectCode})`}
        >
          <form onSubmit={handleSubmitDecision} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Official Action
              </label>
              <div className="text-sm font-bold uppercase text-role-primary">
                {decisionAction}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Official Remarks / Makeup Test Schedule *
              </label>
              <textarea
                required
                rows={3}
                value={decisionRemarks}
                onChange={(e) => setDecisionRemarks(e.target.value)}
                placeholder={
                  decisionAction === 'approve'
                    ? 'e.g. Makeup CIE test approved for 21CS51 on Monday 10:00 AM, Room 302.'
                    : 'e.g. Insufficient documented medical evidence provided.'
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-role-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setDecisionModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 hover:text-gray-900 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`rounded-lg px-4 py-2 text-xs font-semibold text-white transition ${
                  decisionAction === 'approve'
                    ? 'bg-status-success hover:bg-status-success'
                    : 'bg-status-error hover:bg-status-error'
                }`}
              >
                {submitting ? 'Recording Decision...' : `Confirm ${decisionAction === 'approve' ? 'Approval' : 'Rejection'}`}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
