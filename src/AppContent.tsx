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

// New LMS REST API Integrated Pages
import { CoursesPage } from './pages/Courses/CoursesPage';
import { CourseDetailsPage } from './pages/CourseDetails/CourseDetailsPage';
import { LessonViewPage } from './pages/Lesson/LessonViewPage';
import { ExamPage } from './pages/Exam/ExamPage';
import { ProfilePage } from './pages/Profile/ProfilePage';

const ROUTE_TO_VIEW: Record<string, AppView> = {
  '/': 'view-landing',
  '/home': 'view-landing',
  '/courses': 'view-courses',
  '/profile': 'view-profile',
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
  'view-courses': '/courses',
  'view-course-details': '/courses',
  'view-lesson-detail': '/lessons',
  'view-exam-session': '/exams',
  'view-profile': '/profile',
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

const getInitialState = () => {
  const rawPath = window.location.pathname.replace(/\/$/, '') || '/';
  const path = rawPath.toLowerCase();
  let initialCourseId: string | undefined;
  let initialExamId: string | undefined;
  let initialLessonId: string | undefined;
  let initialView: AppView = 'view-landing';

  if (path.startsWith('/courses/') || path.startsWith('/course/')) {
    const rawParts = rawPath.split('/');
    initialCourseId = rawParts[2];
    if ((rawParts[3]?.toLowerCase() === 'lessons' || rawParts[3]?.toLowerCase() === 'lesson') && rawParts[4]) {
      initialLessonId = rawParts[4];
      initialView = 'view-lesson-detail';
    } else {
      initialView = 'view-course-details';
    }
  } else if (path.startsWith('/exams/') || path.startsWith('/exam/')) {
    const rawParts = rawPath.split('/');
    initialExamId = rawParts[2];
    initialView = 'view-exam-session';
  } else if (ROUTE_TO_VIEW[path]) {
    initialView = ROUTE_TO_VIEW[path];
  } else {
    // Check localStorage fallback
    try {
      const saved = localStorage.getItem('syntax_active_view') as AppView;
      if (saved && VIEW_TO_ROUTE[saved]) {
        initialView = saved;
      }
    } catch {}
  }

  return { initialView, initialCourseId, initialExamId, initialLessonId };
};

export const AppContent: React.FC = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const initialState = getInitialState();

  const [currentView, setCurrentView] = useState<AppView>(initialState.initialView);
  const [selectedCourseId, setSelectedCourseId] = useState<string | undefined>(initialState.initialCourseId);
  const [selectedLessonId, setSelectedLessonId] = useState<string | undefined>(initialState.initialLessonId);
  const [selectedExamId, setSelectedExamId] = useState<string | undefined>(initialState.initialExamId);
  const [activeLessonId, setActiveLessonId] = useState<string | undefined>(undefined);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Sync URL on route state change
  useEffect(() => {
    let expectedPath = VIEW_TO_ROUTE[currentView] || '/';
    if (currentView === 'view-course-details' && selectedCourseId) {
      expectedPath = `/courses/${selectedCourseId}`;
    } else if (currentView === 'view-lesson-detail' && selectedCourseId && selectedLessonId) {
      expectedPath = `/courses/${selectedCourseId}/lessons/${selectedLessonId}`;
    } else if (currentView === 'view-exam-session' && selectedExamId) {
      expectedPath = `/exams/${selectedExamId}`;
    }

    const currentPath = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
    if (currentPath !== expectedPath && currentPath !== '') {
      window.history.replaceState({ view: currentView }, '', expectedPath);
    }

    try {
      localStorage.setItem('syntax_active_view', currentView);
    } catch {}
  }, [currentView, selectedCourseId, selectedLessonId, selectedExamId]);

  // Listen to browser Back/Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const state = getInitialState();
      setCurrentView(state.initialView);
      setSelectedCourseId(state.initialCourseId);
      setSelectedLessonId(state.initialLessonId);
      setSelectedExamId(state.initialExamId);
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

  const handleSelectCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    setCurrentView('view-course-details');
    try {
      window.history.pushState({ courseId }, '', `/courses/${courseId}`);
    } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectLessonInCourse = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setCurrentView('view-lesson-detail');
    if (selectedCourseId) {
      try {
        window.history.pushState({ courseId: selectedCourseId, lessonId }, '', `/courses/${selectedCourseId}/lessons/${lessonId}`);
      } catch {}
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenExam = (examId: string) => {
    setSelectedExamId(examId);
    setCurrentView('view-exam-session');
    try {
      window.history.pushState({ examId }, '', `/exams/${examId}`);
    } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = (role: UserRole) => {
    if (role === 'admin' || role === 'teacher') {
      handleNavigateView('view-admin');
    } else {
      handleNavigateView('view-courses');
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
        {/* Landing View */}
        {currentView === 'view-landing' && (
          <LandingView
            onNavigateView={handleNavigateView}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}

        {/* Courses Page (GET /courses) */}
        {currentView === 'view-courses' && (
          <CoursesPage onSelectCourse={handleSelectCourse} />
        )}

        {/* Course Details Page (GET /courses/:courseId) */}
        {currentView === 'view-course-details' && (
          selectedCourseId ? (
            <CourseDetailsPage
              courseId={selectedCourseId}
              onSelectLesson={handleSelectLessonInCourse}
              onSelectExam={handleOpenExam}
              onBackToCourses={() => handleNavigateView('view-courses')}
            />
          ) : (
            <CoursesPage onSelectCourse={handleSelectCourse} />
          )
        )}

        {/* Lesson View Page with Secure Video Player & Heartbeat */}
        {currentView === 'view-lesson-detail' && (
          selectedCourseId && selectedLessonId ? (
            <RoleGuard
              allowedRoles={['student', 'teacher', 'admin']}
              onNavigateHome={() => setIsAuthModalOpen(true)}
            >
              <LessonViewPage
                courseId={selectedCourseId}
                lessonId={selectedLessonId}
                onBackToCourse={() => handleSelectCourse(selectedCourseId)}
                onOpenExam={handleOpenExam}
              />
            </RoleGuard>
          ) : (
            <CoursesPage onSelectCourse={handleSelectCourse} />
          )
        )}

        {/* Exam Taking Page (POST /exams/:id/start & submit) */}
        {currentView === 'view-exam-session' && (
          selectedExamId ? (
            <RoleGuard
              allowedRoles={['student', 'teacher', 'admin']}
              onNavigateHome={() => setIsAuthModalOpen(true)}
            >
              <ExamPage
                examId={selectedExamId}
                onBack={() => {
                  if (selectedCourseId) {
                    handleSelectCourse(selectedCourseId);
                  } else {
                    handleNavigateView('view-courses');
                  }
                }}
              />
            </RoleGuard>
          ) : (
            <CoursesPage onSelectCourse={handleSelectCourse} />
          )
        )}

        {/* Profile Page with Device UUID, Scratch Card & Change Password */}
        {currentView === 'view-profile' && (
          <RoleGuard
            allowedRoles={['student', 'teacher', 'admin']}
            onNavigateHome={() => setIsAuthModalOpen(true)}
          >
            <ProfilePage onLogoutSuccess={() => handleNavigateView('view-landing')} />
          </RoleGuard>
        )}

        {/* Student Dashboard */}
        {currentView === 'view-student-dashboard' && (
          <RoleGuard
            allowedRoles={['student', 'teacher', 'admin']}
            onNavigateHome={() => handleNavigateView('view-landing')}
          >
            <StudentDashboardView
              onNavigateView={handleNavigateView}
              onSelectCourse={handleSelectCourse}
            />
          </RoleGuard>
        )}

        {/* Lessons & Lectures Unified Hub */}
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

        {/* Exams View */}
        {currentView === 'view-assessment' && (
          <RoleGuard
            allowedRoles={['student', 'teacher', 'admin']}
            onNavigateHome={() => handleNavigateView('view-landing')}
          >
            <StandaloneExamsView
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              onNavigateView={handleNavigateView}
              onSelectExam={handleOpenExam}
            />
          </RoleGuard>
        )}

        {/* Dedicated Navbar AI Experience */}
        {currentView === 'view-ai' && (
          <StandaloneAIView onOpenAuthModal={() => setIsAuthModalOpen(true)} />
        )}

        {/* Teacher Inbox */}
        {currentView === 'view-teacher-inbox' && (
          <RoleGuard
            allowedRoles={['teacher', 'admin']}
            onNavigateHome={() => handleNavigateView('view-landing')}
          >
            <TeacherInboxView />
          </RoleGuard>
        )}

        {/* Parent Portal */}
        {currentView === 'view-parent-portal' && (
          <ParentPortalView />
        )}

        {/* Dedicated FAQ View */}
        {currentView === 'view-faq' && (
          <FAQView />
        )}

        {/* Community */}
        {currentView === 'view-community' && (
          <CommunityView
            onOpenShareModal={() => setIsShareModalOpen(true)}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}

        {/* Admin Hub */}
        {currentView === 'view-admin' && (
          <RoleGuard
            allowedRoles={['admin', 'teacher']}
            onNavigateHome={() => handleNavigateView('view-landing')}
          >
            <AdminView />
          </RoleGuard>
        )}

        {/* Placeholder views */}
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
