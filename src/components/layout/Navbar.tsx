import React, { useState } from 'react';
import {
  Home, Video, FileSignature, ShieldCheck, Sliders, Search, LogIn, UserPlus,
  BookOpen, ClipboardList, Radio, Bot, FileText, User, Users, Settings,
  BarChart2, GraduationCap, LogOut, Sun, Moon, Menu, X, MessageSquare, Inbox, LayoutDashboard,
  HelpCircle, Shield, Edit3, Crown
} from 'lucide-react';
import { AppView, UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { NotificationBell } from '../../features/notifications/components/NotificationBell';
import { isPlaceholderName } from '../../utils/user';

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
  { id: 'view-courses',           label: 'الكورسات', icon: BookOpen },
  { id: 'view-student-dashboard', label: 'لوحة تحليلاتي', icon: LayoutDashboard },
  { id: 'view-drm-player',        label: 'الدروس والمحاضرات', icon: Video },
  { id: 'view-assessment',        label: 'سجل الامتحانات', icon: FileSignature },
  { id: 'view-ai',                label: 'المعلم الذكي AI', icon: Bot },
  { id: 'view-community',         label: 'مجتمع الطلاب', icon: MessageSquare },
];

const teacherNav: NavItem[] = [
  { id: 'view-landing',           label: 'الرئيسية', icon: Home },
  { id: 'view-courses',           label: 'الكورسات', icon: BookOpen },
  { id: 'view-admin',             label: 'لوحة الإدارة', icon: Sliders },
  { id: 'view-drm-player',        label: 'الدروس والمحاضرات', icon: Video },
  { id: 'view-assessment',        label: 'تحليلات الامتحانات', icon: FileSignature },
  { id: 'view-ai',                label: 'المعلم الذكي AI', icon: Bot },
  { id: 'view-community',         label: 'مجتمع الرياضيات', icon: MessageSquare },
  { id: 'view-teacher-inbox',     label: 'صندوق الرسائل', icon: Inbox },
];

const adminNav: NavItem[] = [
  { id: 'view-landing',           label: 'الرئيسية', icon: Home },
  { id: 'view-admin',             label: 'لوحة الإدارة', icon: Sliders },
  { id: 'view-student-dashboard', label: 'لوحة الطالب', icon: LayoutDashboard },
  { id: 'view-courses',           label: 'الكورسات', icon: BookOpen },
  { id: 'view-drm-player',        label: 'المحاضرات', icon: Video },
  { id: 'view-assessment',        label: 'الامتحانات', icon: FileSignature },
  { id: 'view-teacher-inbox',     label: 'صندوق الرسائل', icon: Inbox },
  { id: 'view-ai',                label: 'المعلم الذكي AI', icon: Bot },
  { id: 'view-community',         label: 'مجتمع الرياضيات', icon: MessageSquare },
];

const superAdminNav: NavItem[] = [
  { id: 'view-landing',           label: 'الرئيسية', icon: Home },
  { id: 'view-admin',             label: 'لوحة الإدارة', icon: Sliders },
  { id: 'view-courses',           label: 'الكورسات', icon: BookOpen },
  { id: 'view-drm-player',        label: 'المحاضرات', icon: Video },
  { id: 'view-assessment',        label: 'الامتحانات', icon: FileSignature },
  { id: 'view-teacher-inbox',     label: 'الرسائل', icon: Inbox },
  { id: 'view-ai',                label: 'المعلم AI', icon: Bot },
  { id: 'view-community',         label: 'المجتمع', icon: MessageSquare },
];

const parentLoggedInNav: NavItem[] = [
  { id: 'view-landing',           label: 'الرئيسية', icon: Home },
  { id: 'view-courses',           label: 'الكورسات', icon: BookOpen },
  { id: 'view-ai',                label: 'المعلم AI', icon: Bot },
  { id: 'view-community',         label: 'المجتمع', icon: MessageSquare },
];

