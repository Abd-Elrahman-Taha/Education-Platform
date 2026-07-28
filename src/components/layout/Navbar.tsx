import React from 'react';
import { Atom, Home, Video, FileSignature, ShieldCheck, MessageSquare, Sliders, Search, Sun, Moon, LogIn, UserPlus } from 'lucide-react';
import { AppView } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface NavbarProps {
  currentView: AppView;
  onNavigateView: (view: AppView) => void;
  onOpenAuthModal: () => void;
  onOpenSearchModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigateView,
  onOpenAuthModal,
  onOpenSearchModal,
}) => {
  const { theme, toggleTheme } = useTheme();

  const navModules = [
    { id: 'view-landing' as AppView, label: 'الرئيسية', icon: Home },
    { id: 'view-drm-player' as AppView, label: 'مشغل الفيديوهات DRM', icon: Video },
    { id: 'view-assessment' as AppView, label: 'امتحانات البابل شيت', icon: FileSignature },
    { id: 'view-parent-portal' as AppView, label: 'بوابة ولي الأمر', icon: ShieldCheck },
    { id: 'view-community' as AppView, label: 'مجتمع الأسئلة', icon: MessageSquare },
    { id: 'view-admin' as AppView, label: 'لوحة الأدمن والأسستنت', icon: Sliders },
  ];

  return (
    <header className="navbar">
      <div className="container nav-container">
        {/* Brand Logo */}
        <a href="#" className="logo-brand" onClick={(e) => { e.preventDefault(); onNavigateView('view-landing'); }}>
          <div className="logo-icon">
            <Atom size={24} />
          </div>
          <span>
            Syntax <span style={{ color: 'var(--secondary-light)', fontWeight: 400 }}>EdTech</span>
          </span>
        </a>

        {/* Application Module Switcher Tabs */}
        <div className="module-switcher">
          {navModules.map(mod => {
            const IconComponent = mod.icon;
            const isActive = currentView === mod.id;
            return (
              <button
                key={mod.id}
                className={`module-btn ${isActive ? 'active' : ''}`}
                onClick={() => onNavigateView(mod.id)}
              >
                <IconComponent size={15} />
                {mod.label}
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="nav-actions">
          <button
            className="icon-btn"
            onClick={onOpenSearchModal}
            title="بحث سريع (Ctrl + K)"
          >
            <Search size={18} />
          </button>

          <button
            className="icon-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'تبديل للوضع الفاتح' : 'تبديل للوضع الداكن'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button className="btn btn-secondary" onClick={onOpenAuthModal} style={{ padding: '0.5rem 1.1rem', fontSize: '0.85rem' }}>
            <LogIn size={15} /> دخول
          </button>
          <button className="btn btn-primary" onClick={onOpenAuthModal} style={{ padding: '0.5rem 1.1rem', fontSize: '0.85rem' }}>
            <UserPlus size={15} /> إنشـاء حساب
          </button>
        </div>
      </div>
    </header>
  );
};
