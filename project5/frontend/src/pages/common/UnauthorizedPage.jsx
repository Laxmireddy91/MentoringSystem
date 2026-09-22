import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const UnauthorizedPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="max-w-md w-full text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
        <div className="inline-flex p-3 rounded-2xl bg-status-warning dark:bg-status-amber text-status-warning mb-4">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Access Denied</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">
          You do not have the required permissions to view this resource.
        </p>
        <Link
          to="/"
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-role-primary hover:bg-role-primary text-white font-medium rounded-xl text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
