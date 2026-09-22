import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import StudentOverview from './StudentOverview';
import StudentAcademics from './StudentAcademics';
import StudentSessions from './StudentSessions';
import StudentGoals from './StudentGoals';
import StudentAchievements from './StudentAchievements';
import StudentRiskAnalysis from './StudentRiskAnalysis';
import StudentMessages from './StudentMessages';
import StudentTasks from './StudentTasks';
import StudentReports from './StudentReports';
import StudentExamRequests from './StudentExamRequests';
import StudentDocumentVault from './StudentDocumentVault';

export default function StudentDashboard() {
  return (
    <DashboardLayout role="student">
      <Routes>
        <Route path="/" element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<StudentOverview />} />
        <Route path="academics" element={<StudentAcademics />} />
        <Route path="sessions" element={<StudentSessions />} />
        <Route path="tasks" element={<StudentTasks />} />
        <Route path="goals" element={<StudentGoals />} />
        <Route path="achievements" element={<StudentAchievements />} />
        <Route path="exam-requests" element={<StudentExamRequests />} />
        <Route path="vault" element={<StudentDocumentVault />} />
        <Route path="risk" element={<StudentRiskAnalysis />} />
        <Route path="reports" element={<StudentReports />} />
        <Route path="messages" element={<StudentMessages />} />
        <Route path="*" element={<Navigate to="overview" replace />} />
      </Routes>
    </DashboardLayout>
  );
}
