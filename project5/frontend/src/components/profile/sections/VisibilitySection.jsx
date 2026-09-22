import React from 'react';
import { Shield } from 'lucide-react';
import ProfileSection from '../ProfileSection';

const VisibilitySection = ({ value = 'private', onChange }) => {
  const options = [
    { value: 'private', label: 'Private (Only me)', description: 'Your profile details are hidden from others' },
    { value: 'institution', label: 'Institution (All staff)', description: 'Visible to all faculty and staff' },
    { value: 'mentor', label: 'Mentor (My mentor only)', description: 'Only your assigned mentor can view your details' },
    { value: 'placement', label: 'Placement (TPO)', description: 'Visible to the Training & Placement Officer' }
  ];

  const currentOption = options.find(opt => opt.value === value) || options[0];

  return (
    <ProfileSection title="Profile Visibility" icon={Shield} defaultOpen={true}>
      <div className="space-y-5">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Control who can see your profile information across the platform. This setting applies to your personal details, academic history, and contact information.
        </p>
        
        <div className="w-full md:w-1/2">
          <label htmlFor="visibility-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Visibility Level
          </label>
          <div className="relative">
            <select
              id="visibility-select"
              value={value}
              onChange={(e) => onChange && onChange(e.target.value)}
              className="w-full appearance-none border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 pr-10 text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition text-slate-900 dark:text-slate-100"
            >
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
          <div className="text-sm text-slate-700 dark:text-slate-300">
            <span className="font-semibold text-slate-900 dark:text-slate-100 mr-2">Current Setting:</span>
            {currentOption.description}
          </div>
        </div>
      </div>
    </ProfileSection>
  );
};

export default VisibilitySection;
