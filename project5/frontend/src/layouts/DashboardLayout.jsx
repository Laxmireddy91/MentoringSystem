import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotification } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../utils/i18n';
import FaqChatbot from '../components/chatbot/FaqChatbot';
import UserAvatar from '../components/common/UserAvatar';
import {
  LayoutDashboard,
  GraduationCap,
  Calendar,
  Target,
  Award,
  AlertTriangle,
  MessageSquare,
  Users,
  FileSpreadsheet,
  Settings,
  ShieldCheck,
  LogOut,
  Moon,
  Sun,
  Bell,
  Menu,
  X,
  ChevronRight,
  BookOpen,
  UserCheck,
  Check,
  FolderLock,
  Cpu,
  FileCheck2,
  Briefcase,
} from 'lucide-react';

export default function DashboardLayout({ children, role }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
  const { lang } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Navigation configuration for all roles
  const navConfigs = {
    student: [
      { name: 'Academics & Marks',       path: '/student/academics',     icon: GraduationCap },
      { name: 'Mentoring Sessions',       path: '/student/sessions',      icon: Calendar },
      { name: 'Assigned Tasks',           path: '/student/tasks',         icon: BookOpen },
      { name: 'Goals & Badges',           path: '/student/goals',         icon: Target },
      { name: 'Achievements & Certs',     path: '/student/achievements',  icon: Award },
      { name: 'Document Vault',           path: '/student/vault',         icon: FolderLock },
      { name: 'CIE & Exam Requests',      path: '/student/exam-requests', icon: FileCheck2 },
      { name: 'Risk Analysis',            path: '/student/risk',          icon: AlertTriangle },
      { name: 'Reports & Transcripts',    path: '/student/reports',       icon: FileSpreadsheet },
      { name: 'Chat with Mentor',         path: '/student/messages',      icon: MessageSquare },
    ],
    mentor: [
      { name: 'Overview',                     path: '/mentor/overview',      icon: LayoutDashboard },
      { name: 'Assigned Mentees (360°)',       path: '/mentor/students',      icon: Users },
      { name: 'Mentoring Sessions',           path: '/mentor/sessions',      icon: Calendar },
      { name: 'Mentee Tasks',                 path: '/mentor/tasks',         icon: BookOpen },
      { name: 'Certificate Verification',     path: '/mentor/certificates',  icon: Award },
      { name: 'Student Feedback',             path: '/mentor/feedbacks',     icon: Target },
      { name: 'Reports & Exports',            path: '/mentor/reports',       icon: FileSpreadsheet },
      { name: 'Mentee Messages',              path: '/mentor/messages',      icon: MessageSquare },
    ],
    mentoring_coordinator: [
      { name: 'Coordinator Overview',     path: '/coordinator/overview',    icon: LayoutDashboard },
      { name: 'Mentor Allocation Engine', path: '/coordinator/allocation',  icon: Cpu },
      { name: 'Allocation History',       path: '/coordinator/history',     icon: ShieldCheck },
    ],
    hod: [
      { name: 'Department Overview',  path: '/hod/overview',         icon: LayoutDashboard },
      { name: 'Student Directory',    path: '/hod/students',         icon: GraduationCap },
      { name: 'Mentor Allocation',    path: '/hod/mentors',          icon: UserCheck },
      { name: 'Department Analytics', path: '/hod/analytics',        icon: FileSpreadsheet },
      { name: 'Department Tasks',     path: '/hod/tasks',            icon: BookOpen },
      { name: 'Reports & Exports',    path: '/hod/reports',          icon: FileSpreadsheet },
      { name: 'Bulk Data Imports',    path: '/hod/imports',          icon: Settings },
      { name: 'Rank Leaderboard',     path: '/hod/leaderboard',      icon: Award },
      { name: 'Risk Engine Rules',    path: '/hod/risk-settings',    icon: Settings },
      { name: 'System Audit Trail',   path: '/hod/audit-logs',       icon: ShieldCheck },
    ],
    exam_coordinator: [
      { name: 'CIE & Exam Permissions', path: '/exam-coordinator/requests', icon: FileCheck2 },
    ],
    tpo: [
      { name: 'Placement Drives',       path: '/tpo/drives',       icon: Briefcase },
      { name: 'Candidate Eligibility',  path: '/tpo/eligibility',  icon: Users },
      { name: 'Institutional Readiness',path: '/tpo/readiness',    icon: Target },
    ],
    parent: [
      { name: t('nav_parent_overview', lang), path: '/parent/overview', icon: LayoutDashboard },
    ],
  };

  // Add My Profile entry to each role's navigation (translated for parent role)
  const profileNavItem = { name: t('nav_my_profile', lang), path: '/profile', icon: UserCheck };
  Object.keys(navConfigs).forEach((r) => {
    navConfigs[r] = [...navConfigs[r], profileNavItem];
  });

  const currentNav = navConfigs[role || user?.role] || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex transition-colors duration-200">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 text-white" style={{ backgroundColor: 'var(--primary-color)' }}>
          <div className="flex items-center gap-2.5">
            <img src="/assets/logo.png" alt="SGBIT Logo" className="w-8 h-8 object-contain" />
            <span className="font-bold text-lg tracking-tight">MONITOR IQ</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Badge */}
        <div className="px-6 py-3.5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
            {t('rolePortal', lang)}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide bg-role-soft text-role-primary dark:bg-role-soft-dark dark:text-role-primary">
            {user?.role}
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {currentNav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? ''
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                style={isActive ? { backgroundColor: 'var(--primary-color)', color: 'white' } : {}}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                <span className="truncate">{item.name}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-75" />}
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Logout in Sidebar Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3 p-2 rounded-xl">
            <UserAvatar size="w-9 h-9" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                {user?.name}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {user?.usn || user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            {t('signOut', lang)}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              aria-label={t('openSidebar', lang)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 capitalize">
              {t('academicMentoringPortal', lang)}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              aria-label={t('toggleTheme', lang)}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="relative p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                aria-label={t('notifications', lang)}
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                        {t('notificationsLabel', lang)}
                      </span>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 bg-role-soft text-role-primary dark:bg-role-primary/50 dark:text-indigo-300 text-[10px] font-bold rounded-full">
                          {unreadCount} {t('newBadge', lang)}
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[11px] text-role-primary dark:text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> {t('markAllRead', lang)}
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div
                          key={n._id}
                          onClick={() => markAsRead(n._id)}
                          className={`p-3 text-xs cursor-pointer transition ${
                            !n.isRead
                              ? 'bg-role-soft/50 dark:bg-role-soft-dark hover:bg-role-soft dark:hover:bg-role-soft-dark'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-700/40'
                          }`}
                        >
                          <p className="font-semibold text-slate-800 dark:text-slate-100 mb-0.5">{n.title}</p>
                          <p className="text-slate-500 dark:text-slate-400">{n.message}</p>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                            {new Date(n.createdAt).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                        {t('noNewNotifications', lang)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Pill */}
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-800">
              <UserAvatar size="w-8 h-8" />
              <div className="text-left leading-tight">
                <span className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {user?.name?.split(' ')?.[0]}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{user?.role}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>

        {/* Global Floating FAQ Chatbot */}
        <FaqChatbot />
      </div>
    </div>
  );
}