const guestNav: NavItem[] = [
  { id: 'view-landing',           label: 'الرئيسية', icon: Home },
  { id: 'view-courses',           label: 'الكورسات', icon: BookOpen },
  { id: 'view-ai',                label: 'المعلم الذكي AI', icon: Bot },
  { id: 'view-community',         label: 'المجتمع', icon: MessageSquare },
  { id: 'view-parent-portal',     label: 'بوابة ولي الأمر', icon: ShieldCheck },
];

const ROLE_NAV: Record<UserRole, NavItem[]> = {
  student: studentNav,
  parent:  parentLoggedInNav,
  admin:   adminNav,
  superadmin: superAdminNav,
  teacher: teacherNav,
};

const ROLE_LABELS: Record<UserRole, string> = {
  student: 'طالب',
  parent:  'ولي أمر',
  admin:   'مدير المنصة',
  superadmin: 'المدير العام (SuperAdmin)',
  teacher: 'معلم',
};

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigateView,
  onOpenAuthModal,
  onOpenSearchModal,
}) => {
  const { currentUser, isAuthenticated, logout, updateUserName } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  const cleanDisplayName = (() => {
    if (!currentUser) return '';
    const isAdmin = currentUser.role === 'admin' || currentUser.role === 'superadmin' || currentUser.role === 'teacher';

    // 1. Check current user's name
    const raw = (currentUser.name || '').trim();
    if (!isPlaceholderName(raw, currentUser.role)) {
      return raw;
    }

    // 2. For Admin, check admin_username
    if (isAdmin) {
      const adminStored = localStorage.getItem('admin_username');
      if (adminStored && !isPlaceholderName(adminStored, 'admin')) {
        return adminStored.trim();
      }
    }

    // 3. Check cached by phone
    const cachedByPhone = currentUser.phone ? localStorage.getItem(`user_fullname_${currentUser.phone.trim()}`) : null;
    if (cachedByPhone && !isPlaceholderName(cachedByPhone, currentUser.role)) {
      return cachedByPhone.trim();
    }

    // 4. Check cached by ID
    const cachedById = currentUser.id ? localStorage.getItem(`user_fullname_${currentUser.id}`) : null;
    if (cachedById && !isPlaceholderName(cachedById, currentUser.role)) {
      return cachedById.trim();
    }

    // 5. Check active cached
    const activeCached = localStorage.getItem('user_fullname_active');
    if (activeCached && !isPlaceholderName(activeCached, currentUser.role)) {
      return activeCached.trim();
    }

    // 6. IF ADMIN: NEVER show phone number! Extract username from email or default to 'مدير المنصة'
    if (isAdmin) {
      if (currentUser.email && currentUser.email.includes('@')) {
        const emailPrefix = currentUser.email.split('@')[0].trim();
        if (emailPrefix && emailPrefix !== 'user' && !/^\+?[0-9\s\-]+$/.test(emailPrefix)) {
          return emailPrefix;
        }
      }
      return 'مدير المنصة';
    }

    // 7. For Student: phone number if no name is available
    if (currentUser.phone) {
      return currentUser.phone.trim();
    }

    return 'طالب';
  })();

  const isSuperAdmin =
    currentUser?.role === 'superadmin' ||
    currentUser?.isSuperAdmin === true ||
    (currentUser as any)?.Role === 'SuperAdmin' ||
    (currentUser as any)?.Role === 'superadmin';

  const rawNavItems = isAuthenticated && currentUser
    ? (isSuperAdmin ? superAdminNav : (ROLE_NAV[currentUser.role] || guestNav))
    : guestNav;

  // Strict requirement: Never display Parent Portal when logged in with any account
  const navItems = isAuthenticated
    ? rawNavItems.filter(item => item.id !== 'view-parent-portal')
    : rawNavItems;

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
        <nav className={`module-switcher desktop-only-nav ${isSuperAdmin ? 'module-switcher--superadmin' : ''}`}>
          {navItems.map(item => {
            const IconComponent = item.icon;
            const isActive = currentView === item.id;
            const isAdminDashboard = item.id === 'view-admin';
            return (
              <button
                key={item.id + item.label}
                className={`module-btn ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
                style={isAdminDashboard && isSuperAdmin ? {
                  border: isActive ? undefined : '1px solid rgba(245, 158, 11, 0.45)',
                  color: isActive ? '#FFF' : '#FBBF24',
                  background: isActive ? undefined : 'rgba(245, 158, 11, 0.1)',
                  fontWeight: 700,
                } : undefined}
              >
                {isAdminDashboard && isSuperAdmin ? (
                  <Crown size={14} color={isActive ? '#FFF' : '#F59E0B'} fill={isActive ? '#FFF' : '#F59E0B'} />
                ) : (
                  <IconComponent size={14} />
                )}
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
              <button
                className="icon-btn desktop-only-btn"
                onClick={() => handleNavClick('view-profile')}
                title="الملف الشخصي وإعدادات الحساب"
              >
                <User size={18} />
              </button>
              <div
                className={`nav-user-badge desktop-only-user ${isSuperAdmin ? 'nav-user-badge--superadmin' : ''}`}
                onClick={() => { setTempName(isPlaceholderName(cleanDisplayName) ? '' : cleanDisplayName); setIsEditingName(true); }}
                title="اضغط لتعديل الاسم الظاهر"
              >
                <img src={currentUser.avatar} className="nav-user-avatar" alt={cleanDisplayName} />
                {isSuperAdmin && (
                  <Crown size={13} fill="#F59E0B" color="#F59E0B" style={{ flexShrink: 0 }} />
                )}
                <span style={{ maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 800, color: 'var(--text-bright)' }}>
                  {cleanDisplayName.split(' ').slice(0, 3).join(' ')}
                </span>
                <Edit3 size={11} color="var(--primary-light)" style={{ opacity: 0.7 }} />
                <span className={`role-badge role-badge--${currentUser.role}`} style={{ padding: '0.12rem 0.55rem', fontSize: '0.72rem' }}>
                  {isSuperAdmin ? 'المدير العام' : ROLE_LABELS[currentUser.role]}
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
            <div
              className="mobile-user-info"
              onClick={() => { setTempName(isPlaceholderName(cleanDisplayName) ? '' : cleanDisplayName); setIsEditingName(true); setMobileMenuOpen(false); }}
              style={{ cursor: 'pointer' }}
            >
              <img src={currentUser.avatar} className="nav-user-avatar" alt={cleanDisplayName} />
              <div>
                <strong style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-bright)', fontWeight: 800 }}>
                  {isSuperAdmin && <Crown size={15} fill="#F59E0B" color="#F59E0B" />}
                  {cleanDisplayName}
                  <Edit3 size={13} color="var(--primary-light)" />
                </strong>
                <span className={`role-badge role-badge--${currentUser.role}`}>
                  {isSuperAdmin ? 'المدير العام (SuperAdmin)' : ROLE_LABELS[currentUser.role]}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%' }}>
                <button
                  className="btn btn-secondary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => handleNavClick('view-profile')}
                >
                  <User size={16} /> الملف الشخصي والحساب
                </button>
                <button className="btn btn-danger" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { logout(); setMobileMenuOpen(false); }}>
                  <LogOut size={16} /> تسجيل الخروج
                </button>
              </div>
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

      {/* Quick Edit Name Modal */}
      {isEditingName && (
        <div className="modal-overlay active" onClick={() => setIsEditingName(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit3 size={18} color="var(--primary-light)" /> تعديل الاسم الظاهر
              </h3>
              <button className="icon-btn" onClick={() => setIsEditingName(false)}><X size={16} /></button>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              أدخل اسمك ليظهر على شريط التنقل والشهادات الرسمية والمحاضرات بدلاً من رقم الهاتف:
            </p>
            <input
              type="text"
              className="input-field"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="اكتب اسمك الثلاثي أو الثنائي..."
              autoFocus
              style={{ marginBottom: '1.25rem' }}
            />
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setIsEditingName(false)}>إلغاء</button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (tempName.trim()) {
                    updateUserName(tempName.trim());
                    setIsEditingName(false);
                  }
                }}
              >
                حفظ الاسم
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

