import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FileText, Download, FileSpreadsheet, Users, GraduationCap, ShieldCheck } from 'lucide-react';

export default function HodReports() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingStudentsExcel, setDownloadingStudentsExcel] = useState(false);
  const [downloadingMentorsExcel, setDownloadingMentorsExcel] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/hod/students', { params: { limit: 200 } });
      const data = res.data?.data;
      const list = Array.isArray(data) ? data : data?.students || [];
      setStudents(list);
      if (list.length > 0) {
        setSelectedStudentId(list[0]._id);
      }
    } catch (err) {
      console.error('Error fetching students for HOD reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadStudentPdf = async () => {
    if (!selectedStudentId) return;
    setDownloadingPdf(true);
    try {
      const student = students.find((s) => s._id === selectedStudentId);
      const res = await axiosClient.get(`/reports/student/${selectedStudentId}/report-card/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${student?.usn || 'Student'}_Report_Card.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Unable to generate student PDF report card.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleExportStudentsExcel = async () => {
    setDownloadingStudentsExcel(true);
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
      link.setAttribute('download', 'Department_Students_Master_Report.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Unable to export students Excel spreadsheet.');
    } finally {
      setDownloadingStudentsExcel(false);
    }
  };

  const handleExportMentorsExcel = async () => {
    setDownloadingMentorsExcel(true);
    try {
      const res = await axiosClient.get('/reports/export/mentors', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(
        new Blob([res.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
      );
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Faculty_Mentors_Workload_Report.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Unable to export mentors Excel spreadsheet.');
    } finally {
      setDownloadingMentorsExcel(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen={false} message="Loading department reports center..." />;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-role-primary dark:text-indigo-400" />
            Department Reports &amp; Institutional Exports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Generate certified transcripts, department performance audits, and mentor allocation spreadsheets.
          </p>
        </div>
      </div>

      {/* Grid of Report Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Student PDF Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-role-soft dark:bg-role-soft-dark text-role-primary dark:text-indigo-400">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  Student Report Card
                </h3>
                <p className="text-xs text-slate-500">Official PDF Transcript</p>
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Select Student:
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs"
              >
                {students.map((st) => (
                  <option key={st._id} value={st._id}>
                    {st.usn} - {st.userId?.name || 'Student'} (Sem {st.semester})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleDownloadStudentPdf}
            disabled={downloadingPdf || !selectedStudentId}
            className="w-full py-2.5 px-4 bg-role-primary hover:bg-role-primary text-white font-semibold rounded-xl text-xs shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {downloadingPdf ? <LoadingSpinner size="sm" color="text-white" /> : <Download className="w-4 h-4" />}
            Generate PDF Report Card
          </button>
        </div>

        {/* Student Master Excel */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-status-success dark:bg-status-emerald text-status-success dark:text-emerald-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  Students Master Roster
                </h3>
                <p className="text-xs text-slate-500">Excel (XLSX) Dataset</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Export all department student records with CIE scores, GPA history, active backlog metrics, and risk
              flags.
            </p>
          </div>

          <button
            onClick={handleExportStudentsExcel}
            disabled={downloadingStudentsExcel}
            className="w-full py-2.5 px-4 bg-status-success hover:bg-status-success text-white font-semibold rounded-xl text-xs shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {downloadingStudentsExcel ? <LoadingSpinner size="sm" color="text-white" /> : <Download className="w-4 h-4" />}
            Export Students (Excel)
          </button>
        </div>

        {/* Mentor Workload Excel */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-role-soft dark:bg-role-soft-dark text-role-primary dark:text-purple-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  Faculty Mentor Workload
                </h3>
                <p className="text-xs text-slate-500">Excel (XLSX) Summary</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Export mentor mentee allocation counts, capacity limits, feedback rating averages, and consultation
              activity.
            </p>
          </div>

          <button
            onClick={handleExportMentorsExcel}
            disabled={downloadingMentorsExcel}
            className="w-full py-2.5 px-4 bg-role-primary hover:bg-role-primary text-white font-semibold rounded-xl text-xs shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {downloadingMentorsExcel ? <LoadingSpinner size="sm" color="text-white" /> : <Download className="w-4 h-4" />}
            Export Mentors (Excel)
          </button>
        </div>
      </div>
    </div>
  );
}
