import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMyProfile, updateMyProfile } from '../services/profileService';
import DashboardLayout from '../layouts/DashboardLayout';
import ProfileHeader from '../components/profile/ProfileHeader';
import AvatarUpload from '../components/profile/AvatarUpload';

// Section components
import PersonalInfoSection from '../components/profile/sections/PersonalInfoSection';
import SocialLinksSection from '../components/profile/sections/SocialLinksSection';
import SkillsSection from '../components/profile/sections/SkillsSection';
import EducationSection from '../components/profile/sections/EducationSection';
import ExperienceSection from '../components/profile/sections/ExperienceSection';
import ProjectsSection from '../components/profile/sections/ProjectsSection';
import CertificationsSection from '../components/profile/sections/CertificationsSection';
import VisibilitySection from '../components/profile/sections/VisibilitySection';

// Role-specific section components
import StudentAcademicSection from '../components/profile/sections/StudentAcademicSection';
import StudentMentoringSection from '../components/profile/sections/StudentMentoringSection';
import MentorInfoSection from '../components/profile/sections/MentorInfoSection';
import StaffInfoSection from '../components/profile/sections/StaffInfoSection';
import ParentWardSection from '../components/profile/sections/ParentWardSection';

import {
  User,
  GraduationCap,
  Users,
  Briefcase,
  FolderOpen,
  Award,
  Link,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

const MyProfile = () => {
  const { user: authUser, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Editable form state
  const [personalInfo, setPersonalInfo] = useState({});
  const [skills, setSkills] = useState([]);
  const [education, setEducation] = useState([]);
  const [experience, setExperience] = useState([]);
  const [projects, setProjects] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [social, setSocial] = useState({});
  const [visibility, setVisibility] = useState('institution');

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await getMyProfile();
      if (data) {
        setProfile(data);
        setPersonalInfo({
          name: data.name || '',
          phone: data.phone || '',
          bio: data.bio || '',
          email: data.email || '',
          department: data.department || '',
          role: data.role || '',
        });
        setSkills(data.skills || []);
        setEducation(data.education || []);
        setExperience(data.experience || []);
        setProjects(data.projects || []);
        setCertifications(data.certifications || []);
        setSocial(data.social || {});
        setVisibility(data.visibility || 'institution');
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const role = profile?.role || authUser?.role || 'student';
  const roleData = profile?.roleData || {};
  const stats = profile?.stats || {};

  // Role-specific profile completion calculation
  const { completionPercentage, completionItems } = useMemo(() => {
    if (!profile) return { completionPercentage: 0, completionItems: [] };

    let items = [];

    switch (role) {
      case 'student':
        items = [
          { label: 'Profile Photo', completed: !!profile.avatarDocumentId },
          { label: 'Phone Number', completed: !!personalInfo.phone },
          { label: 'Bio / About Me', completed: !!personalInfo.bio },
          { label: 'Skills Added', completed: skills.length > 0 },
          { label: 'Education History', completed: education.length > 0 },
          { label: 'Projects Showcase', completed: projects.length > 0 },
          { label: 'Social Links', completed: !!(social.linkedIn || social.gitHub || social.portfolio) },
        ];
        break;

      case 'mentor':
        items = [
          { label: 'Profile Photo', completed: !!profile.avatarDocumentId },
          { label: 'Phone Number', completed: !!personalInfo.phone },
          { label: 'Bio / About Me', completed: !!personalInfo.bio },
          { label: 'Professional Experience', completed: experience.length > 0 },
          { label: 'Qualifications / Education', completed: education.length > 0 },
          { label: 'Skills & Expertise', completed: skills.length > 0 },
          { label: 'Social / Scholar Links', completed: !!(social.linkedIn || social.googleScholar || social.personalWebsite) },
        ];
        break;

      case 'parent':
        items = [
          { label: 'Profile Photo', completed: !!profile.avatarDocumentId },
          { label: 'Phone Number', completed: !!personalInfo.phone },
          { label: 'Bio / Note', completed: !!personalInfo.bio },
          { label: 'Linked Ward Connected', completed: !!roleData.ward },
        ];
        break;

      case 'hod':
      case 'mentoring_coordinator':
      case 'exam_coordinator':
      case 'tpo':
      default:
        items = [
          { label: 'Profile Photo', completed: !!profile.avatarDocumentId },
          { label: 'Phone Number', completed: !!personalInfo.phone },
          { label: 'Bio / About Me', completed: !!personalInfo.bio },
          { label: 'Experience History', completed: experience.length > 0 },
          { label: 'Education & Qualifications', completed: education.length > 0 },
          { label: 'Skills & Competencies', completed: skills.length > 0 },
        ];
        break;
    }

    const completedCount = items.filter((i) => i.completed).length;
    const percentage = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

    return { completionPercentage: percentage, completionItems: items };
  }, [profile, personalInfo, skills, education, experience, projects, social, role, roleData]);

  // Tab definitions tailored to each role
  const tabs = useMemo(() => {
    switch (role) {
      case 'student':
        return [
          { id: 'overview', label: 'Overview', icon: User },
          { id: 'academics', label: 'Academics', icon: GraduationCap },
          { id: 'mentoring', label: 'Mentoring', icon: Users },
          { id: 'skills', label: 'Skills & Projects', icon: FolderOpen },
          { id: 'experience', label: 'Education & Exp', icon: Briefcase },
          { id: 'social', label: 'Links & Privacy', icon: Link },
        ];
      case 'mentor':
        return [
          { id: 'overview', label: 'Overview', icon: User },
          { id: 'mentoring', label: 'Mentoring Profile', icon: Users },
          { id: 'experience', label: 'Experience & Edu', icon: Briefcase },
          { id: 'skills', label: 'Skills & Certs', icon: Award },
          { id: 'social', label: 'Links & Privacy', icon: Link },
        ];
      case 'parent':
        return [
          { id: 'overview', label: 'Overview', icon: User },
          { id: 'ward', label: 'Ward Academic Info', icon: GraduationCap },
          { id: 'privacy', label: 'Privacy & Settings', icon: Shield },
        ];
      case 'hod':
      case 'mentoring_coordinator':
      case 'exam_coordinator':
      case 'tpo':
      default:
        return [
          { id: 'overview', label: 'Overview', icon: User },
          { id: 'roleInfo', label: 'Institutional Role', icon: Briefcase },
          { id: 'experience', label: 'Experience & Edu', icon: GraduationCap },
          { id: 'skills', label: 'Skills & Certs', icon: Award },
          { id: 'social', label: 'Links & Privacy', icon: Link },
        ];
    }
  }, [role]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    try {
      const payload = {
        name: personalInfo.name,
        phone: personalInfo.phone,
        bio: personalInfo.bio,
        visibility,
        skills,
        education,
        experience,
        projects,
        certifications,
        social,
      };

      const updatedUser = await updateMyProfile(payload);
      if (!updatedUser) throw new Error('Empty response from server');

      // Update local profile state
      setProfile((prev) => ({ ...prev, ...updatedUser }));
      updateUser({
        name: updatedUser.name,
        avatarDocumentId: updatedUser.avatarDocumentId,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error('Save failed:', err);
      setSaveError(err?.message || 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role={authUser?.role}>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500 dark:text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary-color)] mb-3" />
          <p className="text-sm font-medium">Loading your profile…</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={authUser?.role}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Profile Header */}
        <ProfileHeader
          user={profile}
          roleData={roleData}
          stats={stats}
          completionPercentage={completionPercentage}
          completionItems={completionItems}
          onAvatarChange={() => setShowAvatarModal(!showAvatarModal)}
          onEditProfile={() => setActiveTab('overview')}
        />

        {/* Avatar Upload Dropdown/Modal */}
        {showAvatarModal && (
          <div className="animate-in fade-in zoom-in-95 duration-150">
            <AvatarUpload />
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl px-2 py-1 shadow-sm flex flex-wrap gap-1">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-role-soft text-role-primary dark:text-[var(--primary-text-dark)] font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
                style={isActive ? { borderBottom: '2px solid var(--primary-color)' } : {}}
              >
                <TabIcon className={`w-4 h-4 ${isActive ? 'text-[var(--primary-color)]' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Status Messages */}
        {saveError && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-400 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        {saveSuccess && (
          <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900/60 text-green-700 dark:text-green-400 text-sm flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>Profile changes saved successfully.</span>
          </div>
        )}

        {/* Tab Content Panes */}
        <div className="space-y-6">
          {/* ════════════ OVERVIEW TAB ════════════ */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <PersonalInfoSection
                data={personalInfo}
                onChange={setPersonalInfo}
                readOnlyFields={['email', 'department', 'role']}
              />

              {/* Quick glance based on role */}
              {role === 'student' && (
                <>
                  <StudentAcademicSection roleData={roleData} stats={stats} />
                  <StudentMentoringSection roleData={roleData} stats={stats} />
                </>
              )}

              {role === 'mentor' && (
                <MentorInfoSection roleData={roleData} stats={stats} />
              )}

              {['hod', 'mentoring_coordinator', 'exam_coordinator', 'tpo'].includes(role) && (
                <StaffInfoSection roleData={roleData} stats={stats} role={role} />
              )}

              {role === 'parent' && (
                <ParentWardSection roleData={roleData} stats={stats} />
              )}
            </div>
          )}

          {/* ════════════ STUDENT ACADEMICS TAB ════════════ */}
          {activeTab === 'academics' && role === 'student' && (
            <div className="space-y-6">
              <StudentAcademicSection roleData={roleData} stats={stats} />
            </div>
          )}

          {/* ════════════ MENTORING TAB ════════════ */}
          {activeTab === 'mentoring' && (
            <div className="space-y-6">
              {role === 'student' ? (
                <StudentMentoringSection roleData={roleData} stats={stats} />
              ) : (
                <MentorInfoSection roleData={roleData} stats={stats} />
              )}
            </div>
          )}

          {/* ════════════ SKILLS & PROJECTS TAB ════════════ */}
          {activeTab === 'skills' && (
            <div className="space-y-6">
              <SkillsSection skills={skills} onChange={setSkills} editable={true} />
              {role === 'student' && (
                <ProjectsSection projects={projects} onChange={setProjects} editable={true} />
              )}
              <CertificationsSection certifications={certifications} onChange={setCertifications} editable={true} />
            </div>
          )}

          {/* ════════════ EXPERIENCE & EDUCATION TAB ════════════ */}
          {activeTab === 'experience' && (
            <div className="space-y-6">
              <EducationSection education={education} onChange={setEducation} editable={true} />
              <ExperienceSection experience={experience} onChange={setExperience} editable={true} />
            </div>
          )}

          {/* ════════════ STAFF INSTITUTIONAL ROLE TAB ════════════ */}
          {activeTab === 'roleInfo' && (
            <div className="space-y-6">
              <StaffInfoSection roleData={roleData} stats={stats} role={role} />
            </div>
          )}

          {/* ════════════ PARENT WARD TAB ════════════ */}
          {activeTab === 'ward' && role === 'parent' && (
            <div className="space-y-6">
              <ParentWardSection roleData={roleData} stats={stats} />
            </div>
          )}

          {/* ════════════ LINKS & PRIVACY TAB ════════════ */}
          {(activeTab === 'social' || activeTab === 'privacy') && (
            <div className="space-y-6">
              <SocialLinksSection social={social} onChange={setSocial} editable={true} />
              <VisibilitySection value={visibility} onChange={setVisibility} />
            </div>
          )}
        </div>

        {/* Global Sticky / Bottom Save Bar */}
        <div className="sticky bottom-4 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
            Institutional fields (USN, Employee ID, Department, Role) are protected and maintained by college administration.
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white shadow-sm transition-all disabled:opacity-60 cursor-pointer"
            style={{ backgroundColor: 'var(--primary-color)' }}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Changes…</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Profile</span>
              </>
            )}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MyProfile;
