import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import ExamRequests from './ExamRequests';

export default function ExamCoordinatorDashboard() {
  return (
    <DashboardLayout role="exam_coordinator">
      <Routes>
        <Route path="/" element={<Navigate to="requests" replace />} />
        <Route path="requests" element={<ExamRequests />} />
        <Route path="*" element={<Navigate to="requests" replace />} />
      </Routes>
    </DashboardLayout>
  );
}
