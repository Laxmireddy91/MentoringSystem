import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileText,
  Calendar,
  History,
  Users,
  Eye,
  Check,
  X,
  RefreshCw,
  Clock,
  Filter,
} from 'lucide-react';

export default function HodImports() {
  const [activeTab, setActiveTab] = useState('mentors'); // 'mentors' | 'cie' | 'attendance' | 'students' | 'history'

  // Mentor Master Ingestion state
  const [mentorFile, setMentorFile] = useState(null);
  const [mentorValidating, setMentorValidating] = useState(false);
  const [mentorConfirming, setMentorConfirming] = useState(false);
  const [mentorPreview, setMentorPreview] = useState(null);
  const [mentorResult, setMentorResult] = useState(null);
  const [mentorFilter, setMentorFilter] = useState('all');

  // CIE Ingestion state
  const [cieFile, setCieFile] = useState(null);
  const [cieValidating, setCieValidating] = useState(false);
  const [cieConfirming, setCieConfirming] = useState(false);
  const [ciePreview, setCiePreview] = useState(null);
  const [cieResult, setCieResult] = useState(null);
  const [cieFilter, setCieFilter] = useState('all');

  // Attendance Ingestion state
  const [attFile, setAttFile] = useState(null);
  const [attValidating, setAttValidating] = useState(false);
  const [attConfirming, setAttConfirming] = useState(false);
  const [attPreview, setAttPreview] = useState(null);
  const [attResult, setAttResult] = useState(null);
  const [attFilter, setAttFilter] = useState('all');

  // Student Directory state
  const [studentFile, setStudentFile] = useState(null);
  const [studentImporting, setStudentImporting] = useState(false);
  const [studentResult, setStudentResult] = useState(null);

  // History state
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await axiosClient.get('/hod/imports/history');
      setHistoryLogs(res.data?.data?.logs || res.data?.logs || []);
    } catch (err) {
      console.error('Failed to fetch import history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Mentor Master Workflow Handlers
  // ─────────────────────────────────────────────────────────────
  const handleMentorPreview = async (e) => {
    e.preventDefault();
    if (!mentorFile) return;

    setMentorValidating(true);
    setMentorPreview(null);
    setMentorResult(null);
    try {
      const formData = new FormData();
      formData.append('file', mentorFile);

      const res = await axiosClient.post('/hod/imports/mentors/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMentorPreview(res.data?.data || res.data);
    } catch (err) {
      setMentorResult({
        success: false,
        message: err.response?.data?.message || err.message || 'Failed to preview Mentor Master file.',
      });
    } finally {
      setMentorValidating(false);
    }
  };

  const handleMentorConfirm = async () => {
    if (!mentorPreview?.preview) return;
    setMentorConfirming(true);
    try {
      const res = await axiosClient.post('/hod/imports/mentors/confirm', {
        previewData: mentorPreview.preview,
      });
      const data = res.data?.data || res.data;
      setMentorResult({
        success: true,
        data,
        message: `Successfully processed ${data?.successCount || 0} mentor record(s). Staff profiles and activation records synchronized.`,
      });
      setMentorPreview(null);
      setMentorFile(null);
    } catch (err) {
      setMentorResult({
        success: false,
        message: err.response?.data?.message || err.message || 'Failed to confirm Mentor Master import.',
      });
    } finally {
      setMentorConfirming(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // CIE Workflow Handlers
  // ─────────────────────────────────────────────────────────────
  const handleCiePreview = async (e) => {
    e.preventDefault();
    if (!cieFile) return;

    setCieValidating(true);
    setCiePreview(null);
    setCieResult(null);
    try {
      const formData = new FormData();
      formData.append('file', cieFile);

      const res = await axiosClient.post('/hod/imports/cie/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCiePreview(res.data?.data);
    } catch (err) {
      setCieResult({
        success: false,
        message: err.response?.data?.message || 'Failed to preview CIE file.',
      });
    } finally {
      setCieValidating(false);
    }
  };

  const handleCieConfirm = async () => {
    if (!ciePreview?.preview) return;
    setCieConfirming(true);
    try {
      const res = await axiosClient.post('/hod/imports/cie/confirm', {
        previewData: ciePreview.preview,
      });
      setCieResult({
        success: true,
        data: res.data?.data,
        message: `Successfully imported ${res.data?.data?.successCount || 0} academic record(s).`,
      });
      setCiePreview(null);
      setCieFile(null);
    } catch (err) {
      setCieResult({
        success: false,
        message: err.response?.data?.message || 'Failed to confirm CIE import.',
      });
    } finally {
      setCieConfirming(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Attendance Workflow Handlers
  // ─────────────────────────────────────────────────────────────
  const handleAttPreview = async (e) => {
    e.preventDefault();
    if (!attFile) return;

    setAttValidating(true);
    setAttPreview(null);
    setAttResult(null);
    try {
      const formData = new FormData();
      formData.append('file', attFile);

      const res = await axiosClient.post('/hod/imports/attendance/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAttPreview(res.data?.data);
    } catch (err) {
      setAttResult({
        success: false,
        message: err.response?.data?.message || 'Failed to preview attendance file.',
      });
    } finally {
      setAttValidating(false);
    }
  };

  const handleAttConfirm = async () => {
    if (!attPreview?.preview) return;
    setAttConfirming(true);
    try {
      const res = await axiosClient.post('/hod/imports/attendance/confirm', {
        previewData: attPreview.preview,
      });
      setAttResult({
        success: true,
        data: res.data?.data,
        message: `Successfully imported ${res.data?.data?.successCount || 0} attendance record(s).`,
      });
      setAttPreview(null);
      setAttFile(null);
    } catch (err) {
      setAttResult({
        success: false,
        message: err.response?.data?.message || 'Failed to confirm attendance import.',
      });
    } finally {
      setAttConfirming(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Student Directory Import Handler
  // ─────────────────────────────────────────────────────────────
  const handleImportStudents = async (e) => {
    e.preventDefault();
    if (!studentFile) return;

    setStudentImporting(true);
    setStudentResult(null);
    try {
      const formData = new FormData();
      formData.append('file', studentFile);

      const res = await axiosClient.post('/imports/students', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setStudentResult({ success: true, data: res.data?.data });
      setStudentFile(null);
    } catch (err) {
      setStudentResult({
        success: false,
        message: err.response?.data?.message || 'Failed to import student roster.',
      });
    } finally {
      setStudentImporting(false);
    }
  };

  const getFilteredMentorRows = () => {
    if (!mentorPreview?.preview) return [];
    if (mentorFilter === 'all') return mentorPreview.preview;
    return mentorPreview.preview.filter((r) => r.status === mentorFilter);
  };

  const getFilteredCieRows = () => {
    if (!ciePreview?.preview) return [];
    if (cieFilter === 'all') return ciePreview.preview;
    return ciePreview.preview.filter((r) => r.status === cieFilter);
  };

  const getFilteredAttRows = () => {
    if (!attPreview?.preview) return [];
    if (attFilter === 'all') return attPreview.preview;
    return attPreview.preview.filter((r) => r.status === attFilter);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
            <Upload className="w-6 h-6 text-role-primary dark:text-indigo-400" />
            Institutional Ingestion Console
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Official department ingestion for Mentor Master, CIE Marks, Attendance records, and Student directory rosters.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('mentors')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'mentors'
              ? 'bg-role-primary text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" /> Mentor Master
        </button>
        <button
          onClick={() => setActiveTab('cie')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'cie'
              ? 'bg-role-primary text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" /> CIE Marks Ingestion
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'attendance'
              ? 'bg-role-primary text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <Calendar className="w-4 h-4" /> Attendance Ingestion
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'students'
              ? 'bg-role-primary text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <Users className="w-4 h-4" /> Student Roster
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'history'
              ? 'bg-role-primary text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <History className="w-4 h-4" /> Import History
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 0: MENTOR MASTER INGESTION */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'mentors' && (
        <div className="space-y-6">
          {/* Result Banner */}
          {mentorResult && (
            <div
              className={`p-4 rounded-xl text-xs border flex items-center justify-between gap-3 ${
                mentorResult.success
                  ? 'bg-status-success dark:bg-status-emerald text-status-success dark:text-emerald-200 border-status-success dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-status-error/40 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
              }`}
            >
              <div className="flex items-center gap-2 font-medium">
                {mentorResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-status-success shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <span>{mentorResult.message}</span>
              </div>
              <button
                onClick={() => setMentorResult(null)}
                className="text-xs font-bold hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Upload & Preview Step */}
          {!mentorPreview && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-role-soft dark:bg-role-soft-dark text-role-primary dark:text-indigo-400">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                    Upload Mentor Master Roster (Excel or CSV)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Step 1: Upload and preview row validation before confirming to database
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Expected columns:{' '}
                <span className="font-mono text-role-primary dark:text-indigo-400 font-semibold">
                  Mentor ID (Employee ID), Mentor Name, Official Email, Department, Designation, Phone, Max Mentees, Status
                </span>
                . Ingestion generates institutional StaffRecords, links Mentor profiles, and prepares accounts for faculty activation.
              </p>

              <form onSubmit={handleMentorPreview} className="space-y-4 text-xs">
                <div className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-center hover:border-indigo-400 transition">
                  <input
                    type="file"
                    accept=".csv, .xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    onChange={(e) => setMentorFile(e.target.files[0])}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-role-soft file:text-role-primary hover:file:bg-role-soft cursor-pointer"
                  />
                  {mentorFile && (
                    <p className="mt-2 text-role-primary font-bold truncate">Selected: {mentorFile.name}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={mentorValidating || !mentorFile}
                  className="w-full sm:w-auto py-2.5 px-6 bg-role-primary hover:bg-role-primary text-white font-semibold rounded-xl shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {mentorValidating ? (
                    <LoadingSpinner size="sm" color="text-white" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                  Validate &amp; Preview File
                </button>
              </form>
            </div>
          )}

          {/* Preview Console */}
          {mentorPreview && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px]">Total Rows</span>
                  <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
                    {mentorPreview.totalRows || 0}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-status-success dark:bg-status-emerald border border-status-success dark:border-emerald-800/40">
                  <span className="text-status-success dark:text-emerald-400 font-semibold uppercase text-[10px]">Valid</span>
                  <p className="text-2xl font-black text-status-success dark:text-emerald-300 mt-1">
                    {mentorPreview.validRows || 0}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-status-warning dark:bg-status-amber border border-status-warning dark:border-amber-800/40">
                  <span className="text-status-warning dark:text-amber-400 font-semibold uppercase text-[10px]">Warnings</span>
                  <p className="text-2xl font-black text-status-warning dark:text-amber-300 mt-1">
                    {mentorPreview.warningRows || 0}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-status-error/30 border border-rose-200 dark:border-rose-800/40">
                  <span className="text-rose-600 dark:text-rose-400 font-semibold uppercase text-[10px]">Errors</span>
                  <p className="text-2xl font-black text-status-error dark:text-status-error mt-1">
                    {mentorPreview.errorRows || 0}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-role-soft dark:bg-role-soft-dark border border-role-primary dark:border-role-primary/40">
                  <span className="text-role-primary dark:text-purple-400 font-semibold uppercase text-[10px]">Duplicates</span>
                  <p className="text-2xl font-black text-role-primary dark:text-purple-300 mt-1">
                    {mentorPreview.duplicateRows || 0}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-role-soft dark:bg-role-soft-dark border border-role-primary dark:border-role-primary/40">
                  <span className="text-role-primary dark:text-indigo-400 font-semibold uppercase text-[10px]">Ready to Ingest</span>
                  <p className="text-2xl font-black text-role-primary dark:text-indigo-300 mt-1">
                    {mentorPreview.readyToImport || 0}
                  </p>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-500">Filter View:</span>
                  <select
                    value={mentorFilter}
                    onChange={(e) => setMentorFilter(e.target.value)}
                    className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 py-1 px-2.5 font-semibold text-slate-700 dark:text-slate-200"
                  >
                    <option value="all">All Rows ({mentorPreview.totalRows})</option>
                    <option value="valid">Valid Only ({mentorPreview.validRows})</option>
                    <option value="warning">Warnings ({mentorPreview.warningRows})</option>
                    <option value="error">Errors Only ({mentorPreview.errorRows})</option>
                    <option value="duplicate">Duplicates ({mentorPreview.duplicateRows})</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setMentorPreview(null);
                      setMentorFile(null);
                    }}
                    className="py-2 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
                  >
                    Discard &amp; Upload Again
                  </button>
                  <button
                    onClick={handleMentorConfirm}
                    disabled={mentorConfirming || mentorPreview.readyToImport === 0}
                    className="py-2 px-5 text-xs font-bold bg-role-primary hover:bg-role-primary text-white rounded-xl shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {mentorConfirming ? (
                      <LoadingSpinner size="sm" color="text-white" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Confirm &amp; Ingest ({mentorPreview.readyToImport} Eligible Records)
                  </button>
                </div>
              </div>

              {/* Preview Table */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-100/70 dark:bg-slate-900/80 font-bold uppercase text-[11px] text-slate-500 dark:text-slate-400 sticky top-0 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-3 py-2.5">Row</th>
                        <th className="px-3 py-2.5">Status</th>
                        <th className="px-3 py-2.5">Mentor ID</th>
                        <th className="px-3 py-2.5">Full Name</th>
                        <th className="px-3 py-2.5">Official Email</th>
                        <th className="px-3 py-2.5">Department</th>
                        <th className="px-3 py-2.5">Designation</th>
                        <th className="px-3 py-2.5">Max Mentees</th>
                        <th className="px-3 py-2.5">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-mono">
                      {getFilteredMentorRows().map((row) => (
                        <tr
                          key={row.row}
                          className={`hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition ${
                            row.status === 'error'
                              ? 'bg-rose-50/30 dark:bg-rose-950/20'
                              : row.status === 'warning'
                              ? 'bg-amber-50/30 dark:bg-amber-950/20'
                              : row.status === 'duplicate'
                              ? 'bg-purple-50/30 dark:bg-purple-950/20'
                              : ''
                          }`}
                        >
                          <td className="px-3 py-2 text-slate-400 font-sans font-medium">{row.row}</td>
                          <td className="px-3 py-2 font-sans font-semibold">
                            {row.status === 'valid' && (
                              <span className="inline-flex items-center gap-1 text-status-success dark:text-emerald-400 bg-status-success dark:bg-status-emerald px-2 py-0.5 rounded-full text-[10px]">
                                <CheckCircle2 className="w-3 h-3" /> Valid
                              </span>
                            )}
                            {row.status === 'warning' && (
                              <span className="inline-flex items-center gap-1 text-status-warning dark:text-amber-400 bg-status-warning dark:bg-status-amber px-2 py-0.5 rounded-full text-[10px]">
                                <AlertTriangle className="w-3 h-3" /> Warning
                              </span>
                            )}
                            {row.status === 'error' && (
                              <span className="inline-flex items-center gap-1 text-status-error dark:text-rose-400 bg-rose-50 dark:bg-rose-900/40 px-2 py-0.5 rounded-full text-[10px]">
                                <AlertCircle className="w-3 h-3" /> Error
                              </span>
                            )}
                            {row.status === 'duplicate' && (
                              <span className="inline-flex items-center gap-1 text-role-primary dark:text-purple-400 bg-role-soft dark:bg-role-soft-dark px-2 py-0.5 rounded-full text-[10px]">
                                <AlertTriangle className="w-3 h-3" /> Duplicate
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 font-bold text-slate-800 dark:text-slate-100">{row.employeeId}</td>
                          <td className="px-3 py-2 font-sans text-slate-700 dark:text-slate-200">{row.name}</td>
                          <td className="px-3 py-2 font-sans text-slate-500">{row.email}</td>
                          <td className="px-3 py-2 font-sans">{row.department}</td>
                          <td className="px-3 py-2 font-sans">{row.designation}</td>
                          <td className="px-3 py-2 text-center">{row.maxMentees}</td>
                          <td className="px-3 py-2 font-sans text-[11px] text-slate-500 max-w-xs truncate" title={row.reason}>
                            {row.reason || 'Ready for activation'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 1: CIE MARKS INGESTION */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'cie' && (
        <div className="space-y-6">
          {/* Result Banner */}
          {cieResult && (
            <div
              className={`p-4 rounded-xl text-xs border flex items-center justify-between gap-3 ${
                cieResult.success
                  ? 'bg-status-success dark:bg-status-emerald text-status-success dark:text-emerald-200 border-status-success dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-status-error/40 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
              }`}
            >
              <div className="flex items-center gap-2 font-medium">
                {cieResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-status-success shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <span>{cieResult.message}</span>
              </div>
              <button
                onClick={() => setCieResult(null)}
                className="text-xs font-bold hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Upload & Preview Step */}
          {!ciePreview && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-role-soft dark:bg-role-soft-dark text-role-primary dark:text-indigo-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                    Upload CIE Marks (Excel or CSV)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Step 1: Upload and preview row validation before confirming to database
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Expected columns:{' '}
                <span className="font-mono text-role-primary dark:text-indigo-400 font-semibold">
                  USN, Subject Code, Subject Name, Semester, CIE 1, CIE 2, CIE 3, Credits
                </span>
                . Partial CIE entries (e.g. only CIE 1 conducted) are accepted and flagged as warnings.
              </p>

              <form onSubmit={handleCiePreview} className="space-y-4 text-xs">
                <div className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-center hover:border-indigo-400 transition">
                  <input
                    type="file"
                    accept=".csv, .xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    onChange={(e) => setCieFile(e.target.files[0])}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-role-soft file:text-role-primary hover:file:bg-role-soft cursor-pointer"
                  />
                  {cieFile && (
                    <p className="mt-2 text-role-primary font-bold truncate">Selected: {cieFile.name}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={cieValidating || !cieFile}
                  className="w-full sm:w-auto py-2.5 px-6 bg-role-primary hover:bg-role-primary text-white font-semibold rounded-xl shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {cieValidating ? (
                    <LoadingSpinner size="sm" color="text-white" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                  Validate &amp; Preview File
                </button>
              </form>
            </div>
          )}

          {/* Preview Console */}
          {ciePreview && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px]">Total Rows</span>
                  <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
                    {ciePreview.totalRows || 0}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-status-success dark:bg-status-emerald border border-status-success dark:border-emerald-800/40">
                  <span className="text-status-success dark:text-emerald-400 font-semibold uppercase text-[10px]">Valid</span>
                  <p className="text-2xl font-black text-status-success dark:text-emerald-300 mt-1">
                    {ciePreview.validRows || 0}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-status-warning dark:bg-status-amber border border-status-warning dark:border-amber-800/40">
                  <span className="text-status-warning dark:text-amber-400 font-semibold uppercase text-[10px]">Warnings</span>
                  <p className="text-2xl font-black text-status-warning dark:text-amber-300 mt-1">
                    {ciePreview.warningRows || 0}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-status-error/30 border border-rose-200 dark:border-rose-800/40">
                  <span className="text-rose-600 dark:text-rose-400 font-semibold uppercase text-[10px]">Errors</span>
                  <p className="text-2xl font-black text-status-error dark:text-status-error mt-1">
                    {ciePreview.errorRows || 0}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-role-soft dark:bg-role-soft-dark border border-role-primary dark:border-role-primary/40">
                  <span className="text-role-primary dark:text-purple-400 font-semibold uppercase text-[10px]">Duplicates</span>
                  <p className="text-2xl font-black text-role-primary dark:text-purple-300 mt-1">
                    {ciePreview.duplicateRows || 0}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-role-soft dark:bg-role-soft-dark border border-role-primary dark:border-role-primary/40">
                  <span className="text-role-primary dark:text-indigo-400 font-semibold uppercase text-[10px]">Ready to Ingest</span>
                  <p className="text-2xl font-black text-role-primary dark:text-indigo-300 mt-1">
                    {ciePreview.readyToImport || 0}
                  </p>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-500">Filter View:</span>
                  <select
                    value={cieFilter}
                    onChange={(e) => setCieFilter(e.target.value)}
                    className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 py-1 px-2.5 font-semibold text-slate-700 dark:text-slate-200"
                  >
                    <option value="all">All Rows ({ciePreview.totalRows})</option>
                    <option value="valid">Valid Only ({ciePreview.validRows})</option>
                    <option value="warning">Warnings ({ciePreview.warningRows})</option>
                    <option value="error">Errors Only ({ciePreview.errorRows})</option>
                    <option value="duplicate">Duplicates ({ciePreview.duplicateRows})</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setCiePreview(null);
                      setCieFile(null);
                    }}
                    className="py-2 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
                  >
                    Discard &amp; Upload Again
                  </button>
                  <button
                    onClick={handleCieConfirm}
                    disabled={cieConfirming || ciePreview.readyToImport === 0}
                    className="py-2 px-5 text-xs font-bold bg-role-primary hover:bg-role-primary text-white rounded-xl shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {cieConfirming ? (
                      <LoadingSpinner size="sm" color="text-white" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Confirm &amp; Ingest ({ciePreview.readyToImport} Eligible Records)
                  </button>
                </div>
              </div>

              {/* Preview Table */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-100/70 dark:bg-slate-900/80 font-bold uppercase text-[11px] text-slate-500 dark:text-slate-400 sticky top-0 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-3 py-2.5">Row</th>
                        <th className="px-3 py-2.5">USN</th>
                        <th className="px-3 py-2.5">Student</th>
                        <th className="px-3 py-2.5">Subject</th>
                        <th className="px-2 py-2.5 text-center">Sem</th>
                        <th className="px-2 py-2.5 text-center">CIE 1</th>
                        <th className="px-2 py-2.5 text-center">CIE 2</th>
                        <th className="px-2 py-2.5 text-center">CIE 3</th>
                        <th className="px-3 py-2.5">Status</th>
                        <th className="px-3 py-2.5">Remarks / Reasons</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {getFilteredCieRows().map((r, idx) => (
                        <tr
                          key={idx}
                          className={`hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition ${
                            r.status === 'error'
                              ? 'bg-rose-50/30 dark:bg-status-error/10'
                              : r.status === 'warning'
                              ? 'bg-status-warning/30 dark:bg-status-amber'
                              : r.status === 'duplicate'
                              ? 'bg-role-soft/30 dark:bg-role-soft-dark'
                              : ''
                          }`}
                        >
                          <td className="px-3 py-2 font-mono text-slate-500 dark:text-slate-400 text-[11px]">{r.row}</td>
                          <td className="px-3 py-2 font-bold font-mono text-slate-800 dark:text-slate-100">{r.usn}</td>
                          <td className="px-3 py-2">{r.studentName || '—'}</td>
                          <td className="px-3 py-2">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{r.subjectCode}</span>
                            {r.subjectName && r.subjectName !== r.subjectCode && (
                              <span className="text-slate-500 dark:text-slate-400 block text-[10px] truncate max-w-xs">{r.subjectName}</span>
                            )}
                          </td>
                          <td className="px-2 py-2 text-center font-semibold">{r.semester}</td>
                          <td className="px-2 py-2 text-center">{r.cie1}</td>
                          <td className="px-2 py-2 text-center">{r.cie2}</td>
                          <td className="px-2 py-2 text-center">{r.cie3}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                r.status === 'valid'
                                  ? 'bg-status-success text-status-success dark:bg-status-emerald dark:text-emerald-300'
                                  : r.status === 'warning'
                                  ? 'bg-status-warning text-status-warning dark:bg-status-amber dark:text-amber-300'
                                  : r.status === 'duplicate'
                                  ? 'bg-role-soft text-role-primary dark:bg-role-soft-dark dark:text-purple-300'
                                  : 'bg-status-error text-rose-800 dark:bg-status-error dark:text-status-error'
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-[11px] text-slate-500 dark:text-slate-400">
                            {r.reason || 'Ready for ingestion'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 2: ATTENDANCE INGESTION */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {attResult && (
            <div
              className={`p-4 rounded-xl text-xs border flex items-center justify-between gap-3 ${
                attResult.success
                  ? 'bg-status-success dark:bg-status-emerald text-status-success dark:text-emerald-200 border-status-success dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-status-error/40 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
              }`}
            >
              <div className="flex items-center gap-2 font-medium">
                {attResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-status-success shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <span>{attResult.message}</span>
              </div>
              <button
                onClick={() => setAttResult(null)}
                className="text-xs font-bold hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {!attPreview && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-status-info dark:bg-status-blue text-status-info dark:text-blue-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                    Upload Attendance Records (Excel or CSV)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Step 1: Upload and preview row validation before confirming to database
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Expected columns:{' '}
                <span className="font-mono text-status-info dark:text-blue-400 font-semibold">
                  USN, Subject Code, Subject Name, Semester, Total Classes, Classes Attended
                </span>
                . Attendance percentage is computed automatically. Classes attended cannot exceed total classes.
              </p>

              <form onSubmit={handleAttPreview} className="space-y-4 text-xs">
                <div className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-center hover:border-status-info transition">
                  <input
                    type="file"
                    accept=".csv, .xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    onChange={(e) => setAttFile(e.target.files[0])}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-status-info file:text-status-info hover:file:bg-status-info cursor-pointer"
                  />
                  {attFile && (
                    <p className="mt-2 text-status-info font-bold truncate">Selected: {attFile.name}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={attValidating || !attFile}
                  className="w-full sm:w-auto py-2.5 px-6 bg-status-info hover:bg-status-info text-white font-semibold rounded-xl shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {attValidating ? (
                    <LoadingSpinner size="sm" color="text-white" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                  Validate &amp; Preview Attendance File
                </button>
              </form>
            </div>
          )}

          {attPreview && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px]">Total Rows</span>
                  <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
                    {attPreview.totalRows || 0}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-status-success dark:bg-status-emerald border border-status-success dark:border-emerald-800/40">
                  <span className="text-status-success dark:text-emerald-400 font-semibold uppercase text-[10px]">Valid</span>
                  <p className="text-2xl font-black text-status-success dark:text-emerald-300 mt-1">
                    {attPreview.validRows || 0}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-status-warning dark:bg-status-amber border border-status-warning dark:border-amber-800/40">
                  <span className="text-status-warning dark:text-amber-400 font-semibold uppercase text-[10px]">Warnings</span>
                  <p className="text-2xl font-black text-status-warning dark:text-amber-300 mt-1">
                    {attPreview.warningRows || 0}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-status-error/30 border border-rose-200 dark:border-rose-800/40">
                  <span className="text-rose-600 dark:text-rose-400 font-semibold uppercase text-[10px]">Errors</span>
                  <p className="text-2xl font-black text-status-error dark:text-status-error mt-1">
                    {attPreview.errorRows || 0}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-role-soft dark:bg-role-soft-dark border border-role-primary dark:border-role-primary/40">
                  <span className="text-role-primary dark:text-purple-400 font-semibold uppercase text-[10px]">Duplicates</span>
                  <p className="text-2xl font-black text-role-primary dark:text-purple-300 mt-1">
                    {attPreview.duplicateRows || 0}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-status-info dark:bg-status-blue border border-status-info dark:border-blue-800/40">
                  <span className="text-status-info dark:text-blue-400 font-semibold uppercase text-[10px]">Ready to Ingest</span>
                  <p className="text-2xl font-black text-status-info dark:text-blue-300 mt-1">
                    {attPreview.readyToImport || 0}
                  </p>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-500">Filter View:</span>
                  <select
                    value={attFilter}
                    onChange={(e) => setAttFilter(e.target.value)}
                    className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 py-1 px-2.5 font-semibold text-slate-700 dark:text-slate-200"
                  >
                    <option value="all">All Rows ({attPreview.totalRows})</option>
                    <option value="valid">Valid Only ({attPreview.validRows})</option>
                    <option value="warning">Warnings ({attPreview.warningRows})</option>
                    <option value="error">Errors Only ({attPreview.errorRows})</option>
                    <option value="duplicate">Duplicates ({attPreview.duplicateRows})</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setAttPreview(null);
                      setAttFile(null);
                    }}
                    className="py-2 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
                  >
                    Discard &amp; Upload Again
                  </button>
                  <button
                    onClick={handleAttConfirm}
                    disabled={attConfirming || attPreview.readyToImport === 0}
                    className="py-2 px-5 text-xs font-bold bg-status-info hover:bg-status-info text-white rounded-xl shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {attConfirming ? (
                      <LoadingSpinner size="sm" color="text-white" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Confirm &amp; Ingest ({attPreview.readyToImport} Eligible Records)
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-100/70 dark:bg-slate-900/80 font-bold uppercase text-[11px] text-slate-500 dark:text-slate-400 sticky top-0 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-3 py-2.5">Row</th>
                        <th className="px-3 py-2.5">USN</th>
                        <th className="px-3 py-2.5">Student</th>
                        <th className="px-3 py-2.5">Subject</th>
                        <th className="px-2 py-2.5 text-center">Sem</th>
                        <th className="px-2 py-2.5 text-center">Attended</th>
                        <th className="px-2 py-2.5 text-center">Total</th>
                        <th className="px-2 py-2.5 text-center">Att. %</th>
                        <th className="px-3 py-2.5">Status</th>
                        <th className="px-3 py-2.5">Remarks / Reasons</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {getFilteredAttRows().map((r, idx) => (
                        <tr
                          key={idx}
                          className={`hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition ${
                            r.status === 'error'
                              ? 'bg-rose-50/30 dark:bg-status-error/10'
                              : r.status === 'warning'
                              ? 'bg-status-warning/30 dark:bg-status-amber'
                              : r.status === 'duplicate'
                              ? 'bg-role-soft/30 dark:bg-role-soft-dark'
                              : ''
                          }`}
                        >
                          <td className="px-3 py-2 font-mono text-slate-500 dark:text-slate-400 text-[11px]">{r.row}</td>
                          <td className="px-3 py-2 font-bold font-mono text-slate-800 dark:text-slate-100">{r.usn}</td>
                          <td className="px-3 py-2">{r.studentName || '—'}</td>
                          <td className="px-3 py-2">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{r.subjectCode}</span>
                            {r.subjectName && r.subjectName !== r.subjectCode && (
                              <span className="text-slate-500 dark:text-slate-400 block text-[10px] truncate max-w-xs">{r.subjectName}</span>
                            )}
                          </td>
                          <td className="px-2 py-2 text-center font-semibold">{r.semester}</td>
                          <td className="px-2 py-2 text-center font-semibold">{r.classesAttended}</td>
                          <td className="px-2 py-2 text-center">{r.totalClasses}</td>
                          <td className="px-2 py-2 text-center font-bold">
                            <span
                              className={
                                r.attendancePercentage < 75
                                  ? 'text-rose-600 font-extrabold'
                                  : 'text-status-success font-bold'
                              }
                            >
                              {r.attendancePercentage}%
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                r.status === 'valid'
                                  ? 'bg-status-success text-status-success dark:bg-status-emerald dark:text-emerald-300'
                                  : r.status === 'warning'
                                  ? 'bg-status-warning text-status-warning dark:bg-status-amber dark:text-amber-300'
                                  : r.status === 'duplicate'
                                  ? 'bg-role-soft text-role-primary dark:bg-role-soft-dark dark:text-purple-300'
                                  : 'bg-status-error text-rose-800 dark:bg-status-error dark:text-status-error'
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-[11px] text-slate-500 dark:text-slate-400">
                            {r.reason || 'Ready for ingestion'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 3: STUDENT DIRECTORY ROSTER */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'students' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 max-w-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-role-soft dark:bg-role-soft-dark text-role-primary dark:text-indigo-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                Student Directory Ingestion
              </h3>
              <p className="text-xs text-slate-500">CSV or Excel (.xlsx) Format</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Columns required:{' '}
            <span className="font-mono text-role-primary dark:text-indigo-400 font-semibold">
              name, email, usn, semester, section, batch, department
            </span>
            .
          </p>

          <form onSubmit={handleImportStudents} className="space-y-4 text-xs">
            <div className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-center">
              <input
                type="file"
                accept=".csv, .xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={(e) => setStudentFile(e.target.files[0])}
                className="block w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-role-soft file:text-role-primary hover:file:bg-role-soft cursor-pointer"
              />
              {studentFile && (
                <p className="mt-2 text-role-primary font-bold truncate">Selected: {studentFile.name}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={studentImporting || !studentFile}
              className="py-2.5 px-6 bg-role-primary hover:bg-role-primary text-white font-semibold rounded-xl shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {studentImporting ? (
                <LoadingSpinner size="sm" color="text-white" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              Start Student Import
            </button>
          </form>

          {studentResult && (
            <div
              className={`p-4 rounded-xl text-xs border ${
                studentResult.success
                  ? 'bg-status-success dark:bg-status-emerald text-status-success dark:text-emerald-200 border-status-success dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-status-error/40 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
              }`}
            >
              {studentResult.success ? (
                <div>
                  <p className="font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-status-success" /> Import Complete
                  </p>
                  <p className="mt-1">
                    Successfully registered: <strong>{studentResult.data?.successCount || 0}</strong> students.
                    {studentResult.data?.failureCount > 0 && (
                      <span> Failed: {studentResult.data?.failureCount}</span>
                    )}
                  </p>
                </div>
              ) : (
                <p className="flex items-center gap-1 font-semibold">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" /> {studentResult.message}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 4: IMPORT HISTORY & AUDIT LOGS */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
              <History className="w-4 h-4 text-role-primary" />
              Institutional Ingestion Audit History
            </h3>
            <button
              onClick={fetchHistory}
              disabled={loadingHistory}
              className="py-1.5 px-3 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 transition flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          {loadingHistory ? (
            <div className="py-12 text-center">
              <LoadingSpinner size="md" message="Loading import history..." />
            </div>
          ) : historyLogs.length > 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden text-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-100/70 dark:bg-slate-900/80 font-bold uppercase text-[11px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3">Timestamp</th>
                      <th className="px-4 py-3">Import Type</th>
                      <th className="px-4 py-3">Admin Authority</th>
                      <th className="px-4 py-3">Summary Stats</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {historyLogs.map((log) => {
                      const details = log.newValue || {};
                      return (
                        <tr key={log._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition">
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                            {new Date(log.timestamp || log.createdAt).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="px-4 py-3 font-bold">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                log.action === 'CIE_IMPORT'
                                  ? 'bg-role-soft text-role-primary dark:bg-role-soft-dark dark:text-indigo-300'
                                  : log.action === 'ATTENDANCE_IMPORT'
                                  ? 'bg-status-info text-status-info dark:bg-status-blue dark:text-blue-300'
                                  : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                            >
                              {details.importType || log.action?.replace('_IMPORT', '') || log.action}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{log.actorName}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">{log.actorRole}</p>
                          </td>
                          <td className="px-4 py-3">
                            {details.importedRows !== undefined ? (
                              <span>
                                Ingested: <strong className="text-status-success">{details.importedRows}</strong> / Total: {details.totalRows || '—'}
                              </span>
                            ) : details.successCount !== undefined ? (
                              <span>
                                Ingested: <strong className="text-status-success">{details.successCount}</strong> (Failed: {details.failureCount || 0})
                              </span>
                            ) : (
                              <span>—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                (details.failedRows || details.failureCount || 0) > 0
                                  ? 'bg-status-warning text-status-warning dark:bg-status-amber dark:text-amber-300'
                                  : 'bg-status-success text-status-success dark:bg-status-emerald dark:text-emerald-300'
                              }`}
                            >
                              {details.status || 'COMPLETED'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{log.description || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-slate-500 dark:text-slate-400">
              No previous import history records found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
