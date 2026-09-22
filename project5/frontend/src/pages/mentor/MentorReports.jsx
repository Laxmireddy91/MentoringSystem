import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FileText, Download, FileSpreadsheet, Users, GraduationCap, Calendar } from 'lucide-react';

export default function MentorReports() {
  const [loading, setLoading] = useState(true);
  const [mentees, setMentees] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);

  useEffect(() => {
    fetchMentees();
  }, []);

  const fetchMentees = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/mentors/my-students');
      const data = res.data?.data;
      const list = data?.students || data || [];
      setMentees(list);
      if (list.length > 0) {
        setSelectedStudentId(list[0]._id);
      }
    } catch (err) {
      console.error('Error fetching mentees for reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadStudentReportCard = async () => {
    if (!selectedStudentId) return;
    setDownloadingPdf(true);
    try {
      const student = mentees.find((m) => m._id === selectedStudentId);
      const res = await axiosClient.get(`/reports/student/${selectedStudentId}/report-card/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${student?.usn || 'Mentee'}_Report_Card.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Unable to generate PDF report card.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleExportMenteesExcel = async () => {
    setDownloadingExcel(true);
    try {
      const res = await axiosClient.get('/reports/export/students', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(
        new Blob([res.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
      );
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Assigned_Mentees_Academic_Roster.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Unable to export Excel roster.');
    } finally {
      setDownloadingExcel(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen={false} message="Loading reporting center..." />;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-role-primary dark:text-indigo-400" />
            Mentee Reports &amp; Data Exports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Generate individual PDF performance report cards and export comprehensive mentee spreadsheets.
          </p>
        </div>

        <button
          onClick={handleExportMenteesExcel}
          disabled={downloadingExcel || mentees.length === 0}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-status-success hover:bg-status-success text-white font-semibold rounded-xl text-xs sm:text-sm shadow-sm transition disabled:opacity-50"
        >
          {downloadingExcel ? <LoadingSpinner size="sm" color="text-white" /> : <FileSpreadsheet className="w-4 h-4" />}
          Export Mentees (Excel)
        </button>
      </div>

      {/* Grid of Reporting Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Single Student PDF Generator */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-role-soft dark:bg-role-soft-dark text-role-primary dark:text-indigo-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                Individual Student Report Card
              </h3>
              <p className="text-xs text-slate-500">Official PDF Academic Transcript</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Select Mentee:
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs"
            >
              {mentees.map((st) => (
                <option key={st._id} value={st._id}>
                  {st.usn} - {st.userId?.name || 'Student'} (Sem {st.semester})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleDownloadStudentReportCard}
            disabled={downloadingPdf || !selectedStudentId}
            className="w-full py-2.5 px-4 bg-role-primary hover:bg-role-primary text-white font-semibold rounded-xl text-xs shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {downloadingPdf ? <LoadingSpinner size="sm" color="text-white" /> : <Download className="w-4 h-4" />}
            Generate Official PDF Report Card
          </button>
        </div>

        {/* Bulk Roster Export */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-status-success dark:bg-status-emerald text-status-success dark:text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                Complete Mentee Academic Spreadsheet
              </h3>
              <p className="text-xs text-slate-500">Structured Excel (XLSX) Export</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Exports tabular data including student USNs, CIE marks, computed SGPAs, cumulative CGPAs, active
            backlog counts, and risk engine evaluation scores.
          </p>

          <button
            onClick={handleExportMenteesExcel}
            disabled={downloadingExcel || mentees.length === 0}
            className="w-full py-2.5 px-4 bg-status-success hover:bg-status-success text-white font-semibold rounded-xl text-xs shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {downloadingExcel ? <LoadingSpinner size="sm" color="text-white" /> : <Download className="w-4 h-4" />}
            Download Roster (.xlsx)
          </button>
        </div>
      </div>
    </div>
  );
}
