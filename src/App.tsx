import React, { useState } from 'react';
import { AppView } from './types';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { AITutorWidget } from './components/layout/AITutorWidget';
import { LandingView } from './components/views/LandingView';
import { DRMPlayerView } from './components/views/DRMPlayerView';
import { AssessmentView } from './components/views/AssessmentView';
import { ParentPortalView } from './components/views/ParentPortalView';
import { CommunityView } from './components/views/CommunityView';
import { AdminView } from './components/views/AdminView';
import { AuthModal } from './components/modals/AuthModal';
import { SearchModal } from './components/modals/SearchModal';
import { ShareModal } from './components/modals/ShareModal';
import './styles/globals.css';

export const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('view-landing');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const handleNavigateView = (view: AppView) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        {currentView === 'view-drm-player' && <DRMPlayerView />}
        {currentView === 'view-assessment' && <AssessmentView />}
        {currentView === 'view-parent-portal' && <ParentPortalView />}
        {currentView === 'view-community' && (
          <CommunityView onOpenShareModal={() => setIsShareModalOpen(true)} />
        )}
        {currentView === 'view-admin' && <AdminView />}
      </main>

      {/* Footer */}
      <Footer />

      {/* Floating Syntax AI Assistant Widget */}
      <AITutorWidget />

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
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

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
