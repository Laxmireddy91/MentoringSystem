import React from 'react';
import ProfileSection from '../ProfileSection';
import { Heart, GraduationCap, Users, AlertTriangle } from 'lucide-react';

const ParentWardSection = ({ roleData, stats }) => {
  if (!roleData || !roleData.ward) return null;
  const ward = roleData.ward;
  const s = stats || {};

  const renderLabelValue = (label, value) => (
    <div className="flex flex-col mb-3">
      <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">{label}</span>
      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{value || 'N/A'}</span>
    </div>
  );

  const getStatusBadge = (status) => {
    const st = (status || '').toUpperCase();
    if (st === 'ACTIVE') return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (st === 'GRADUATED') return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
  };

  return (
    <ProfileSection icon={Heart} title="Ward Information">
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="bg-role-soft px-4 py-2 rounded-lg border border-role-primary/20">
          <span className="text-xs text-role-primary font-medium block">Relation</span>
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{roleData.relation || 'Parent/Guardian'}</span>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Student USN</span>
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{roleData.studentUsn || ward.usn}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ward Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center mb-4">
              <GraduationCap className="h-5 w-5 text-role-primary mr-2" />
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base">{ward.name}</h3>
              <span className={`ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(ward.status)}`}>
                {ward.status || 'UNKNOWN'}
              </span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {renderLabelValue('USN', ward.usn)}
              {renderLabelValue('Program', ward.program)}
              {renderLabelValue('Department', ward.department)}
              {renderLabelValue('Semester', ward.semester)}
              {renderLabelValue('Section', ward.section)}
              {renderLabelValue('Batch', ward.batch)}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">Academic Overview</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">CGPA</span>
                <div className="text-xl font-bold mt-1 text-slate-800 dark:text-slate-100">{s.cgpa || '-'}</div>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">Attendance</span>
                <div className="text-xl font-bold mt-1 text-slate-800 dark:text-slate-100">{s.attendancePercentage !== undefined ? `${s.attendancePercentage}%` : '-'}</div>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">Backlogs</span>
                <div className="text-xl font-bold mt-1 text-slate-800 dark:text-slate-100">{s.totalActiveBacklogs !== undefined ? s.totalActiveBacklogs : '-'}</div>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">Mentoring</span>
                <div className="text-xl font-bold mt-1 text-slate-800 dark:text-slate-100">{s.sessionsCount || 0} <span className="text-xs font-normal">sessions</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Mentor & Risk */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center mb-4">
              <Users className="h-5 w-5 text-role-primary mr-2" />
              <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Assigned Mentor</h4>
            </div>
            
            {ward.mentor ? (
              <div className="space-y-3">
                <div className="font-medium text-slate-800 dark:text-slate-100">{ward.mentor.name}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">{ward.mentor.designation}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">{ward.mentor.department}</div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <a href={`mailto:${ward.mentor.email}`} className="text-sm text-role-primary hover:underline truncate block">{ward.mentor.email}</a>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No mentor assigned.</p>
            )}
          </div>

          {ward.riskProfile && ward.riskProfile.level && (
            <div className="bg-orange-50 dark:bg-orange-900/20 p-5 rounded-xl border border-orange-100 dark:border-orange-800/30">
              <div className="flex items-center mb-2">
                <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Risk Profile</h4>
                <span className="ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                  {ward.riskProfile.level}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                Contact the mentor for more details on your ward's academic standing.
              </p>
            </div>
          )}
        </div>
      </div>
    </ProfileSection>
  );
};

export default ParentWardSection;
