import React, { useState } from 'react';
import { Briefcase, Plus, Trash2, Calendar } from 'lucide-react';
import ProfileSection from '../ProfileSection';

const ExperienceSection = ({ experience = [], onChange, editable = true }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newExp, setNewExp] = useState({
    organization: '',
    role: '',
    startDate: '',
    endDate: '',
    currentlyWorking: false,
    description: ''
  });

  const handleAdd = () => {
    if (newExp.organization.trim() && newExp.role.trim()) {
      onChange([...experience, newExp]);
      setNewExp({
        organization: '',
        role: '',
        startDate: '',
        endDate: '',
        currentlyWorking: false,
        description: ''
      });
      setIsAdding(false);
    }
  };

  const handleRemove = (index) => {
    const updated = experience.filter((_, i) => i !== index);
    onChange(updated);
  };

  const headerActions = editable && !isAdding ? (
    <button
      onClick={() => setIsAdding(true)}
      className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg text-white"
      style={{ backgroundColor: 'var(--primary-color)' }}
    >
      <Plus size={16} />
      Add Experience
    </button>
  ) : null;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString; // fallback to raw string
      return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  return (
    <ProfileSection icon={Briefcase} title="Experience" headerActions={headerActions}>
      {isAdding && (
        <div className="mb-5 p-5 border rounded-xl dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role / Job Title</label>
              <input
                type="text"
                placeholder="e.g. Software Engineer Intern"
                value={newExp.role}
                onChange={(e) => setNewExp({ ...newExp, role: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Organization / Company</label>
              <input
                type="text"
                placeholder="Company Name"
                value={newExp.organization}
                onChange={(e) => setNewExp({ ...newExp, organization: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
              <input
                type="month"
                value={newExp.startDate}
                onChange={(e) => setNewExp({ ...newExp, startDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End Date</label>
              <input
                type="month"
                value={newExp.endDate}
                disabled={newExp.currentlyWorking}
                onChange={(e) => setNewExp({ ...newExp, endDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:border-slate-600 dark:bg-slate-700 dark:text-white disabled:opacity-50"
              />
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="currentWork"
                  checked={newExp.currentlyWorking}
                  onChange={(e) => setNewExp({ ...newExp, currentlyWorking: e.target.checked, endDate: '' })}
                  className="rounded border-slate-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)]"
                />
                <label htmlFor="currentWork" className="text-sm text-slate-600 dark:text-slate-400">I currently work here</label>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
              <textarea
                placeholder="Describe your responsibilities and achievements"
                value={newExp.description}
                onChange={(e) => setNewExp({ ...newExp, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                rows="3"
              ></textarea>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              className="px-4 py-2 text-white rounded-lg font-medium"
              style={{ backgroundColor: 'var(--primary-color)' }}
            >
              Save
            </button>
          </div>
        </div>
      )}

      {experience.length === 0 && !isAdding ? (
        <p className="text-slate-500 dark:text-slate-400 italic">No experience added yet.</p>
      ) : (
        <div className="space-y-4">
          {experience.map((exp, index) => (
            <div key={index} className="relative border dark:border-slate-700 rounded-xl p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
              {editable && (
                <button
                  onClick={() => handleRemove(index)}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={18} />
                </button>
              )}
              <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 pr-10">{exp.role}</h4>
              <p className="text-md font-medium text-[var(--primary-color)] mt-1">{exp.organization}</p>
              
              <div className="flex items-center gap-1.5 mt-2 text-sm text-slate-500 dark:text-slate-400">
                <Calendar size={14} />
                <span>
                  {formatDate(exp.startDate) || 'Unknown'} - {exp.currentlyWorking ? 'Present' : (formatDate(exp.endDate) || 'Unknown')}
                </span>
              </div>
              
              {exp.description && (
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line">{exp.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </ProfileSection>
  );
};

export default ExperienceSection;
