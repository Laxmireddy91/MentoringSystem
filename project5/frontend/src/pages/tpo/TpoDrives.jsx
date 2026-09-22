import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import {
  Briefcase,
  Plus,
  Calendar,
  DollarSign,
  GraduationCap,
  Users,
  Search,
  Building,
  CheckCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';

export default function TpoDrives() {
  const [loading, setLoading] = useState(true);
  const [drives, setDrives] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [form, setForm] = useState({
    company: '',
    role: '',
    jobType: 'Full Time',
    ctc: '',
    eligibleDepartments: ['CSE', 'ISE'],
    minCGPA: 7.0,
    maxBacklogs: 0,
    requiredSkills: '',
    driveDate: '',
    applicationDeadline: '',
    description: '',
  });

  const departmentOptions = ['CSE', 'ISE', 'ECE', 'MECH', 'CIVIL', 'AIML'];

  const fetchDrives = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/placement/drives');
      setDrives(res.data || res || []);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load placement drives');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrives();
  }, []);

  const handleCreateDrive = async (e) => {
    e.preventDefault();
    if (!form.company.trim() || !form.role.trim()) {
      alert('Company name and Job role are required.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage('');

      const payload = {
        ...form,
        minCGPA: parseFloat(form.minCGPA) || 0,
        maxBacklogs: parseInt(form.maxBacklogs) || 0,
        requiredSkills: form.requiredSkills
          ? form.requiredSkills.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };

      await axiosClient.post('/placement/drives', payload);
      setIsCreateModalOpen(false);
      setForm({
        company: '',
        role: '',
        jobType: 'Full Time',
        ctc: '',
        eligibleDepartments: ['CSE', 'ISE'],
        minCGPA: 7.0,
        maxBacklogs: 0,
        requiredSkills: '',
        driveDate: '',
        applicationDeadline: '',
        description: '',
      });
      await fetchDrives();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to create placement drive');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleDept = (dept) => {
    setForm((prev) => {
      const exists = prev.eligibleDepartments.includes(dept);
      return {
        ...prev,
        eligibleDepartments: exists
          ? prev.eligibleDepartments.filter((d) => d !== dept)
          : [...prev.eligibleDepartments, dept],
      };
    });
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const filteredDrives = drives.filter((d) => {
    const matchesSearch =
      d.company?.toLowerCase().includes(search.toLowerCase()) ||
      d.role?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || d.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-5 dark:border-gray-800">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Campus Placement Drives & Corporate Outreach
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Publish institutional recruitment opportunities, define strict eligibility criteria, and evaluate candidate pools.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-role-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-role-primary transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Placement Drive</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 bg-status-error text-status-error rounded-lg text-sm">
          {errorMessage}
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search drives by company or job role..."
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-role-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-role-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        >
          <option value="ALL">All Drive Statuses</option>
          <option value="active">Active</option>
          <option value="upcoming">Upcoming</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Drives Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDrives.length ? (
          filteredDrives.map((drive) => (
            <div
              key={drive._id}
              className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 transition hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="rounded-lg bg-status-info p-2 text-status-info dark:bg-status-info/40 dark:text-blue-300">
                      <Building className="h-6 w-6" />
                    </span>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-base">
                        {drive.company}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        {drive.role}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                      drive.status === 'active'
                        ? 'bg-status-success text-status-success dark:bg-status-success/40 dark:text-emerald-300'
                        : drive.status === 'upcoming'
                        ? 'bg-status-info text-status-info dark:bg-status-info/40 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                    }`}
                  >
                    {drive.status}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs text-gray-600 dark:text-gray-300 border-t border-gray-100 pt-3 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">CTC Package</span>
                    <span className="font-semibold text-status-success dark:text-emerald-400">
                      {drive.ctc || 'As per norms'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Min CGPA</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      &ge; {drive.minCGPA || 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Max Backlogs</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      &le; {drive.maxBacklogs ?? 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Eligible Branches</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {drive.eligibleDepartments?.join(', ') || 'ALL'}
                    </span>
                  </div>

                  {drive.applicationDeadline && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Deadline</span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {new Date(drive.applicationDeadline).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 border-t border-gray-100 pt-4 dark:border-gray-800">
                <Link
                  to={`/tpo/eligibility?driveId=${drive._id}`}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-role-soft py-2 text-xs font-semibold text-role-primary hover:bg-role-soft dark:bg-role-soft-dark dark:text-indigo-300 dark:hover:bg-role-primary/50 transition"
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>Evaluate Eligibility & Candidates</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full rounded-xl border border-gray-200 bg-white p-12 text-center text-gray-500 dark:border-gray-800 dark:bg-gray-900">
            <Briefcase className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <p className="font-medium">No placement drives found matching criteria.</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Click &quot;New Placement Drive&quot; to publish a campus hiring opportunity.
            </p>
          </div>
        )}
      </div>

      {/* Create Placement Drive Modal */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create Campus Placement Drive"
        >
          <form onSubmit={handleCreateDrive} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="e.g. Cisco Systems"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-role-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Job Role *
                </label>
                <input
                  type="text"
                  required
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  placeholder="e.g. Software Engineer"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-role-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  CTC Package
                </label>
                <input
                  type="text"
                  value={form.ctc}
                  onChange={(e) => setForm({ ...form, ctc: e.target.value })}
                  placeholder="e.g. 14.5 LPA"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-role-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Job Type
                </label>
                <select
                  value={form.jobType}
                  onChange={(e) => setForm({ ...form, jobType: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-role-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="Full Time">Full Time</option>
                  <option value="Internship">Internship</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>
            </div>

            {/* Academic Eligibility Criteria */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Minimum CGPA Required
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={form.minCGPA}
                  onChange={(e) => setForm({ ...form, minCGPA: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-role-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Maximum Active Backlogs Allowed
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.maxBacklogs}
                  onChange={(e) => setForm({ ...form, maxBacklogs: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-role-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Eligible Departments
              </label>
              <div className="flex flex-wrap gap-2">
                {departmentOptions.map((dept) => {
                  const selected = form.eligibleDepartments.includes(dept);
                  return (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => handleToggleDept(dept)}
                      className={`px-3 py-1 rounded text-xs font-medium transition ${
                        selected
                          ? 'bg-role-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                      }`}
                    >
                      {dept}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Required Technical Skills (Comma-separated)
              </label>
              <input
                type="text"
                value={form.requiredSkills}
                onChange={(e) => setForm({ ...form, requiredSkills: e.target.value })}
                placeholder="e.g. Java, Python, SQL, React"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-role-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Application Deadline
                </label>
                <input
                  type="date"
                  value={form.applicationDeadline}
                  onChange={(e) => setForm({ ...form, applicationDeadline: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-role-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Drive / Interview Date
                </label>
                <input
                  type="date"
                  value={form.driveDate}
                  onChange={(e) => setForm({ ...form, driveDate: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-role-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Description / Selection Process Details
              </label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Online test round followed by technical interviews..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-role-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 hover:text-gray-900 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-role-primary px-4 py-2 text-xs font-semibold text-white hover:bg-role-primary transition disabled:opacity-50"
              >
                {submitting ? 'Publishing Drive...' : 'Publish Drive'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
