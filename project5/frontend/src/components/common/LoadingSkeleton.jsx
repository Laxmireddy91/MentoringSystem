import React from 'react';

export default function LoadingSkeleton({ rows = 4, className = '' }) {
  return (
    <div className={`w-full space-y-3 animate-pulse ${className}`}>
      <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-1/3 mb-4" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center">
          <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg w-full" />
        </div>
      ))}
    </div>
  );
}
