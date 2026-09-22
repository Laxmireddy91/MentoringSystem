import React from 'react';
import { Award, Star, CheckCircle, Zap, TrendingUp, Target } from 'lucide-react';

const Badge = ({ name, size = 'md' }) => {
  const badgeConfig = {
    'No Backlogs': {
      icon: CheckCircle,
      classes: 'bg-status-success dark:bg-status-emerald text-status-success dark:text-emerald-400 border-status-success dark:border-emerald-800',
    },
    'High Performer': {
      icon: Star,
      classes: 'bg-status-warning dark:bg-status-amber text-status-warning dark:text-amber-400 border-status-warning dark:border-amber-800',
    },
    'Consistent Performer': {
      icon: Award,
      classes: 'bg-role-soft dark:bg-role-soft-dark text-role-primary dark:text-indigo-400 border-role-primary dark:border-role-primary',
    },
    'Top Scholar': {
      icon: Zap,
      classes: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800',
    },
    'Goal Achiever': {
      icon: Target,
      classes: 'bg-role-soft dark:bg-role-soft-dark text-role-primary dark:text-purple-400 border-role-primary dark:border-role-primary',
    },
    'Active Mentee': {
      icon: Award,
      classes: 'bg-status-info dark:bg-status-blue text-status-info dark:text-blue-400 border-status-info dark:border-blue-800',
    },
    'CIE Improvement': {
      icon: TrendingUp,
      classes: 'bg-rose-50 dark:bg-status-error/40 text-status-error dark:text-rose-400 border-rose-200 dark:border-rose-800',
    },
  };

  const current = badgeConfig[name] || {
    icon: Award,
    classes: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700',
  };

  const IconComp = current.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 space-x-1',
    md: 'text-xs px-2.5 py-1 space-x-1.5',
    lg: 'text-sm px-3.5 py-1.5 space-x-2',
  };

  return (
    <span className={`inline-flex items-center rounded-lg border font-medium ${current.classes} ${sizeClasses[size]}`}>
      <IconComp className="w-3.5 h-3.5 flex-shrink-0" />
      <span>{name}</span>
    </span>
  );
};

export default Badge;
