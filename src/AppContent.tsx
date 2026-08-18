import React, { useState, useEffect } from 'react';
import { AppView, UserRole } from './types';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { AITutorWidget } from './components/layout/AITutorWidget';
import { LandingView } from './components/views/LandingView';
import { StudentDashboardView } from './features/student/components/StudentDashboardView';
import { UnifiedLessonView } from './features/lessons/components/UnifiedLessonView';
import { StandaloneExamsView } from './features/exams/components/StandaloneExamsView';
import { TeacherInboxView } from './features/messages/components/TeacherInboxView';
import { ParentPortalView } from './components/views/ParentPortalView';
import { FAQView } from './components/views/FAQView';
import { CommunityView } from './components/views/CommunityView';
import { AdminView } from './components/views/AdminView';
import { AuthModal } from './components/modals/AuthModal';
import { SearchModal } from './components/modals/SearchModal';
import { ShareModal } from './components/modals/ShareModal';
import { RoleGuard } from './components/layout/RoleGuard';
import { useAuth } from './context/AuthContext';
import { StandaloneAIView } from './features/ai/components/StandaloneAIView';

const ROUTE_TO_VIEW: Record<string, AppView> = {
  '/': 'view-landing',
  '/home': 'view-landing',
  '/dashboard': 'view-student-dashboard',
  '/student-dashboard': 'view-student-dashboard',
  '/lessons': 'view-drm-player',
  '/lectures': 'view-drm-player',
  '/exams': 'view-assessment',
  '/assessments': 'view-assessment',
  '/ai': 'view-ai',
  '/community': 'view-community',
  '/parent-portal': 'view-parent-portal',
  '/admin': 'view-admin',
  '/students': 'view-admin',
  '/teachers': 'view-admin',
  '/messages': 'view-teacher-inbox',
  '/inbox': 'view-teacher-inbox',
  '/packages': 'view-packages',
  '/faq': 'view-faq',
};

const VIEW_TO_ROUTE: Record<AppView, string> = {
  'view-landing': '/',
  'view-student-dashboard': '/dashboard',
  'view-drm-player': '/lessons',
  'view-assessment': '/exams',
  'view-ai': '/ai',
  'view-community': '/community',
  'view-parent-portal': '/parent-portal',
  'view-admin': '/admin',
  'view-teacher-inbox': '/messages',
  'view-packages': '/packages',
  'view-faq': '/faq',
  'view-homework': '/lessons',
  'view-pdfs': '/lessons',
  'view-live': '/lessons',
  'view-subject-calculus': '/lessons',
  'view-subject-geometry': '/lessons',
};

