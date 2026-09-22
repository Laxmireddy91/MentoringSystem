import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  UserCheck,
  UserPlus,
  ShieldCheck,
  Edit2,
  Info,
  Search,
} from 'lucide-react';

export default function CoordinatorAllocation() {
  const [loading, setLoading] = useState(true);
  const [capacity, setCapacity] = useState(null);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Mode: 'incremental' (allocate unassigned/late only) vs 'full' (allocate all)
  const [allocationMode, setAllocationMode] = useState('incremental');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [batchNotes, setBatchNotes] = useState('');

  // Search in preview
  const [searchFilter, setSearchFilter] = useState('');

  // Manual Adjustment Modal State
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [selectedStudentForReassign, setSelectedStudentForReassign] = useState(null);
  const [newMentorId, setNewMentorId] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [reassignSubmitting, setReassignSubmitting] = useState(false);

  const fetchCapacity = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/allocation/capacity');
      setCapacity(res.data || res);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load mentor capacities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCapacity();
  }, []);

  const handleGeneratePreview = async () => {
    try {
      setPreviewLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      const payload = {
        mode: allocationMode,
        academicYear,
        semester: semesterFilter ? parseInt(semesterFilter) : undefined,
      };

      const res = await axiosClient.post('/allocation/preview', payload);
      setPreview(res.data || res);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to generate allocation preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleConfirmAllocation = async () => {
    if (!preview || !preview.assignments || preview.assignments.length === 0) {
      setErrorMessage('No generated assignments to confirm.');
      return;
    }

    try {
      setConfirming(true);
      setErrorMessage('');
      setSuccessMessage('');

      const payload = {
        mode: preview.mode,
        academicYear: preview.academicYear || academicYear,
        notes: batchNotes || `Automated ${preview.mode} allocation for ${preview.assignments.length} students`,
        assignments: preview.assignments.map((a) => ({
          studentId: a.studentId,
          mentorId: a.assignedMentorId,
          mentorName: a.assignedMentorName,
        })),
      };

      const res = await axiosClient.post('/allocation/confirm', payload);
      const confirmedCount =
        res.data?.summary?.studentsAllocated ??
        res.data?.totalStudentsAllocated ??
        preview.assignments.length;
      setSuccessMessage(
        `Successfully confirmed allocation! ${confirmedCount} student assignments persisted.`
      );
      setPreview(null);
      await fetchCapacity();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to confirm allocation');
    } finally {
      setConfirming(false);
    }
  };

  const handleOpenReassign = (assignment) => {
    setSelectedStudentForReassign(assignment);
    setNewMentorId(assignment.assignedMentorId);
    setReassignReason('');
    setManualModalOpen(true);
  };

  const handleApplyManualAdjustment = () => {
    if (!newMentorId) {
      alert('Please select a replacement mentor.');
      return;
    }
    if (!reassignReason.trim()) {
      alert('A mandatory reason is required for manual assignment adjustment.');
      return;
    }

    const mentorObj = capacity?.mentors?.find((m) => m._id === newMentorId);
    const updatedAssignments = preview.assignments.map((a) => {
      if (a.studentId === selectedStudentForReassign.studentId) {
        return {
          ...a,
          assignedMentorId: newMentorId,
          assignedMentorName: mentorObj ? mentorObj.name : a.assignedMentorName,
          manualOverride: true,
          overrideReason: reassignReason,
        };
      }
      return a;
    });

    setPreview({
      ...preview,
      assignments: updatedAssignments,
    });
    setManualModalOpen(false);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const filteredPreview = (preview?.assignments || []).filter((a) => {
    const q = searchFilter.toLowerCase();
    return (
      a.usn?.toLowerCase().includes(q) ||
      a.studentName?.toLowerCase().includes(q) ||
      a.assignedMentorName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-5 dark:border-gray-800">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Automated Mentor-Mentee Allocation Engine
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Preview, balance, and safely confirm mentor allocations with support for late admissions and manual adjustments.
          </p>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="rounded-xl border border-status-success bg-status-success p-4 text-status-success dark:border-emerald-800 dark:bg-status-emerald dark:text-emerald-300 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-status-success dark:text-emerald-400 flex-shrink-0" />
          <span className="text-sm font-medium">{successMessage}</span>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="rounded-xl border border-status-error bg-status-error p-4 text-status-error dark:border-red-800 dark:bg-status-red dark:text-red-300 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-status-error dark:text-red-400 flex-shrink-0" />
          <span className="text-sm font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Capacity Shortage Alert */}
      {capacity?.shortage?.isShortage && (
        <div className="rounded-xl border border-status-error bg-status-error p-5 text-status-error dark:border-red-800 dark:bg-status-red dark:text-red-300">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-status-error dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-status-error dark:text-red-300">
                Department Capacity Deficit: {capacity.shortage.shortageAmount} Slots Short
              </h4>
              <p className="mt-1 text-xs text-status-error dark:text-red-400">
                Total active capacity ({capacity.capacity.totalCapacity}) is insufficient for all students needing allocation ({capacity.capacity.totalStudents}).
                Please adjust mentor maximum limits or add mentors before final confirmation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Allocation Control Panel */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Play className="h-4 w-4 text-role-primary" />
          <span>Allocation Parameters & Engine Configuration</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Mode Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
              Allocation Mode
            </label>
            <div className="space-y-2">
              <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                <input
                  type="radio"
                  name="allocMode"
                  value="incremental"
                  checked={allocationMode === 'incremental'}
                  onChange={() => setAllocationMode('incremental')}
                  className="mt-0.5 text-role-primary"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Incremental / Supplementary Only
                  </span>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Allocates unassigned and late-admission students without disturbing existing mentor assignments.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                <input
                  type="radio"
                  name="allocMode"
                  value="full"
                  checked={allocationMode === 'full'}
                  onChange={() => setAllocationMode('full')}
                  className="mt-0.5 text-role-primary"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Full Batch Balanced Reallocation
                  </span>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Distributes all department students evenly across available mentors.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Academic Term & Semester */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                Academic Year
              </label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="2025-2026"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-role-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                Filter by Semester (Optional)
              </label>
              <select
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-role-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="flex flex-col justify-between">
            <div className="rounded-lg bg-role-soft dark:bg-role-soft-dark p-4 border border-indigo-100 dark:border-role-primary/50">
              <div className="flex items-center gap-2 text-role-primary dark:text-indigo-300 font-semibold text-xs mb-1">
                <Info className="h-4 w-4" />
                <span>Simulation Safety</span>
              </div>
              <p className="text-xs text-role-primary dark:text-indigo-400">
                Clicking Generate Preview computes balanced assignments in memory without modifying the database.
              </p>
            </div>

            <button
              onClick={handleGeneratePreview}
              disabled={previewLoading}
              className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-role-primary px-5 py-3 text-sm font-semibold text-white shadow hover:bg-role-primary transition disabled:opacity-50"
            >
              {previewLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Computing Distribution...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>Generate Allocation Preview</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Generated Allocation Preview Section */}
      {preview && (
        <div className="rounded-xl border border-role-primary bg-white shadow-md dark:border-role-primary/50 dark:bg-gray-900 overflow-hidden">
          <div className="bg-role-soft/70 border-b border-indigo-100 px-6 py-4 dark:bg-role-soft-dark dark:border-role-primary/40 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-role-primary text-white">
                <span>Mode: {preview.mode?.toUpperCase()}</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                Allocation Preview: {preview.assignments?.length || 0} Students Assigned
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                Review the proposed distribution below. You may adjust individual assignments with a recorded reason before confirming.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setPreview(null)}
                className="px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                Discard
              </button>
              <button
                onClick={handleConfirmAllocation}
                disabled={confirming || preview.assignments?.length === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-status-success px-4 py-2 text-sm font-semibold text-white shadow hover:bg-status-success transition disabled:opacity-50"
              >
                {confirming ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Persisting Assignments...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Confirm & Persist Allocation</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preview Search & Table */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search preview by USN, Student, or Mentor..."
                className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-1.5 text-xs focus:border-role-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 sticky top-0 dark:bg-gray-800 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-3">USN</th>
                  <th className="px-6 py-3">Student Name</th>
                  <th className="px-6 py-3">Semester</th>
                  <th className="px-6 py-3">Allocated Mentor</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3 text-right">Manual Adjustment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredPreview.length ? (
                  filteredPreview.map((a, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-3 font-mono font-semibold text-gray-900 dark:text-white">
                        {a.usn}
                      </td>
                      <td className="px-6 py-3">{a.studentName || 'Student'}</td>
                      <td className="px-6 py-3">Sem {a.semester || '—'}</td>
                      <td className="px-6 py-3 font-medium text-role-primary dark:text-indigo-400">
                        {a.assignedMentorName}
                      </td>
                      <td className="px-6 py-3">
                        {a.manualOverride ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-status-warning text-status-warning dark:bg-status-warning/40 dark:text-amber-300">
                            Manual Override
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            Auto Balanced
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => handleOpenReassign(a)}
                          className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-role-soft hover:text-role-primary dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                          <Edit2 className="h-3 w-3" />
                          <span>Change</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      No matching records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Reassign Modal */}
      {manualModalOpen && selectedStudentForReassign && (
        <Modal
          isOpen={manualModalOpen}
          onClose={() => setManualModalOpen(false)}
          title={`Manual Assignment Override: ${selectedStudentForReassign.studentName} (${selectedStudentForReassign.usn})`}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Select Mentor
              </label>
              <select
                value={newMentorId}
                onChange={(e) => setNewMentorId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-role-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                {capacity?.mentors?.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({m.department}) - Available Slots: {m.availableSlots}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Mandatory Override Reason
              </label>
              <textarea
                value={reassignReason}
                onChange={(e) => setReassignReason(e.target.value)}
                rows={3}
                placeholder="Specify administrative justification (e.g., student requested female mentor, domain expertise alignment, late admission adjustment)..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-role-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setManualModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 hover:text-gray-900 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyManualAdjustment}
                className="rounded-lg bg-role-primary px-4 py-2 text-xs font-semibold text-white hover:bg-role-primary transition"
              >
                Apply to Preview
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
