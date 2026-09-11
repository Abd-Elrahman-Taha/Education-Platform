import React, { useState } from 'react';
import {
  ShieldCheck, Search, CheckCircle2, XCircle,
  TrendingUp, Award, Phone, BookOpen, AlertCircle, RefreshCw, BarChart2,
  Download, FileText, AlertTriangle, UserCheck, Clock, Check
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { parentPortalApi } from '../../api/parentPortal.api';
import { ParentPortalLookupData, ParentPortalLookupRequest } from '../../types/api.types';
import { useToast } from '../../context/ToastContext';
import { getFriendlyErrorMessage } from '../../utils/errors';

export const ParentPortalView: React.FC = () => {
  const { showToast } = useToast();

  // Inputs
  const [nationalId, setNationalId] = useState('');
  const [phone, setPhone] = useState('');

  // States
  const [lookupResult, setLookupResult] = useState<ParentPortalLookupData | null>(null);
  const [lookupCredentials, setLookupCredentials] = useState<ParentPortalLookupRequest | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Normalize arabic numerals and remove spaces
  const cleanDigits = (val: string): string => {
    return val
      .trim()
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
      .replace(/\s+/g, '')
      .replace(/-/g, '');
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanNid = cleanDigits(nationalId);
    const cleanPh = cleanDigits(phone);

    // Front-end pre-validations to save rate-limited requests
    if (!/^[0-9]{14}$/.test(cleanNid)) {
      setErrorMessage('الرقم القومي غير صحيح. يجب أن يتكون من 14 رقماً بالضبط وبأرقام صالحة.');
      return;
    }

    if (!/^01[0125][0-9]{8}$/.test(cleanPh)) {
      setErrorMessage('رقم الهاتف غير صحيح. يجب أن يكون رقم هاتف مصري مكوّن من 11 رقماً ويبدأ بـ 01 (مثل: 010, 011, 012, 015).');
      return;
    }

    setIsLoading(true);

    try {
      const creds: ParentPortalLookupRequest = {
        nationalId: cleanNid,
        phone: cleanPh,
      };

      const res = await parentPortalApi.lookupProgress(creds);

      if (res?.data?.student) {
        setLookupResult(res.data);
        setLookupCredentials(creds);
        showToast(`تم التحقق بنجاح! جاري عرض تقرير الطالب ${res.data.student.fullName}`, 'success');
        setErrorMessage(null);
      } else {
        setErrorMessage('لم يتم العثور على بيانات مطابقة في المنظومة. يرجى التأكد من صحة البيانات.');
      }
    } catch (err: any) {
      if (err?.response?.status === 429 || err?.status === 429) {
        setErrorMessage('تم تجاوز الحد المسموح به لعمليات البحث (5 محاولات لكل 5 دقائق). يرجى الانتظار بضع دقائق ثم المحاولة مجدداً.');
        showToast('تم بلوغ حد المحاولات المسموح به، يرجى الانتظار 5 دقائق', 'warning');
      } else if (err?.response?.status === 400 || err?.status === 400) {
        setErrorMessage('البيانات المدخلة غير صحيحة أو غير متطابقة. ملاحظة أمنية: يجب أن ينتمي الرقم القومي ورقم الهاتف لنفس الطالب المسجل.');
        showToast('بيانات الاستعلام غير متطابقة مع سجلات المنظومة', 'error');
      } else {
        setErrorMessage(getFriendlyErrorMessage(err, 'تعذر الاستعلام عن بيانات الطالب حالياً. يرجى المحاولة لاحقاً.'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!lookupCredentials) return;
    setIsDownloadingPdf(true);
    try {
      const blob = await parentPortalApi.downloadPdfReport(lookupCredentials);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `student-progress-report-${lookupCredentials.nationalId.slice(-4)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast('تم تحميل التقرير الرسمي PDF بنجاح!', 'success');
    } catch (err: any) {
      if (err?.response?.status === 429 || err?.status === 429) {
        showToast('تم تجاوز حد المحاولات المسموح به للتحميل، يرجى الانتظار قليلاً', 'warning');
      } else {
        showToast('تعذر استخراج ملف PDF حالياً. يرجى المحاولة لاحقاً.', 'error');
      }
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleReset = () => {
    setLookupResult(null);
    setLookupCredentials(null);
    setNationalId('');
    setPhone('');
    setErrorMessage(null);
  };

  // Calculations for dashboard
  const courses = lookupResult?.courses || [];

  const totalViewedLessons = courses.reduce((acc, c) => acc + (c.progress?.viewedLessons || 0), 0);
  const totalCourseLessons = courses.reduce((acc, c) => acc + (c.progress?.totalLessons || 0), 0);
  const overallLessonPercentage = totalCourseLessons > 0 ? Math.round((totalViewedLessons / totalCourseLessons) * 100) : 0;

  // Flatten all attempts across all courses
  const allAttempts = courses.flatMap(c =>
    (c.exams || []).flatMap(ex =>
      (ex.attempts || []).map(att => ({
        courseTitle: c.title,
        examTitle: ex.title,
        attemptNumber: att.attemptNumber,
        score: att.score,
        status: att.status,
      }))
    )
  );

  const averageExamScore = allAttempts.length > 0
    ? Math.round(allAttempts.reduce((acc, a) => acc + a.score, 0) / allAttempts.length)
    : 0;

  const passedAttemptsCount = allAttempts.filter(a => a.status === 'Passed' || a.score >= 50).length;

  // Chart data from attempts
  const examChartData = allAttempts.slice(0, 10).map((a, idx) => ({
    name: a.examTitle.length > 15 ? a.examTitle.slice(0, 15) + '...' : a.examTitle,
    score: a.score,
    attempt: `محاولة ${a.attemptNumber}`,
  }));

  return (
    <div className="container fade-in-up" style={{ padding: '2.5rem 1.5rem 6rem' }}>
      {/* ── STAGE 1: VERIFICATION FORM (PUBLIC LOOKUP) ───── */}
      {!lookupResult ? (
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <div className="glass-card" style={{ padding: '2.5rem', border: '1px solid rgba(8,145,178,0.3)', background: 'var(--bg-glass-card)' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  color: '#FFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                  boxShadow: '0 4px 20px var(--primary-glow)',
                }}
              >
                <ShieldCheck size={32} />
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-bright)', margin: '0 0 0.5rem' }}>
                بوابة متابعة ولي الأمر (Parent Portal)
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>
                استعلام فوري عن التقرير الأكاديمي، ونسبة حضور المحاضرات، وسجل نتائج الامتحانات والبابل شيت للطالب دون الحاجة لتسجيل حساب.
              </p>
            </div>

            <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* National ID Field */}
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.5rem' }}>
                  الرقم القومي للطالب (National ID)
                </label>
                <div style={{ position: 'relative' }}>
                  <ShieldCheck size={18} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    required
                    maxLength={14}
                    placeholder="14 رقماً قومياً مسجلاً للطالب (مثال: 30101011234567)"
                    className="input-field"
                    style={{ width: '100%', paddingRight: '44px', fontSize: '0.95rem' }}
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                  />
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.35rem', marginInlineStart: '0.25rem' }}>
                  يجب أن يتكون الرقم القومي من 14 رقماً صحيحاً تماماً كما في شهادة الميلاد أو بطاقة الرقم القومي.
                </p>
              </div>

              {/* Student Phone Field */}
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.5rem' }}>
                  رقم هاتف الطالب المسجل (Student Phone)
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={18} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="tel"
                    required
                    maxLength={11}
                    placeholder="رقم هاتف مصري يبدأ بـ 01 (مثال: 01012345678)"
                    className="input-field"
                    style={{ width: '100%', paddingRight: '44px', fontSize: '0.95rem' }}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.35rem', marginInlineStart: '0.25rem' }}>
                  رقم الهاتف الشخصي المسجل به حساب الطالب في المنظومة.
                </p>
              </div>

              {/* Security Note Alert */}
              <div
                style={{
                  background: 'rgba(8, 145, 178, 0.1)',
                  border: '1px solid rgba(8, 145, 178, 0.25)',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  fontSize: '0.82rem',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <ShieldCheck size={16} color="var(--primary-light)" style={{ flexShrink: 0 }} />
                <span>
                  <strong>حماية الخصوصية:</strong> لضمان سرية الدرجات، يلزم تطابق الرقم القومي ورقم الهاتف التابعين لنفس الطالب بالضبط.
                </span>
              </div>

              {errorMessage && (
                <div
                  style={{
                    background: 'rgba(239,68,68,0.12)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    padding: '0.85rem 1rem',
                    borderRadius: '8px',
                    color: '#EF4444',
                    fontSize: '0.88rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
                style={{ padding: '0.85rem', fontSize: '1rem', marginTop: '0.5rem', justifyContent: 'center' }}
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={18} className="spin" /> جاري التحقق واستخراج التقرير...
                  </>
                ) : (
                  <>
                    <Search size={18} /> استخراج تقرير الطالب الأكاديمي
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* ── STAGE 2: VERIFIED STUDENT ACADEMIC REPORT ──────── */
        <div>
          {/* Header Card */}
          <div
            className="glass-card"
            style={{
              padding: '2rem 2.5rem',
              marginBottom: '2rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1.5rem',
              background: 'linear-gradient(135deg, rgba(8, 145, 178, 0.18), rgba(139, 92, 246, 0.18))',
              border: '1px solid rgba(8, 145, 178, 0.35)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFF',
                  boxShadow: '0 4px 15px var(--primary-glow)',
                }}
              >
                <UserCheck size={36} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                  <span className="gradient-badge">
                    تقرير ولي الأمر المعتمد
                  </span>
                  <span style={{ fontSize: '0.82rem', color: '#10B981', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700 }}>
                    <CheckCircle2 size={13} /> تم التحقق بنجاح من قاعدة البيانات
                  </span>
                </div>
                <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--text-bright)', margin: 0 }}>
                  {lookupResult.student?.fullName || 'طالب مسجل'}
                </h1>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                  <span>الرقم القومي: ••••{lookupCredentials?.nationalId.slice(-4)}</span>
                  <span>• الهاتف المسجل: {lookupCredentials?.phone}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {/* PDF Download Button */}
              <button
                className="btn btn-primary"
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.15rem' }}
                title="تحميل تقرير PDF رسمي شامل لولي الأمر"
              >
                {isDownloadingPdf ? (
                  <>
                    <RefreshCw size={16} className="spin" /> جاري تجهيز PDF...
                  </>
                ) : (
                  <>
                    <Download size={16} /> تحميل تقرير رسمي (PDF)
                  </>
                )}
              </button>

              {/* Reset Search Button */}
              <button className="btn btn-secondary" onClick={handleReset} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <Search size={16} /> استعلام عن طالب آخر
              </button>
            </div>
          </div>

          {/* Key Metrics Overview Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>متوسط درجات الامتحانات</div>
              <strong style={{ fontSize: '1.85rem', color: averageExamScore >= 60 ? '#10B981' : 'var(--primary-light)', display: 'block', fontWeight: 900 }}>
                {averageExamScore}%
              </strong>
              <span style={{ fontSize: '0.75rem', color: averageExamScore >= 80 ? '#10B981' : averageExamScore >= 60 ? 'var(--accent)' : '#EF4444', fontWeight: 700 }}>
                {allAttempts.length === 0 ? 'لا توجد امتحانات مكتملة' : averageExamScore >= 85 ? 'أداء ممتاز مرتفع' : averageExamScore >= 60 ? 'مستوى جيد ومستقر' : 'يحتاج لمزيد من المتابعة'}
              </span>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>نسبة حضور المحاضرات</div>
              <strong style={{ fontSize: '1.85rem', color: '#10B981', display: 'block', fontWeight: 900 }}>
                {overallLessonPercentage}%
              </strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {totalViewedLessons} من إجمالي {totalCourseLessons} محاضرة
              </span>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>الكورسات المسجلة</div>
              <strong style={{ fontSize: '1.85rem', color: 'var(--primary-light)', display: 'block', fontWeight: 900 }}>
                {courses.length}
              </strong>
              <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700 }}>
                {courses.length > 0 ? 'مقررات دراسية نشطة' : 'لم يشترك في كورسات'}
              </span>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>محاولات الامتحانات المعتمدة</div>
              <strong style={{ fontSize: '1.85rem', color: 'var(--accent)', display: 'block', fontWeight: 900 }}>
                {passedAttemptsCount} / {allAttempts.length}
              </strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>محاولات ناجحة بنسبة 100% رصد</span>
            </div>
          </div>

          {/* Academic Chart (if attempts exist) */}
          {examChartData.length > 0 && (
            <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BarChart2 size={20} color="var(--primary-light)" /> منحنى درجات الامتحانات والتقييمات (%)
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    رصد لحظي لتطور تحصيل الطالب في كل محاولة اختبار
                  </span>
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
          )}

          {/* ── COURSES AND PROGRESS BREAKDOWN ────────────────── */}
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={22} color="var(--primary-light)" /> تفاصيل المقررات والامتحانات المنجزة ({courses.length})
          </h2>

          {courses.length === 0 ? (
            <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <BookOpen size={40} style={{ opacity: 0.35, margin: '0 auto 0.75rem' }} />
              <p style={{ margin: 0, fontSize: '0.95rem' }}>الطالب مسجل بالمنظومة ولكن لم يقم بالاشتراك في أي كورس بعد.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {courses.map((course) => {
                const prog = course.progress || { viewedLessons: 0, totalLessons: 0, percentage: 0 };
                const examsList = course.exams || [];

                return (
                  <div key={course.courseId} className="glass-card" style={{ padding: '1.75rem' }}>
                    {/* Course Title and Progress */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
                          {course.title}
                        </h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          تمت مشاهدة {prog.viewedLessons} من أصل {prog.totalLessons} محاضرة
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--primary-light)' }}>
                          {prog.percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '9999px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                      <div
                        style={{
                          width: `${Math.min(100, Math.max(0, prog.percentage))}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, var(--primary), #10B981)',
                          borderRadius: '9999px',
                          transition: 'width 0.5s ease',
                        }}
                      />
                    </div>

                    {/* Exams under this course */}
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Award size={16} color="var(--accent)" /> اختبارات الكورس ({examsList.length}):
                    </h4>

                    {examsList.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                        لم تسجل أي اختبارات لهذا الكورس بعد.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        {examsList.map((ex) => (
                          <div
                            key={ex.examId}
                            style={{
                              background: 'var(--bg-subtle)',
                              border: '1px solid var(--border-glass)',
                              borderRadius: '8px',
                              padding: '0.85rem 1.15rem',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: '0.75rem',
                            }}
                          >
                            <div>
                              <strong style={{ fontSize: '0.92rem', color: 'var(--text-bright)', display: 'block' }}>
                                {ex.title}
                              </strong>
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                عدد المحاولات المعتمدة: {ex.attempts?.length || 0}
                              </span>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              {(ex.attempts && ex.attempts.length > 0) ? (
                                ex.attempts.map((att, aIdx) => {
                                  const isPassed = att.status === 'Passed' || att.score >= 50;
                                  const isAutoSubmitted = att.status === 'AutoSubmitted';

                                  return (
                                    <span
                                      key={aIdx}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.35rem',
                                        padding: '0.3rem 0.65rem',
                                        borderRadius: '6px',
                                        fontSize: '0.8rem',
                                        fontWeight: 700,
                                        background: isAutoSubmitted
                                          ? 'rgba(245, 158, 11, 0.15)'
                                          : isPassed
                                          ? 'rgba(16, 185, 129, 0.15)'
                                          : 'rgba(239, 68, 68, 0.15)',
                                        color: isAutoSubmitted
                                          ? '#F59E0B'
                                          : isPassed
                                          ? '#10B981'
                                          : '#EF4444',
                                        border: `1px solid ${
                                          isAutoSubmitted
                                            ? 'rgba(245, 158, 11, 0.3)'
                                            : isPassed
                                            ? 'rgba(16, 185, 129, 0.3)'
                                            : 'rgba(239, 68, 68, 0.3)'
                                        }`,
                                      }}
                                    >
                                      {isAutoSubmitted ? <AlertTriangle size={12} /> : isPassed ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                      <span>محاولة {att.attemptNumber}: {att.score}%</span>
                                    </span>
                                  );
                                })
                              ) : (
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                  لم يؤد الاختبار بعد
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
