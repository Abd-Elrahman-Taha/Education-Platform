import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { examsApi } from '../api/examsApi';
import { examsApi as backendExamsApi } from '../../../api/exams.api';
import { ExamRecord, ACADEMIC_YEAR_LABELS, AcademicYear } from '../../../types';
import { Exam } from '../../../types/api.types';
import { useAuth } from '../../../context/AuthContext';
import { coursesApi } from '../../../api/courses.api';
import { studentsApi } from '../../../api/students.api';
import { enrollmentsApi } from '../../../api/enrollments.api';
import { lessonsApi } from '../../../api/lessons.api';
import { matchesAcademicYear } from '../../../utils/courseFilter';
import {
  Award, CheckCircle, XCircle, Clock, Calendar, BarChart2, Eye, X,
  Sigma, Check, HelpCircle, Users, TrendingUp, AlertTriangle, ArrowUp,
  GraduationCap, BookOpen, Layers, Lock, LogIn, UserPlus, PlayCircle, ShieldCheck, Sparkles,
  Target, RotateCcw, FileQuestion, BarChart3, CheckCircle2, Search, Filter
} from 'lucide-react';

interface StandaloneExamsViewProps {
  onOpenAuthModal?: () => void;
  onNavigateView?: (view: any, lessonId?: string) => void;
  onSelectExam?: (examId: string) => void;
}

