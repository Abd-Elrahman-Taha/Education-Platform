import React, { useState, useMemo } from 'react';
import { Search, BookOpen, Book, ArrowLeft, Filter, Sparkles, GraduationCap, Lock, CheckCircle2, ShieldCheck, CreditCard } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useCourses } from '../../hooks/useCourses';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { Pagination } from '../../components/common/Pagination';
import { Course } from '../../types/api.types';
import { AcademicYear, ACADEMIC_YEAR_LABELS } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { enrollmentsApi } from '../../api/enrollments.api';
import { SubscriptionPlansModal } from '../../components/payment/SubscriptionPlansModal';
import { getFriendlyErrorMessage } from '../../utils/errors';
import { matchesAcademicYear } from '../../utils/courseFilter';

interface CoursesPageProps {
  onSelectCourse: (courseId: string) => void;
}

export const CoursesPage: React.FC<CoursesPageProps> = ({ onSelectCourse }) => {
  const { currentUser } = useAuth();
  const isAdminOrTeacher = currentUser?.role === 'admin' || currentUser?.role === 'superadmin' || currentUser?.role === 'teacher';
  const isStudentSubscribed = !!(currentUser?.isSubscribed || currentUser?.subscription?.isActive);
  const userSubscribedYear: AcademicYear = (currentUser?.subscribedYear as AcademicYear) || (currentUser?.subscription?.year as AcademicYear) || 'third_secondary';

  const [selectedYear, setSelectedYear] = useState<AcademicYear | 'all'>('all');
  const [modalYear, setModalYear] = useState<AcademicYear>('third_secondary');
  const [isPlansModalOpen, setIsPlansModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  // Live query for current student's enrolled courses from backend
  const { data: myEnrollments } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => enrollmentsApi.getMyCourses(),
    enabled: !!currentUser && !isAdminOrTeacher,
  });

  const enrolledCourseIds = useMemo(() => {
    if (!myEnrollments || !Array.isArray(myEnrollments)) return new Set<string>();
    return new Set(
      myEnrollments.map((e) =>
        typeof e.CourseId === 'object' && e.CourseId ? e.CourseId._id : (e.CourseId as unknown as string)
      )
    );
  }, [myEnrollments]);

  const {
    courses,
    pagination,
    isLoading,
    isError,
    error,
    params,
    handlePageChange,
    handleSearchChange,
    handleSortChange,
    refetch,
  } = useCourses({ limit: 12, sort: '-createdAt' });

  const yearsList: { key: AcademicYear; title: string; subtitle: string; icon: React.ElementType }[] = [
    { key: 'first_secondary', title: 'الصف الأول الثانوي', subtitle: 'الجبر وحساب المثلثات والهندسة المستوية', icon: BookOpen },
    { key: 'second_secondary', title: 'الصف الثاني الثانوي', subtitle: 'الدوال الحقيقية وتأسيس التفاضل والتكامل', icon: Book },
    { key: 'third_secondary', title: 'الصف الثالث الثانوي', subtitle: 'التفاضل والتكامل والهندسة الفراغية التخصصية', icon: GraduationCap },
  ];

  const handleYearClick = (yearKey: AcademicYear) => {
    if (selectedYear === yearKey) {
      setSelectedYear('all');
    } else {
      setSelectedYear(yearKey);
    }
  };

  const filteredCourses = courses.filter((course: Course) => {
    return matchesAcademicYear(course, selectedYear);
  });

  const handleCourseClick = (course: Course) => {
    // Open course details directly. CourseDetailsPage handles unlocking lessons if enrolled,
    // or displays registration options if not enrolled.
    onSelectCourse(course._id);
  };

  const onSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchInput(val);
    const trimmed = val.trim();
    if (!trimmed) {
      handleSearchChange('');
    } else {
      handleSearchChange(trimmed);
    }
  };

  return (
    <div className="container fade-in-up" style={{ padding: '2.5rem 1.5rem 6rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 2rem' }}>
        <span className="gradient-badge" style={{ marginBottom: '0.75rem', display: 'inline-flex' }}>
          <Sparkles size={13} /> استكشف الكورسات والمراحل الدراسية
        </span>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--text-bright)', margin: '0.4rem 0 0.75rem' }}>
          الكورسات والمسارات التعليمية
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0, lineHeight: 1.6 }}>
          حدد مرحلتك الدراسية للوصول إلى المحاضرات المعتمدة، امتحانات البابل شيت، والملازم
        </p>
      </div>

      {/* ── ACADEMIC YEARS SELECTION CARDS (Requirement #2) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {yearsList.map((yr) => {
          const isThisYearSubscribed = isStudentSubscribed && (userSubscribedYear === yr.key);
          const isCurrentSelected = selectedYear === yr.key;
          const hasFullAccess = isAdminOrTeacher || isThisYearSubscribed;

          return (
            <div
              key={yr.key}
              className={`glass-card ${isCurrentSelected && hasFullAccess ? 'popular' : ''}`}
              onClick={() => handleYearClick(yr.key)}
              style={{
                padding: '1.5rem',
                cursor: 'pointer',
                borderRadius: 'var(--radius-lg)',
                border: isCurrentSelected && hasFullAccess
                  ? '2px solid var(--primary-light)'
                  : !hasFullAccess
                  ? '1px solid rgba(245, 158, 11, 0.3)'
                  : '1px solid var(--border-glass)',
                background: isCurrentSelected && hasFullAccess
                  ? 'rgba(8, 145, 178, 0.12)'
                  : undefined,
                transition: 'all 0.25s ease',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(8, 145, 178, 0.15)', color: 'var(--primary-light)' }}>
                    <yr.icon size={26} />
                  </span>
                  {isAdminOrTeacher ? (
                    <span className="status-badge status-badge--active" style={{ fontSize: '0.75rem', gap: '0.3rem' }}>
                      <ShieldCheck size={13} /> صلاحية إدارة كاملة
                    </span>
                  ) : isThisYearSubscribed ? (
                    <span className="status-badge status-badge--active" style={{ fontSize: '0.75rem', gap: '0.3rem' }}>
                      <CheckCircle2 size={13} /> اشتراكك مفعل
                    </span>
                  ) : (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      background: 'rgba(245, 158, 11, 0.15)',
                      color: '#F59E0B',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      padding: '0.2rem 0.65rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}>
                      <Lock size={12} /> غير مشترك
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-bright)', margin: '0 0 0.35rem' }}>
                  {yr.title}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: 0, lineHeight: 1.5 }}>
                  {yr.subtitle}
                </p>
              </div>

              <div style={{ marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: hasFullAccess ? 'var(--primary-light)' : '#F59E0B', fontWeight: 700 }}>
                  {hasFullAccess ? 'تصفح الكورسات المتاحة' : 'عرض باقات وطرق الدفع'}
                </span>
                <button
                  type="button"
                  className={`btn ${hasFullAccess ? (isCurrentSelected ? 'btn-primary' : 'btn-secondary') : 'btn-secondary'}`}
                  style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', gap: '0.35rem' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (hasFullAccess) {
                      handleYearClick(yr.key);
                    } else {
                      setModalYear(yr.key);
                      setIsPlansModalOpen(true);
                    }
                  }}
                >
                  {hasFullAccess ? (isCurrentSelected ? 'معروض حالياً' : 'عرض الكورسات') : <><CreditCard size={13} /> اشترك الآن</>}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Subscription Plans Modal */}
      <SubscriptionPlansModal
        isOpen={isPlansModalOpen}
        onClose={() => setIsPlansModalOpen(false)}
        academicYear={modalYear}
        onSubscribedSuccess={() => {
          setSelectedYear(modalYear);
          refetch();
        }}
      />

      {/* Filters & Search Toolbar */}
      <div
        className="glass-card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '1rem 1.25rem',
          marginBottom: '2rem',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            placeholder="ابحث عن كورس أو مادة..."
            className="input-field"
            style={{ width: '100%', paddingRight: '38px', fontSize: '0.88rem' }}
            value={searchInput}
            onChange={onSearchInputChange}
          />
        </div>

        {/* Quick Academic Year Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn ${selectedYear === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}
            onClick={() => setSelectedYear('all')}
          >
            كافة السنوات ({courses.length})
          </button>
          {yearsList.map(yr => (
            <button
              key={yr.key}
              type="button"
              className={`btn ${selectedYear === yr.key ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}
              onClick={() => handleYearClick(yr.key)}
            >
              {yr.title}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} style={{ color: 'var(--text-muted)' }} />
          <select
            className="input-field"
            style={{ fontSize: '0.85rem', width: 'auto' }}
            value={params.sort || '-createdAt'}
            onChange={(e) => handleSortChange(e.target.value)}
          >
            <option value="-createdAt">الأحدث إضافة</option>
            <option value="Price">الأقل سعراً</option>
            <option value="-Price">الأعلى سعراً</option>
            <option value="Title">أبجدياً (أ - ي)</option>
          </select>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && <LoadingSpinner message="جاري استعراض الكورسات..." size="lg" />}

      {/* Error state */}
      {isError && (
        <ErrorState
          title="تعذر عرض الكورسات"
          message={getFriendlyErrorMessage(error, 'تعذر تحميل الكورسات حالياً. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.')}
          onRetry={refetch}
        />
      )}

      {/* Empty state */}
      {!isLoading && !isError && filteredCourses.length === 0 && (
        <EmptyState
          title="لم يتم العثور على أي كورسات"
          message={
            params.search
              ? `لا توجد نتائج بحث مطابقة لـ "${params.search}".`
              : selectedYear !== 'all'
              ? `لا توجد كورسات معلنة لـ "${ACADEMIC_YEAR_LABELS[selectedYear]}" حالياً.`
              : 'لا توجد كورسات منشورة متاحة حالياً.'
          }
          actionText={selectedYear !== 'all' ? 'عرض كافة المراحل الدراسية' : (params.search ? 'إلغاء البحث' : undefined)}
          onAction={() => {
            if (selectedYear !== 'all') setSelectedYear('all');
            else if (params.search) handleSearchChange('');
          }}
        />
      )}

      {/* Courses Grid */}
      {!isLoading && !isError && filteredCourses.length > 0 && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {filteredCourses.map((course: Course) => {
              const isEnrolledInCourse = isAdminOrTeacher || enrolledCourseIds.has(course._id);
              return (
                <div
                  key={course._id}
                  className="glass-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'pointer',
                    border: isEnrolledInCourse ? '1px solid rgba(16, 185, 129, 0.35)' : undefined,
                  }}
                  onClick={() => handleCourseClick(course)}
                >
                  {/* Course Thumbnail */}
                  <div
                    style={{
                      height: '160px',
                      background: course.Thumbnail
                        ? `url(${course.Thumbnail}) center/cover no-repeat`
                        : 'linear-gradient(135deg, rgba(8,145,178,0.25), rgba(139,92,246,0.25))',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {!course.Thumbnail && <BookOpen size={48} style={{ opacity: 0.35, color: '#FFF' }} />}
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '10px',
                        left: '10px',
                        background: isEnrolledInCourse ? 'rgba(16, 185, 129, 0.85)' : 'rgba(0, 0, 0, 0.75)',
                        backdropFilter: 'blur(6px)',
                        color: '#FFF',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        padding: '0.25rem 0.65rem',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      {isEnrolledInCourse ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <CheckCircle2 size={12} /> مشترك
                        </span>
                      ) : (course.Price > 0 ? `${course.Price} ج.م` : 'مجاني')}
                    </span>
                  </div>

                  {/* Course Info */}
                  <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <h3
                      style={{
                        fontSize: '1.1rem',
                        fontWeight: 800,
                        color: 'var(--text-bright)',
                        margin: '0 0 0.5rem',
                        lineHeight: 1.4,
                      }}
                    >
                      {course.Title}
                    </h3>

                    {course.Description && (
                      <p
                        style={{
                          color: 'var(--text-muted)',
                          fontSize: '0.84rem',
                          margin: '0 0 1rem',
                          lineHeight: 1.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          flex: 1,
                        }}
                      >
                        {course.Description}
                      </p>
                    )}

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: 'auto',
                        paddingTop: '0.85rem',
                        borderTop: '1px solid var(--border-glass)',
                      }}
                    >
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {course.LessonsCount ? `${course.LessonsCount} محاضرة` : 'عرض التفاصيل'}
                      </span>
                      <button
                        className={`btn ${isEnrolledInCourse ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCourseClick(course);
                        }}
                      >
                        {isEnrolledInCourse ? 'دخول المحاضرات' : 'عرض التفاصيل'} <ArrowLeft size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Backend-driven Pagination */}
          <Pagination pagination={pagination} onPageChange={handlePageChange} />
        </>
      )}
    </div>
  );
};
