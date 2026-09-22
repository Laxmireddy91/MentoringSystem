import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FileText, Download, GraduationCap, CheckCircle, Calendar, ShieldCheck } from 'lucide-react';

export default function StudentReports() {
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/students/profile');
      setStudent(res.data?.data?.student || res.data?.data);
    } catch (err) {
      console.error('Error fetching profile for reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReportCard = async () => {
    if (!student?._id) return;
    setDownloading(true);
    try {
      const res = await axiosClient.get(`/reports/student/${student._id}/report-card/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${student.usn || 'Student'}_Official_Report_Card.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Unable to generate PDF report card at this moment.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen={false} message="Loading academic report records..." />;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-role-primary dark:text-indigo-400" />
            Official Academic Reports &amp; Transcripts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Download certified PDF performance transcripts and semester grade cards with institutional verification.
          </p>
        </div>

        <button
          onClick={handleDownloadReportCard}
          disabled={downloading || !student?._id}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-role-primary hover:bg-role-primary text-white font-semibold rounded-xl text-xs sm:text-sm shadow-sm transition disabled:opacity-50"
        >
          {downloading ? <LoadingSpinner size="sm" color="text-white" /> : <Download className="w-4 h-4" />}
          Download PDF Report Card
        </button>
      </div>

      {/* Report Cards Preview & Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-role-soft dark:bg-role-soft-dark text-role-primary dark:text-indigo-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                Cumulative Semester Report Card
              </h3>
              <p className="text-xs text-slate-500">Official Institutional Transcript</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Contains comprehensive CIE scores, SGPA calculations for all completed semesters, cumulative CGPA,
            earned credits, and verified academic milestones.
          </p>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-status-success" /> Digitally Verified
            </span>
            <button
              onClick={handleDownloadReportCard}
              disabled={downloading}
              className="text-role-primary dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> Generate PDF
            </button>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-role-soft dark:bg-role-soft-dark text-role-primary dark:text-purple-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                Mentoring Consultation Log Summary
              </h3>
              <p className="text-xs text-slate-500">Session Notes &amp; Action Plan</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Record of scheduled 1-on-1 consultations with faculty mentors, documented discussion notes, identified
            risk flags, and agreed upon remedial goals.
          </p>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Integrated inside Report Card</span>
            <span className="text-xs font-mono font-semibold text-role-primary dark:text-purple-400">Section B</span>
          </div>
        </div>
      </div>
    </div>
  );
}
