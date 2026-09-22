import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import DataTable from '../../components/common/DataTable';
import RiskBadge from '../../components/common/RiskBadge';
import Modal from '../../components/common/Modal';
import {
  GraduationCap,
  Plus,
  Upload,
  Search,
  Filter,
  UserCheck,
  Trash2,
  Download,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import Student360Modal from '../../components/student/Student360Modal';

export default function HodStudents() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [semFilter, setSemFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');

  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [is360ModalOpen, setIs360ModalOpen] = useState(false);
  const [student360Id, setStudent360Id] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Add Individual Student (Late Admission) Form State
  const [studentForm, setStudentForm] = useState({
    name: '',
    usn: '',
    email: '',
    department: 'Computer Science and Engineering',
    batch: '2024-2028',
    semester: 1,
    section: 'A',
    phone: '',
    parentName: '',
    parentEmail: '',
    parentRelation: 'Guardian',
  });

  // Import State
  const [importFile, setImportFile] = useState(null);
  const [importResult, setImportResult] = useState(null);

  // Assign Mentor Form State
  const [newMentorId, setNewMentorId] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sRes, mRes] = await Promise.allSettled([
        axiosClient.get('/hod/students'),
        axiosClient.get('/hod/mentors'),
      ]);

      if (sRes.status === 'fulfilled') setStudents(sRes.value.data?.data || []);
      if (mRes.status === 'fulfilled') setMentors(mRes.value.data?.data || []);
    } catch (err) {
      console.error('Error fetching HOD students data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: studentForm.name.trim(),
        usn: studentForm.usn.trim().toUpperCase(),
        email: studentForm.email.trim().toLowerCase(),
        department: studentForm.department,
        batch: studentForm.batch.trim(),
        semester: Number(studentForm.semester) || 1,
        section: (studentForm.section || 'A').trim().toUpperCase(),
        phone: studentForm.phone.trim(),
        parentName: studentForm.parentName.trim(),
        parentEmail: studentForm.parentEmail.trim().toLowerCase(),
        parentRelation: studentForm.parentRelation || 'Guardian',
      };

      const res = await axiosClient.post('/hod/students/individual', payload);
      setIsAddModalOpen(false);
      const createdUsn = studentForm.usn.trim().toUpperCase();
      setStudentForm({
        name: '',
        usn: '',
        email: '',
        department: 'Computer Science and Engineering',
        batch: '2024-2028',
        semester: 1,
        section: 'A',
        phone: '',
        parentName: '',
        parentEmail: '',
        parentRelation: 'Guardian',
      });
      alert(`Student record created for USN ${createdUsn}! Account is pre-registered (inactive). The student can now activate their account via /activate.`);
      await fetchData();
    } catch (err) {
      alert(err.message || err.response?.data?.message || 'Failed to create student record.');
    } finally {
      setSubmitting(false);
    }
  };

  
