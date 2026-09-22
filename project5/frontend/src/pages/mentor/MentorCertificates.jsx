import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import {
  Award,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Search,
  FileCheck,
  Sparkles,
  Info,
  Calendar,
} from 'lucide-react';

export default function MentorCertificates() {
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [reviewAction, setReviewAction] = useState('approved'); // 'approved' | 'rejected' | 'correction_required'
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      setError('');
      // Fetch achievements for mentor's mentees
      const res = await axiosClient.get('/achievements/pending-review');
      setAchievements(res.data || res || []);
    } catch (err) {
      setError(err.message || 'Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  const handleOpenReview = (item, action = 'approved') => {
    setSelectedAchievement(item);
    setReviewAction(action);
    setReviewRemarks('');
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedAchievement) return;

    try {
      setSubmitting(true);
      await axiosClient.patch(`/achievements/${selectedAchievement._id}/review`, {
        status: reviewAction,
        remarks: reviewRemarks,
      });
      setReviewModalOpen(false);
      await fetchAchievements();
    } catch (err) {
      alert(err.message || 'Failed to record review');
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

  const filteredList = achievements.filter((a) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      a.title?.toLowerCase().includes(q) ||
      a.organization?.toLowerCase().includes(q) ||
      a.studentId?.usn?.toLowerCase().includes(q) ||
      a.studentId?.userId?.name?.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (filterStatus === 'PENDING') return a.status === 'pending';
    if (filterStatus === 'APPROVED') return a.status === 'approved';
    if (filterStatus === 'REJECTED') return a.status === 'rejected';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-5 dark:border-gray-800">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <Award className="h-6 w-6 text-role-primary dark:text-indigo-400" />
            <span>Certificate Verification & Achievement Review</span>
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Review student certifications and extracurricular credentials with AI-assisted consistency analysis.
          </p>
        </div>
      </div>

      {/* Mandatory Assistant Disclaimer Banner */}
      <div className="rounded-xl border border-status-info bg-status-info/70 p-4 text-xs text-status-info dark:border-blue-900/50 dark:bg-status-blue dark:text-blue-200 flex items-start gap-3 shadow-sm">
        <Info className="h-5 w-5 text-status-info dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-status-info dark:text-blue-200 mb-0.5">
            Practical Consistency Analysis Assistant
          </h4>
          <p className="leading-relaxed">
            The verification indicator evaluates student name consistency, organization records, certificate ID format, and duplicate presence. 
            It is an assistance indicator and <strong>never claims 100% authenticity</strong>. Final institutional verification rests exclusively with you as the authorized faculty mentor.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-status-error text-status-error rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student, USN, certificate title, or organization..."
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-role-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div className="flex gap-2">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'PENDING', label: 'Pending Review' },
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

      {/* Cards List */}
      <div className="space-y-4">
        {filteredList.length ? (
          filteredList.map((item) => {
            const analysis = item.verificationAnalysis;
            return (
              <div
                key={item._id}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b border-gray-100 pb-4 dark:border-gray-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-role-soft text-role-primary dark:bg-role-primary/40 dark:text-indigo-300">
                        {item.category || 'Certification'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Submitted: {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">
                      Issued by: <strong>{item.organization || 'Educational Institute'}</strong>
                    </p>

                    <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 mt-2">
                      <span>
                        Student: <strong className="text-gray-900 dark:text-white">{item.studentId?.userId?.name || 'Student'}</strong> ({item.studentId?.usn})
                      </span>
                      <span>•</span>
                      <span>Sem: {item.studentId?.semester || '—'}</span>
                      {item.certificateId && (
                        <>
                          <span>•</span>
                          <span>Certificate ID: <strong className="font-mono">{item.certificateId}</strong></span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                        item.status === 'approved'
                          ? 'bg-status-success text-status-success dark:bg-status-success/40 dark:text-emerald-300'
                          : item.status === 'rejected'
                          ? 'bg-status-error text-status-error dark:bg-status-error/40 dark:text-red-300'
                          : 'bg-status-warning text-status-warning dark:bg-status-warning/40 dark:text-amber-300'
                      }`}
                    >
                      {item.status}
                    </span>

                    {item.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenReview(item, 'approved')}
                          className="rounded-lg bg-status-success px-3 py-1.5 text-xs font-semibold text-white hover:bg-status-success transition"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleOpenReview(item, 'rejected')}
                          className="rounded-lg bg-status-error px-3 py-1.5 text-xs font-semibold text-white hover:bg-status-error transition"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Verification Assistant Analysis Box */}
                {analysis && (
                  <div className="my-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3.5 border border-slate-200 dark:border-slate-700 text-xs">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                        <Sparkles className="h-4 w-4 text-role-primary" />
                        <span>Consistency Analysis Checklist</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-semibold">
                        Consistency Score: {analysis.confidenceScore || 85}%
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      <div className="flex items-center gap-1.5">
                        {analysis.nameMatches ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-status-success" />
                        ) : (
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                        )}
                        <span>Student Name Matches Record</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {analysis.dateConsistent ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-status-success" />
                        ) : (
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                        )}
                        <span>Completion Date Consistent</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {!analysis.duplicateDetected ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-status-success" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-red-500" />
                        )}
                        <span>No Duplicate Certificate ID</span>
                      </div>
                    </div>

                    {item.verificationUrl && (
                      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2">
                        <span className="text-slate-500">Issuer Verification URL:</span>
                        <a
                          href={item.verificationUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-role-primary dark:text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          <span>{item.verificationUrl}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {item.reviewRemarks && (
                  <div className="text-xs text-gray-500 italic mt-2">
                    Review Remarks: &quot;{item.reviewRemarks}&quot;
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-gray-500 dark:border-gray-800 dark:bg-gray-900">
            <FileCheck className="h-10 w-10 text-gray-500 dark:text-gray-400 mx-auto mb-3" />
            <p className="font-medium">No certificates pending review.</p>
          </div>
        )}
      </div>

      {/* Review Action Modal */}
      {reviewModalOpen && selectedAchievement && (
        <Modal
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          title={`${reviewAction === 'approved' ? 'Approve' : 'Reject'} Certificate: ${selectedAchievement.title}`}
        >
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Decision Action
              </label>
              <select
                value={reviewAction}
                onChange={(e) => setReviewAction(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium focus:border-role-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="approved">Approve & Credit to Profile</option>
                <option value="rejected">Reject (Invalid / Inconsistent)</option>
                <option value="correction_required">Correction Required</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Mentor Review Remarks
              </label>
              <textarea
                rows={3}
                value={reviewRemarks}
                onChange={(e) => setReviewRemarks(e.target.value)}
                placeholder="e.g. Verified against course completion portal. Excellent effort in cloud fundamentals."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-role-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 hover:text-gray-900 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`rounded-lg px-4 py-2 text-xs font-semibold text-white transition ${
                  reviewAction === 'approved'
                    ? 'bg-status-success hover:bg-status-success'
                    : 'bg-status-error hover:bg-status-error'
                }`}
              >
                {submitting ? 'Recording...' : `Confirm ${reviewAction}`}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
