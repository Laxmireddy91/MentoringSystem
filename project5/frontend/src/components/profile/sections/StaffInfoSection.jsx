import React from 'react';
import ProfileSection from '../ProfileSection';
import { Building2 } from 'lucide-react';

const StaffInfoSection = ({ roleData, stats, role }) => {
  if (!roleData) return null;

  const getTitle = () => {
    switch(role) {
      case 'hod': return 'Department Information';
      case 'mentoring_coordinator': return 'Coordinator Information';
      case 'exam_coordinator': return 'Examination Responsibilities';
      case 'tpo': return 'Placement Office';
      default: return 'Staff Information';
    }
  };

  const renderLabelValue = (label, value) => (
    <div className="flex flex-col">
      <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">{label}</span>
      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{value || 'N/A'}</span>
    </div>
  );

  return (
    <ProfileSection icon={Building2} title={getTitle()}>
      <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {renderLabelValue('Employee ID', roleData.employeeId)}
          {renderLabelValue('Department', roleData.department)}
          {renderLabelValue('Designation', roleData.designation)}
        </div>
      </div>
      
      {stats && (stats.studentCount !== undefined || stats.mentorCount !== undefined) && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {stats.studentCount !== undefined && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Students</span>
              <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.studentCount}</span>
            </div>
          )}
          {stats.mentorCount !== undefined && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Mentors</span>
              <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.mentorCount}</span>
            </div>
          )}
        </div>
      )}
    </ProfileSection>
  );
};

export default StaffInfoSection;
