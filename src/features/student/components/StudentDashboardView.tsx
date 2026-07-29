import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { studentApi } from '../api/studentApi';
import { AppView } from '../../../types';
import {
  GraduationCap, BookOpen, Clock, Award, Flame, Calendar,
  TrendingUp, CheckCircle, BarChart3, ArrowLeft, PlayCircle,
  FileCheck, AlertCircle, RefreshCw
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

interface Props {
  onNavigateView: (view: AppView, lessonId?: string) => void;
}

const PIE_COLORS = ['#0891B2', '#06B6D4', '#E11D48'];

export const StudentDashboardView: React.FC<Props> = ({ onNavigateView }) => {
  const { data: dashboardRes, isLoading: isDashLoading, isError: isDashError, refetch: refetchDash } = useQuery({
    queryKey: ['studentDashboard'],
    queryFn: studentApi.getDashboard,
  });

  const { data: timelineRes, isLoading: isTimelineLoading } = useQuery({
    queryKey: ['studentTimeline'],
    queryFn: studentApi.getProgressTimeline,
  });

  if (isDashLoading || isTimelineLoading) {
    return (
      <div className="container fade-in-up" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div className="glass-card" style={{ padding: '3rem', maxWidth: '500px', margin: '0 auto' }}>
          <div className="spinner" style={{ margin: '0 auto 1.5rem', width: '48px', height: '48px', border: '4px solid rgba(8,145,178,0.2)', borderTopColor: 'var(--primary-light)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-bright)' }}>جاري تحميل تحليلات الطالب الأكاديمية...</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>نستجلب البيانات المعالجة من المحاكي (simulated delay 500-1000ms)...</p>
        </div>
      </div>
    );
  }

  if (isDashError || !dashboardRes?.data) {
    return (
      <div className="container fade-in-up" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div className="glass-card" style={{ padding: '3rem', maxWidth: '500px', margin: '0 auto' }}>
          <AlertCircle size={48} color="var(--danger)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-bright)' }}>حدث خطأ أثناء تحميل البيانات</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0.5rem 0 1.5rem' }}>لم نتمكن من الوصول للبيانات التحليلية للواجهة.</p>
          <button className="btn btn-primary" onClick={() => refetchDash()}>
            <RefreshCw size={16} /> إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  const dash = dashboardRes.data;
  const timeline = timelineRes?.data;

  return (
    <div className="container fade-in-up" style={{ padding: '2.5rem 1.5rem 5rem' }}>
      {/* ── WELCOME BANNER ─────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '2rem 2.5rem', marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(8,145,178,0.18), rgba(15,23,42,0.65))', border: '1px solid rgba(8,145,178,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ background: 'rgba(8,145,178,0.25)', color: 'var(--primary-light)', padding: '0.3rem 0.85rem', borderRadius: '9999px', fontSize: '0.82rem', fontWeight: 700 }}>
              لوحة التحكم الشخصية للتعليم
            </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Clock size={14} /> آخر دخول: {dash.lastLogin}
            </span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-bright)', margin: 0 }}>
            Welcome back, {dash.studentName} 👋
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.35rem', fontSize: '0.95rem' }}>
            أهلاً بعودتك! أداءك ممتاز هذا الأسبوع، استمر في الحفاظ على سلسلة التعلم المتميزة.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ background: 'rgba(234,179,8,0.15)', border: '1px solid rgba(234,179,8,0.3)', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#F59E0B', fontWeight: 800, fontSize: '1.25rem' }}>
              <Flame size={20} fill="#F59E0B" /> {dash.currentLearningStreak} أيام
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>سلسلة التعلم</span>
          </div>

          <button className="btn btn-primary" onClick={() => onNavigateView('view-drm-player')}>
            <BookOpen size={18} /> تصفح جميع الدروس
          </button>
        </div>
      </div>

      {/* ── CONTINUE LEARNING BANNER CARD ──────────────────── */}
      {dash.continueLearningLesson && (
        <div className="glass-card" style={{ padding: '1.75rem 2rem', marginBottom: '2.5rem', borderLeft: '5px solid var(--primary-light)', background: 'var(--bg-glass-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div style={{ flex: 1, minWidth: '280px' }}>
              <span style={{ color: 'var(--primary-light)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ▶ متابعة التعلم — أخر درس متبقي
              </span>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-bright)', margin: '0.35rem 0' }}>
                {dash.continueLearningLesson.title}
              </h2>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                <span>المادة: {dash.continueLearningLesson.subject}</span>
                <span>المدة: {dash.continueLearningLesson.duration}</span>
              </div>
              <div style={{ width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: '9999px', height: '8px', overflow: 'hidden' }}>
                <div style={{ width: `${dash.continueLearningLesson.progressPercentage}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--secondary))' }}></div>
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}>
                مكتمل بنسبة {dash.continueLearningLesson.progressPercentage}%
              </span>
            </div>

            <button
              className="btn btn-primary"
              style={{ padding: '0.85rem 1.75rem', fontSize: '0.95rem' }}
              onClick={() => onNavigateView('view-drm-player', dash.continueLearningLesson.id)}
            >
              <PlayCircle size={20} /> فتح الدرس المتبقي
            </button>
          </div>
        </div>
      )}

      {/* ── 10 ANALYTIC WIDGETS GRID ───────────────────────── */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <BarChart3 size={20} color="var(--primary-light)" /> المؤشرات والأداء الأكاديمي الشامل
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {/* Widget 1: Grade */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>الصف الدراسي</span>
            <GraduationCap size={20} color="var(--primary-light)" />
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-bright)' }}>{dash.currentGrade}</div>
        </div>

        {/* Widget 2: Overall Progress */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>التقدم العام</span>
            <TrendingUp size={20} color="#10B981" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981' }}>{dash.overallProgress}%</div>
        </div>

        {/* Widget 3: Lessons Completed */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>دروس مكتملة</span>
            <CheckCircle size={20} color="var(--success)" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-bright)' }}>{dash.lessonsCompleted} دروس</div>
        </div>

        {/* Widget 4: Lessons Remaining */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>دروس متبقية</span>
            <BookOpen size={20} color="var(--secondary-light)" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-bright)' }}>{dash.lessonsRemaining} دروس</div>
        </div>

        {/* Widget 5: Homework Completion Rate */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>نسبة إنجاز الواجبات</span>
            <FileCheck size={20} color="#3B82F6" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#3B82F6' }}>{dash.homeworkCompletionRate}%</div>
        </div>

        {/* Widget 6: Exams Passed */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>امتحانات تم اجتيازها</span>
            <Award size={20} color="#8B5CF6" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#8B5CF6' }}>{dash.examsPassed} اختبارات</div>
        </div>

        {/* Widget 7: Average Exam Score */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>متوسط درجات الاختبارات</span>
            <TrendingUp size={20} color="#EC4899" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#EC4899' }}>{dash.averageExamScore}%</div>
        </div>

        {/* Widget 8: Total Study Hours */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>ساعات المذاكرة الكلية</span>
            <Clock size={20} color="#F59E0B" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-bright)' }}>{dash.totalStudyHours} ساعة</div>
        </div>

        {/* Widget 9: Last Login */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>تاريخ آخر تسجيل</span>
            <Calendar size={20} color="var(--primary-light)" />
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-bright)' }}>{dash.lastLogin}</div>
        </div>

        {/* Widget 10: Current Learning Streak */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>سلسلة التعلم النشطة</span>
            <Flame size={20} color="#F59E0B" fill="#F59E0B" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#F59E0B' }}>{dash.currentLearningStreak} أيام 🔥</div>
        </div>
      </div>

      {/* ── CHARTS SECTION ─────────────────────────────────── */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '1.25rem' }}>
        📊 الرسوم البيانية والتحليلات البصرية
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
        {/* Chart 1: Exam Scores Over Time */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '1.25rem' }}>
            درجات الامتحانات عبر الوقت (Exam scores over time)
          </h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline?.examScores}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="var(--text-muted)" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-glass-card)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#FFF' }}
                />
                <Line type="monotone" dataKey="score" stroke="#0891B2" strokeWidth={3} dot={{ r: 5, fill: '#0891B2' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Lesson Completion Progress */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '1.25rem' }}>
            تقدم إنجاز الدروس شهرياً (Lesson completion progress)
          </h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline?.lessonProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip contentStyle={{ background: 'var(--bg-glass-card)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#FFF' }} />
                <Area type="monotone" dataKey="completed" stroke="#10B981" fill="rgba(16, 185, 129, 0.2)" strokeWidth={2} />
                <Area type="monotone" dataKey="target" stroke="#64748B" fill="none" strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Weekly Study Activity */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '1.25rem' }}>
            نشاط المذاكرة الأسبوعي بالساعات (Weekly study activity)
          </h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeline?.weeklyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip contentStyle={{ background: 'var(--bg-glass-card)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#FFF' }} />
                <Bar dataKey="hours" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0891B2" />
                    <stop offset="100%" stopColor="#06B6D4" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Homework Completion Rate */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '1.25rem' }}>
            نسبة إكمال الواجبات المنزلية (Homework completion rate)
          </h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={timeline?.homeworkRates}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="rate"
                  nameKey="category"
                >
                  {timeline?.homeworkRates?.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-glass-card)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#FFF' }} />
                <Legend formatter={(value) => <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
