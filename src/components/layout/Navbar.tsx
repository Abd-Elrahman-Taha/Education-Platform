import React, { useState } from 'react';
import {
  Home, Video, FileSignature, ShieldCheck, Sliders, Search, LogIn, UserPlus,
  BookOpen, ClipboardList, Radio, Bot, FileText, User, Users, Settings,
  BarChart2, GraduationCap, LogOut, Sun, Moon, Menu, X, MessageSquare, Inbox, LayoutDashboard
} from 'lucide-react';
import { AppView, UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { NotificationBell } from '../../features/notifications/components/NotificationBell';

interface NavbarProps {
  currentView: AppView;
  onNavigateView: (view: AppView, lessonId?: string) => void;
  onOpenAuthModal: () => void;
  onOpenSearchModal: () => void;
}

interface NavItem {
  id: AppView;
  label: string;
  icon: React.ElementType;
}

const studentNav: NavItem[] = [
  { id: 'view-landing',           label: 'الرئيسية', icon: Home },
  { id: 'view-student-dashboard', label: 'لوحة تحليلاتي', icon: LayoutDashboard },
  { id: 'view-drm-player',        label: 'الدروس الموحدة', icon: Video },
  { id: 'view-assessment',        label: 'سجل الامتحانات', icon: FileSignature },
  { id: 'view-community',         label: 'المجتمع', icon: MessageSquare },
];

const parentNav: NavItem[] = [
  { id: 'view-landing',           label: 'الرئيسية', icon: Home },
  { id: 'view-parent-portal',     label: 'بوابة ولي الأمر', icon: ShieldCheck },
  { id: 'view-community',         label: 'المجتمع', icon: MessageSquare },
];

const adminNav: NavItem[] = [
  { id: 'view-admin',             label: 'لوحة الإدارة', icon: Sliders },
  { id: 'view-landing',           label: 'الطلاب', icon: Users },
  { id: 'view-community',         label: 'المجتمع', icon: MessageSquare },
];

const teacherNav: NavItem[] = [
  { id: 'view-landing',           label: 'الرئيسية', icon: Home },
  { id: 'view-teacher-inbox',     label: 'صندوق رسائل المعلم', icon: Inbox },
  { id: 'view-drm-player',        label: 'الدروس', icon: Video },
  { id: 'view-assessment',        label: 'سجل الامتحانات', icon: FileSignature },
  { id: 'view-community',         label: 'المجتمع', icon: MessageSquare },
];

const guestNav: NavItem[] = [
  { id: 'view-landing',           label: 'الرئيسية', icon: Home },
  { id: 'view-drm-player',        label: 'الدروس الموحدة', icon: Video },
  { id: 'view-assessment',        label: 'سجل الامتحانات', icon: FileSignature },
  { id: 'view-community',         label: 'المجتمع', icon: MessageSquare },
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
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = isAuthenticated && currentUser
    ? ROLE_NAV[currentUser.role]
    : guestNav;

  const handleNavClick = (view: AppView) => {
    onNavigateView(view);
    setMobileMenuOpen(false);
  };

  return (
    <header className="navbar">
      <div className="container nav-container">
        {/* Brand Logo */}
        <a
          href="#"
          className="logo-brand"
          onClick={(e) => { e.preventDefault(); handleNavClick('view-landing'); }}
        >
          <div className="logo-icon">∫</div>
          <span>
            Syntax <span style={{ color: 'var(--secondary-light)', fontWeight: 400 }}>Math</span>
          </span>
        </a>

        {/* Desktop Navigation Modules */}
        <nav className="module-switcher desktop-only-nav">
          {navItems.map(item => {
            const IconComponent = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id + item.label}
                className={`module-btn ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
              >
                <IconComponent size={14} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Action Buttons */}
        <div className="nav-actions">
          {/* Notification Bell with live unread badge */}
          {isAuthenticated && (
            <NotificationBell onNavigateView={onNavigateView} />
          )}

          {/* Theme Toggle Button */}
          <button
            className="icon-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'تبديل للوضع الفاتح (Light Mode)' : 'تبديل للوضع الداكن (Dark Mode)'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Search Button */}
          <button className="icon-btn" onClick={onOpenSearchModal} title="بحث سريع">
            <Search size={18} />
          </button>

          {isAuthenticated && currentUser ? (
            <>
              <div className="nav-user-badge desktop-only-user">
                <img src={currentUser.avatar} className="nav-user-avatar" alt={currentUser.name} />
                <span>{currentUser.name.split(' ')[0]}</span>
                <span className={`role-badge role-badge--${currentUser.role}`} style={{ padding: '0.1rem 0.5rem', fontSize: '0.7rem' }}>
                  {ROLE_LABELS[currentUser.role]}
                </span>
              </div>
              <button
                className="btn btn-secondary desktop-only-btn"
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
                className="btn btn-secondary desktop-only-btn"
                onClick={onOpenAuthModal}
                style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}
              >
                <LogIn size={15} /> دخول
              </button>
              <button
                className="btn btn-primary desktop-only-btn"
                onClick={onOpenAuthModal}
                style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}
              >
                <UserPlus size={15} /> تسجيل
              </button>
            </>
          )}

          {/* Mobile Hamburger Collapse Button */}
          <button
            className="icon-btn mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="القائمة"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Collapsible Dropdown Navigation Menu */}
      {mobileMenuOpen && (
        <div className="mobile-dropdown-menu fade-in-up">
          {isAuthenticated && currentUser && (
            <div className="mobile-user-info">
              <img src={currentUser.avatar} className="nav-user-avatar" alt={currentUser.name} />
              <div>
                <strong style={{ fontSize: '0.9rem', display: 'block', color: 'var(--text-bright)' }}>{currentUser.name}</strong>
                <span className={`role-badge role-badge--${currentUser.role}`}>
                  {ROLE_LABELS[currentUser.role]}
                </span>
              </div>
            </div>
          )}

          <div className="mobile-nav-items">
            {navItems.map(item => {
              const IconComponent = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={'mob-' + item.id + item.label}
                  className={`mobile-nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => handleNavClick(item.id)}
                >
                  <IconComponent size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mobile-actions-row">
            {isAuthenticated && currentUser ? (
              <button className="btn btn-danger" style={{ width: '100%' }} onClick={() => { logout(); setMobileMenuOpen(false); }}>
                <LogOut size={16} /> تسجيل الخروج
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { onOpenAuthModal(); setMobileMenuOpen(false); }}>
                  <LogIn size={16} /> دخول
                </button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { onOpenAuthModal(); setMobileMenuOpen(false); }}>
                  <UserPlus size={16} /> إنشاء حساب
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
