import React from 'react';
import ProfileSection from '../ProfileSection';
import { GraduationCap, AlertTriangle } from 'lucide-react';

const StudentAcademicSection = ({ roleData, stats }) => {
  if (!roleData) return null;
  const s = stats || {};

  const renderLabelValue = (label, value) => (
    <div className="flex flex-col">
      <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">{label}</span>
      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{value || 'N/A'}</span>
    </div>
  );

  const getCgpaColor = (cgpa) => {
    if (!cgpa) return 'text-slate-800 dark:text-slate-100';
    if (cgpa >= 7) return 'text-green-600 dark:text-green-400';
    if (cgpa >= 5) return 'text-amber-500 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getAttendanceColor = (att) => {
    if (att === undefined || att === null) return 'text-slate-800 dark:text-slate-100';
    if (att >= 75) return 'text-green-600 dark:text-green-400';
    if (att >= 60) return 'text-amber-500 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'ACTIVE') return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (s === 'GRADUATED') return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    if (s === 'DROPPED') return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
  };

  const getRiskBadge = (level) => {
    const l = (level || '').toUpperCase();
    if (l === 'LOW') return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (l === 'MEDIUM') return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
    if (l === 'HIGH') return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    if (l === 'CRITICAL') return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
  };

  return (
    <ProfileSection icon={GraduationCap} title="Academic Information">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">CGPA</div>
          <div className={`text-2xl font-bold ${getCgpaColor(s.cgpa)}`}>{s.cgpa || '-'}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Attendance</div>
          <div className={`text-2xl font-bold ${getAttendanceColor(s.attendancePercentage)}`}>
            {s.attendancePercentage !== undefined ? `${s.attendancePercentage}%` : '-'}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Active Backlogs</div>
          <div className={`text-2xl font-bold ${s.totalActiveBacklogs > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
            {s.totalActiveBacklogs !== undefined ? s.totalActiveBacklogs : '-'}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Credits Earned</div>
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{s.totalEarnedCredits !== undefined ? s.totalEarnedCredits : '-'}</div>
        </div>
      </div>

      {/* Academic Details */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-y-5 gap-x-4 mb-6 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
        {renderLabelValue('USN', roleData.usn)}
        {renderLabelValue('Program', roleData.program)}
        {renderLabelValue('Department', roleData.department)}
        {renderLabelValue('Semester', roleData.semester)}
        {renderLabelValue('Section', roleData.section)}
        {renderLabelValue('Batch', roleData.batch)}
        {renderLabelValue('Admission Year', roleData.admissionYear)}
        {renderLabelValue('Academic Year', roleData.academicYear)}
        {renderLabelValue('Entry Type', roleData.entryType)}
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium mb-1">Status</span>
          <div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(roleData.status)}`}>
              {roleData.status || 'UNKNOWN'}
            </span>
          </div>
        </div>
      </div>

      {/* Additional Stats & Risk */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">Engagement</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
              <span className="text-sm text-slate-600 dark:text-slate-400">Goals Completed</span>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{s.completedGoalsCount || 0} / {s.goalsCount || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
              <span className="text-sm text-slate-600 dark:text-slate-400">Achievements</span>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{s.achievementsCount || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Mentoring Sessions</span>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{s.sessionsCount || 0}</span>
            </div>
          </div>
        </div>

        {roleData.riskProfile && (
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-800/30">
            <div className="flex items-center mb-3">
              <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Risk Profile</h4>
              <span className={`ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getRiskBadge(roleData.riskProfile.level)}`}>
                {roleData.riskProfile.level}
              </span>
            </div>
            {roleData.riskProfile.reasons && roleData.riskProfile.reasons.length > 0 && (
              <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400 space-y-1">
                {roleData.riskProfile.reasons.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </ProfileSection>
  );
};

export default StudentAcademicSection;
