import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const DashboardRouter = () => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <LoadingSpinner size="lg" text="Loading your dashboard..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'student':
      return <Navigate to="/student/overview" replace />;
    case 'mentor':
      return <Navigate to="/mentor/overview" replace />;
    case 'mentoring_coordinator':
      return <Navigate to="/coordinator/overview" replace />;
    case 'hod':
      return <Navigate to="/hod/overview" replace />;
    case 'exam_coordinator':
      return <Navigate to="/exam-coordinator/requests" replace />;
    case 'tpo':
      return <Navigate to="/tpo/drives" replace />;
    case 'parent':
      return <Navigate to="/parent/overview" replace />;
    default:
      return <Navigate to="/unauthorized" replace />;
  }
};

export default DashboardRouter;
