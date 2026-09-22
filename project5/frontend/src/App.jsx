import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import { LanguageProvider } from './context/LanguageContext';

import RoleThemeProvider from './components/common/RoleThemeProvider';

// Pages
import LandingPage from './pages/landing/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import TwoFactorPage from './pages/auth/TwoFactorPage';
import ActivateAccountPage from './pages/auth/ActivateAccountPage';

import DashboardRouter from './pages/dashboard/DashboardRouter';
import StudentDashboard from './pages/student/StudentDashboard';
import MentorDashboard from './pages/mentor/MentorDashboard';
import CoordinatorDashboard from './pages/coordinator/CoordinatorDashboard';
import HodDashboard from './pages/hod/HodDashboard';
import ExamCoordinatorDashboard from './pages/exam/ExamCoordinatorDashboard';
import TpoDashboard from './pages/tpo/TpoDashboard';
import ParentDashboard from './pages/parent/ParentDashboard';

import MyProfile from './pages/MyProfile';
import UnauthorizedPage from './pages/common/UnauthorizedPage';
import NotFoundPage from './pages/common/NotFoundPage';

import ProtectedRoute from './components/common/ProtectedRoute';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ThemeProvider>
          <SocketProvider>
            <NotificationProvider>

              <Router>
                <RoleThemeProvider>

                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/activate" element={<ActivateAccountPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/verify-email" element={<VerifyEmailPage />} />
                    <Route path="/2fa" element={<TwoFactorPage />} />

                    {/* Dashboard Router */}
                    <Route path="/dashboard" element={<DashboardRouter />} />

                    {/* Profile */}
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute allowedRoles={['student', 'mentor', 'mentoring_coordinator', 'hod', 'exam_coordinator', 'tpo', 'parent']}>
                          <MyProfile />
                        </ProtectedRoute>
                      }
                    />

                    {/* Student */}
                    <Route
                      path="/student/*"
                      element={
                        <ProtectedRoute allowedRoles={['student']}>
                          <StudentDashboard />
                        </ProtectedRoute>
                      }
                    />

                    {/* Mentor */}
                    <Route
                      path="/mentor/*"
                      element={
                        <ProtectedRoute allowedRoles={['mentor']}>
                          <MentorDashboard />
                        </ProtectedRoute>
                      }
                    />

                    {/* Mentoring Coordinator */}
                    <Route
                      path="/coordinator/*"
                      element={
                        <ProtectedRoute allowedRoles={['mentoring_coordinator']}>
                          <CoordinatorDashboard />
                        </ProtectedRoute>
                      }
                    />

                    {/* HOD */}
                    <Route
                      path="/hod/*"
                      element={
                        <ProtectedRoute allowedRoles={['hod']}>
                          <HodDashboard />
                        </ProtectedRoute>
                      }
                    />

                    {/* Exam Coordinator */}
                    <Route
                      path="/exam-coordinator/*"
                      element={
                        <ProtectedRoute allowedRoles={['exam_coordinator']}>
                          <ExamCoordinatorDashboard />
                        </ProtectedRoute>
                      }
                    />

                    {/* TPO */}
                    <Route
                      path="/tpo/*"
                      element={
                        <ProtectedRoute allowedRoles={['tpo']}>
                          <TpoDashboard />
                        </ProtectedRoute>
                      }
                    />

                    {/* Parent */}
                    <Route
                      path="/parent/*"
                      element={
                        <ProtectedRoute allowedRoles={['parent']}>
                          <ParentDashboard />
                        </ProtectedRoute>
                      }
                    />

                    {/* Status Pages */}
                    <Route
                      path="/unauthorized"
                      element={<UnauthorizedPage />}
                    />

                    <Route
                      path="/404"
                      element={<NotFoundPage />}
                    />

                    {/* Fallback */}
                    <Route
                      path="*"
                      element={<Navigate to="/404" replace />}
                    />
                  </Routes>

                </RoleThemeProvider>
              </Router>

            </NotificationProvider>
          </SocketProvider>
        </ThemeProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;