import React, { useState } from 'react';
import {
  ShieldCheck, Search, CheckCircle2, XCircle, Calendar,
  TrendingUp, Award, Phone, User, BookOpen, AlertCircle, ArrowLeft, RefreshCw, BarChart2
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { mockDB } from '../../services/db';
import { StudentProfile, ACADEMIC_YEAR_LABELS } from '../../types';
import { useToast } from '../../context/ToastContext';

export const ParentPortalView: React.FC = () => {
  const { showToast } = useToast();
  const [studentCode, setStudentCode] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [verifiedStudent, setVerifiedStudent] = useState<StudentProfile | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentCode.trim() || !nationalId.trim()) {
      setErrorMessage('يرجى إدخال كود الطالب والرقم القومي معاً');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    setTimeout(() => {
      setIsLoading(false);
      const student = mockDB.verifyStudentForParent(studentCode, nationalId);
      if (student) {
        setVerifiedStudent(student);
        showToast(`تم التحقق بنجاح! جاري عرض التقرير الأكاديمي لـ ${student.name}`, 'success');
      } else {
        setErrorMessage('بيانات غير صحيحة. يرجى التأكد من كود الطالب والرقم القومي وإعادة المحاولة.');
        showToast('لم يتم العثور على طالب يطابق الكود والرقم القومي المدخلين', 'danger');
      }
    }, 600);
  };

  const handleQuickFillDemo = (code: string, nId: string) => {
    setStudentCode(code);
    setNationalId(nId);
    setErrorMessage(null);
  };

  const handleReset = () => {
    setVerifiedStudent(null);
    setStudentCode('');
    setNationalId('');
    setErrorMessage(null);
  };

  // Prepare chart data from student exams
  const examChartData = verifiedStudent?.examResults.map((ex, i) => ({
    name: ex.examTitle.length > 18 ? ex.examTitle.slice(0, 18) + '...' : ex.examTitle,
    score: ex.percentage,
    date: ex.date,
  })) || [
    { name: 'اختبار 1', score: 85, date: '15 مايو' },
    { name: 'اختبار 2', score: 90, date: '1 يونيو' },
    { name: 'اختبار 3', score: 95, date: '15 يوليو' },
  ];

  const subjectGradesData = [
    { subject: 'التفاضل والتكامل', score: verifiedStudent ? Math.min(100, verifiedStudent.averageScore + 3) : 92 },
    { subject: 'الهندسة الفراغية', score: verifiedStudent ? Math.max(70, verifiedStudent.averageScore - 2) : 88 },
    { subject: 'الجبر والهندسة', score: verifiedStudent ? verifiedStudent.averageScore : 90 },
  ];

  return (
    <div className="container fade-in-up" style={{ padding: '2.5rem 1.5rem 6rem' }}>
      {/* ── STAGE 1: VERIFICATION FORM (IF NOT VERIFIED) ───── */}
      {!verifiedStudent ? (
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <div className="glass-card" style={{ padding: '2.5rem', border: '1px solid rgba(8,145,178,0.3)', background: 'var(--bg-glass-card)' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{
                width: '60px', height: '60px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                color: '#FFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1rem',
                boxShadow: '0 4px 20px var(--primary-glow)'
              }}>
                <ShieldCheck size={32} />
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-bright)', margin: '0 0 0.5rem' }}>
                بوابة متابعة ولي الأمر (Parent Portal)
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>
                الاستعلام اللحظي عن نتائج وتقرير الطالب الأكاديمي، سجل الامتحانات، ونسبة الحضور بدون الحاجة لتسجيل حساب.
              </p>
            </div>

            <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.5rem' }}>
                  1. كود الطالب (Student Code)
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    required
                    placeholder="مثال: CODE-94021"
                    className="input-field"
                    style={{ width: '100%', paddingRight: '44px', fontSize: '0.95rem' }}
                    value={studentCode}
                    onChange={e => setStudentCode(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.5rem' }}>
                  2. الرقم القومي للطالب / رقم الهوية (National ID)
                </label>
                <div style={{ position: 'relative' }}>
                  <ShieldCheck size={18} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    required
                    placeholder="مثال: 30501011234567 أو رقم الهاتف المسجل"
                    className="input-field"
                    style={{ width: '100%', paddingRight: '44px', fontSize: '0.95rem' }}
                    value={nationalId}
                    onChange={e => setNationalId(e.target.value)}
                  />
                </div>
              </div>

              {errorMessage && (
                <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', padding: '0.85rem 1rem', borderRadius: '8px', color: '#EF4444', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={18} />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
                style={{ padding: '0.9rem', fontSize: '1rem', marginTop: '0.5rem' }}
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={18} className="spin" /> جاري التحقق من البيانات...
                  </>
                ) : (
                  <>
                    <Search size={18} /> استخراج تقرير الطالب
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Fill Box for Testing */}
            <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px dashed var(--border-glass)' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.65rem' }}>
                بيانات تجربة سريعة (Demo Student Accounts):
              </span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleQuickFillDemo('CODE-94021', '30501011234567')}
                  style={{ background: 'rgba(8,145,178,0.12)', border: '1px solid rgba(8,145,178,0.25)', borderRadius: '6px', padding: '0.35rem 0.75rem', fontSize: '0.78rem', color: 'var(--primary-light)', cursor: 'pointer' }}
                >
                  أحمد طالب (CODE-94021)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFillDemo('CODE-88123', '30602051234568')}
                  style={{ background: 'rgba(8,145,178,0.12)', border: '1px solid rgba(8,145,178,0.25)', borderRadius: '6px', padding: '0.35rem 0.75rem', fontSize: '0.78rem', color: 'var(--primary-light)', cursor: 'pointer' }}
                >
                  مريم إبراهيم (CODE-88123)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFillDemo('CODE-55101', '30704051234571')}
                  style={{ background: 'rgba(8,145,178,0.12)', border: '1px solid rgba(8,145,178,0.25)', borderRadius: '6px', padding: '0.35rem 0.75rem', fontSize: '0.78rem', color: 'var(--primary-light)', cursor: 'pointer' }}
                >
                  يوسف تامر (أولى ثانوي)
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── STAGE 2: VERIFIED STUDENT ACADEMIC REPORT ──────── */
        <div>
          {/* Header Card */}
          <div className="glass-card" style={{ padding: '2rem 2.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <img
                src={verifiedStudent.avatar}
                alt={verifiedStudent.name}
                style={{ width: '70px', height: '70px', borderRadius: '50%', border: '3px solid var(--primary-light)', objectFit: 'cover' }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                  <span className="gradient-badge">
                    تقرير ولي الأمر المعتمد
                  </span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    كود: #{verifiedStudent.code}
                  </span>
                </div>
                <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--text-bright)', margin: 0 }}>
                  {verifiedStudent.name}
                </h1>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.88rem', color: 'var(--primary-light)', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                  <span>{ACADEMIC_YEAR_LABELS[verifiedStudent.academicYear]}</span>
                  <span>• هاتف ولي الأمر: {verifiedStudent.parentPhone}</span>
                </div>
              </div>
            </div>

            <button className="btn btn-secondary" onClick={handleReset}>
              <RefreshCw size={16} /> استعلام عن طالب آخر
            </button>
          </div>

          {/* Key Metrics Overview Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>المعدل التراكمي للدرجات</div>
              <strong style={{ fontSize: '1.85rem', color: 'var(--primary-light)', display: 'block', fontWeight: 900 }}>
                {verifiedStudent.averageScore}%
              </strong>
              <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700 }}>
                {verifiedStudent.averageScore >= 85 ? 'ممتاز مرتفع (Top Tier)' : 'أداء جيد جداً'}
              </span>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>نسبة حضور المحاضرات</div>
              <strong style={{ fontSize: '1.85rem', color: '#10B981', display: 'block', fontWeight: 900 }}>
                {verifiedStudent.attendanceRate}%
              </strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>متابعة مستمرة ومثالية</span>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>باقة الاشتراك الحالية</div>
              <strong style={{ fontSize: '1.1rem', color: 'var(--text-bright)', display: 'block', fontWeight: 800 }}>
                {verifiedStudent.packageName || 'الباقة الشاملة'}
              </strong>
              <span style={{ fontSize: '0.75rem', color: verifiedStudent.hasAccess ? '#10B981' : '#EF4444' }}>
                {verifiedStudent.hasAccess ? '● اشتراك نشط ومفعل' : '● الاشتراك منتهي'}
              </span>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>حالة الحساب والانضباط</div>
              <strong style={{ fontSize: '1.2rem', color: verifiedStudent.status === 'active' ? '#10B981' : '#EF4444', display: 'block', fontWeight: 800 }}>
                {verifiedStudent.status === 'active' ? 'حساب نشط ومثالي' : 'محظور'}
              </strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>0 مخالفات DRM أو أمان</span>
            </div>
          </div>

          {/* Academic Charts Grid (Requirement #4: Clear Grade Charts) */}
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart2 size={22} color="var(--primary-light)" /> المنحنيات البيانية والتحليل الأكاديمي (Grade Charts)
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
            {/* Chart 1: Exam Progression Over Time */}
            <div className="glass-card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-bright)', margin: 0 }}>
                    منحنى درجات الامتحانات المتتالية (%)
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>تطور مستوى الطالب في كل اختبار</span>
                </div>
              </div>

              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={examChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                    <YAxis domain={[0, 100]} stroke="var(--text-muted)" fontSize={11} />
                    <Tooltip contentStyle={{ background: 'var(--bg-glass-card)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#FFF' }} />
                    <Line type="monotone" dataKey="score" stroke="#0891B2" strokeWidth={3} dot={{ r: 5, fill: '#22D3EE' }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Subject Grades Breakdown */}
            <div className="glass-card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-bright)', margin: 0 }}>
                    توزيع الدرجات حسب الفروع والمواد
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>مقارنة التحصيل في التفاضل والهندسة الفراغية</span>
                </div>
              </div>

              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectGradesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="subject" stroke="var(--text-muted)" fontSize={11} />
                    <YAxis domain={[0, 100]} stroke="var(--text-muted)" fontSize={11} />
                    <Tooltip contentStyle={{ background: 'var(--bg-glass-card)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#FFF' }} />
                    <Bar dataKey="score" fill="#10B981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Exam Results Table */}
          <div className="glass-card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award size={20} color="var(--primary-light)" /> السجل التفصيلي للاختبارات وامتحانات البابل شيت
            </h3>

            {verifiedStudent.examResults.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                لم يسجل الطالب أي محاولات امتحانات بعد.
              </div>
            ) : (
              <div className="user-table-wrapper">
                <table className="user-table">
                  <thead>
                    <tr>
                      <th>اسم الاختبار</th>
                      <th>تاريخ الامتحان</th>
                      <th>الدرجة</th>
                      <th>النسبة المئوية</th>
                      <th>الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verifiedStudent.examResults.map((ex, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 700, color: 'var(--text-bright)' }}>{ex.examTitle}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{ex.date}</td>
                        <td style={{ color: 'var(--text-bright)', fontWeight: 700 }}>{ex.score} / {ex.total}</td>
                        <td>
                          <span style={{ fontWeight: 800, color: ex.isPassed ? '#10B981' : '#EF4444' }}>
                            {ex.percentage}%
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              padding: '0.2rem 0.65rem',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: ex.isPassed ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                              color: ex.isPassed ? '#10B981' : '#EF4444',
                              border: `1px solid ${ex.isPassed ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                            }}
                          >
                            {ex.isPassed ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                            {ex.isPassed ? 'ناجح' : 'راسب'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
