import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import {
  Award,
  Plus,
  Download,
  FileText,
  Calendar,
  ExternalLink,
  Trash2,
  CheckCircle2,
  Clock,
  Archive,
} from 'lucide-react';

export default function StudentAchievements() {
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);

  // Form State
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'certification',
    issuer: '',
    issueDate: '',
  });
  const [files, setFiles] = useState([]);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/achievements/my-achievements');
      setAchievements(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching achievements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('category', form.category);
      formData.append('issuer', form.issuer);
      formData.append('issueDate', form.issueDate);

      for (let i = 0; i < files.length; i++) {
        formData.append('certificates', files[i]);
      }

      await axiosClient.post('/achievements', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setIsUploadModalOpen(false);
      setForm({
        title: '',
        description: '',
        category: 'certification',
        issuer: '',
        issueDate: '',
      });
      setFiles([]);
      await fetchAchievements();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload achievement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadZip = async () => {
    setDownloadingZip(true);
    try {
      const res = await axiosClient.get('/achievements/export/zip', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'My_Certificates_Portfolio.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('No certificate files available to export or download failed.');
    } finally {
      setDownloadingZip(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this achievement record?')) return;
    try {
      await axiosClient.delete(`/achievements/${id}`);
      await fetchAchievements();
    } catch (err) {
      alert('Failed to delete achievement.');
    }
  };

  if (loading) return <LoadingSpinner fullScreen={false} message="Loading your achievements portfolio..." />;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
            <Award className="w-6 h-6 text-role-primary dark:text-indigo-400" />
            Achievements & Certification Portfolio
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Store certificates, research papers, hackathon prizes, and export your verified credentials.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadZip}
            disabled={downloadingZip || achievements.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold rounded-xl transition disabled:opacity-40"
          >
            {downloadingZip ? <LoadingSpinner size="sm" /> : <Archive className="w-4 h-4" />}
            Download ZIP
          </button>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-role-primary hover:bg-role-primary text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> Add Achievement
          </button>
        </div>
      </div>

      {/* Grid of Achievements */}
      {achievements.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {achievements.map((item) => (
            <div
              key={item._id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-role-soft text-role-primary dark:bg-role-primary/40 dark:text-indigo-300">
                    {item.category}
                  </span>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="text-slate-500 dark:text-slate-400 hover:text-rose-500 p-1"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mt-2">
                  {item.title}
                </h3>
                {item.issuer && (
                  <p className="text-xs font-semibold text-role-primary dark:text-indigo-400 mt-0.5">
                    Issuer: {item.issuer}
                  </p>
                )}
                {item.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    {item.description}
                  </p>
                )}

                {/* Attached Files List */}
                {((item.files && item.files.length > 0) || (item.attachments && item.attachments.length > 0)) && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide block">
                      Certificates ({(item.files || item.attachments).length})
                    </span>
                    {(item.files || item.attachments).map((att, idx) => {
                      const fileUrl = att.url || att.fileUrl;
                      const fileName = att.originalName || att.fileName || `Certificate #${idx + 1}`;
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-300"
                        >
                          <span className="truncate max-w-[180px] font-mono text-[11px]" title={fileName}>
                            {fileName}
                          </span>
                          {fileUrl && (
                            <a
                              href={fileUrl.startsWith('http') ? fileUrl : `${axiosClient.defaults.baseURL?.replace('/api', '') || ''}${fileUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-role-primary dark:text-indigo-400 hover:underline flex items-center gap-0.5 text-[11px]"
                            >
                              <ExternalLink className="w-3 h-3" /> View
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {item.issueDate
                    ? new Date(item.issueDate).toLocaleDateString([], { month: 'short', year: 'numeric' })
                    : 'Date not specified'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    item.isVerified
                      ? 'bg-status-success text-status-success dark:bg-status-emerald dark:text-emerald-300'
                      : 'bg-status-warning text-status-warning dark:bg-status-amber dark:text-amber-300'
                  }`}
                >
                  {item.isVerified ? 'Verified' : 'Pending Verification'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No achievements recorded yet.</p>
          <p>Upload hackathon prizes, online course certificates, and sports wins to bolster your profile.</p>
        </div>
      )}

      {/* Add Achievement Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Add Achievement & Certificates"
        size="md"
      >
        <form onSubmit={handleUpload} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Achievement Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 1st Place Smart India Hackathon, AWS Solutions Architect"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus-role"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              >
                <option value="hackathon">Hackathon / Competition</option>
                <option value="certification">Professional Certification</option>
                <option value="research">Research Paper / Publication</option>
                <option value="workshop">Workshop / Seminar</option>
                <option value="sports">Sports & Athletics</option>
                <option value="cultural">Cultural / Arts</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Issuing Organization / Authority
              </label>
              <input
                type="text"
                placeholder="e.g. AICTE, Coursera, IEEE"
                value={form.issuer}
                onChange={(e) => setForm({ ...form, issuer: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date of Issue / Achievement
              </label>
              <input
                type="date"
                value={form.issueDate}
                onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Attach Certificates (PDF/Images)
              </label>
              <input
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setFiles(Array.from(e.target.files))}
                className="w-full text-xs text-slate-500 file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-role-soft file:text-role-primary dark:file:bg-indigo-950 dark:file:text-indigo-300"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description & Summary
            </label>
            <textarea
              rows={3}
              placeholder="Key project details, ranking, technologies used..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-role-primary hover:bg-role-primary text-white font-semibold shadow-sm transition disabled:opacity-50"
            >
              {submitting ? <LoadingSpinner size="sm" color="text-white" /> : 'Save Achievement'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