const getInitialView = (): AppView => {
  // 1. Check window.location.pathname
  const path = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
  if (ROUTE_TO_VIEW[path]) {
    return ROUTE_TO_VIEW[path];
  }

  // 2. Check window.location.hash
  const hash = window.location.hash.replace(/^#\/?/, '/').toLowerCase();
  if (ROUTE_TO_VIEW[hash]) {
    return ROUTE_TO_VIEW[hash];
  }

  // 3. Check localStorage
  try {
    const saved = localStorage.getItem('syntax_active_view') as AppView;
    if (saved && VIEW_TO_ROUTE[saved]) {
      return saved;
    }
  } catch {}

  return 'view-landing';
};

export const AppContent: React.FC = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>(getInitialView);
  const [activeLessonId, setActiveLessonId] = useState<string | undefined>(undefined);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Sync URL on initial mount and route changes without reloading
  useEffect(() => {
    const currentPath = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
    const expectedPath = VIEW_TO_ROUTE[currentView] || '/';
    if (currentPath !== expectedPath && currentPath !== '') {
      window.history.replaceState({ view: currentView }, '', expectedPath);
    }
    try {
      localStorage.setItem('syntax_active_view', currentView);
    } catch {}
  }, [currentView]);

  // Listen to browser Back/Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
      if (ROUTE_TO_VIEW[path]) {
        setCurrentView(ROUTE_TO_VIEW[path]);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigateView = (view: AppView, lessonId?: string) => {
    setCurrentView(view);
    if (lessonId) {
      setActiveLessonId(lessonId);
    }
    const targetPath = VIEW_TO_ROUTE[view] || '/';
    try {
      localStorage.setItem('syntax_active_view', view);
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ view }, '', targetPath);
      }
    } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = (role: UserRole) => {
    if (role === 'admin' || role === 'teacher') {
      handleNavigateView('view-admin');
    } else {
      handleNavigateView('view-student-dashboard');
    }
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Ambient Glowing Background Orbs */}
      <div className="ambient-glow-sphere sphere-1"></div>
      <div className="ambient-glow-sphere sphere-2"></div>

      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigateView={handleNavigateView}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenSearchModal={() => setIsSearchModalOpen(true)}
      />

      {/* Main View Router Container */}
      <main style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        {currentView === 'view-landing' && (
          <LandingView
            onNavigateView={handleNavigateView}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}

        {currentView === 'view-student-dashboard' && (
          <RoleGuard
            allowedRoles={['student', 'teacher', 'admin']}
            onNavigateHome={() => handleNavigateView('view-landing')}
          >
            <StudentDashboardView onNavigateView={handleNavigateView} />
          </RoleGuard>
        )}

        {/* Lessons & Lectures — Accessible for authenticated users (Students, Teachers, Admins) */}
        {currentView === 'view-drm-player' && (
          <RoleGuard
            allowedRoles={['student', 'teacher', 'admin']}
            onNavigateHome={() => handleNavigateView('view-landing')}
          >
            <UnifiedLessonView
              activeLessonId={activeLessonId}
              onNavigateView={handleNavigateView}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
            />
          </RoleGuard>
        )}

        {/* Exams View — Accessible only after login (Students: Exam History/Taking, Teacher/Admin: Analytics) */}
        {currentView === 'view-assessment' && (
          <RoleGuard
            allowedRoles={['student', 'teacher', 'admin']}
            onNavigateHome={() => handleNavigateView('view-landing')}
          >
            <StandaloneExamsView
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              onNavigateView={handleNavigateView}
            />
          </RoleGuard>
        )}

        {/* Standalone AI View — Dedicated Navbar AI Experience */}
        {currentView === 'view-ai' && (
          <StandaloneAIView onOpenAuthModal={() => setIsAuthModalOpen(true)} />
        )}

        {currentView === 'view-teacher-inbox' && (
          <RoleGuard
            allowedRoles={['teacher', 'admin']}
            onNavigateHome={() => handleNavigateView('view-landing')}
          >
            <TeacherInboxView />
          </RoleGuard>
        )}

        {/* Parent Portal is public & verification-based */}
        {currentView === 'view-parent-portal' && (
          <ParentPortalView />
        )}

        {/* Dedicated FAQ View */}
        {currentView === 'view-faq' && (
          <FAQView />
        )}

        {/* Community with Auth Gate for Guests */}
        {currentView === 'view-community' && (
          <CommunityView
            onOpenShareModal={() => setIsShareModalOpen(true)}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}

        {currentView === 'view-admin' && (
          <RoleGuard
            allowedRoles={['admin', 'teacher']}
            onNavigateHome={() => handleNavigateView('view-landing')}
          >
            <AdminView />
          </RoleGuard>
        )}

        {/* Placeholder views for new routes */}
        {(currentView === 'view-homework' || currentView === 'view-pdfs' || currentView === 'view-live') && (
          <RoleGuard
            allowedRoles={['student', 'teacher', 'admin']}
            onNavigateHome={() => handleNavigateView('view-landing')}
          >
            <div className="container fade-in-up" style={{ padding: '5rem 1.5rem', textAlign: 'center' }}>
              <div className="glass-card" style={{ padding: '3rem', maxWidth: '600px', margin: '0 auto' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                  {currentView === 'view-homework' ? '📝' : currentView === 'view-pdfs' ? '📄' : '📡'}
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '0.75rem' }}>
                  {currentView === 'view-homework' ? 'الواجبات المنزلية' :
                   currentView === 'view-pdfs' ? 'ملفات PDF والمذكرات' :
                   'البث المباشر'}
                </h2>
                <p style={{ color: 'var(--text-muted)' }}>
                  يمكنك الوصول للواجبات وملفات PDF المخصصة لكل درس مباشرة داخل صفحة الدرس الموحدة.
                </p>
                <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => handleNavigateView('view-drm-player')}>
                  الذهاب للدروس الموحدة
                </button>
              </div>
            </div>
          </RoleGuard>
        )}
      </main>

      {/* Footer */}
      <Footer
        onNavigateView={handleNavigateView}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Floating AI Assistant Widget */}
      <AITutorWidget />

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onNavigateView={handleNavigateView}
      />
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
};
