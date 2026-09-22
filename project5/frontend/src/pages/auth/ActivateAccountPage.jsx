import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Users,
  Heart,
  Lock,
  ArrowRight,
  Mail,
  UserCheck,
} from 'lucide-react';

export default function ActivateAccountPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Tab: 'student' | 'staff' | 'parent' (determines fields and activation endpoint)
  const [activeTab, setActiveTab] = useState('student');

  // Form Fields
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI State
  const [activating, setActivating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const getRoleLabel = (role) => {
    const map = {
      student: 'Student',
      mentor: 'Faculty Mentor',
      mentoring_coordinator: 'Mentoring Coordinator',
      hod: 'Head of Department (HOD)',
      exam_coordinator: 'Exam Coordinator',
      tpo: 'Training & Placement Officer (TPO)',
      parent: 'Parent / Guardian',
    };
    return map[role] || role;
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIdentifier('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleActivate = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Pre-flight Client Validation
    if (!identifier.trim()) {
      setErrorMessage(
        activeTab === 'student'
          ? 'Student USN is required.'
          : activeTab === 'staff'
          ? 'Faculty / Staff Employee ID is required.'
          : "Linked Ward's Student USN is required."
      );
      return;
    }

    if (!email.trim()) {
      setErrorMessage('Registered email address is required.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setActivating(true);

    try {
      let endpoint = '';
      let payload = {};

      // STRICT ZERO-CLIENT TRUST: Role is NEVER sent from frontend.
      // The backend derives the role purely from institutional database records (StudentRecord/StaffRecord).
      if (activeTab === 'student') {
        endpoint = '/auth/activate/student';
        payload = {
          usn: identifier.trim().toUpperCase(),
          email: email.trim().toLowerCase(),
          password,
        };
      } else if (activeTab === 'staff') {
        endpoint = '/auth/activate/staff';
        payload = {
          employeeId: identifier.trim().toUpperCase(),
          email: email.trim().toLowerCase(),
          password,
        };
      } else if (activeTab === 'parent') {
        endpoint = '/auth/activate/parent';
        payload = {
          studentUsn: identifier.trim().toUpperCase(),
          parentEmail: email.trim().toLowerCase(),
          password,
        };
      }

      const res = await axiosClient.post(endpoint, payload);
      const data = res?.data || res;

      if (data?.user && data?.token) {
        // Authenticate user in session context
        login(data.user, data.token);

        const assignedRole = data.user.role;
        const roleName = getRoleLabel(assignedRole);
        setSuccessMessage(`Account activated successfully as ${roleName}! Redirecting to your dashboard...`);

        // Router relies solely on the authoritative role returned by backend
        setTimeout(() => {
          switch (assignedRole) {
            case 'student':
              navigate('/student/overview');
              break;
            case 'mentor':
              navigate('/mentor/overview');
              break;
            case 'mentoring_coordinator':
              navigate('/coordinator/overview');
              break;
            case 'hod':
              navigate('/hod/overview');
              break;
            case 'exam_coordinator':
              navigate('/exam-coordinator/requests');
              break;
            case 'tpo':
              navigate('/tpo/drives');
              break;
            case 'parent':
              navigate('/parent/overview');
              break;
            default:
              navigate('/dashboard');
          }
        }, 1200);
      } else {
        // Fallback in case response structure is different
        setSuccessMessage('Account activated successfully! Please sign in.');
        setTimeout(() => navigate('/login?activated=1'), 1500);
      }
    } catch (err) {
      setErrorMessage(
        err.message ||
          err.response?.data?.message ||
          'Failed to activate institutional account. Please verify your official details or contact your department.'
      );
    } finally {
      setActivating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-role-soft dark:bg-role-soft-dark text-role-primary dark:text-indigo-400 mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Activate Institutional Account
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Institutional records are pre-registered by administration. Claim your official account and set your secure password.
          </p>
        </div>

        {/* Status Messages */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-status-error dark:bg-status-red border border-status-error dark:border-red-900/60 text-status-error dark:text-red-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-status-error mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-status-success dark:bg-status-emerald border border-status-success dark:border-emerald-900/60 text-status-success dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-status-success" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Category Selection Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => handleTabChange('student')}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'student'
                ? 'bg-white dark:bg-slate-900 text-role-primary dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Student</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('staff')}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'staff'
                ? 'bg-white dark:bg-slate-900 text-role-primary dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Faculty / Staff</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('parent')}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'parent'
                ? 'bg-white dark:bg-slate-900 text-role-primary dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Parent</span>
          </button>
        </div>

        {/* Information Notice */}
        <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
          {activeTab === 'student' && (
            <span>
              <strong>Student Activation:</strong> Enter your official USN and college-registered email provided by your department or during admission.
            </span>
          )}
          {activeTab === 'staff' && (
            <span>
              <strong>Staff / Faculty Activation:</strong> Enter your institutional Employee ID and official college email. System roles (Mentor, HOD, Coordinator, TPO) are derived automatically.
            </span>
          )}
          {activeTab === 'parent' && (
            <span>
              <strong>Parent Activation:</strong> Enter your ward&apos;s Student USN and the registered parent email address given on college admission records.
            </span>
          )}
        </div>

        {/* Activation Form */}
        <form onSubmit={handleActivate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {activeTab === 'student'
                ? 'Student USN (University Seat Number) *'
                : activeTab === 'staff'
                ? 'Faculty / Staff Employee ID *'
                : "Linked Ward's Student USN *"}
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value.toUpperCase())}
              placeholder={
                activeTab === 'student'
                  ? 'e.g. 1MS24CS001'
                  : activeTab === 'staff'
                  ? 'e.g. EMP_CSE_01'
                  : 'e.g. 1MS24CS001'
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm uppercase focus:outline-none focus:ring-2 focus-role"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {activeTab === 'student'
                ? 'Registered Student College Email *'
                : activeTab === 'staff'
                ? 'Official Institutional Email Address *'
                : 'Registered Parent / Guardian Email *'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@college.edu or registered email"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus-role"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Create Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus-role"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus-role"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={activating}
              className="w-full py-3 px-4 bg-role-primary hover:bg-role-primary text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {activating ? (
                <>
                  <LoadingSpinner size="sm" color="text-white" />
                  <span>Activating Account...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Activate Institutional Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer Link */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
          Already activated your account?{' '}
          <Link
            to="/login"
            className="font-bold text-role-primary hover:text-role-primary dark:text-indigo-400 ml-1"
          >
            Sign In Here &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
