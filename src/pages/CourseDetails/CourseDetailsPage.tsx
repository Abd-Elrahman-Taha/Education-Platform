import React, { useState } from 'react';
import { BookOpen, Lock, Play, ArrowRight, ShieldCheck, Award, Clock, AlertCircle } from 'lucide-react';
import { useCourseDetails } from '../../hooks/useCourseDetails';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { CheckoutModal } from '../../components/payment/CheckoutModal';
import { Lesson } from '../../types/api.types';
import { getFriendlyErrorMessage } from '../../utils/errors';

interface CourseDetailsPageProps {
  courseId: string;
  onSelectLesson: (lessonId: string) => void;
  onSelectExam: (examId: string) => void;
  onBackToCourses: () => void;
}

export const CourseDetailsPage: React.FC<CourseDetailsPageProps> = ({
  courseId,
  onSelectLesson,
  onSelectExam,
  onBackToCourses,
}) => {
  const {
    course,
    lessons,
    isEnrolled,
    isLoading,
    isCourseError,
    courseError,
    refetchCourse,
    refetchLessons,
  } = useCourseDetails(courseId);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  if (isLoading) {
    return <LoadingSpinner message="جاري تحميل بيانات الكورس والمحاضرات..." size="lg" />;
  }

  if (isCourseError || !course) {
    return (
      <ErrorState
        title="تعذر تحميل الكورس"
        message={getFriendlyErrorMessage(courseError, 'الكورس المطلوب غير متوفر حالياً.')}
        onRetry={refetchCourse}
      />
    );
  }

  return (
    <div className="container fade-in-up" style={{ padding: '2rem 1.5rem 6rem', maxWidth: '1000px' }}>
      {/* Back Button */}
      <button
        type="button"
        className="btn btn-secondary"
        onClick={onBackToCourses}
        style={{ marginBottom: '1.5rem', padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}
      >
        <ArrowRight size={15} /> العودة لقائمة الكورسات
      </button>

      {/* Course Hero Banner */}
      <div
        className="glass-card"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 280px',
          gap: '2rem',
          padding: '2rem',
          marginBottom: '2rem',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.6rem' }}>
            <span className={`status-badge ${isEnrolled ? 'status-badge--active' : 'status-badge--blocked'}`}>
              {isEnrolled ? '✓ أنت مشترك في هذا الكورس' : 'غير مشترك'}
            </span>
          </div>

          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-bright)', margin: '0 0 0.75rem' }}>
            {course.Title}
          </h1>

          {course.Description && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6, margin: '0 0 1.25rem' }}>
              {course.Description}
            </p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <span>عدد المحاضرات: <strong style={{ color: 'var(--text-bright)' }}>{lessons.length}</strong></span>
            <span>•</span>
            <span>قيمة الكورس: <strong style={{ color: '#10B981', fontSize: '1.1rem' }}>{course.Price} ج.م</strong></span>
          </div>
        </div>

        {/* Action / Enrollment Box */}
        <div
          style={{
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-glass)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>سعر الكورس</span>
          <strong style={{ fontSize: '1.75rem', color: '#10B981', display: 'block', margin: '0.25rem 0 1rem' }}>
            {course.Price > 0 ? `${course.Price} ج.م` : 'مجاني'}
          </strong>

          {isEnrolled ? (
            <div style={{ padding: '0.65rem', borderRadius: '8px', background: 'rgba(16,185,129,0.12)', color: '#10B981', fontSize: '0.85rem', fontWeight: 700 }}>
              <ShieldCheck size={18} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '4px' }} />
              الوصول متاح لجميع المحاضرات
            </div>
          ) : (
            <button
              className="btn btn-primary"
              onClick={() => setIsCheckoutOpen(true)}
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
            >
              الاشتراك والالتحاق بالكورس
            </button>
          )}
        </div>
      </div>

      {/* Pending enrollment notice if not enrolled */}
      {!isEnrolled && (
        <div
          style={{
            background: 'rgba(234, 179, 8, 0.1)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <AlertCircle size={20} color="var(--accent)" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.85rem', color: 'var(--text-bright)' }}>
            <strong>تنبيه الاشتراك:</strong> المحاضرات محمية ومشفرة للمشتركين فقط. إذا أتممت عملية الدفع للتو عبر فوري أو المحفظة، قد يستغرق تفعيل الاشتراك بضع لحظات حتى تأكيد البنك.
          </div>
        </div>
      )}

      {/* Lessons List Section */}
      <div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '1rem' }}>
          محتوى محاضرات الكورس ({lessons.length})
        </h2>

        {lessons.length === 0 ? (
          <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <BookOpen size={36} style={{ opacity: 0.3, margin: '0 auto 0.5rem' }} />
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              {isEnrolled ? 'لم تتم إضافة محاضرات في هذا الكورس بعد.' : 'اشترك في الكورس للاطلاع على كافة المحاضرات المسجلة والمذكرات.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {lessons.map((lesson: Lesson, idx: number) => {
              const isLocked = !isEnrolled || lesson.IsLocked;
              return (
                <div
                  key={lesson._id}
                  className="glass-card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.1rem 1.25rem',
                    borderRadius: 'var(--radius-md)',
                    opacity: isLocked ? 0.75 : 1,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: 'var(--radius-sm)',
                        background: isLocked ? 'rgba(255,255,255,0.05)' : 'rgba(8, 145, 178, 0.15)',
                        color: isLocked ? 'var(--text-muted)' : 'var(--primary-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        flexShrink: 0,
                      }}
                    >
                      {lesson.OrderIndex ?? lesson.Order ?? idx + 1}
                    </div>

                    <div>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--text-bright)', display: 'block', marginBottom: '0.2rem' }}>
                        {lesson.Title}
                      </strong>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {(lesson.DurationSeconds || lesson.DurationMinutes) && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Clock size={12} /> {lesson.DurationSeconds ? Math.round(lesson.DurationSeconds / 60) : lesson.DurationMinutes} دقيقة
                          </span>
                        )}
                        {lesson.PrerequisiteExamId && (
                          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                            ★ يحتوي على اختبار تأهيلي
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {lesson.PrerequisiteExamId && (
                      <button
                        className="btn btn-secondary"
                        onClick={() => onSelectExam(lesson.PrerequisiteExamId!)}
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                      >
                        <Award size={14} /> الاختبار التأهيلي
                      </button>
                    )}

                    {isLocked ? (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Lock size={14} /> مغلق
                      </span>
                    ) : (
                      <button
                        className="btn btn-primary"
                        onClick={() => onSelectLesson(lesson._id)}
                        style={{ padding: '0.4rem 0.9rem', fontSize: '0.82rem' }}
                      >
                        <Play size={14} /> مشاهدة المحاضرة
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          course={course}
        />
      )}
    </div>
  );
};
