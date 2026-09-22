import React from 'react';
import ProfileSection from '../ProfileSection';
import { Users, Calendar, CheckCircle } from 'lucide-react';

const StudentMentoringSection = ({ roleData, stats }) => {
  const mentor = roleData?.mentor;
  const s = stats || {};

  const renderLabelValue = (label, value) => (
    <div className="flex flex-col">
      <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">{label}</span>
      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{value || 'N/A'}</span>
    </div>
  );

  return (
    <ProfileSection icon={Users} title="Mentoring">
      {!mentor ? (
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">No mentor assigned yet. Contact your department coordinator.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">Assigned Mentor</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {renderLabelValue('Name', mentor.name)}
              {renderLabelValue('Designation', mentor.designation)}
              {renderLabelValue('Department', mentor.department)}
              {renderLabelValue('Employee ID', mentor.employeeId)}
              {renderLabelValue('Email', mentor.email)}
              {renderLabelValue('Phone', mentor.phone)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="p-3 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mr-4">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">Total Sessions</div>
                <div className="text-xl font-bold text-slate-800 dark:text-slate-100">{s.sessionsCount || 0}</div>
              </div>
            </div>

            <div className="flex items-center p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="p-3 rounded-full bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 mr-4">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">Latest Session</div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">
                  {s.latestSession?.date ? new Date(s.latestSession.date).toLocaleDateString() : 'None yet'}
                </div>
              </div>
            </div>

            <div className="flex items-center p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="p-3 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 mr-4">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">Upcoming Session</div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">
                  {s.upcomingSession?.date ? new Date(s.upcomingSession.date).toLocaleDateString() : 'None scheduled'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProfileSection>
  );
};

export default StudentMentoringSection;
