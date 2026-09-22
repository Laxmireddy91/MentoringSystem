import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import {
  FolderLock,
  Upload,
  FileText,
  Eye,
  Trash2,
  Lock,
  Users,
  Building,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';

export default function StudentDocumentVault() {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    title: '',
    documentType: 'marks_card',
    semester: 5,
    visibility: 'mentor_visible',
    fileUrl: '',
    description: '',
  });

  const fetchVault = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axiosClient.get('/documents');
      setDocuments(res.data || res || []);
    } catch (err) {
      setError(err.message || 'Failed to load vault documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVault();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      alert('Document Title is required.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');
      await axiosClient.post('/documents', form);
      setSuccess('Document safely saved to your Document Vault.');
      setIsUploadModalOpen(false);
      setForm({
        title: '',
        documentType: 'marks_card',
        semester: 5,
        visibility: 'mentor_visible',
        fileUrl: '',
        description: '',
      });
      await fetchVault();
    } catch (err) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to remove this document from your vault?')) return;
    try {
      await axiosClient.delete(`/documents/${docId}`);
      await fetchVault();
    } catch (err) {
      alert(err.message || 'Failed to delete document');
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
            <FolderLock className="h-6 w-6 text-role-primary dark:text-indigo-400" />
            <span>Student Document Vault</span>
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Secure digital repository for academic marks cards, medical records, and verification certificates with granular visibility controls.
          </p>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-role-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-role-primary transition"
        >
          <Upload className="h-4 w-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {success && (
        <div className="p-4 bg-status-success text-status-success rounded-lg text-sm flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-status-success flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-status-error text-status-error rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.length ? (
          documents.map((doc) => (
            <div
              key={doc._id}
              className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="rounded-lg bg-role-soft p-2.5 text-role-primary dark:bg-role-primary/40 dark:text-indigo-300">
                      <FileText className="h-6 w-6" />
                    </span>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1">
                        {doc.title}
                      </h3>
                      <span className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold uppercase">
                        {doc.documentType?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Visibility Badge */}
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      doc.visibility === 'mentor_visible'
                        ? 'bg-status-info text-status-info dark:bg-status-info/40 dark:text-blue-300'
                        : doc.visibility === 'institution_visible'
                        ? 'bg-role-soft text-role-primary dark:bg-role-primary/40 dark:text-purple-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                    }`}
                  >
                    {doc.visibility === 'mentor_visible' ? (
                      <>
                        <Users className="h-3 w-3" />
                        <span>Mentor</span>
                      </>
                    ) : doc.visibility === 'institution_visible' ? (
                      <>
                        <Building className="h-3 w-3" />
                        <span>Institution</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-3 w-3" />
                        <span>Private</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="mt-4 space-y-1 text-xs text-gray-500">
                  <div>Semester: {doc.semester || 'All'}</div>
                  <div>Uploaded: {new Date(doc.createdAt).toLocaleDateString()}</div>
                  {doc.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-xs italic mt-2 line-clamp-2">
                      &quot;{doc.description}&quot;
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
                {doc.fileUrl ? (
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-role-primary hover:text-role-primary dark:text-indigo-400"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>View / Download</span>
                  </a>
                ) : (
                  <span className="text-xs text-gray-500 dark:text-gray-400">Stored on college drive</span>
                )}

                <button
                  onClick={() => handleDelete(doc._id)}
                  className="p-1 text-gray-500 dark:text-gray-400 hover:text-status-error transition"
                  title="Remove from vault"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full rounded-xl border border-gray-200 bg-white p-12 text-center text-gray-500 dark:border-gray-800 dark:bg-gray-900">
            <FolderLock className="h-10 w-10 text-gray-500 dark:text-gray-400 mx-auto mb-3" />
            <p className="font-medium">Your Document Vault is empty.</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Store your marks cards, medical certificates, and ID documents here for instant attachment to permission requests.
            </p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <Modal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          title="Add Document to Vault"
        >
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Document Title *
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. 5th Semester Grade Card / Medical Certificate"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-role-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Document Category
                </label>
                <select
                  value={form.documentType}
                  onChange={(e) => setForm({ ...form, documentType: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-role-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="marks_card">Marks Card / Grade Sheet</option>
                  <option value="medical_certificate">Medical Certificate</option>
                  <option value="fee_receipt">Fee Receipt</option>
                  <option value="internship_certificate">Internship Certificate</option>
                  <option value="govt_id">Government ID Proof</option>
                  <option value="other">Other Official Document</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Access & Visibility Permission
                </label>
                <select
                  value={form.visibility}
                  onChange={(e) => setForm({ ...form, visibility: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-role-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="mentor_visible">Visible to Assigned Mentor</option>
                  <option value="institution_visible">Visible to HOD & Coordinators</option>
                  <option value="private">Private (Only Me)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Semester Association
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
                Document URL / Link
              </label>
              <input
                type="text"
                value={form.fileUrl}
                onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
                placeholder="https://drive.google.com/... or cloud document link"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-role-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Notes / Context
              </label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. Issued by Victoria Hospital during November CIE examination window."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-role-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 hover:text-gray-900 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-role-primary px-4 py-2 text-xs font-semibold text-white hover:bg-role-primary transition disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save to Vault'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
