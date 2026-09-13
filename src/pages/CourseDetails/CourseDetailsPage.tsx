import React, { useState, useEffect } from 'react';
import { BookOpen, Lock, Play, ArrowRight, ShieldCheck, Award, Clock, AlertCircle, CheckCircle2, Target, RotateCcw, Star } from 'lucide-react';
import { useCourseDetails } from '../../hooks/useCourseDetails';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { CheckoutModal } from '../../components/payment/CheckoutModal';
import { Lesson, Exam } from '../../types/api.types';
import { examsApi } from '../../api/exams.api';
import { lessonsApi } from '../../api/lessons.api';
import { getFriendlyErrorMessage } from '../../utils/errors';
import { useAuth } from '../../context/AuthContext';

interface CourseDetailsPageProps {
  courseId: string;
  onSelectLesson: (lessonId: string) => void;
  onSelectExam: (examId: string) => void;
  onBackToCourses: () => void;
  onNavigateToPackages?: () => void;
}

export const CourseDetailsPage: React.FC<CourseDetailsPageProps> = ({
  courseId,
  onSelectLesson,
  onSelectExam,
  onBackToCourses,
  onNavigateToPackages,
}) => {
  const { currentUser } = useAuth();
  const isSuperAdmin =
    currentUser?.role === 'superadmin' ||
    currentUser?.isSuperAdmin === true ||
    (currentUser as any)?.Role === 'SuperAdmin' ||
    (currentUser as any)?.Role === 'superadmin';
  const isAdminOrTeacher = isSuperAdmin || currentUser?.role === 'admin' || currentUser?.role === 'teacher';

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
  const [courseExams, setCourseExams] = useState<Exam[]>([]);
  const [isExamsLoading, setIsExamsLoading] = useState(false);
  const [examAttemptsMap, setExamAttemptsMap] = useState<Record<string, any>>({});

  useEffect(() => {
    let isMounted = true;
    setIsExamsLoading(true);

    const loadExams = async () => {
      try {
        const examMap = new Map<string, Exam>();

        if (isAdminOrTeacher) {
          // Admin & Teacher: can safely query /exams
          try {
            const res = await examsApi.getExams({ CourseId: courseId });
            (res.exams || []).forEach((e) => {
              const cid = typeof e.CourseId === 'object' && e.CourseId ? (e.CourseId as any)._id : e.CourseId;
              if (cid === courseId && (e.Status === 'Published' || !e.Status)) {
                examMap.set(e._id, e);
              }
            });
          } catch {}
        } else if (isEnrolled) {
          // Student enrolled in this course: query exams for each lesson safely
          await Promise.all(
            lessons.map(async (lesson) => {
              try {
                const lessonExams = await lessonsApi.getLessonExams(courseId, lesson._id);
                if (Array.isArray(lessonExams)) {
                  lessonExams.forEach((le: any) => {
                    if (le && le._id && !examMap.has(le._id)) {
                      examMap.set(le._id, {
                        _id: le._id,
                        Title: le.Title || `امتحان ${lesson.Title}`,
                        CourseId: courseId,
                        LessonId: lesson._id,
                        DurationMinutes: le.DurationMinutes || 20,
                        PassingScore: le.PassingScore || 10,
                        MaxAttempts: le.MaxAttempts || 0,
                        Status: le.Status || 'Published',
                        IsRandomized: false,
                        IsGated: false,
                      } as Exam);
                    }
                  });
                }
              } catch {}
            })
          );
        }

        // Always check lesson.PrerequisiteExamId as well
        if (Array.isArray(lessons)) {
          lessons.forEach((l) => {
            if (l.PrerequisiteExamId && !examMap.has(l.PrerequisiteExamId)) {
              examMap.set(l.PrerequisiteExamId, {
                _id: l.PrerequisiteExamId,
                Title: `امتحان: ${l.Title || 'المحاضرة'}`,
                CourseId: courseId,
                LessonId: l._id,
                DurationMinutes: (l as any).DurationMinutes || (l.DurationSeconds ? Math.round(l.DurationSeconds / 60) : 20),
                PassingScore: 10,
                MaxAttempts: 0,
                Status: 'Published',
                IsRandomized: true,
                IsGated: false,
              } as Exam);
            }
          });
        }

        if (isMounted) {
          setCourseExams(Array.from(examMap.values()));
        }
      } finally {
        if (isMounted) {
          setIsExamsLoading(false);
        }
      }
    };

    loadExams();
    return () => {
      isMounted = false;
    };
  }, [courseId, lessons, isEnrolled, isAdminOrTeacher]);

  // Fetch student's attempt & degree for each exam in the course
  useEffect(() => {
    let isMounted = true;
    if (courseExams.length === 0) return;

    const loadAttempts = async () => {
      const attemptsMap: Record<string, any> = {};
      await Promise.all(
        courseExams.map(async (exam) => {
          try {
            const list = await examsApi.getMyExamAttempts(exam._id);
            if (Array.isArray(list) && list.length > 0) {
              const bestAttempt = [...list].sort((a, b) => Number(b.score ?? 0) - Number(a.score ?? 0))[0];
              attemptsMap[exam._id] = bestAttempt;
            }
          } catch {}
        })
      );
      if (isMounted) {
        setExamAttemptsMap(attemptsMap);
      }
    };

    loadAttempts();
    return () => {
      isMounted = false;
    };
  }, [courseExams]);

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
            <span className={`status-badge ${isEnrolled ? 'status-badge--active' : 'status-badge--blocked'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              {isEnrolled ? (
                <>
                  <CheckCircle2 size={13} /> أنت مشترك في هذا الكورس
                </>
              ) : 'غير مشترك'}
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
            <>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsCheckoutOpen(true)}
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
              >
                الاشتراك والالتحاق بالكورس
              </button>
              {onNavigateToPackages && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onNavigateToPackages}
                  style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem', fontSize: '0.82rem' }}
                >
                  استعراض الباقات والخصومات
                </button>
              )}
            </>
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
              const isLocked = !isSuperAdmin && (!isEnrolled || lesson.IsLocked);
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--text-bright)' }}>
                          {lesson.Title}
                        </strong>
                        {isSuperAdmin && lesson.IsLocked && (
                          <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.45rem', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                            <Lock size={10} /> مقفل للطلاب (متاح لك كمدير)
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {(lesson.DurationSeconds || lesson.DurationMinutes) && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Clock size={12} /> {lesson.DurationSeconds ? Math.round(lesson.DurationSeconds / 60) : lesson.DurationMinutes} دقيقة
                          </span>
                        )}
                        {lesson.PrerequisiteExamId && (
                          <span style={{ color: 'var(--accent)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Star size={13} fill="currentColor" /> يحتوي على اختبار تأهيلي
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

      {/* ── COURSE EXAMS & ASSESSMENTS SECTION ─────────────── */}
      <div className="glass-card" style={{ padding: '2rem', marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award size={22} color="var(--primary-light)" /> امتحانات واختبارات الكورس ({courseExams.length})
            </h2>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              اختبارات إلكترونية تفاعلية بنظام البابل شيت والتصحيح الفوري
            </span>
          </div>
        </div>

        {isExamsLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            جاري تحميل الاختبارات...
          </div>
        ) : courseExams.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--bg-subtle)', borderRadius: '10px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            لا توجد امتحانات منشورة لهذا الكورس حالياً.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {courseExams.map(exam => {
              const attempt = examAttemptsMap[exam._id];
              const hasAttempt = !!attempt;
              const isPassed = attempt?.status === 'Passed' || (attempt?.score ?? 0) >= (exam.PassingScore || 50);
              const scoreVal = attempt?.score ?? 0;
              const totalVal = attempt?.totalPoints;

              return (
                <div
                  key={exam._id}
                  className="glass-card"
                  style={{
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: hasAttempt
                      ? (isPassed ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)')
                      : '1px solid var(--border-glass)',
                    background: hasAttempt
                      ? (isPassed ? 'rgba(16, 185, 129, 0.03)' : 'rgba(239, 68, 68, 0.03)')
                      : 'rgba(255, 255, 255, 0.02)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      {hasAttempt ? (
                        <span style={{
                          fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.65rem',
                          borderRadius: '9999px',
                          background: isPassed ? 'rgba(16, 185, 129, 0.18)' : 'rgba(239, 68, 68, 0.18)',
                          color: isPassed ? '#10B981' : '#EF4444',
                          display: 'inline-flex', alignItems: 'center', gap: '0.3rem'
                        }}>
                          {isPassed ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                          {isPassed ? 'اجتياز ناجح' : 'لم يتم الاجتياز'}
                        </span>
                      ) : (
                        <span style={{
                          fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.55rem',
                          borderRadius: '9999px', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981'
                        }}>
                          اختبار متاح
                        </span>
                      )}
                      {exam.IsGated && (
                        <span style={{ fontSize: '0.7rem', color: '#F59E0B', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          مشروط <Lock size={11} />
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-bright)', margin: '0 0 0.5rem' }}>
                      {exam.Title}
                    </h3>

                    {/* DEGREE DISPLAY BANNER FOR STUDENT */}
                    {hasAttempt && (
                      <div style={{
                        background: isPassed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        border: `1px solid ${isPassed ? 'rgba(16, 185, 129, 0.28)' : 'rgba(239, 68, 68, 0.28)'}`,
                        borderRadius: '8px',
                        padding: '0.55rem 0.85rem',
                        marginBottom: '0.85rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-bright)', fontWeight: 700 }}>
                          درجتك في الاختبار:
                        </span>
                        <strong style={{ fontSize: '1.15rem', fontWeight: 900, color: isPassed ? '#10B981' : '#EF4444' }}>
                          {scoreVal} {totalVal ? `/ ${totalVal}` : '%'}
                        </strong>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.85rem', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem', flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={13} /> {exam.DurationMinutes} دقيقة</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><Target size={13} /> درجة النجاح: {exam.PassingScore}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><RotateCcw size={13} /> المحاولات: {exam.MaxAttempts === 0 ? 'غير محدودة' : exam.MaxAttempts}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      background: hasAttempt && isPassed ? 'linear-gradient(135deg, #10B981, #059669)' : undefined,
                      borderColor: hasAttempt && isPassed ? '#10B981' : undefined
                    }}
                    onClick={() => onSelectExam(exam._id)}
                  >
                    <Award size={15} /> {hasAttempt ? 'إعادة الاختبار' : 'بدء الامتحان الآن'}
                  </button>
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
          onSuccess={() => {
            refetchCourse();
            refetchLessons();
          }}
        />
      )}
    </div>
  );
};
