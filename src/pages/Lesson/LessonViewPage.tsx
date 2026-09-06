import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BookOpen, Award, AlertCircle } from 'lucide-react';
import { lessonsApi } from '../../api/lessons.api';
import { SecureVideoPlayer } from '../../components/video/SecureVideoPlayer';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { useAuth } from '../../context/AuthContext';

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

  if (isLoading) {
    return <LoadingSpinner message="جاري تجهيز مشغل المحاضرة المشفرة..." size="lg" />;
  }

  if (isError || !lesson) {
    return (
      <ErrorState
        title="تعذر تشغيل المحاضرة"
        message={(error as any)?.message || 'المحاضرة غير متاحة أو ليس لديك اشتراك نشط في هذا الكورس.'}
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

      {/* Prerequisite Exam Alert Notice if present */}
      {lesson.PrerequisiteExamId && (
        <div
          className="glass-card"
          style={{
            background: 'rgba(139, 92, 246, 0.12)',
            border: '1px solid rgba(139, 92, 246, 0.35)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Award size={22} color="#A78BFA" />
            <div>
              <strong style={{ fontSize: '0.9rem', color: '#FFF', display: 'block' }}>
                اختبار تأهيلي مطلوب لهذه المحاضرة
              </strong>
              <span style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                يوصى بأداء الاختبار التأهيلي لقياس جاهزيتك لمحتوى المحاضرة.
              </span>
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => onOpenExam(lesson.PrerequisiteExamId!)}
            style={{ padding: '0.4rem 0.95rem', fontSize: '0.82rem' }}
          >
            بدء الاختبار الآن
          </button>
        </div>
      )}

      {/* Video Player */}
      <SecureVideoPlayer
        lessonId={lesson._id}
        videoUrl={lesson.VideoUrl}
        title={lesson.Title}
        userPhone={currentUser?.phone}
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
    </div>
  );
};
