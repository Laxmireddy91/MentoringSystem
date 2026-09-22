import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import DataTable from '../../components/common/DataTable';
import RiskBadge from '../../components/common/RiskBadge';
import Modal from '../../components/common/Modal';
import {
  Users,
  Search,
  Filter,
  Edit,
  Eye,
  Download,
  Plus,
  Trash2,
  Calendar,
  Phone,
  Mail,
  Award,
  BookOpen,
  Clock,
  FileSpreadsheet,
  Sparkles,
} from 'lucide-react';
import Student360Modal from '../../components/student/Student360Modal';

export default function MentorStudents() {
  const [loading, setLoading] = useState(true);
  const [mentees, setMentees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [semFilter, setSemFilter] = useState('ALL');

  // Marks Entry Modal State
  const [isMarksModalOpen, setIsMarksModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [targetSemester, setTargetSemester] = useState(1);
  const [subjectsList, setSubjectsList] = useState([]);
  const [savingMarks, setSavingMarks] = useState(false);

  // Profile Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'mentorship' | 'backlogs' | 'courses'

  // Student 360 Console Modal State
  const [is360ModalOpen, setIs360ModalOpen] = useState(false);
  const [student360Id, setStudent360Id] = useState(null);

  // Log Mentorship Interaction Modal State
  const [isInteractionModalOpen, setIsInteractionModalOpen] = useState(false);
  const [submittingInteraction, setSubmittingInteraction] = useState(false);
  const [interactionForm, setInteractionForm] = useState({
    date: new Date().toISOString().split('T')[0],
    agenda: '',
    discussionPoints: '',
    actionItems: '',
    nextFollowUpDate: '',
  });

  // Log Backlog Record Modal State
  const [isBacklogModalOpen, setIsBacklogModalOpen] = useState(false);
  const [submittingBacklog, setSubmittingBacklog] = useState(false);
  const [backlogForm, setBacklogForm] = useState({
    subjectCode: '',
    subjectName: '',
    semesterFailed: 1,
    isCleared: false,
    clearedSemester: '',
  });

  useEffect(() => {
    fetchMentees();
  }, []);

  const fetchMentees = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/mentors/my-students');
      const data = res.data?.data || [];
      setMentees(data);
      // If modal is open, refresh viewingStudent with latest data
      if (viewingStudent) {
        const updated = data.find((s) => s._id === viewingStudent._id);
        if (updated) setViewingStudent(updated);
      }
    } catch (err) {
      console.error('Error fetching mentees:', err);
    } finally {
      setLoading(false);
    }
  };

  const openMarksModal = async (student) => {
    setSelectedStudent(student);
    const currSem = student.currentSemester || 1;
    setTargetSemester(currSem);

    try {
      const res = await axiosClient.get(`/academics/student/${student._id}/semester/${currSem}`);
      const semData = res.data?.data;
      if (semData && semData.subjects?.length > 0) {
        setSubjectsList(semData.subjects);
      } else {
        setSubjectsList([
          { subjectCode: '', subjectName: '', credits: 3, cie1: 0, cie2: 0, cie3: 0, assignmentMarks: 0, semesterExamMarks: 0 },
        ]);
      }
    } catch (err) {
      setSubjectsList([
        { subjectCode: '', subjectName: '', credits: 3, cie1: 0, cie2: 0, cie3: 0, assignmentMarks: 0, semesterExamMarks: 0 },
      ]);
    }
    setIsMarksModalOpen(true);
  };

  const handleSubjectChange = (index, field, value) => {
    const updated = [...subjectsList];
    updated[index][field] = field === 'subjectCode' || field === 'subjectName' ? value : Number(value);
    setSubjectsList(updated);
  };

  const handleAddSubjectRow = () => {
    setSubjectsList([
      ...subjectsList,
      { subjectCode: '', subjectName: '', credits: 3, cie1: 0, cie2: 0, cie3: 0, assignmentMarks: 0, semesterExamMarks: 0 },
    ]);
  };

  const handleRemoveSubjectRow = (index) => {
    setSubjectsList(subjectsList.filter((_, i) => i !== index));
  };

  const handleSaveMarks = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    setSavingMarks(true);
    try {
      await axiosClient.put(`/academics/student/${selectedStudent._id}/semester/${targetSemester}`, {
        subjects: subjectsList,
      });
      alert('Marks and SGPA updated successfully!');
      setIsMarksModalOpen(false);
      await fetchMentees();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save academic marks.');
    } finally {
      setSavingMarks(false);
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

  const handleSaveInteraction = async (e) => {
    e.preventDefault();
    if (!viewingStudent) return;

    setSubmittingInteraction(true);
    try {
      const payload = {
        date: interactionForm.date || new Date(),
        agenda: interactionForm.agenda,
        discussionPoints: interactionForm.discussionPoints,
        actionItems: interactionForm.actionItems,
        nextFollowUpDate: interactionForm.nextFollowUpDate || undefined,
      };
      await axiosClient.post(`/students/${viewingStudent._id}/mentorship-records`, payload);
      alert('Mentorship meeting record logged successfully!');
      setIsInteractionModalOpen(false);
      setInteractionForm({
        date: new Date().toISOString().split('T')[0],
        agenda: '',
        discussionPoints: '',
        actionItems: '',
        nextFollowUpDate: '',
      });
      await fetchMentees();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to log mentorship record.');
    } finally {
      setSubmittingInteraction(false);
    }
  };

  const handleSaveBacklog = async (e) => {
    e.preventDefault();
    if (!viewingStudent) return;

    setSubmittingBacklog(true);
    try {
      const payload = {
        subjectCode: backlogForm.subjectCode,
        subjectName: backlogForm.subjectName,
        semesterFailed: Number(backlogForm.semesterFailed),
        isCleared: Boolean(backlogForm.isCleared),
        clearedSemester: backlogForm.isCleared && backlogForm.clearedSemester ? Number(backlogForm.clearedSemester) : undefined,
      };
      await axiosClient.post(`/students/${viewingStudent._id}/backlog-records`, payload);
      alert('Backlog record added successfully!');
      setIsBacklogModalOpen(false);
      setBacklogForm({
        subjectCode: '',
        subjectName: '',
        semesterFailed: 1,
        isCleared: false,
        clearedSemester: '',
      });
      await fetchMentees();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save backlog record.');
    } finally {
      setSubmittingBacklog(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen={false} message="Loading mentees roster..." />;

  // Filtering
  const filteredMentees = mentees.filter((m) => {
    const isNeedingAttention = (m.computedBacklogs ?? m.totalBacklogs ?? 0) > 0 || m.riskCategory === 'High' || m.riskCategory === 'Critical';
    const matchRisk =
      riskFilter === 'ALL' ||
      (riskFilter === 'Attention' && isNeedingAttention) ||
      (riskFilter === 'Good' && !isNeedingAttention) ||
      (m.riskProfile?.riskLevel || m.riskCategory || 'Low') === riskFilter;
    const sem = m.semester || m.currentSemester || 1;
    const matchSem = semFilter === 'ALL' || String(sem) === semFilter;
    return matchRisk && matchSem;
  });

  const columns = [
    {
      header: 'Student',
      accessorKey: 'name',
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-bold text-slate-800 dark:text-slate-100">{row.userId?.name || row.name || row.usn}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{row.usn}</p>
        </div>
      ),
    },
    {
      header: 'Sem / Sec',
      accessorKey: 'semester',
      sortable: true,
      cell: (row) => (
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          Sem {row.semester || row.currentSemester || 1} • {row.section || 'A'}
        </span>
      ),
    },
    {
      header: 'CGPA',
      accessorKey: 'cgpa',
      sortable: true,
      cell: (row) => {
        const val = row.computedCGPA ?? row.cgpa ?? 0;
        return (
          <span className="font-extrabold text-role-primary dark:text-indigo-400">
            {typeof val === 'number' ? val.toFixed(2) : val}
          </span>
        );
      },
    },
    {
      header: 'Backlogs',
      accessorKey: 'totalBacklogs',
      sortable: true,
      cell: (row) => {
        const backlogs = row.computedBacklogs ?? row.totalBacklogs ?? 0;
        return (
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              backlogs > 0
                ? 'bg-status-error text-status-error dark:bg-status-error dark:text-status-error'
                : 'bg-status-success text-status-success dark:bg-status-emerald dark:text-emerald-300'
            }`}
          >
            {backlogs}
          </span>
        );
      },
    },
    {
      header: 'Academic Standing',
      accessorKey: 'riskCategory',
      sortable: true,
      cell: (row) => {
        const needsAttention = (row.computedBacklogs ?? row.totalBacklogs ?? 0) > 0 || row.riskCategory === 'High' || row.riskCategory === 'Critical';
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
            <Users className="w-6 h-6 text-role-primary dark:text-indigo-400" />
            Assigned Mentees & Academic Records
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Conduct marks evaluation, inspect academic standing, log mentorship meetings, track backlogs, and view guardian details.
          </p>
        </div>

        <div className="text-xs font-semibold px-3 py-1.5 bg-role-soft dark:bg-role-soft-dark text-role-primary dark:text-indigo-300 rounded-xl border border-indigo-100 dark:border-role-primary">
          Total Assigned: {mentees.length} Students
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex-1 min-w-[240px]">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by student name or USN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus-role"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200"
          >
            <option value="ALL">All Academic Standings</option>
            <option value="Good">Good Standing</option>
            <option value="Attention">Needs Academic Attention</option>
          </select>

          <select
            value={semFilter}
            onChange={(e) => setSemFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200"
          >
            <option value="ALL">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={String(s)}>
                Semester {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mentees Table */}
      <DataTable
        columns={columns}
        data={filteredMentees}
        searchQuery={searchQuery}
        searchKeys={['usn', 'userId.name', 'userId.email', 'name', 'email']}
        pageSize={10}
        emptyMessage="No mentees match your search filter."
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
              onClick={() => openMarksModal(row)}
              className="px-2.5 py-1.5 bg-role-soft hover:bg-role-soft dark:bg-role-soft-dark dark:hover:bg-role-primary/60 text-role-primary dark:text-indigo-300 rounded-lg text-xs font-semibold transition flex items-center gap-1"
              title="Enter / Update Semester Marks"
            >
              <Edit className="w-3.5 h-3.5" /> Marks
            </button>

            <button
              onClick={() => {
                setViewingStudent(row);
                setActiveTab('overview');
                setIsProfileModalOpen(true);
              }}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
              title="View Comprehensive Profile & Mentorship History"
            >
              <Eye className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleDownloadReportCard(row)}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-role-primary dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
              title="Download PDF Report Card"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        )}
      />

      {/* Marks Entry Modal */}
      <Modal
        isOpen={isMarksModalOpen}
        onClose={() => setIsMarksModalOpen(false)}
        title={`Enter Academic Marks: ${selectedStudent?.userId?.name || selectedStudent?.name || ''} (${selectedStudent?.usn || ''})`}
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleSaveMarks} className="space-y-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl">
            <div className="flex items-center gap-3">
              <label className="font-bold text-slate-700 dark:text-slate-200">Semester:</label>
              <select
                value={targetSemester}
                onChange={(e) => setTargetSemester(Number(e.target.value))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleAddSubjectRow}
              className="px-3 py-1.5 bg-role-primary hover:bg-role-primary text-white rounded-lg font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Subject
            </button>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 font-bold uppercase text-[10px] text-slate-500 border-b border-slate-200 dark:border-slate-700 sticky top-0">
                <tr>
                  <th className="p-2">Code</th>
                  <th className="p-2">Subject Name</th>
                  <th className="p-2 w-14 text-center">Credits</th>
                  <th className="p-2 w-16 text-center">CIE-1 (50)</th>
                  <th className="p-2 w-16 text-center">CIE-2 (50)</th>
                  <th className="p-2 w-16 text-center">CIE-3 (50)</th>
                  <th className="p-2 w-16 text-center">Asgn (10)</th>
                  <th className="p-2 w-16 text-center">SEE (50)</th>
                  <th className="p-2 w-10 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {subjectsList.map((sub, idx) => (
                  <tr key={idx}>
                    <td className="p-1.5">
                      <input
                        type="text"
                        required
                        placeholder="21CS51"
                        value={sub.subjectCode}
                        onChange={(e) => handleSubjectChange(idx, 'subjectCode', e.target.value)}
                        className="w-20 p-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-[11px]"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="text"
                        required
                        placeholder="Subject Name"
                        value={sub.subjectName}
                        onChange={(e) => handleSubjectChange(idx, 'subjectName', e.target.value)}
                        className="w-full p-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="number"
                        min="1"
                        max="6"
                        required
                        value={sub.credits}
                        onChange={(e) => handleSubjectChange(idx, 'credits', e.target.value)}
                        className="w-12 p-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={sub.cie1 ?? 0}
                        onChange={(e) => handleSubjectChange(idx, 'cie1', e.target.value)}
                        className="w-14 p-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={sub.cie2 ?? 0}
                        onChange={(e) => handleSubjectChange(idx, 'cie2', e.target.value)}
                        className="w-14 p-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={sub.cie3 ?? 0}
                        onChange={(e) => handleSubjectChange(idx, 'cie3', e.target.value)}
                        className="w-14 p-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={sub.assignmentMarks ?? 0}
                        onChange={(e) => handleSubjectChange(idx, 'assignmentMarks', e.target.value)}
                        className="w-14 p-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={sub.semesterExamMarks ?? 0}
                        onChange={(e) => handleSubjectChange(idx, 'semesterExamMarks', e.target.value)}
                        className="w-14 p-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center"
                      />
                    </td>
                    <td className="p-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveSubjectRow(idx)}
                        className="text-slate-500 dark:text-slate-400 hover:text-rose-500 p-1"
                        title="Remove Subject"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-status-warning dark:bg-status-amber rounded-xl border border-status-warning/60 text-status-warning dark:text-amber-300 text-[11px]">
            💡 Best 2 of 3 CIE tests will be scaled to 40 marks automatically + Assignment (10 marks) + SEE (50 marks). Final SGPA and updated risk score will be computed instantly.
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsMarksModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingMarks || subjectsList.length === 0}
              className="px-4 py-2 rounded-xl bg-role-primary hover:bg-role-primary text-white font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {savingMarks ? <LoadingSpinner size="sm" color="text-white" /> : 'Save & Compute SGPA'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Comprehensive Mentee Profile & Records Modal */}
      <Modal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        title={`Student Profile: ${viewingStudent?.userId?.name || viewingStudent?.name || viewingStudent?.usn || ''}`}
        maxWidth="max-w-4xl"
      >
        {viewingStudent && (
          <div className="space-y-5 text-xs">
            {/* Top Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  activeTab === 'overview'
                    ? 'bg-role-primary text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Overview & Guardian
              </button>
              <button
                onClick={() => setActiveTab('mentorship')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                  activeTab === 'mentorship'
                    ? 'bg-role-primary text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Mentorship Log ({viewingStudent.mentorshipRecords?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('backlogs')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                  activeTab === 'backlogs'
                    ? 'bg-role-primary text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Backlogs History ({viewingStudent.backlogRecords?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('courses')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                  activeTab === 'courses'
                    ? 'bg-role-primary text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                Online Courses ({viewingStudent.onlineCoursesAttended?.length || 0})
              </button>
            </div>

            {/* TAB 1: OVERVIEW & GUARDIAN */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block font-medium">USN</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{viewingStudent.usn}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block font-medium">Email</span>
                    <span className="text-slate-800 dark:text-slate-100 truncate block">{viewingStudent.userId?.email || viewingStudent.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block font-medium">Department</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{viewingStudent.department}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block font-medium">Semester / Section</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">
                      Sem {viewingStudent.semester || viewingStudent.currentSemester || 1} • {viewingStudent.section || 'A'}
                    </span>
                  </div>
                </div>

                {/* Performance Summary Cards */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-role-soft dark:bg-role-soft-dark rounded-xl border border-indigo-100 dark:border-role-primary/50">
                    <span className="text-slate-500 dark:text-slate-400 block font-medium">Cumulative CGPA</span>
                    <span className="text-xl font-black text-role-primary dark:text-indigo-400">
                      {(viewingStudent.computedCGPA ?? viewingStudent.cgpa ?? 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 block font-medium">Active Backlogs</span>
                    <span className="text-xl font-black text-slate-800 dark:text-slate-100">
                      {viewingStudent.computedBacklogs ?? viewingStudent.totalBacklogs ?? 0}
                    </span>
                  </div>
                  <div className="p-3 bg-rose-50 dark:bg-status-error/40 rounded-xl border border-rose-100 dark:border-rose-900/50">
                    <span className="text-slate-500 dark:text-slate-400 block font-medium">Risk Score</span>
                    <span className="text-xl font-black text-rose-600">
                      {viewingStudent.riskProfile?.riskScore ?? viewingStudent.riskScore ?? 0}/100
                    </span>
                  </div>
                </div>

                {/* Parent & Emergency Info */}
                <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3 bg-white dark:bg-slate-800/60">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-status-success dark:text-emerald-400" />
                    <span className="font-bold text-slate-700 dark:text-slate-200 uppercase text-[11px] tracking-wide">
                      Parent / Guardian & Emergency Contact
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600 dark:text-slate-300">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block font-medium">Guardian Name & Relationship</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        {viewingStudent.parentDetails?.guardianName || viewingStudent.parentName || 'Not recorded'} 
                        {viewingStudent.parentDetails?.guardianRelationship ? ` (${viewingStudent.parentDetails.guardianRelationship})` : ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block font-medium">Emergency Contact Number</span>
                      <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        {viewingStudent.parentDetails?.emergencyContact || viewingStudent.parentPhone || 'Not recorded'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block font-medium">Primary Parent Phone</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        {viewingStudent.parentDetails?.phone || viewingStudent.parentPhone || 'Not recorded'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block font-medium">Parent Email</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {viewingStudent.parentDetails?.email || viewingStudent.parentEmail || 'Not recorded'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: MENTORSHIP INTERACTION HISTORY */}
            {activeTab === 'mentorship' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-slate-500 dark:text-slate-400">
                    Official record of face-to-face mentorship discussions, action plans, and follow-ups.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsInteractionModalOpen(true)}
                    className="px-3 py-1.5 bg-role-primary hover:bg-role-primary text-white font-semibold rounded-lg shadow-sm transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Log Interaction
                  </button>
                </div>

                {viewingStudent.mentorshipRecords?.length > 0 ? (
                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/80 font-bold uppercase text-[10px] text-slate-500 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="p-3">Date</th>
                          <th className="p-3">Agenda / Topic</th>
                          <th className="p-3">Discussion Points</th>
                          <th className="p-3">Action Items</th>
                          <th className="p-3">Next Follow-Up</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {viewingStudent.mentorshipRecords.map((rec, i) => (
                          <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="p-3 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              {new Date(rec.date).toLocaleDateString()}
                            </td>
                            <td className="p-3 font-bold text-slate-800 dark:text-slate-100">{rec.agenda}</td>
                            <td className="p-3 text-slate-600 dark:text-slate-300 max-w-xs">{rec.discussionPoints || '—'}</td>
                            <td className="p-3 text-slate-600 dark:text-slate-300 max-w-xs">{rec.actionItems || '—'}</td>
                            <td className="p-3 text-role-primary dark:text-indigo-400 font-semibold whitespace-nowrap">
                              {rec.nextFollowUpDate ? new Date(rec.nextFollowUpDate).toLocaleDateString() : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                    <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700 dark:text-slate-200">No mentorship interactions logged yet.</p>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Click "+ Log Interaction" to record notes from your latest meeting.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: BACKLOGS CLEARANCE HISTORY */}
            {activeTab === 'backlogs' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-slate-500 dark:text-slate-400">
                    Historical record of failed subjects and clearance progress across semesters.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsBacklogModalOpen(true)}
                    className="px-3 py-1.5 bg-role-primary hover:bg-role-primary text-white font-semibold rounded-lg shadow-sm transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Backlog Record
                  </button>
                </div>

                {viewingStudent.backlogRecords?.length > 0 ? (
                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/80 font-bold uppercase text-[10px] text-slate-500 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="p-3">Subject Code</th>
                          <th className="p-3">Subject Name</th>
                          <th className="p-3 text-center">Failed In Sem</th>
                          <th className="p-3 text-center">Cleared In Sem</th>
                          <th className="p-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {viewingStudent.backlogRecords.map((b, i) => (
                          <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-100">{b.subjectCode}</td>
                            <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">{b.subjectName}</td>
                            <td className="p-3 text-center text-slate-600 dark:text-slate-300">Sem {b.semesterFailed}</td>
                            <td className="p-3 text-center text-slate-600 dark:text-slate-300">{b.clearedSemester ? `Sem ${b.clearedSemester}` : '—'}</td>
                            <td className="p-3 text-center">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  b.isCleared
                                    ? 'bg-status-success text-status-success dark:bg-status-emerald dark:text-emerald-300'
                                    : 'bg-status-error text-status-error dark:bg-status-error dark:text-status-error'
                                }`}
                              >
                                {b.isCleared ? 'CLEARED' : 'PENDING'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                    <FileSpreadsheet className="w-8 h-8 text-slate-500 dark:text-slate-400 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700 dark:text-slate-200">No backlogs recorded for this student.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: ONLINE COURSES ATTENDED */}
            {activeTab === 'courses' && (
              <div className="space-y-4">
                <p className="text-slate-500 dark:text-slate-400">
                  External certifications and MOOC courses completed by this student (NPTEL, Coursera, Udemy, etc.).
                </p>

                {viewingStudent.onlineCoursesAttended?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {viewingStudent.onlineCoursesAttended.map((c, i) => (
                      <div key={i} className="p-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 dark:text-slate-100">{c.courseName}</span>
                          <span className="px-2 py-0.5 bg-role-soft text-role-primary dark:bg-role-soft-dark dark:text-indigo-300 rounded font-bold text-[10px]">
                            {c.platform || 'MOOC'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {c.durationWeeks ? `${c.durationWeeks} weeks` : 'Self-paced'}
                          </span>
                          {c.completionDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {new Date(c.completionDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        {c.certificateUrl && (
                          <a
                            href={c.certificateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block text-role-primary dark:text-indigo-400 hover:underline font-semibold text-[11px] pt-1"
                          >
                            🔗 View Verified Certificate
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                    <Award className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700 dark:text-slate-200">No online courses uploaded yet.</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Log Mentorship Interaction Modal */}
      <Modal
        isOpen={isInteractionModalOpen}
        onClose={() => setIsInteractionModalOpen(false)}
        title={`Log Mentorship Interaction: ${viewingStudent?.userId?.name || viewingStudent?.name || ''}`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveInteraction} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">Meeting Date *</label>
              <input
                type="date"
                required
                value={interactionForm.date}
                onChange={(e) => setInteractionForm({ ...interactionForm, date: e.target.value })}
                className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">Next Follow-Up Date</label>
              <input
                type="date"
                value={interactionForm.nextFollowUpDate}
                onChange={(e) => setInteractionForm({ ...interactionForm, nextFollowUpDate: e.target.value })}
                className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">Agenda / Topic *</label>
            <input
              type="text"
              required
              placeholder="e.g. Mid-term Performance Review & Career Guidance"
              value={interactionForm.agenda}
              onChange={(e) => setInteractionForm({ ...interactionForm, agenda: e.target.value })}
              className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">Discussion Points</label>
            <textarea
              rows={3}
              placeholder="Key observations regarding academic progress, project milestones, or personal challenges..."
              value={interactionForm.discussionPoints}
              onChange={(e) => setInteractionForm({ ...interactionForm, discussionPoints: e.target.value })}
              className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">Action Items / Remedial Steps</label>
            <textarea
              rows={2}
              placeholder="Action items assigned to the student before next review..."
              value={interactionForm.actionItems}
              onChange={(e) => setInteractionForm({ ...interactionForm, actionItems: e.target.value })}
              className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsInteractionModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingInteraction || !interactionForm.agenda}
              className="px-4 py-2 rounded-xl bg-role-primary hover:bg-role-primary text-white font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {submittingInteraction ? <LoadingSpinner size="sm" color="text-white" /> : 'Log Record'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Backlog Record Modal */}
      <Modal
        isOpen={isBacklogModalOpen}
        onClose={() => setIsBacklogModalOpen(false)}
        title={`Add Backlog Record: ${viewingStudent?.userId?.name || viewingStudent?.name || ''}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveBacklog} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">Subject Code *</label>
              <input
                type="text"
                required
                placeholder="21CS32"
                value={backlogForm.subjectCode}
                onChange={(e) => setBacklogForm({ ...backlogForm, subjectCode: e.target.value })}
                className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">Failed In Sem *</label>
              <select
                value={backlogForm.semesterFailed}
                onChange={(e) => setBacklogForm({ ...backlogForm, semesterFailed: Number(e.target.value) })}
                className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">Subject Name *</label>
            <input
              type="text"
              required
              placeholder="Data Structures and Algorithms"
              value={backlogForm.subjectName}
              onChange={(e) => setBacklogForm({ ...backlogForm, subjectName: e.target.value })}
              className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={backlogForm.isCleared}
                onChange={(e) => setBacklogForm({ ...backlogForm, isCleared: e.target.checked })}
                className="w-4 h-4 text-role-primary rounded"
              />
              Has this backlog been cleared?
            </label>

            {backlogForm.isCleared && (
              <div className="pt-2">
                <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">Cleared In Semester</label>
                <select
                  value={backlogForm.clearedSemester}
                  onChange={(e) => setBacklogForm({ ...backlogForm, clearedSemester: e.target.value })}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold"
                >
                  <option value="">Select clearance semester...</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsBacklogModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingBacklog || !backlogForm.subjectCode || !backlogForm.subjectName}
              className="px-4 py-2 rounded-xl bg-role-primary hover:bg-role-primary text-white font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {submittingBacklog ? <LoadingSpinner size="sm" color="text-white" /> : 'Save Record'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Student 360 Console Modal */}
      <Student360Modal
        isOpen={is360ModalOpen}
        onClose={() => setIs360ModalOpen(false)}
        studentId={student360Id}
      />
    </div>
  );
}

