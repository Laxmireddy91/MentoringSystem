import React, { useState } from 'react';
import ProfileSection from '../ProfileSection';
import { Link, BookOpen, Globe, Github, Linkedin, ExternalLink } from 'lucide-react';

const SocialLinksSection = ({ social, onChange, editable }) => {
  const [links, setLinks] = useState(social || {});

  const handleChange = (field, value) => {
    const updated = { ...links, [field]: value };
    setLinks(updated);
    if (onChange) onChange(updated);
  };

  const handleBlur = (field, value) => {
    if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
      handleChange(field, `https://${value}`);
    }
  };

  const isEmpty = !links.linkedIn && !links.gitHub && !links.portfolio && !links.personalWebsite && !links.googleScholar && (!links.other || links.other.length === 0);

  if (!editable && isEmpty) {
    return (
      <ProfileSection icon={Link} title="Social & Professional Links">
        <p className="text-sm text-slate-500 dark:text-slate-400">No links added yet.</p>
      </ProfileSection>
    );
  }

  const renderInput = (field, label, IconComponent) => {
    return (
      <div className="flex flex-col space-y-1">
        <label className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">{label}</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <IconComponent className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-role-primary focus:border-role-primary text-slate-800 dark:text-slate-100"
            value={links[field] || ''}
            onChange={(e) => handleChange(field, e.target.value)}
            onBlur={(e) => handleBlur(field, e.target.value)}
            placeholder={`Enter ${label} URL`}
          />
        </div>
      </div>
    );
  };

  const renderLink = (url, label, IconComponent) => {
    if (!url) return null;
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
        <IconComponent className="h-5 w-5 text-slate-500 dark:text-slate-400 mr-3" />
        <span className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{label}</span>
        <ExternalLink className="h-4 w-4 text-slate-400" />
      </a>
    );
  };

  return (
    <ProfileSection icon={Link} title="Social & Professional Links">
      {editable ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderInput('linkedIn', 'LinkedIn', Linkedin)}
          {renderInput('gitHub', 'GitHub', Github)}
          {renderInput('portfolio', 'Portfolio', Globe)}
          {renderInput('personalWebsite', 'Personal Website', Globe)}
          {renderInput('googleScholar', 'Google Scholar', BookOpen)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {renderLink(links.linkedIn, 'LinkedIn', Linkedin)}
          {renderLink(links.gitHub, 'GitHub', Github)}
          {renderLink(links.portfolio, 'Portfolio', Globe)}
          {renderLink(links.personalWebsite, 'Personal Website', Globe)}
          {renderLink(links.googleScholar, 'Google Scholar', BookOpen)}
          {links.other?.map((item, idx) => renderLink(item.url, item.platform || 'Other', Link))}
        </div>
      )}
    </ProfileSection>
  );
};

export default SocialLinksSection;
