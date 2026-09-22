import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import CoordinatorOverview from './CoordinatorOverview';
import CoordinatorAllocation from './CoordinatorAllocation';
import CoordinatorHistory from './CoordinatorHistory';

export default function CoordinatorDashboard() {
  return (
    <DashboardLayout role="mentoring_coordinator">
      <Routes>
        <Route index element={<Navigate to="/coordinator/overview" replace />} />
        <Route path="/" element={<Navigate to="/coordinator/overview" replace />} />
        <Route path="overview" element={<CoordinatorOverview />} />
        <Route path="allocation" element={<CoordinatorAllocation />} />
        <Route path="history" element={<CoordinatorHistory />} />
        <Route path="*" element={<Navigate to="/coordinator/overview" replace />} />
      </Routes>
    </DashboardLayout>
  );
}
