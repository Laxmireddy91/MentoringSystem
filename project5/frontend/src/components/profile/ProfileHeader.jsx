import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Mail, Phone, Calendar, ShieldCheck, ShieldAlert, CheckCircle, Edit3, KeyRound, Shield } from 'lucide-react';
import UserAvatar from '../common/UserAvatar';

const ROLE_LABELS = {
  student: 'Student',
  mentor: 'Mentor / Faculty',
  mentoring_coordinator: 'Mentoring Coordinator',
  hod: 'Head of Department',
  exam_coordinator: 'Exam Coordinator',
  tpo: 'Training & Placement Officer',
  parent: 'Parent / Guardian'
};

const ProfileHeader = ({
  user = {},
  roleData = {},
  stats = {},
  completionPercentage = 0,
  completionItems = [],
  onAvatarChange,
  onEditProfile,
}) => {
  const roleLabel = ROLE_LABELS[user.role] || user.role;
  const identifier = roleData.usn || roleData.employeeId || 'ID Pending';
  const isActive = user.isActive !== false;

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden relative">
      {/* Role-accent gradient top border */}
      <div className="h-2 w-full bg-gradient-to-r from-[var(--primary-soft)] via-[var(--primary-color)] to-[var(--primary-dark)]"></div>
      
      <div className="p-5 md:p-8">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
          
          {/* Avatar Section */}
          <div className="flex-shrink-0 relative group self-center md:self-start">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden shadow-md ring-4 ring-white dark:ring-slate-800 bg-slate-100 dark:bg-slate-800">
              <UserAvatar size="w-full h-full" />
            </div>
            {onAvatarChange && (
              <button
                onClick={onAvatarChange}
                className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full text-white text-sm font-medium backdrop-blur-sm ring-4 ring-transparent"
              >
                Change Photo
              </button>
            )}
          </div>

          {/* User Info Section */}
          <div className="flex-1 w-full min-w-0">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-5 mb-5">
              
              <div className="text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center justify-center md:justify-start gap-3">
                  {user.name || 'Unknown User'}
                  {isActive ? (
                    <span title="Active Account" className="inline-flex items-center p-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-500">
                      <ShieldCheck className="w-5 h-5" />
                    </span>
                  ) : (
                    <span title="Inactive Account" className="inline-flex items-center p-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-500">
                      <ShieldAlert className="w-5 h-5" />
                    </span>
                  )}
                </h1>
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-3">
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-role-soft text-role-primary dark:bg-[var(--primary-dark)] dark:text-[var(--primary-soft)] border border-[var(--primary-border)]">
                    {roleLabel}
                  </span>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {identifier}
                  </span>
                  {user.department && (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {user.department}
                    </span>
                  )}
                </div>
              </div>

              {/* Completion Bar */}
              <div className="flex flex-col items-center md:items-end w-full md:w-56 shrink-0 mt-2 md:mt-0">
                <div className="w-full relative group">
                  <div className="flex justify-between items-center mb-1.5 cursor-help">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Profile Completion
                    </span>
                    <span className="text-sm font-bold text-[var(--primary-color)]">
                      {completionPercentage}%
                    </span>
                  </div>
                  
                  <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--primary-color)] rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${completionPercentage}%` }}
                    ></div>
                  </div>

                  {/* Completion Tooltip */}
                  {completionItems.length > 0 && (
                    <div className="hidden group-hover:block absolute z-10 w-56 p-3 mt-2 -right-2 md:right-0 text-sm bg-slate-800 dark:bg-slate-700 text-white rounded-lg shadow-xl border border-slate-700 dark:border-slate-600">
                      <div className="font-semibold mb-2 text-slate-200 border-b border-slate-600 pb-1">Checklist</div>
                      <div className="space-y-2">
                        {completionItems.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <CheckCircle className={`w-4 h-4 mt-0.5 shrink-0 ${item.completed ? 'text-green-400' : 'text-slate-500'}`} />
                            <span className={`text-xs ${item.completed ? 'opacity-100' : 'opacity-60 text-slate-300'}`}>
                              {item.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Meta Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl mb-4">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 shrink-0 text-slate-400" />
                <span className="truncate" title="S G Balekundri Institute of Technology">
                  S G Balekundri Institute of Technology
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 shrink-0 text-slate-400" />
                <span className="truncate">{user.email || 'No email provided'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 shrink-0 text-slate-400" />
                <span>{user.phone || 'Not added yet'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 shrink-0 text-slate-400" />
                <span>Last updated: {formatDate(user.updatedAt)}</span>
              </div>
            </div>

            {/* Profile Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={onEditProfile}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-role-soft text-role-primary border border-role-primary/25 hover:opacity-90 transition cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Profile
              </button>
              <Link
                to="/forgot-password"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                <KeyRound className="w-3.5 h-3.5" />
                Change Password
              </Link>
              <Link
                to="/2fa"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                <Shield className="w-3.5 h-3.5" />
                Account Security (2FA)
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
