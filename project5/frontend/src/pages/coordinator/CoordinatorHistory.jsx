import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { History, Calendar, CheckCircle, Users, FileText } from 'lucide-react';

export default function CoordinatorHistory() {
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await axiosClient.get('/allocation/history');
        setBatches(res.data || res || []);
      } catch (err) {
        setError(err.message || 'Failed to load allocation history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Allocation History & Audit Trail
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Permanent institutional log of all mentor allocation batches and administrative reassignment events.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-status-error text-status-error rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {batches.length ? (
          batches.map((b) => (
            <div
              key={b._id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border-b border-gray-100 pb-3 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-role-soft p-2 text-role-primary dark:bg-role-primary/40 dark:text-indigo-400">
                    <History className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {b.notes || `Allocation Batch (${b.academicYear})`}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(b.createdAt).toLocaleString()}
                      </span>
                      <span>•</span>
                      <span>Department: {b.department}</span>
                      <span>•</span>
                      <span>Academic Year: {b.academicYear}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-status-success text-status-success dark:bg-status-success/40 dark:text-emerald-300">
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                    Confirmed
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 text-xs text-gray-600 dark:text-gray-300">
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block mb-0.5">Allocated By</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {b.allocatedByName || 'Coordinator'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block mb-0.5">Students Allocated</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {b.totalStudentsAllocated}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block mb-0.5">Mentors Involved</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {b.summary?.mentorsInvolved ?? '—'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block mb-0.5">Semester</span>
                  <span className="font-semibold text-gray-900 dark:text-white uppercase">
                    {b.semester ? `Sem ${b.semester}` : '—'}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-gray-500 dark:border-gray-800 dark:bg-gray-900">
            <FileText className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <p className="font-medium">No previous allocation batches recorded yet.</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Confirmed allocation batches will appear here with complete audit metrics.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
