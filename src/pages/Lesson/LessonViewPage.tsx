import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BookOpen, Award, AlertCircle, Clock } from 'lucide-react';
import { lessonsApi } from '../../api/lessons.api';
import { SecureVideoPlayer } from '../../components/video/SecureVideoPlayer';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { useAuth } from '../../context/AuthContext';
import { getFriendlyErrorMessage } from '../../utils/errors';

interface LessonViewPageProps {
  courseId: string;
  lessonId: string;
  onBackToCourse: () => void;
  onOpenExam: (examId: string) => void;
}

export const LessonViewPage: React.FC<LessonViewPageProps> = ({
  courseId,
  lessonId,
  onBackToCourse,
  onOpenExam,
}) => {
  const { currentUser } = useAuth();

  const { data: lesson, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['lesson', courseId, lessonId],
    queryFn: () => lessonsApi.getLessonById(courseId, lessonId),
  });

  const { data: lessonExams = [], isLoading: isExamsLoading } = useQuery({
    queryKey: ['lesson-exams', courseId, lessonId],
    queryFn: () => lessonsApi.getLessonExams(courseId, lessonId),
    enabled: !!courseId && !!lessonId,
  });

  // Consolidate exams from backend endpoint and fallback PrerequisiteExamId
  const displayExams = React.useMemo(() => {
    const list = [...lessonExams];
    if (lesson?.PrerequisiteExamId && !list.some((e) => e._id === lesson.PrerequisiteExamId)) {
      list.unshift({
        _id: lesson.PrerequisiteExamId,
        Title: 'الاختبار التأهيلي للمحاضرة',
        DurationMinutes: 20,
      });
    }
    return list;
  }, [lessonExams, lesson?.PrerequisiteExamId]);

  if (isLoading) {
    return <LoadingSpinner message="جاري تجهيز مشغل المحاضرة..." size="lg" />;
  }

  if (isError || !lesson) {
    return (
      <ErrorState
        title="تعذر تشغيل المحاضرة"
        message={getFriendlyErrorMessage(error, 'المحاضرة غير متاحة أو يلزم الاشتراك أولاً لمشاهدتها.')}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="container fade-in-up" style={{ padding: '2rem 1.5rem 6rem', maxWidth: '1080px' }}>
      {/* Back Button */}
      <button
        type="button"
        className="btn btn-secondary"
        onClick={onBackToCourse}
        style={{ marginBottom: '1.25rem', padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}
      >
        <ArrowRight size={15} /> العودة للكورس والمحاضرات
      </button>

      {/* Video Player */}
      <SecureVideoPlayer
        lessonId={lesson._id}
        videoUrl={lesson.VideoUrl}
        title={lesson.Title}
        userPhone={currentUser?.phone}
        userName={currentUser?.name}
      />

      {/* Lesson Details Card */}
      <div className="glass-card" style={{ marginTop: '1.75rem', padding: '1.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-bright)', margin: '0 0 0.5rem' }}>
          {lesson.Title}
        </h1>

        {lesson.Description && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6, margin: '0.75rem 0 0' }}>
            {lesson.Description}
          </p>
        )}
      </div>

      {/* Lesson Exams Section (GET /courses/:courseId/lessons/:lessonId/exams) */}
      {displayExams.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Award size={20} color="var(--primary-light)" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
              اختبارات المحاضرة ({displayExams.length})
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {displayExams.map((exam) => (
              <div
                key={exam._id}
                className="glass-card"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-glass)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'rgba(99, 102, 241, 0.15)',
                        color: 'var(--primary-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Award size={18} />
                    </div>
                    <strong style={{ fontSize: '0.98rem', color: 'var(--text-bright)' }}>
                      {exam.Title}
                    </strong>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                      fontSize: '0.78rem',
                      color: 'var(--text-muted)',
                      margin: '0.75rem 0 1.25rem',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={13} /> {exam.DurationMinutes} دقيقة
                    </span>
                    {typeof exam.TotalPoints === 'number' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        الدرجة الكلية: {exam.TotalPoints}
                      </span>
                    )}
                    {typeof exam.MaxAttempts === 'number' && exam.MaxAttempts > 0 && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        المحاولات: {exam.MaxAttempts}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => onOpenExam(exam._id)}
                  style={{
                    width: '100%',
                    padding: '0.55rem',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <Award size={15} /> ابدأ الامتحان
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
