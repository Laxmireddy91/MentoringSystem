import React, { useState } from 'react';
import { Cpu, Plus, X } from 'lucide-react';
import ProfileSection from '../ProfileSection';

const proficiencyColors = {
  Beginner: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  Intermediate: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  Advanced: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800',
  Expert: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800',
};

const defaultColor = 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';

const SkillsSection = ({ skills = [], onChange, editable = true }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: '', proficiency: 'Intermediate' });

  const handleAdd = () => {
    if (newSkill.name.trim()) {
      onChange([...skills, newSkill]);
      setNewSkill({ name: '', proficiency: 'Intermediate' });
      setIsAdding(false);
    }
  };

  const handleRemove = (index) => {
    const updatedSkills = skills.filter((_, i) => i !== index);
    onChange(updatedSkills);
  };

  const headerActions = editable && !isAdding ? (
    <button
      onClick={() => setIsAdding(true)}
      className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg text-white"
      style={{ backgroundColor: 'var(--primary-color)' }}
    >
      <Plus size={16} />
      Add Skill
    </button>
  ) : null;

  return (
    <ProfileSection icon={Cpu} title="Skills & Expertise" headerActions={headerActions}>
      {isAdding && (
        <div className="mb-4 p-4 border rounded-xl dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Skill Name (e.g., React)"
              value={newSkill.name}
              onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
              className="flex-1 px-3 py-2 border rounded-lg dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
            <select
              value={newSkill.proficiency}
              onChange={(e) => setNewSkill({ ...newSkill, proficiency: e.target.value })}
              className="px-3 py-2 border rounded-lg dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Expert">Expert</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                className="px-4 py-2 text-white rounded-lg font-medium"
                style={{ backgroundColor: 'var(--primary-color)' }}
              >
                Save
              </button>
              <button
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {skills.length === 0 && !isAdding ? (
        <p className="text-slate-500 dark:text-slate-400 italic">No skills added yet. Add your skills to showcase your expertise.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, index) => {
            const colorClass = proficiencyColors[skill.proficiency] || defaultColor;
            return (
              <div
                key={index}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${colorClass}`}
              >
                <span>{skill.name}</span>
                {editable && (
                  <button
                    onClick={() => handleRemove(index)}
                    className="p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </ProfileSection>
  );
};

export default SkillsSection;
