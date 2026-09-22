import React, { useState } from 'react';
import { GraduationCap, Plus, Trash2, Calendar } from 'lucide-react';
import ProfileSection from '../ProfileSection';

const EducationSection = ({ education = [], onChange, editable = true }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newEdu, setNewEdu] = useState({
    qualification: '',
    institution: 'S G Balekundri Institute of Technology',
    field: '',
    startYear: '',
    endYear: '',
    grade: '',
    description: ''
  });

  const handleAdd = () => {
    if (newEdu.qualification.trim() && newEdu.institution.trim()) {
      onChange([...education, newEdu]);
      setNewEdu({
        qualification: '',
        institution: 'S G Balekundri Institute of Technology',
        field: '',
        startYear: '',
        endYear: '',
        grade: '',
        description: ''
      });
      setIsAdding(false);
    }
  };

  const handleRemove = (index) => {
    const updated = education.filter((_, i) => i !== index);
    onChange(updated);
  };

  const headerActions = editable && !isAdding ? (
    <button
      onClick={() => setIsAdding(true)}
      className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg text-white"
      style={{ backgroundColor: 'var(--primary-color)' }}
    >
      <Plus size={16} />
      Add Education
    </button>
  ) : null;

  return (
    <ProfileSection icon={GraduationCap} title="Education" headerActions={headerActions}>
      {isAdding && (
        <div className="mb-5 p-5 border rounded-xl dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Qualification / Degree</label>
              <input
                type="text"
                placeholder="e.g. Bachelor of Engineering"
                value={newEdu.qualification}
                onChange={(e) => setNewEdu({ ...newEdu, qualification: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Institution</label>
              <input
                type="text"
                placeholder="Institution Name"
                value={newEdu.institution}
                onChange={(e) => setNewEdu({ ...newEdu, institution: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Field of Study</label>
              <input
                type="text"
                placeholder="e.g. Computer Science"
                value={newEdu.field}
                onChange={(e) => setNewEdu({ ...newEdu, field: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Grade / CGPA</label>
              <input
                type="text"
                placeholder="e.g. 8.5 CGPA"
                value={newEdu.grade}
                onChange={(e) => setNewEdu({ ...newEdu, grade: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Year</label>
              <input
                type="text"
                placeholder="YYYY"
                value={newEdu.startYear}
                onChange={(e) => setNewEdu({ ...newEdu, startYear: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End Year</label>
              <input
                type="text"
                placeholder="YYYY (or Expected)"
                value={newEdu.endYear}
                onChange={(e) => setNewEdu({ ...newEdu, endYear: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description (Optional)</label>
              <textarea
                placeholder="Additional details about your studies"
                value={newEdu.description}
                onChange={(e) => setNewEdu({ ...newEdu, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                rows="2"
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

      {education.length === 0 && !isAdding ? (
        <p className="text-slate-500 dark:text-slate-400 italic">No education history added yet.</p>
      ) : (
        <div className="space-y-4">
          {education.map((edu, index) => (
            <div key={index} className="relative border dark:border-slate-700 rounded-xl p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
              {editable && (
                <button
                  onClick={() => handleRemove(index)}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={18} />
                </button>
              )}
              <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 pr-10">{edu.qualification} {edu.field && `in ${edu.field}`}</h4>
              <p className="text-md font-medium text-slate-700 dark:text-slate-300 mt-1">{edu.institution}</p>
              
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400">
                {(edu.startYear || edu.endYear) && (
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    <span>{edu.startYear} {edu.startYear && edu.endYear ? '-' : ''} {edu.endYear}</span>
                  </div>
                )}
                {edu.grade && (
                  <span className="font-medium px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">Grade: {edu.grade}</span>
                )}
              </div>
              
              {edu.description && (
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{edu.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </ProfileSection>
  );
};

export default EducationSection;
