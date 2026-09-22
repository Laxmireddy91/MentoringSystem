import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import TpoDrives from './TpoDrives';
import TpoEligibility from './TpoEligibility';
import TpoReadiness from './TpoReadiness';

export default function TpoDashboard() {
  return (
    <DashboardLayout role="tpo">
      <Routes>
        <Route path="/" element={<Navigate to="drives" replace />} />
        <Route path="drives" element={<TpoDrives />} />
        <Route path="eligibility" element={<TpoEligibility />} />
        <Route path="readiness" element={<TpoReadiness />} />
        <Route path="*" element={<Navigate to="drives" replace />} />
      </Routes>
    </DashboardLayout>
  );
}
