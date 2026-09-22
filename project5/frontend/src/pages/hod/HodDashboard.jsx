import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import HodOverview from './HodOverview';
import HodStudents from './HodStudents';
import HodMentors from './HodMentors';
import HodAnalytics from './HodAnalytics';
import HodRiskSettings from './HodRiskSettings';
import HodAuditLogs from './HodAuditLogs';
import HodTasks from './HodTasks';
import HodReports from './HodReports';
import HodImports from './HodImports';
import HodLeaderboard from './HodLeaderboard';

export default function HodDashboard() {
  return (
    <DashboardLayout role="hod">
      <Routes>
        <Route path="/" element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<HodOverview />} />
        <Route path="students" element={<HodStudents />} />
        <Route path="mentors" element={<HodMentors />} />
        <Route path="analytics" element={<HodAnalytics />} />
        <Route path="tasks" element={<HodTasks />} />
        <Route path="reports" element={<HodReports />} />
        <Route path="imports" element={<HodImports />} />
        <Route path="leaderboard" element={<HodLeaderboard />} />
        <Route path="risk-settings" element={<HodRiskSettings />} />
        <Route path="audit-logs" element={<HodAuditLogs />} />
        <Route path="*" element={<Navigate to="overview" replace />} />
      </Routes>
    </DashboardLayout>
  );
}
