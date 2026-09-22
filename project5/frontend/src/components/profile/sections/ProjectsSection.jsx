import React, { useState } from 'react';
import { FolderOpen, Plus, Trash2, ExternalLink } from 'lucide-react';
import ProfileSection from '../ProfileSection';

const ProjectsSection = ({ projects = [], onChange, editable = true }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newProj, setNewProj] = useState({
    title: '',
    description: '',
    technologies: '',
    role: '',
    startDate: '',
    endDate: '',
    projectUrl: '',
    repoUrl: '',
    demoUrl: ''
  });

  const handleAdd = () => {
    if (newProj.title.trim()) {
      const techArray = newProj.technologies
        ? newProj.technologies.split(',').map(t => t.trim()).filter(Boolean)
        : [];
        
      onChange([...projects, { ...newProj, technologies: techArray }]);
      setNewProj({
        title: '',
        description: '',
        technologies: '',
        role: '',
        startDate: '',
        endDate: '',
        projectUrl: '',
        repoUrl: '',
        demoUrl: ''
      });
      setIsAdding(false);
    }
  };

  const handleRemove = (index) => {
    const updated = projects.filter((_, i) => i !== index);
    onChange(updated);
  };

  const headerActions = editable && !isAdding ? (
    <button
      onClick={() => setIsAdding(true)}
      className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg text-white"
      style={{ backgroundColor: 'var(--primary-color)' }}
    >
      <Plus size={16} />
      Add Project
    </button>
  ) : null;

  return (
    <ProfileSection icon={FolderOpen} title="Projects" headerActions={headerActions}>
      {isAdding && (
        <div className="mb-5 p-5 border rounded-xl dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Project Title</label>
              <input
                type="text"
                placeholder="e.g. Smart Mentoring System"
                value={newProj.title}
                onChange={(e) => setNewProj({ ...newProj, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Lead Developer"
                value={newProj.role}
                onChange={(e) => setNewProj({ ...newProj, role: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Technologies (Comma separated)</label>
              <input
                type="text"
                placeholder="React, Node.js, MongoDB"
                value={newProj.technologies}
                onChange={(e) => setNewProj({ ...newProj, technologies: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Repository URL</label>
              <input
                type="url"
                placeholder="GitHub link"
                value={newProj.repoUrl}
                onChange={(e) => setNewProj({ ...newProj, repoUrl: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Live Demo URL</label>
              <input
                type="url"
                placeholder="Live link"
                value={newProj.demoUrl}
                onChange={(e) => setNewProj({ ...newProj, demoUrl: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
              <textarea
                placeholder="What did you build? What problems did it solve?"
                value={newProj.description}
                onChange={(e) => setNewProj({ ...newProj, description: e.target.value })}
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

      {projects.length === 0 && !isAdding ? (
        <p className="text-slate-500 dark:text-slate-400 italic">No projects added yet.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {projects.map((proj, index) => (
            <div key={index} className="relative flex flex-col border dark:border-slate-700 rounded-xl p-5 hover:shadow-md transition-shadow bg-white dark:bg-slate-800 group">
              {editable && (
                <button
                  onClick={() => handleRemove(index)}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={18} />
                </button>
              )}
              
              <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 pr-10">{proj.title}</h4>
              {proj.role && <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">{proj.role}</p>}
              
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 flex-grow">{proj.description}</p>
              
              {proj.technologies && proj.technologies.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {proj.technologies.map((tech, i) => (
                    <span key={i} className="px-2 py-0.5 text-xs rounded-full font-medium bg-role-soft text-role-primary border border-role-primary/20">
                      {tech}
                    </span>
                  ))}
                </div>
              )}
              
              {(proj.repoUrl || proj.demoUrl || proj.projectUrl) && (
                <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t dark:border-slate-700">
                  {proj.repoUrl && (
                    <a href={proj.repoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-[var(--primary-color)] transition-colors">
                      <ExternalLink size={14} /> Repository
                    </a>
                  )}
                  {(proj.demoUrl || proj.projectUrl) && (
                    <a href={proj.demoUrl || proj.projectUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-[var(--primary-color)] transition-colors">
                      <ExternalLink size={14} /> Live Demo
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </ProfileSection>
  );
};

export default ProjectsSection;
