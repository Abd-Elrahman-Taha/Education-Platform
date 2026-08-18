import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { examsApi } from '../api/examsApi';
import { ExamRecord, ACADEMIC_YEAR_LABELS, AcademicYear } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { mockDB } from '../../../services/db';
import {
  Award, CheckCircle, XCircle, Clock, Calendar, BarChart2, Eye, X,
  Sigma, Check, HelpCircle, Users, TrendingUp, AlertTriangle, ArrowUp,
  GraduationCap, BookOpen, Layers, Lock, LogIn, UserPlus, PlayCircle, ShieldCheck, Sparkles
} from 'lucide-react';

interface StandaloneExamsViewProps {
  onOpenAuthModal?: () => void;
  onNavigateView?: (view: any, lessonId?: string) => void;
}

export const StandaloneExamsView: React.FC<StandaloneExamsViewProps> = ({ onOpenAuthModal, onNavigateView }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const isTeacherOrAdmin = currentUser?.role === 'admin' || currentUser?.role === 'teacher';

  const [activeTab, setActiveTab] = useState<'all' | 'passed' | 'failed' | 'completed'>('all');
  const [selectedExamDetail, setSelectedExamDetail] = useState<ExamRecord | null>(null);
  const [guestYear, setGuestYear] = useState<AcademicYear>('third_secondary');

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
  const allStudents = mockDB.getStudents();

  // ── GUEST VIEW: PUBLIC EXAM CATALOG PREVIEW ─────────────────
  if (!isAuthenticated) {
    const guestLessons = mockDB.getLessons(guestYear, true);
    const guestExams = guestLessons.map(l => ({
      lessonId: l.id,
      lessonTitle: l.title,
      subject: l.subject,
      exam: l.exam,
      academicYear: l.academicYear,
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
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    ⏱ المدة: <strong style={{ color: 'var(--text-bright)' }}>{item.exam.durationMinutes} دقيقة</strong>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    🎯 درجة النجاح: <strong style={{ color: '#10B981' }}>{item.exam.passingScorePercentage}%</strong>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    📝 عدد الأسئلة: <strong style={{ color: 'var(--text-bright)' }}>{item.exam.questions?.length || 5} أسئلة</strong>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    📊 النظام: <strong style={{ color: 'var(--primary-light)' }}>بابل شيت</strong>
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
    const totalExamSubmissions = allStudents.reduce((acc, s) => acc + s.examResults.length, 0);
    const avgStudentScore = Math.round(
      allStudents.reduce((acc, s) => acc + s.averageScore, 0) / (allStudents.length || 1)
    );
    const studentsWithoutExams = allStudents.filter(s => s.examResults.length === 0);

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
                {allStudents.map(st => {
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
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{ACADEMIC_YEAR_LABELS[st.academicYear]}</td>
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
            سجل وتاريخ الامتحانات (Exams History & Statistics)
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
            تأدية الامتحانات التفاعلية تكون داخل صفحات الدروس المحددة. هذه الصفحة مخصصة لعرض التحليلات والتاريخ والنتائج السابقة.
          </p>
        </div>
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
                <strong style={{ display: 'block', fontSize: '0.9rem', color: selectedExamDetail.isPassed ? '#10B981' : '#E11D48' }}>{selectedExamDetail.isPassed ? 'ناجح ✅' : 'راسب ❌'}</strong>
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
                      <span style={{ color: dt.isCorrect ? '#10B981' : '#E11D48' }}>
                        إجابتك: ({dt.studentAnswer || 'لم يتم الإجابة'}) {dt.isCorrect ? '✅ صحيح' : '❌ خطأ'}
                      </span>
                      <span style={{ color: '#10B981' }}>
                        الإجابة الصحيحة: ({dt.correctAnswer})
                      </span>
                    </div>
                    {dt.explanation && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--bg-subtle-hover)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                        💡 الشرح: {dt.explanation}
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
