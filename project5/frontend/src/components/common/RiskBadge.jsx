import React from 'react';
import { ShieldCheck, AlertCircle, AlertTriangle, Flame } from 'lucide-react';

const RiskBadge = ({ level, category, score = null, showIcon = true, size = 'md' }) => {
  const effectiveLevel = category || level || 'Low';
  const normalized = String(effectiveLevel).toLowerCase();

  const styles = {
    low: {
      bg: 'bg-status-success dark:bg-status-emerald border-status-success dark:border-emerald-800 text-status-success dark:text-emerald-400',
      icon: ShieldCheck,
    },
    medium: {
      bg: 'bg-status-warning dark:bg-status-amber border-status-warning dark:border-amber-800 text-status-warning dark:text-amber-400',
      icon: AlertTriangle,
    },
    high: {
      bg: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400',
      icon: AlertCircle,
    },
    critical: {
      bg: 'bg-status-error dark:bg-status-red border-status-error dark:border-red-800 text-status-error dark:text-red-400 font-bold animate-pulse',
      icon: Flame,
    },
  };

  const current = styles[normalized] || styles.low;
  const IconComponent = current.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 space-x-1',
    md: 'text-xs px-2.5 py-1 space-x-1.5',
    lg: 'text-sm px-3 py-1.5 space-x-2',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold tracking-wide ${current.bg} ${sizeClasses[size]}`}
    >
      {showIcon && <IconComponent className="w-3.5 h-3.5" />}
      <span>{effectiveLevel} Risk</span>
      {score !== null && <span className="opacity-75 font-normal">({score})</span>}
    </span>
  );
};

export default RiskBadge;
