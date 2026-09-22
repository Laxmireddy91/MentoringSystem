import React, { useState } from 'react';
import { Award, Plus, Trash2, Calendar, ExternalLink } from 'lucide-react';
import ProfileSection from '../ProfileSection';

const CertificationsSection = ({ certifications = [], onChange, editable = true }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newCert, setNewCert] = useState({
    name: '',
    issuer: '',
    issueDate: '',
    expiryDate: '',
    credentialId: '',
    credentialUrl: '',
    description: ''
  });

  const handleAdd = () => {
    if (newCert.name.trim() && newCert.issuer.trim()) {
      onChange([...certifications, newCert]);
      setNewCert({
        name: '',
        issuer: '',
        issueDate: '',
        expiryDate: '',
        credentialId: '',
        credentialUrl: '',
        description: ''
      });
      setIsAdding(false);
    }
  };

  const handleRemove = (index) => {
    const updated = certifications.filter((_, i) => i !== index);
    onChange(updated);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const headerActions = editable && !isAdding ? (
    <button
      onClick={() => setIsAdding(true)}
      className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg text-white"
      style={{ backgroundColor: 'var(--primary-color)' }}
    >
      <Plus size={16} />
      Add Certification
    </button>
  ) : null;

  return (
    <ProfileSection icon={Award} title="Certifications" headerActions={headerActions}>
      {isAdding && (
        <div className="mb-5 p-5 border rounded-xl dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Certification Name</label>
              <input
                type="text"
                placeholder="e.g. AWS Certified Solutions Architect"
                value={newCert.name}
                onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Issuing Organization</label>
              <input
                type="text"
                placeholder="e.g. Amazon Web Services"
                value={newCert.issuer}
                onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Credential ID (Optional)</label>
              <input
                type="text"
                placeholder="ID number"
                value={newCert.credentialId}
                onChange={(e) => setNewCert({ ...newCert, credentialId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Issue Date</label>
              <input
                type="month"
                value={newCert.issueDate}
                onChange={(e) => setNewCert({ ...newCert, issueDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Expiry Date (Optional)</label>
              <input
                type="month"
                value={newCert.expiryDate}
                onChange={(e) => setNewCert({ ...newCert, expiryDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Credential URL</label>
              <input
                type="url"
                placeholder="Link to verify credential"
                value={newCert.credentialUrl}
                onChange={(e) => setNewCert({ ...newCert, credentialUrl: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
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

      {certifications.length === 0 && !isAdding ? (
        <p className="text-slate-500 dark:text-slate-400 italic">No certifications added yet.</p>
      ) : (
        <div className="space-y-4">
          {certifications.map((cert, index) => (
            <div key={index} className="relative border dark:border-slate-700 rounded-xl p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex-grow">
                {editable && (
                  <button
                    onClick={() => handleRemove(index)}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors opacity-0 group-hover:opacity-100 md:hidden"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 pr-8 md:pr-0">{cert.name}</h4>
                <p className="text-md font-medium text-[var(--primary-color)] mt-1">{cert.issuer}</p>
                
                <div className="flex items-center gap-3 mt-2 text-sm text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    <span>Issued: {formatDate(cert.issueDate)} {cert.expiryDate && `· Expires: ${formatDate(cert.expiryDate)}`}</span>
                  </div>
                </div>
                
                {cert.credentialId && (
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    Credential ID: <span className="font-mono text-xs">{cert.credentialId}</span>
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-2 mt-2 md:mt-0">
                {cert.credentialUrl && (
                  <a
                    href={cert.credentialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Show Credential <ExternalLink size={14} />
                  </a>
                )}
                {editable && (
                  <button
                    onClick={() => handleRemove(index)}
                    className="hidden md:flex p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </ProfileSection>
  );
};

export default CertificationsSection;