const handleBulkImport = async (e) => {
  e.preventDefault();

  if (!importFile) {
    alert('Please select a CSV or Excel file first.');
    return;
  }

  setSubmitting(true);
  setImportResult(null);

  try {
    const formData = new FormData();
    formData.append('file', importFile);

    const isExcel = /\.(xlsx|xls)$/i.test(importFile.name);
    const endpoint = isExcel
      ? '/imports/students/excel'
      : '/imports/students/csv';

    const res = await axiosClient.post(endpoint, formData);

    setImportResult(res.data?.data || res.data);

    alert('Bulk student import completed successfully.');

    await fetchData();

    setImportFile(null);

    const fileInput = document.getElementById('student-bulk-file');
    if (fileInput) {
      fileInput.value = '';
    }
  } catch (err) {
    console.error('Bulk import error:', err);

    alert(
      err.response?.data?.message ||
      err.message ||
      'Bulk import failed. Please check the Excel file format.'
    );
  } finally {
    setSubmitting(false);
  }
};
const handleAssignMentor = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    setSubmitting(true);
    try {
      const res = await axiosClient.patch(`/hod/students/${selectedStudent._id}/mentor`, {
        mentorId: newMentorId || null,
      });
      setIsAssignModalOpen(false);
      setSelectedStudent(null);
      setNewMentorId('');
      alert(newMentorId ? 'Mentor assigned successfully!' : 'Mentor unassigned successfully.');
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to assign mentor.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to permanently remove this student record?')) return;
    try {
      await axiosClient.delete(`/hod/students/${studentId}`);
      await fetchData();
    } catch (err) {
      alert('Failed to delete student.');
    }
  };

  const handleDownloadReportCard = async (student) => {
    try {
      const res = await axiosClient.get(`/reports/student/${student._id}/report-card/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${student.usn}_ReportCard.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Unable to generate PDF report card.');
    }
  };

  if (loading) return <LoadingSpinner fullScreen={false} message="Loading student directory..." />;

  const filteredStudents = students.filter((s) => {
    const matchSem = semFilter === 'ALL' || String(s.currentSemester) === semFilter;
    const isNeedingAttention = s.riskCategory === 'High' || s.riskCategory === 'Critical' || (s.totalBacklogs || 0) > 0;
    const matchRisk =
      riskFilter === 'ALL' ||
      (riskFilter === 'Attention' && isNeedingAttention) ||
      (riskFilter === 'Good' && !isNeedingAttention) ||
      (s.riskCategory || 'Low') === riskFilter;
    return matchSem && matchRisk;
  });

  const columns = [
    {
      header: 'Student',
      accessorKey: 'name',
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-bold text-slate-800 dark:text-slate-100">{row.name}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{row.usn}</p>
        </div>
      ),
    },
    {
      header: 'Sem / Sec',
      accessorKey: 'currentSemester',
      sortable: true,
      cell: (row) => (
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          Sem {row.currentSemester} • {row.section}
        </span>
      ),
    },
    {
      header: 'Assigned Mentor',
      accessorKey: 'mentorId.name',
      sortable: true,
      cell: (row) => (
        <span className="text-slate-700 dark:text-slate-300 font-medium">
          {row.mentorId?.name || <span className="text-amber-500 font-bold">Unassigned</span>}
        </span>
      ),
    },
    {
      header: 'CGPA',
      accessorKey: 'cgpa',
      sortable: true,
      cell: (row) => (
        <span className="font-black text-role-primary dark:text-indigo-400">
          {row.cgpa?.toFixed(2) || '0.00'}
        </span>
      ),
    },
    {
      header: 'Backlogs',
      accessorKey: 'totalBacklogs',
      sortable: true,
      cell: (row) => (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            (row.totalBacklogs || 0) > 0
              ? 'bg-status-error text-status-error dark:bg-status-error dark:text-status-error'
              : 'bg-status-success text-status-success dark:bg-status-emerald dark:text-emerald-300'
          }`}
        >
          {row.totalBacklogs || 0}
        </span>
      ),
    },
    {
      header: 'Academic Attention',
      accessorKey: 'riskCategory',
      sortable: true,
      cell: (row) => {
        const needsAttention = row.riskCategory === 'High' || row.riskCategory === 'Critical' || (row.totalBacklogs || 0) > 0;
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
              needsAttention
                ? 'bg-status-error text-rose-800 dark:bg-status-error dark:text-rose-200'
                : 'bg-status-success text-status-success dark:bg-status-emerald dark:text-emerald-200'
            }`}
          >
            {needsAttention ? 'Needs Attention' : 'Good Standing'}
          </span>
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
            <GraduationCap className="w-6 h-6 text-role-primary dark:text-indigo-400" />
            Student Master Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Maintain student records, bulk upload via CSV/Excel, and reallocate faculty mentors.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold rounded-xl transition"
          >
            <Upload className="w-4 h-4" /> Bulk Import
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-role-primary hover:bg-role-primary text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition"
          >
            <UserCheck className="w-4 h-4" /> Add Individual Student
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex-1 min-w-[240px]">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by student name, USN, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus-role"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={semFilter}
            onChange={(e) => setSemFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200"
          >
            <option value="ALL">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={String(s)}>Semester {s}</option>
            ))}
          </select>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200"
          >
            <option value="ALL">All Academic Standings</option>
            <option value="Good">Good Standing</option>
            <option value="Attention">Needs Academic Attention</option>
          </select>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filteredStudents}
        searchQuery={searchQuery}
        searchKeys={['name', 'usn', 'email', 'mentorId.name']}
        pageSize={10}
        emptyMessage="No students found matching current filters."
        actions={(row) => (
          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={() => {
                setStudent360Id(row._id);
                setIs360ModalOpen(true);
              }}
              className="px-2.5 py-1.5 bg-role-soft hover:bg-role-soft dark:bg-role-soft-dark dark:hover:bg-role-primary/60 text-role-primary dark:text-purple-300 rounded-lg text-xs font-semibold transition flex items-center gap-1"
              title="Open Student 360° Console"
            >
              <Sparkles className="w-3.5 h-3.5" /> 360°
            </button>

            <button
              onClick={() => {
                setSelectedStudent(row);
                setNewMentorId(row.mentorId?._id || '');
                setIsAssignModalOpen(true);
              }}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-role-primary dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
              title="Assign / Change Mentor"
            >
              <UserCheck className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleDownloadReportCard(row)}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-role-primary dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
              title="Download PDF Report Card"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleDeleteStudent(row._id)}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
              title="Delete Student"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      />

      {/* Add Individual Student (Late Admission) Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Individual Student (Late Admission)"
        size="lg"
      >
        <form onSubmit={handleCreateStudent} className="space-y-4 text-xs">
          <div className="p-3 bg-status-warning dark:bg-status-amber border border-status-warning dark:border-amber-900 rounded-xl text-status-warning dark:text-amber-300">
            <p className="font-bold flex items-center gap-1.5 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              Institutional Pre-Registration Workflow
            </p>
            <p className="text-[11px] mt-1 leading-relaxed">
              This registers a single late-admission student without requiring an Excel file. The account remains <strong>inactive</strong> until the student completes self-activation at <code>/activate</code> using their USN and institutional email. Faculty mentor allocation will be performed subsequently by the Mentoring Coordinator.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Full Name *</label>
              <input
                type="text"
                required
                placeholder="Student Full Name"
                value={studentForm.name}
                onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">USN (University Seat Number) *</label>
              <input
                type="text"
                required
                placeholder="1MS24CS001"
                value={studentForm.usn}
                onChange={(e) => setStudentForm({ ...studentForm, usn: e.target.value.toUpperCase() })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Institutional Email *</label>
              <input
                type="email"
                required
                placeholder="student.cs24@college.edu"
                value={studentForm.email}
                onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Department *</label>
              <select
                value={studentForm.department}
                onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="Computer Science and Engineering">Computer Science and Engineering</option>
                <option value="Information Science and Engineering">Information Science and Engineering</option>
                <option value="Electronics and Communication Engineering">Electronics and Communication Engineering</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Civil Engineering">Civil Engineering</option>
                <option value="Electrical and Electronics Engineering">Electrical and Electronics Engineering</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Batch *</label>
              <input
                type="text"
                required
                placeholder="2024-2028"
                value={studentForm.batch}
                onChange={(e) => setStudentForm({ ...studentForm, batch: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-center"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Semester *</label>
              <select
                value={studentForm.semester}
                onChange={(e) => setStudentForm({ ...studentForm, semester: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>Sem {s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Section *</label>
              <input
                type="text"
                required
                maxLength={2}
                placeholder="A"
                value={studentForm.section}
                onChange={(e) => setStudentForm({ ...studentForm, section: e.target.value.toUpperCase() })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-center uppercase"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Phone</label>
              <input
                type="text"
                placeholder="9876543210"
                value={studentForm.phone}
                onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Optional Parent Details */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl space-y-3 border border-slate-100 dark:border-slate-800">
            <span className="font-bold text-slate-700 dark:text-slate-200 block text-[11px] uppercase tracking-wide">
              Parent / Guardian Details (Optional)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Parent Name"
                value={studentForm.parentName}
                onChange={(e) => setStudentForm({ ...studentForm, parentName: e.target.value })}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <input
                type="email"
                placeholder="Parent Email"
                value={studentForm.parentEmail}
                onChange={(e) => setStudentForm({ ...studentForm, parentEmail: e.target.value })}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <select
                value={studentForm.parentRelation}
                onChange={(e) => setStudentForm({ ...studentForm, parentRelation: e.target.value })}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Guardian">Guardian</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-role-primary hover:bg-role-primary text-white font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting ? <LoadingSpinner size="sm" color="text-white" /> : 'Pre-Register Student'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Bulk CSV / Excel Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setImportFile(null);
          setImportResult(null);
        }}
        title="Bulk Import Students (CSV / Excel)"
        size="md"
      >
        <form onSubmit={handleBulkImport} className="space-y-4 text-xs">
          <p className="text-slate-500">
            Upload a spreadsheet containing student roster columns: <code>name, email, usn, semester, section, rollNumber, parentName, parentPhone</code>.
          </p>

          <div className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-center space-y-3">
  <Upload className="w-8 h-8 text-role-primary mx-auto" />

  <p className="font-semibold text-slate-700 dark:text-slate-200">
    {importFile ? importFile.name : 'Select a .csv or .xlsx file'}
  </p>

  <input
    id="student-bulk-file"
    type="file"
    accept=".csv,.xlsx,.xls"
    onChange={(e) => {
      const file = e.target.files?.[0] || null;
      setImportFile(file);
      setImportResult(null);
    }}
    className="block w-full text-sm text-slate-600 dark:text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-role-primary file:text-white file:font-semibold"
  />

  {importFile && (
    <p className="text-xs text-green-600 font-semibold">
      Selected: {importFile.name}
    </p>
  )}
</div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-semibold"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={submitting || !importFile}
              className="px-4 py-2 rounded-xl bg-role-primary hover:bg-role-primary text-white font-semibold shadow-sm transition disabled:opacity-50"
            >
              {submitting ? <LoadingSpinner size="sm" color="text-white" /> : 'Run Bulk Import'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Mentor Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={`Assign Faculty Mentor: ${selectedStudent?.name || selectedStudent?.usn || ''}`}
        size="sm"
      >
        <form onSubmit={handleAssignMentor} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">Select Mentor</label>
            <select
              value={newMentorId}
              onChange={(e) => setNewMentorId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus-role"
            >
              <option value="">-- No Mentor (Unassign) --</option>
              {mentors.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name} ({m.designation || 'Faculty'} • {m.menteeCount !== undefined ? m.menteeCount : (m.assignedStudents?.length || 0)} mentees)
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-role-primary hover:bg-role-primary text-white font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting ? <LoadingSpinner size="sm" color="text-white" /> : 'Save Allocation'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Student 360° Console Modal */}
      <Student360Modal
        isOpen={is360ModalOpen}
        onClose={() => {
          setIs360ModalOpen(false);
          setStudent360Id(null);
        }}
        studentId={student360Id}
      />
    </div>
  );
}
