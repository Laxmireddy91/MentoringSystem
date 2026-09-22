import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const ProfileSection = ({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
  isEmpty = false,
  emptyMessage = 'Not added yet',
  headerActions = null
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden relative transition-all duration-300 pl-1">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--primary-color)]"></div>
      
      <div
        className="flex items-center justify-between p-5 md:p-6 cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-5 h-5 text-[var(--primary-color)]" />}
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
        </div>
        
        <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
          {headerActions}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-500 dark:text-slate-400"
            aria-expanded={isOpen}
            aria-label="Toggle section"
          >
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>
      
      <div 
        className={`transition-all duration-300 ease-in-out origin-top ${
          isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        <div className="p-5 md:p-6 pt-0 border-t border-slate-100 dark:border-slate-800">
          {isEmpty ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400 italic">
              {emptyMessage}
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSection;
