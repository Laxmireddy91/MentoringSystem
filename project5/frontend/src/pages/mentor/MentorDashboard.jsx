import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import MentorOverview from './MentorOverview';
import MentorStudents from './MentorStudents';
import MentorSessions from './MentorSessions';
import MentorFeedbacks from './MentorFeedbacks';
import MentorMessages from './MentorMessages';
import MentorTasks from './MentorTasks';
import MentorReports from './MentorReports';
import MentorCertificates from './MentorCertificates';

export default function MentorDashboard() {
  return (
    <DashboardLayout role="mentor">
      <Routes>
        <Route path="/" element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<MentorOverview />} />
        <Route path="students" element={<MentorStudents />} />
        <Route path="sessions" element={<MentorSessions />} />
        <Route path="tasks" element={<MentorTasks />} />
        <Route path="certificates" element={<MentorCertificates />} />
        <Route path="feedbacks" element={<MentorFeedbacks />} />
        <Route path="reports" element={<MentorReports />} />
        <Route path="messages" element={<MentorMessages />} />
        <Route path="*" element={<Navigate to="overview" replace />} />
      </Routes>
    </DashboardLayout>
  );
}
