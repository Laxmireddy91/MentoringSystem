import React from 'react';
import ProfileSection from '../ProfileSection';
import { UserCheck, Star } from 'lucide-react';

const MentorInfoSection = ({ roleData, stats }) => {
  if (!roleData) return null;
  const s = stats || {};

  const renderLabelValue = (label, value) => (
    <div className="flex flex-col">
      <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">{label}</span>
      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{value || 'N/A'}</span>
    </div>
  );

  const capacityPercent = roleData.maxMentees ? Math.round(((s.activeMenteeCount || 0) / roleData.maxMentees) * 100) : 0;
  
  return (
    <ProfileSection icon={UserCheck} title="Mentoring Profile">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Active Mentees</div>
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{s.activeMenteeCount || 0} <span className="text-sm font-normal text-slate-400">/ {roleData.maxMentees || '-'}</span></div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Available Capacity</div>
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{s.availableCapacity || 0}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Sessions Completed</div>
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{s.completedSessionsCount || 0}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Rating</div>
          <div className="flex items-center">
            <span className="text-2xl font-bold text-slate-800 dark:text-slate-100 mr-2">{roleData.ratingAverage || 'N/A'}</span>
            <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
            <span className="text-xs text-slate-400 ml-2">({roleData.totalRatings || 0})</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {renderLabelValue('Employee ID', roleData.employeeId)}
            {renderLabelValue('Department', roleData.department)}
            {renderLabelValue('Designation', roleData.designation)}
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">Status</span>
              <div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1 ${roleData.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'}`}>
                  {roleData.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <h4 className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium mb-3">Capacity Utilization</h4>
          <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 mb-2">
            <div 
              className={`h-2.5 rounded-full ${capacityPercent > 90 ? 'bg-red-500' : capacityPercent > 75 ? 'bg-amber-500' : 'bg-green-500'}`} 
              style={{ width: `${Math.min(capacityPercent, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-5">
            <span>0</span>
            <span>{capacityPercent}% full</span>
            <span>{roleData.maxMentees}</span>
          </div>

          <h4 className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium mb-2 mt-4">Specializations</h4>
          <div className="flex flex-wrap gap-2">
            {roleData.specialization && roleData.specialization.length > 0 ? (
              roleData.specialization.map((spec, idx) => (
                <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-role-soft text-role-primary border border-role-primary/20">
                  {spec}
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-500">None specified</span>
            )}
          </div>
        </div>
      </div>
    </ProfileSection>
  );
};

export default MentorInfoSection;
