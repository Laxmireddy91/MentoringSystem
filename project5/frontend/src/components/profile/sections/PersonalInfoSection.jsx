import React from 'react';
import { User, Lock } from 'lucide-react';
import ProfileSection from '../ProfileSection';

const PersonalInfoSection = ({ data = {}, onChange, readOnlyFields = [] }) => {
  const isReadOnly = (field) => readOnlyFields.includes(field);

  const handleChange = (field, value) => {
    if (onChange && !isReadOnly(field)) {
      onChange({ ...data, [field]: value });
    }
  };

  const renderInput = (id, label, type = 'text') => {
    const value = data[id] || '';
    const readOnly = isReadOnly(id);

    return (
      <div className="flex flex-col gap-2">
        <label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between">
          {label}
          {readOnly && (
            <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-normal">
              <Lock className="w-3.5 h-3.5" /> Read Only
            </span>
          )}
        </label>
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => handleChange(id, e.target.value)}
          disabled={readOnly}
          className={`w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] text-slate-900 dark:text-slate-100 ${
            readOnly 
              ? 'bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed opacity-80' 
              : 'bg-white dark:bg-slate-800'
          }`}
          placeholder={`Enter ${label.toLowerCase()}`}
        />
      </div>
    );
  };

  const bioValue = data.bio || '';
  const maxBioLength = 1000;
  const bioReadOnly = isReadOnly('bio');

  return (
    <ProfileSection title="Personal Information" icon={User} defaultOpen={true}>
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderInput('name', 'Full Name')}
          {renderInput('phone', 'Phone Number')}
          {renderInput('email', 'Email Address', 'email')}
          {renderInput('department', 'Department')}
          {isReadOnly('role') && renderInput('role', 'Role')}
        </div>
        
        <div className="flex flex-col gap-2 pt-2">
          <label htmlFor="bio" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Bio / About Me</span>
            {bioReadOnly && (
              <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-normal">
                <Lock className="w-3.5 h-3.5" /> Read Only
              </span>
            )}
          </label>
          <textarea
            id="bio"
            value={bioValue}
            onChange={(e) => handleChange('bio', e.target.value)}
            disabled={bioReadOnly}
            maxLength={maxBioLength}
            rows={4}
            className={`w-full border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-sm transition focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] text-slate-900 dark:text-slate-100 resize-y ${
              bioReadOnly 
                ? 'bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed opacity-80' 
                : 'bg-white dark:bg-slate-800'
            }`}
            placeholder={bioReadOnly ? "No bio provided." : "Tell us a little about yourself..."}
          />
          {!bioReadOnly && (
            <div className="flex justify-end mt-1">
              <span className={`text-xs ${bioValue.length >= maxBioLength ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>
                {bioValue.length} / {maxBioLength} characters
              </span>
            </div>
          )}
        </div>
      </div>
    </ProfileSection>
  );
};

export default PersonalInfoSection;