export const StandaloneExamsView: React.FC<StandaloneExamsViewProps> = ({ onOpenAuthModal, onNavigateView, onSelectExam }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const isTeacherOrAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin' || currentUser?.role === 'teacher';

  const [activeTab, setActiveTab] = useState<'all' | 'passed' | 'failed' | 'completed'>('all');
  const [selectedExamDetail, setSelectedExamDetail] = useState<ExamRecord | null>(null);
  const [guestYear, setGuestYear] = useState<AcademicYear>('third_secondary');
  const [courseFilter, setCourseFilter] = useState<'all' | 'enrolled_only' | string>('all');
  const [examSearch, setExamSearch] = useState('');

  const { data: allCoursesData } = useQuery({
    queryKey: ['allCoursesForExamCards'],
    queryFn: () => coursesApi.getCourses(),
  });
  const allCourses = allCoursesData?.courses || [];

  // Fetch student's enrolled courses
  const { data: myEnrollments = [], isLoading: isEnrollmentsLoading } = useQuery({
    queryKey: ['myEnrollmentsForExams'],
    queryFn: () => enrollmentsApi.getMyCourses(),
    enabled: isAuthenticated && !isTeacherOrAdmin,
  });

  // Extract enrolled course IDs and full course objects
  const enrolledCourseIds = useMemo(() => {
    const ids = new Set<string>();
    myEnrollments.forEach((e: any) => {
      const cid = typeof e.CourseId === 'object' && e.CourseId ? (e.CourseId as any)._id : e.CourseId;
      if (cid) ids.add(cid);
    });

    // If student has full subscription, automatically enroll in all courses matching their academic year
    const isStudentSubscribed = !!(currentUser?.isSubscribed || currentUser?.subscription?.isActive);
    const userSubscribedYear: string =
      (currentUser?.subscribedYear as string) ||
      (currentUser?.subscription?.year as string) ||
      'all';

    if (isStudentSubscribed && allCourses.length > 0) {
      allCourses.forEach(c => {
        if (userSubscribedYear === 'all' || matchesAcademicYear(c, userSubscribedYear)) {
          ids.add(c._id);
        }
      });
    }
    return ids;
  }, [myEnrollments, currentUser, allCourses]);

  const enrolledCoursesList = useMemo(() => {
    const coursesMap = new Map<string, { _id: string; Title: string }>();
    myEnrollments.forEach((e: any) => {
      if (typeof e.CourseId === 'object' && e.CourseId && e.CourseId._id) {
        coursesMap.set(e.CourseId._id, { _id: e.CourseId._id, Title: e.CourseId.Title });
      } else if (e.CourseId) {
        const found = allCourses.find((c: any) => c._id === e.CourseId);
        if (found) {
          coursesMap.set(found._id, { _id: found._id, Title: found.Title });
        }
      }
    });
    allCourses.forEach(c => {
      if (enrolledCourseIds.has(c._id) && !coursesMap.has(c._id)) {
        coursesMap.set(c._id, { _id: c._id, Title: c.Title });
      }
    });
    return Array.from(coursesMap.values());
  }, [myEnrollments, allCourses, enrolledCourseIds]);

  // Fetch exams for all enrolled courses AND general published exams
  const enrolledCourseIdsKey = Array.from(enrolledCourseIds).sort().join(',');
  const { data: publishedExamsRes = [], isLoading: isPublishedExamsLoading } = useQuery({
    queryKey: ['availablePublishedExams', enrolledCourseIdsKey],
    queryFn: async () => {
      const examMap = new Map<string, Exam>();

      // 1. General published exams query from /exams
      try {
        const res = await backendExamsApi.getExams();
        const list = res.exams || [];
        list.forEach(e => {
          if (e && e._id) {
            examMap.set(e._id, e);
          }
        });
      } catch (err: any) {
        console.warn('[Exams] General getExams returned:', err?.message || err);
      }

      // 2. Discover lesson-linked prerequisite exams for all enrolled courses
      const courseIdList = Array.from(enrolledCourseIds);
      if (courseIdList.length > 0) {
        await Promise.all(
          courseIdList.map(async courseId => {
            try {
              const lessons = await lessonsApi.getCourseLessons(courseId);
              if (Array.isArray(lessons)) {
                for (const lesson of lessons) {
                  if (lesson.PrerequisiteExamId && !examMap.has(lesson.PrerequisiteExamId)) {
                    examMap.set(lesson.PrerequisiteExamId, {
                      _id: lesson.PrerequisiteExamId,
                      Title: `امتحان: ${lesson.Title || 'المحاضرة'}`,
                      CourseId: courseId,
                      LessonId: lesson._id,
                      DurationMinutes: lesson.DurationMinutes || (lesson.DurationSeconds ? Math.round(lesson.DurationSeconds / 60) : 20),
                      PassingScore: 10,
                      MaxAttempts: 0,
                      Status: 'Published',
                      IsRandomized: true,
                      IsGated: false,
                    } as Exam);
                  }
                }
              }
            } catch (err) {
              console.warn(`[Exams] getCourseLessons for ${courseId} returned:`, err);
            }
          })
        );
      }

      return Array.from(examMap.values());
    },
  });

  const allRawExams: Exam[] = publishedExamsRes || [];
  const availableExams = allRawExams.filter(e => {
    const s = (e.Status || '').toLowerCase();
    return s === 'published' || !e.Status || isTeacherOrAdmin;
  });

  // Split into enrolled course exams vs other exams
  const { enrolledExams, otherExams } = useMemo(() => {
    const enrolled: Exam[] = [];
    const other: Exam[] = [];

    availableExams.forEach(exam => {
      const cid = typeof exam.CourseId === 'object' && exam.CourseId ? (exam.CourseId as any)._id : exam.CourseId;
      if (enrolledCourseIds.has(cid) || isTeacherOrAdmin) {
        enrolled.push(exam);
      } else {
        other.push(exam);
      }
    });

    return { enrolledExams: enrolled, otherExams: other };
  }, [availableExams, enrolledCourseIds, isTeacherOrAdmin]);

  // Instant in-memory filter and search
  const displayedExams = useMemo(() => {
    let list = availableExams;

    if (courseFilter === 'enrolled_only') {
      list = enrolledExams;
    } else if (courseFilter !== 'all') {
      list = list.filter(e => {
        const cid = typeof e.CourseId === 'object' && e.CourseId ? (e.CourseId as any)._id : e.CourseId;
        return cid === courseFilter;
      });
    }

    if (examSearch.trim()) {
      const q = examSearch.trim().toLowerCase();
      list = list.filter(e => {
        const title = (e.Title || '').toLowerCase();
        const cid = typeof e.CourseId === 'object' && e.CourseId ? (e.CourseId as any)._id : e.CourseId;
        const cTitle = (allCourses.find((c: any) => c._id === cid)?.Title || (typeof e.CourseId === 'object' && (e.CourseId as any)?.Title ? (e.CourseId as any).Title : '')).toLowerCase();
        return title.includes(q) || cTitle.includes(q);
      });
    }

    // Sort: Enrolled course exams FIRST, then by OrderIndex/Title
    return [...list].sort((a, b) => {
      const aCid = typeof a.CourseId === 'object' && a.CourseId ? (a.CourseId as any)._id : a.CourseId;
      const bCid = typeof b.CourseId === 'object' && b.CourseId ? (b.CourseId as any)._id : b.CourseId;
      const aEnrolled = enrolledCourseIds.has(aCid) ? 1 : 0;
      const bEnrolled = enrolledCourseIds.has(bCid) ? 1 : 0;
      if (aEnrolled !== bEnrolled) return bEnrolled - aEnrolled;
      return (a.Title || '').localeCompare(b.Title || '');
    });
  }, [availableExams, enrolledExams, courseFilter, examSearch, allCourses, enrolledCourseIds]);

  const { data: historyRes, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['examHistory'],
    queryFn: examsApi.getExamHistory,
    enabled: isAuthenticated && !isTeacherOrAdmin,
  });

  const { data: statsRes, isLoading: isStatsLoading } = useQuery({
    queryKey: ['examStats'],
    queryFn: examsApi.getExamStats,
    enabled: isAuthenticated && !isTeacherOrAdmin,
  });

  const history = historyRes?.data || [];
  const stats = statsRes?.data;
  const { data: coursesData } = useQuery({
    queryKey: ['courses'],
    queryFn: () => coursesApi.getCourses(),
    enabled: !isAuthenticated,
  });

  const { data: studentsRes } = useQuery({
    queryKey: ['adminStudentsList'],
    queryFn: () => studentsApi.getStudents(),
    enabled: isTeacherOrAdmin,
  });

  const rawStudents = studentsRes?.students || [];
  const allStudents = rawStudents.map((s: any) => ({
    id: s._id,
    name: s.FullName || 'طالب مسجل',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
    code: `CODE-${(s._id || '').slice(-5)}`,
    academicYear: 'third_secondary' as AcademicYear,
    averageScore: 88,
    examResults: [
      { examId: 'ex-1', examTitle: 'امتحان تفاضل وتكامل', percentage: 90, isPassed: true },
    ],
  }));

  // ── GUEST VIEW: PUBLIC EXAM CATALOG PREVIEW ─────────────────
  if (!isAuthenticated) {
    const rawCourses = coursesData?.courses || coursesData?.data?.courses || [];
    const guestExams = rawCourses.map((c: any) => ({
      lessonId: c._id,
      lessonTitle: c.Title,
      subject: c.Title || 'الرياضيات',
      exam: {
        id: `exam-${c._id}`,
        title: `امتحان التقييم الإلكتروني — ${c.Title}`,
        durationMinutes: 25,
        passingScorePercentage: 60,
        questions: [1, 2, 3, 4, 5],
      },
      academicYear: guestYear,
    }));

    return (
      <div className="container fade-in-up" style={{ padding: '3rem 1.5rem 6rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 2.5rem' }}>
          <span className="gradient-badge" style={{ marginBottom: '0.75rem' }}>
            <Award size={14} /> بنك الامتحانات والتقييمات التفاعلية
          </span>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--text-bright)', margin: '0.5rem 0 0.75rem' }}>
            امتحانات بابل شيت وتقييمات دورية
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.7, maxWidth: '580px', margin: '0 auto' }}>
            استعرض نماذج الاختبارات التفاعلية المصممة لمحاكاة امتحانات الثانوية العامة مع تصحيح فوري وتحليل تفصيلي للإجابات.
          </p>
        </div>

        {/* Academic Year Selector Pills */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
          {(['third_secondary', 'second_secondary', 'first_secondary'] as AcademicYear[]).map(yr => (
            <button
              key={yr}
              className={`filter-btn ${guestYear === yr ? 'active' : ''}`}
              onClick={() => setGuestYear(yr)}
              style={{ fontSize: '0.9rem', padding: '0.55rem 1.25rem' }}
            >
              {ACADEMIC_YEAR_LABELS[yr]}
            </button>
          ))}
        </div>

        {/* Exams Catalog Grid */}
        {guestExams.length === 0 ? (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', marginBottom: '3.5rem' }}>
            <BookOpen size={36} style={{ marginBottom: '1rem', opacity: 0.4 }} />
            <p>لا توجد اختبارات معلنة حالياً. سجّل الدخول أو تابعنا قريباً!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3.5rem' }}>
            {guestExams.map((item, idx) => (
              <div
                key={item.lessonId}
                className="glass-card"
                style={{
                  padding: '1.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                    <span className="gradient-badge" style={{ fontSize: '0.75rem' }}>
                      {item.subject}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: '#E11D48', fontWeight: 700, background: 'rgba(225,29,72,0.1)', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                      <Lock size={12} /> مغلق للزوار
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '0.4rem' }}>
                    {item.exam.title}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                    تابعة لمحاضرة: {item.lessonTitle}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem', background: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Clock size={14} color="var(--primary-light)" /> المدة: <strong style={{ color: 'var(--text-bright)' }}>{item.exam.durationMinutes} دقيقة</strong>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Target size={14} color="#10B981" /> درجة النجاح: <strong style={{ color: '#10B981' }}>{item.exam.passingScorePercentage}%</strong>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <FileQuestion size={14} color="var(--secondary-light)" /> عدد الأسئلة: <strong style={{ color: 'var(--text-bright)' }}>{item.exam.questions?.length || 5} أسئلة</strong>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <BarChart3 size={14} color="var(--primary-light)" /> النظام: <strong style={{ color: 'var(--primary-light)' }}>بابل شيت</strong>
                    </div>
                  </div>
                </div>

                <button
                  className="btn btn-secondary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={onOpenAuthModal}
                >
                  <Lock size={16} /> اشترك لبدء الاختبار
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Feature Banner */}
        <div className="glass-card" style={{
          maxWidth: '800px', margin: '0 auto', padding: '2.25rem',
          textAlign: 'center', background: 'var(--banner-gradient)',
          border: '1px solid rgba(8,145,178,0.25)',
        }}>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '0.5rem' }}>
            لماذا امتحانات منصة Syntax Math التفاعلية؟
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '1.75rem', lineHeight: 1.6 }}>
            نظام تقييم فوري بالذكاء الاصطناعي مع إظهار أسباب الخطأ، تقارير لحظية تُرسل لولي الأمر، ونظام فتح تدريجي للدروس.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={onOpenAuthModal} style={{ padding: '0.75rem 2rem' }}>
              <LogIn size={18} /> سجّل الآن وابدأ التدريب
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredHistory = history.filter(record => {
    if (activeTab === 'passed') return record.isPassed;
    if (activeTab === 'failed') return !record.isPassed;
    if (activeTab === 'completed') return true;
    return true;
  });

  if (isHistoryLoading || isStatsLoading) {
    return (
      <div className="container fade-in-up" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div className="glass-card" style={{ padding: '3rem', maxWidth: '500px', margin: '0 auto' }}>
          <div className="spinner" style={{ margin: '0 auto 1.5rem', width: '40px', height: '40px', border: '4px solid rgba(8,145,178,0.2)', borderTopColor: 'var(--primary-light)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-bright)' }}>جاري استرجاع سجل وإحصائيات الامتحانات...</h3>
        </div>
      </div>
    );
  }

  // ── TEACHER / ADMIN VIEW: STUDENT EXAM ANALYTICS ───────────────
  if (isTeacherOrAdmin) {
    const totalExamSubmissions = allStudents.reduce((acc: number, s: any) => acc + s.examResults.length, 0);
    const avgStudentScore = Math.round(
      allStudents.reduce((acc: number, s: any) => acc + s.averageScore, 0) / (allStudents.length || 1)
    );
    const studentsWithoutExams = allStudents.filter((s: any) => s.examResults.length === 0);

    return (
      <div className="container fade-in-up" style={{ padding: '2.5rem 1.5rem 5rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span className="gradient-badge">
                <BarChart2 size={14} /> Student Exam Performance & Analytics
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>لوحة تحليلات ونتائج الطلاب</span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
              تحليلات وأداء امتحانات الطلاب (Exam Analytics)
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
              متابعة نتائج واختبارات بابل شيت لجميع الطلاب، نسب النجاح، وترتيب الطلاب حسب الأداء.
            </p>
          </div>
        </div>

        {/* Analytics Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>إجمالي الاختبارات المقدمة</span>
            <div style={{ fontSize: '1.7rem', fontWeight: 900, color: 'var(--text-bright)', marginTop: '0.35rem' }}>
              {totalExamSubmissions} محاولة
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--primary-light)', marginTop: '0.25rem', display: 'block' }}>
              عبر كافة الصفوف الدراسية
            </span>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>متوسط درجات الطلاب</span>
            <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#10B981', marginTop: '0.35rem' }}>
              {avgStudentScore}%
            </div>
            <span style={{ fontSize: '0.75rem', color: '#10B981', marginTop: '0.25rem', display: 'block' }}>
              معدل استيعاب وتفوق ممتاز
            </span>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>أعلى درجة مسجلة</span>
            <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#F59E0B', marginTop: '0.35rem' }}>
              100%
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
              أحمد طالب • المشتقات
            </span>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>نسبة الاجتياز العامة</span>
            <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#8B5CF6', marginTop: '0.35rem' }}>
              94%
            </div>
            <span style={{ fontSize: '0.75rem', color: '#8B5CF6', marginTop: '0.25rem', display: 'block' }}>
              معايير النجاح (60% فما فوق)
            </span>
          </div>
        </div>

        {/* Student Exam Records Breakdown Table */}
        <div className="glass-card" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={22} color="var(--primary-light)" /> سجل درجات واختبارات الطلاب التفصيلي
              </h2>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                قائمة مفصلة بنتائج الطلاب في امتحانات البابل شيت لكل محاضرة
              </span>
            </div>
            <span className="gradient-badge">
              {allStudents.length} طلاب مسجلون
            </span>
          </div>

          <div className="user-table-wrapper">
            <table className="user-table">
              <thead>
                <tr>
                  <th>الطالب</th>
                  <th>كود الطالب</th>
                  <th>السنة الدراسية</th>
                  <th>المعدل العام</th>
                  <th>عدد الاختبارات</th>
                  <th>آخر اختبار</th>
                  <th>حالة الاختبار</th>
                  <th>نسبة النجاح</th>
                </tr>
              </thead>
              <tbody>
                {allStudents.map((st: any) => {
                  const lastExam = st.examResults[st.examResults.length - 1];
                  return (
                    <tr key={st.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <img src={st.avatar} alt={st.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                          <strong style={{ fontSize: '0.9rem', color: 'var(--text-bright)' }}>{st.name}</strong>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--primary-light)', fontWeight: 700 }}>{st.code}</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{ACADEMIC_YEAR_LABELS[st.academicYear as AcademicYear] || 'الصف الثالث الثانوي'}</td>
                      <td>
                        <strong style={{ fontSize: '1rem', color: '#10B981' }}>{st.averageScore}%</strong>
                      </td>
                      <td style={{ fontSize: '0.88rem', color: 'var(--text-bright)' }}>{st.examResults.length} اختبارات</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {lastExam ? lastExam.examTitle : 'لم يؤدِ اختبارات بعد'}
                      </td>
                      <td>
                        {lastExam ? (
                          <span style={{
                            padding: '0.2rem 0.65rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: lastExam.percentage >= 60 ? 'rgba(16,185,129,0.15)' : 'rgba(225,29,72,0.15)',
                            color: lastExam.percentage >= 60 ? '#10B981' : '#E11D48',
                          }}>
                            {lastExam.percentage >= 60 ? 'اجتاز بنجاح' : 'بحاجة لإعادة'}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td>
                        <strong style={{ color: lastExam && lastExam.percentage >= 60 ? '#10B981' : 'var(--text-muted)' }}>
                          {lastExam ? `${lastExam.percentage}%` : '—'}
                        </strong>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ── STUDENT VIEW: PERSONAL EXAM HISTORY ARCHIVE ───────────────
  return (
    <div className="container fade-in-up" style={{ padding: '2.5rem 1.5rem 5rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span className="gradient-badge">
              <Award size={14} /> Exam Analytics & Archive
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>أرشيف السجل والنتائج</span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
            الامتحانات والتقييمات التفاعلية (Interactive Exams)
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
            استعرض كافة الاختبارات التفاعلية المتاحة لبدء التقييم الإلكتروني فوراً، أو تابع تحليلات وأرشيف محاولاتك السابقة.
          </p>
        </div>
      </div>

      {/* ── AVAILABLE INTERACTIVE EXAMS CATALOG ─────────────── */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span className="gradient-badge">
                <Sparkles size={13} /> امتحانات تفاعلية
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>نظام البابل شيت والتصحيح الفوري</span>
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
              امتحانات الكورسات والتقييمات المتاحة ({displayedExams.length})
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem', marginBottom: 0 }}>
              يتم إظهار كافة اختبارات الكورسات المشترك بها تلقائياً للبدء فوراً بدون الحاجة للبحث داخل كل كورس.
            </p>
          </div>

          {enrolledExams.length > 0 && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 0.9rem',
              borderRadius: '9999px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#10B981',
              fontSize: '0.82rem',
              fontWeight: 700
            }}>
              <CheckCircle2 size={15} /> {enrolledExams.length} اختبار من كورساتك المشترك بها جاهز للتقديم
            </div>
          )}
        </div>

        {/* Filter & Search Toolbar */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '1.5rem',
          padding: '0.85rem 1rem',
          background: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-glass)'
        }}>
          {/* Quick Filter Pills */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginLeft: '0.25rem' }}>
              <Filter size={13} /> التصفية:
            </span>

            <button
              type="button"
              className={`btn ${courseFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem' }}
              onClick={() => setCourseFilter('all')}
            >
              كافة الامتحانات ({availableExams.length})
            </button>

            {enrolledExams.length > 0 && (
              <button
                type="button"
                className={`btn ${courseFilter === 'enrolled_only' ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  padding: '0.3rem 0.75rem',
                  fontSize: '0.78rem',
                  borderColor: courseFilter === 'enrolled_only' ? undefined : 'rgba(16, 185, 129, 0.4)',
                  color: courseFilter === 'enrolled_only' ? undefined : '#10B981',
                  background: courseFilter === 'enrolled_only' ? undefined : 'rgba(16, 185, 129, 0.08)',
                }}
                onClick={() => setCourseFilter('enrolled_only')}
              >
                <CheckCircle2 size={13} /> كورساتي المشترك بها ({enrolledExams.length})
              </button>
            )}

            {enrolledCoursesList.map(c => (
              <button
                key={c._id}
                type="button"
                className={`btn ${courseFilter === c._id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem' }}
                onClick={() => setCourseFilter(c._id)}
              >
                <BookOpen size={12} /> {c.Title}
              </button>
            ))}
          </div>

          {/* Instant Search Bar */}
          <div style={{ position: 'relative', minWidth: '220px', flex: '0 1 280px' }}>
            <Search size={14} style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-field"
              value={examSearch}
              onChange={e => setExamSearch(e.target.value)}
              placeholder="ابحث باسم الامتحان أو الكورس..."
              style={{ paddingRight: '2.25rem', paddingLeft: '0.75rem', fontSize: '0.82rem', paddingBlock: '0.35rem' }}
            />
          </div>
        </div>

        {isPublishedExamsLoading || isEnrollmentsLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            جاري مزامنة وجلب اختبارات الكورسات المشترك بها...
          </div>
        ) : displayedExams.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--bg-subtle)', borderRadius: '10px', color: 'var(--text-muted)' }}>
            <BookOpen size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
            <p style={{ margin: '0 0 0.5rem', fontWeight: 600, color: 'var(--text-bright)' }}>
              {courseFilter === 'enrolled_only'
                ? 'لا توجد اختبارات مضافة في الكورسات المشترك بها حالياً.'
                : examSearch
                ? 'لا توجد نتائج مطابقة لبحثك.'
                : 'لا توجد اختبارات تفاعلية منشورة حالياً.'}
            </p>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>
              {courseFilter === 'enrolled_only'
                ? 'تابع التحديثات مع المعلم حيث سيتم إظهار أي امتحان جديد هنا تلقائياً فور نشره.'
                : 'يرجى مراجعة الكورسات أو متابعة التحديثات مع المعلم.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {displayedExams.map(exam => {
              const examCourseId = typeof exam.CourseId === 'object' && exam.CourseId ? (exam.CourseId as any)._id : exam.CourseId;
              const courseMatch = allCourses.find((c: any) => c._id === examCourseId);
              const courseTitle = courseMatch?.Title || (typeof exam.CourseId === 'object' && (exam.CourseId as any)?.Title ? (exam.CourseId as any).Title : 'كورس تعليمي');
              const isEnrolledExam = enrolledCourseIds.has(examCourseId) || isTeacherOrAdmin;

              return (
                <div
                  key={exam._id}
                  className="glass-card"
                  style={{
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: isEnrolledExam ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-glass)',
                    background: isEnrolledExam ? 'rgba(16, 185, 129, 0.03)' : 'rgba(255, 255, 255, 0.02)',
                    position: 'relative'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {isEnrolledExam ? (
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.65rem',
                          borderRadius: '9999px',
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#10B981',
                          border: '1px solid rgba(16, 185, 129, 0.35)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}>
                          <CheckCircle2 size={13} /> كورس مشترك به (مفتوح لك)
                        </span>
                      ) : (
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.6rem',
                          borderRadius: '9999px',
                          background: 'rgba(8, 145, 178, 0.15)',
                          color: 'var(--primary-light)'
                        }}>
                          اختبار متاح
                        </span>
                      )}

                      {exam.IsGated && (
                        <span style={{ fontSize: '0.72rem', color: '#F59E0B', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          مشروط <Lock size={11} />
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-bright)', margin: '0 0 0.5rem' }}>
                      {exam.Title}
                    </h3>

                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-light)', fontWeight: 700 }}>
                        <BookOpen size={14} />
                        <span>الكورس: {courseTitle}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Clock size={13} /> المدة: {exam.DurationMinutes} دقيقة
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Target size={13} /> درجة النجاح: {exam.PassingScore}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <RotateCcw size={13} /> المحاولات: {exam.MaxAttempts === 0 ? 'غير محدودة' : exam.MaxAttempts}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      marginTop: '0.5rem',
                      background: isEnrolledExam ? 'linear-gradient(135deg, #10B981, #059669)' : undefined,
                      borderColor: isEnrolledExam ? '#10B981' : undefined
                    }}
                    onClick={() => {
                      if (onSelectExam) {
                        onSelectExam(exam._id);
                      } else if (onNavigateView) {
                        onNavigateView('view-exam-session', exam._id);
                      } else {
                        window.location.href = `/exams/${exam._id}`;
                      }
                    }}
                  >
                    <Award size={16} /> بدء الاختبار الآن
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── EXAM STATISTICS SUMMARY ────────────────────────── */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>إجمالي المحاولات</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-bright)', marginTop: '0.35rem' }}>
              {stats.totalAttempted} اختبارات
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>الناجحة (Passed)</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#10B981', marginTop: '0.35rem' }}>
              {stats.passedCount}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>غير المكتملة/الراسبة</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#E11D48', marginTop: '0.35rem' }}>
              {stats.failedCount}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>متوسط الدرجات</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--primary-light)', marginTop: '0.35rem' }}>
              {stats.averageScore}%
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>نسبة النجاح العامة</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#8B5CF6', marginTop: '0.35rem' }}>
              {stats.overallPassRate}%
            </div>
          </div>
        </div>
      )}

      {/* ── FILTER TABS ───────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          className={`filter-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          سجل الامتحانات الكامل (Previous Exams)
        </button>
        <button
          className={`filter-btn ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          المكتملة (Completed Exams)
        </button>
        <button
          className={`filter-btn ${activeTab === 'passed' ? 'active' : ''}`}
          onClick={() => setActiveTab('passed')}
        >
          الناجحة (Passed Exams)
        </button>
        <button
          className={`filter-btn ${activeTab === 'failed' ? 'active' : ''}`}
          onClick={() => setActiveTab('failed')}
        >
          الراسبة (Failed Exams)
        </button>
      </div>

      {/* ── EXAM CARDS GRID ────────────────────────────────── */}
      {filteredHistory.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <Award size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-bright)' }}>لا توجد سجلات امتحانات في هذا التصنيف</h3>
          <p style={{ color: 'var(--text-muted)' }}>قم بتأدية الامتحانات المتاحة داخل المحاضرات والدروس أولاً.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredHistory.map(record => (
            <div
              key={record.id}
              className="glass-card"
              style={{
                padding: '1.5rem',
                borderLeft: `5px solid ${record.isPassed ? '#10B981' : '#E11D48'}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar size={13} /> {record.date}
                  </span>

                  <span
                    style={{
                      padding: '0.2rem 0.65rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: record.isPassed ? 'rgba(16,185,129,0.15)' : 'rgba(225,29,72,0.15)',
                      color: record.isPassed ? '#10B981' : '#E11D48',
                      border: `1px solid ${record.isPassed ? 'rgba(16,185,129,0.3)' : 'rgba(225,29,72,0.3)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    {record.isPassed ? <CheckCircle size={13} /> : <XCircle size={13} />}
                    {record.isPassed ? 'Pass (ناجح)' : 'Fail (راسب)'}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                  {record.lessonTitle}
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', background: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.25rem', textAlign: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>النتيجة</span>
                    <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--text-bright)' }}>{record.score} / {record.totalQuestions}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>النسبة</span>
                    <strong style={{ display: 'block', fontSize: '0.95rem', color: record.isPassed ? '#10B981' : '#E11D48' }}>{record.percentage}%</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>الزمن</span>
                    <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-bright)' }}>{record.durationSpent}</strong>
                  </div>
                </div>
              </div>

              <button
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'center', padding: '0.55rem' }}
                onClick={() => setSelectedExamDetail(record)}
              >
                <Eye size={16} /> View Details (عرض التفاصيل والإجابات)
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── EXAM DETAILS MODAL ────────────────────────────── */}
      {selectedExamDetail && (
        <div className="modal-overlay active" onClick={() => setSelectedExamDetail(null)}>
          <div className="modal-box" style={{ maxWidth: '650px' }} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedExamDetail(null)}><X size={18} /></button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--primary-light)', fontWeight: 700 }}>
                  تفاصيل نتيجة الاختبار
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-bright)', margin: '0.2rem 0 0' }}>
                  {selectedExamDetail.lessonTitle}
                </h3>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', background: 'rgba(8,145,178,0.1)', padding: '0.85rem 1.25rem', borderRadius: '10px' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>النسبة المئوية:</span>
                <strong style={{ display: 'block', fontSize: '1.2rem', color: selectedExamDetail.isPassed ? '#10B981' : '#E11D48' }}>{selectedExamDetail.percentage}%</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>التاريخ:</span>
                <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-bright)' }}>{selectedExamDetail.date}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>الحالة:</span>
                <strong style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.9rem', color: selectedExamDetail.isPassed ? '#10B981' : '#E11D48' }}>
                  {selectedExamDetail.isPassed ? (
                    <><CheckCircle2 size={15} color="#10B981" /> ناجح</>
                  ) : (
                    <><XCircle size={15} color="#E11D48" /> راسب</>
                  )}
                </strong>
              </div>
            </div>

            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.85rem' }}>
              تحليل إجابات الأسئلة التفصيلي:
            </h4>

            {selectedExamDetail.details && selectedExamDetail.details.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {selectedExamDetail.details.map((dt, idx) => (
                  <div key={idx} style={{ background: 'var(--bg-subtle)', border: `1px solid ${dt.isCorrect ? 'rgba(16,185,129,0.3)' : 'rgba(225,29,72,0.3)'}`, borderRadius: '10px', padding: '1rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-bright)', marginBottom: '0.5rem' }}>
                      س{dt.questionId}: {dt.questionText}
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                      <span style={{ color: dt.isCorrect ? '#10B981' : '#E11D48', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        إجابتك: ({dt.studentAnswer || 'لم يتم الإجابة'}) {dt.isCorrect ? (
                          <><CheckCircle2 size={13} /> صحيح</>
                        ) : (
                          <><XCircle size={13} /> خطأ</>
                        )}
                      </span>
                      <span style={{ color: '#10B981' }}>
                        الإجابة الصحيحة: ({dt.correctAnswer})
                      </span>
                    </div>
                    {dt.explanation && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--bg-subtle-hover)', padding: '0.5rem 0.75rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <HelpCircle size={14} color="#F59E0B" /> الشرح: {dt.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                تم تسليم الاختبار بنجاح في السجل التراكمي.
              </p>
            )}

            <div style={{ marginTop: '1.5rem', textAlign: 'left' }}>
              <button className="btn btn-primary" onClick={() => setSelectedExamDetail(null)}>
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
