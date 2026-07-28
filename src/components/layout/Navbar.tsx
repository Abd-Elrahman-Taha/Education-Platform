import React from 'react';
import {
  Home, Video, FileSignature, ShieldCheck, Sliders, Search, LogIn, UserPlus,
  BookOpen, ClipboardList, Radio, Bot, FileText, User, Users, Settings,
  BarChart2, GraduationCap, LogOut, ChevronDown
} from 'lucide-react';
import { AppView, UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  currentView: AppView;
  onNavigateView: (view: AppView) => void;
  onOpenAuthModal: () => void;
  onOpenSearchModal: () => void;
}

interface NavItem {
  id: AppView;
  label: string;
  icon: React.ElementType;
}

const studentNav: NavItem[] = [
  { id: 'view-landing',          label: 'الرئيسية',      icon: Home },
  { id: 'view-drm-player',       label: 'الدروس',         icon: Video },
  { id: 'view-assessment',       label: 'الامتحانات',     icon: FileSignature },
  { id: 'view-homework',         label: 'الواجبات',       icon: ClipboardList },
  { id: 'view-live',             label: 'البث المباشر',   icon: Radio },
  { id: 'view-community',        label: 'مساعد AI',       icon: Bot },
  { id: 'view-pdfs',             label: 'ملفات PDF',      icon: FileText },
];

const parentNav: NavItem[] = [
  { id: 'view-landing',          label: 'الرئيسية',        icon: Home },
  { id: 'view-parent-portal',    label: 'بوابة ولي الأمر', icon: ShieldCheck },
  { id: 'view-community',        label: 'التقارير',        icon: BarChart2 },
];

const adminNav: NavItem[] = [
  { id: 'view-admin',            label: 'لوحة الإدارة',   icon: Sliders },
  { id: 'view-landing',          label: 'الطلاب',          icon: Users },
  { id: 'view-community',        label: 'التقارير',        icon: BarChart2 },
];

const teacherNav: NavItem[] = [
  { id: 'view-landing',          label: 'الرئيسية',        icon: Home },
  { id: 'view-drm-player',       label: 'إدارة الدروس',    icon: Video },
  { id: 'view-assessment',       label: 'الامتحانات',      icon: FileSignature },
  { id: 'view-homework',         label: 'الواجبات',        icon: ClipboardList },
];

const guestNav: NavItem[] = [
  { id: 'view-landing', label: 'الرئيسية', icon: Home },
];

const ROLE_NAV: Record<UserRole, NavItem[]> = {
  student: studentNav,
  parent:  parentNav,
  admin:   adminNav,
  teacher: teacherNav,
};

const ROLE_LABELS: Record<UserRole, string> = {
  student: 'طالب',
  parent:  'ولي أمر',
  admin:   'أدمن',
  teacher: 'معلم',
};

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigateView,
  onOpenAuthModal,
  onOpenSearchModal,
}) => {
  const { currentUser, isAuthenticated, logout } = useAuth();

  const navItems = isAuthenticated && currentUser
    ? ROLE_NAV[currentUser.role]
    : guestNav;

  return (
    <header className="navbar">
      <div className="container nav-container">
        {/* Brand Logo */}
        <a
          href="#"
          className="logo-brand"
          onClick={(e) => { e.preventDefault(); onNavigateView('view-landing'); }}
        >
          <div className="logo-icon">∫</div>
          <span>
            Syntax <span style={{ color: 'var(--secondary-light)', fontWeight: 400 }}>Math</span>
          </span>
        </a>

        {/* Role-Based Navigation */}
        <nav className="module-switcher">
          {navItems.map(item => {
            const IconComponent = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id + item.label}
                className={`module-btn ${isActive ? 'active' : ''}`}
                onClick={() => onNavigateView(item.id)}
              >
                <IconComponent size={14} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Action Buttons */}
        <div className="nav-actions">
          <button className="icon-btn" onClick={onOpenSearchModal} title="بحث سريع">
            <Search size={18} />
          </button>

          {isAuthenticated && currentUser ? (
            <>
              <div className="nav-user-badge">
                <img src={currentUser.avatar} className="nav-user-avatar" alt={currentUser.name} />
                <span>{currentUser.name.split(' ')[0]}</span>
                <span className={`role-badge role-badge--${currentUser.role}`} style={{ padding: '0.1rem 0.5rem', fontSize: '0.7rem' }}>
                  {ROLE_LABELS[currentUser.role]}
                </span>
              </div>
              <button
                className="btn btn-secondary"
                onClick={logout}
                style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}
                title="تسجيل الخروج"
              >
                <LogOut size={15} /> خروج
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-secondary"
                onClick={onOpenAuthModal}
                style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}
              >
                <LogIn size={15} /> دخول
              </button>
              <button
                className="btn btn-primary"
                onClick={onOpenAuthModal}
                style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}
              >
                <UserPlus size={15} /> تسجيل
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
