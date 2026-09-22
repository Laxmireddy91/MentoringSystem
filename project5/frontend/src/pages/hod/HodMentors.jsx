import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import {
  UserCheck,
  Plus,
  Search,
  Users,
  Building,
  Mail,
  CheckCircle,
  Clock,
} from 'lucide-react';

export default function HodMentors() {
  const [loading, setLoading] = useState(true);
  const [mentors, setMentors] = useState([]);
  const [unassignedStudents, setUnassignedStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddMentorOpen, setIsAddMentorOpen] = useState(false);
  const [isBulkAllocateOpen, setIsBulkAllocateOpen] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [mentorForm, setMentorForm] = useState({
    name: '',
    email: '',
    password: 'Password@123',
    department: 'Computer Science and Engineering',
    designation: 'Assistant Professor',
    officeRoom: '',
    maxCapacity: 25,
  });

  useEffect(() => {
    fetchMentorsAndStudents();
  }, []);

  const fetchMentorsAndStudents = async () => {
    setLoading(true);
    try {
      const [mRes, sRes] = await Promise.allSettled([
        axiosClient.get('/hod/mentors'),
        axiosClient.get('/hod/students'),
      ]);

      if (mRes.status === 'fulfilled') setMentors(mRes.value.data?.data || []);
      if (sRes.status === 'fulfilled') {
        const allStudents = sRes.value.data?.data || [];
        setUnassignedStudents(allStudents.filter((s) => !s.mentorId));
      }
    } catch (err) {
      console.error('Error fetching mentors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMentor = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axiosClient.post('/hod/mentors', mentorForm);
      setIsAddMentorOpen(false);
      setMentorForm({
        name: '',
        email: '',
        password: 'Password@123',
        department: 'Computer Science and Engineering',
        designation: 'Assistant Professor',
        officeRoom: '',
        maxCapacity: 25,
      });
      alert('Faculty mentor registered successfully!');
      await fetchMentorsAndStudents();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create mentor.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkAllocate = async (e) => {
    e.preventDefault();
    if (!selectedMentor || selectedStudentIds.length === 0) return;

    setSubmitting(true);
    try {
      await axiosClient.post('/hod/mentors/allocate-bulk', {
        mentorId: selectedMentor._id,
        studentIds: selectedStudentIds,
      });
      setIsBulkAllocateOpen(false);
      setSelectedStudentIds([]);
      setSelectedMentor(null);
      alert('Students allocated to mentor successfully!');
      await fetchMentorsAndStudents();
    } catch (err) {
      alert(err.response?.data?.message || 'Bulk allocation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen={false} message="Loading faculty mentor directory..." />;

  const columns = [
    {
      header: 'Faculty Mentor',
      accessorKey: 'name',
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-bold text-slate-800 dark:text-slate-100">{row.name}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{row.email}</p>
        </div>
      ),
    },
    {
      header: 'Designation',
      accessorKey: 'designation',
      sortable: true,
      cell: (row) => (
        <span className="font-medium text-slate-700 dark:text-slate-300">
          {row.designation || 'Assistant Professor'}
        </span>
      ),
    },
    {
      header: 'Office / Location',
      accessorKey: 'officeRoom',
      cell: (row) => (
        <span className="text-xs text-slate-500 font-mono">
          {row.officeRoom || 'Not provided'}
        </span>
      ),
    },
    {
      header: 'Assigned Mentees',
      accessorKey: 'assignedStudents',
      sortable: true,
      cell: (row) => {
        const count = row.assignedStudents?.length || 0;
        const max = row.maxCapacity || 25;
        const pct = Math.round((count / max) * 100);
        return (
          <div className="w-36">
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span>{count} / {max}</span>
              <span className={pct >= 90 ? 'text-rose-500' : 'text-role-primary'}>{pct}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
              <div
                className={`h-full rounded-full ${pct >= 90 ? 'bg-rose-500' : 'bg-role-primary'}`}
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
            <UserCheck className="w-6 h-6 text-role-primary dark:text-indigo-400" />
            Faculty Mentors &amp; Workload Distribution
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Supervise faculty advising quotas, balance mentee allocations, and onboard new faculty mentors.
          </p>
        </div>

        <button
          onClick={() => setIsAddMentorOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-role-primary hover:bg-role-primary text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Onboard Faculty Mentor
        </button>
      </div>

      {/* Unassigned Students Notice Banner */}
      {unassignedStudents.length > 0 && (
        <div className="p-4 rounded-xl bg-status-warning dark:bg-status-amber border border-status-warning dark:border-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm text-status-warning dark:text-amber-300">
            <Clock className="w-5 h-5 text-status-warning" />
            <span>
              <strong>{unassignedStudents.length} Students</strong> currently have no assigned faculty mentor.
            </span>
          </div>
          <span className="text-xs font-bold text-status-warning dark:text-amber-400">
            Select a mentor below to allocate
          </span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search mentors by name, email, or designation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus-role"
          />
        </div>
      </div>

      {/* Mentors Table */}
      <DataTable
        columns={columns}
        data={mentors}
        searchQuery={searchQuery}
        searchKeys={['name', 'email', 'designation']}
        pageSize={10}
        emptyMessage="No faculty mentors registered in this department."
        actions={(row) => (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => {
                setSelectedMentor(row);
                setIsBulkAllocateOpen(true);
              }}
              className="px-3 py-1.5 bg-role-soft hover:bg-role-soft dark:bg-role-soft-dark dark:hover:bg-role-primary/60 text-role-primary dark:text-indigo-300 rounded-lg text-xs font-semibold transition flex items-center gap-1"
            >
              <Users className="w-3.5 h-3.5" /> Allocate Mentees
            </button>
          </div>
        )}
      />

      {/* Onboard Mentor Modal */}
      <Modal
        isOpen={isAddMentorOpen}
        onClose={() => setIsAddMentorOpen(false)}
        title="Onboard Faculty Mentor"
        size="md"
      >
        <form onSubmit={handleCreateMentor} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">Faculty Full Name *</label>
            <input
              type="text"
              required
              placeholder="Dr. S. K. Sharma"
              value={mentorForm.name}
              onChange={(e) => setMentorForm({ ...mentorForm, name: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Email *</label>
              <input
                type="email"
                required
                placeholder="faculty@college.edu"
                value={mentorForm.email}
                onChange={(e) => setMentorForm({ ...mentorForm, email: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Initial Password *</label>
              <input
                type="password"
                required
                value={mentorForm.password}
                onChange={(e) => setMentorForm({ ...mentorForm, password: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold mb-1">Designation</label>
              <input
                type="text"
                placeholder="Associate Professor"
                value={mentorForm.designation}
                onChange={(e) => setMentorForm({ ...mentorForm, designation: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Office Room</label>
              <input
                type="text"
                placeholder="Room 402, Block B"
                value={mentorForm.officeRoom}
                onChange={(e) => setMentorForm({ ...mentorForm, officeRoom: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Mentee Capacity</label>
              <input
                type="number"
                min="5"
                max="60"
                value={mentorForm.maxCapacity}
                onChange={(e) => setMentorForm({ ...mentorForm, maxCapacity: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddMentorOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-role-primary hover:bg-role-primary text-white font-semibold shadow-sm transition disabled:opacity-50"
            >
              {submitting ? <LoadingSpinner size="sm" color="text-white" /> : 'Register Mentor'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Bulk Allocate Modal */}
      <Modal
        isOpen={isBulkAllocateOpen}
        onClose={() => setIsBulkAllocateOpen(false)}
        title={`Allocate Students to ${selectedMentor?.name}`}
        size="md"
      >
        <form onSubmit={handleBulkAllocate} className="space-y-4 text-xs">
          <p className="text-slate-500">
            Select unassigned students below to assign to {selectedMentor?.name} (Capacity: {selectedMentor?.assignedStudents?.length || 0}/{selectedMentor?.maxCapacity || 25}).
          </p>

          {unassignedStudents.length > 0 ? (
            <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-200 dark:border-slate-700 p-3 rounded-xl">
              {unassignedStudents.map((s) => (
                <label
                  key={s._id}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-xs"
                >
                  <input
                    type="checkbox"
                    checked={selectedStudentIds.includes(s._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedStudentIds([...selectedStudentIds, s._id]);
                      } else {
                        setSelectedStudentIds(selectedStudentIds.filter((id) => id !== s._id));
                      }
                    }}
                    className="rounded text-role-primary focus-role"
                  />
                  <div className="flex-1">
                    <span className="font-bold text-slate-800 dark:text-slate-100">{s.name}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono ml-2">({s.usn} • Sem {s.currentSemester})</span>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-slate-500 dark:text-slate-400">All registered students currently have assigned mentors.</p>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsBulkAllocateOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || selectedStudentIds.length === 0}
              className="px-4 py-2 rounded-xl bg-role-primary hover:bg-role-primary text-white font-semibold shadow-sm transition disabled:opacity-50"
            >
              {submitting ? <LoadingSpinner size="sm" color="text-white" /> : `Allocate ${selectedStudentIds.length} Students`}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
