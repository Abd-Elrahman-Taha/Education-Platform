import React, { useEffect, useState } from 'react';
import { Clock, Award, CheckCircle, XCircle, AlertTriangle, Send, ShieldCheck } from 'lucide-react';
import { useExamSession } from '../../hooks/useExamSession';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorState } from '../common/ErrorState';

interface ExamSessionViewProps {
  examId: string;
  onBackToCourse?: () => void;
}

export const ExamSessionView: React.FC<ExamSessionViewProps> = ({
  examId,
  onBackToCourse,
}) => {
  const {
    exam,
    questions,
    answers,
    isLoading,
    isSubmitting,
    error,
    result,
    isFinished,
    formatTimeRemaining,
    timeRemainingSeconds,
    isTimerExpired,
    startExam,
    selectAnswer,
    submitExam,
  } = useExamSession(examId);

  const [hasStarted, setHasStarted] = useState(false);

  if (isLoading) {
    return <LoadingSpinner message="جاري إعداد جلسة الاختبار..." />;
  }

  if (error && !hasStarted) {
    return <ErrorState title="خطأ في بدء الاختبار" message={error} onRetry={startExam} />;
  }

  // Pre-start screen
  if (!hasStarted) {
    return (
      <div className="glass-card" style={{ maxWidth: '640px', margin: '2rem auto', padding: '2.5rem 2rem', textAlign: 'center' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            color: '#FFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
          }}
        >
          <Award size={32} />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-bright)', margin: '0 0 0.5rem' }}>
          الاختبار التأهيلي للدرس
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0 0 1.5rem', lineHeight: 1.6 }}>
          يرجى العلم أن المؤقت سيبدأ فور الضغط على زر البدء. يتم احتساب النتيجة والتصحيح وتحديد حالة النجاح بالكامل عبر خوادم المنظومة.
        </p>

        <button
          className="btn btn-primary"
          style={{ padding: '0.75rem 2rem', fontSize: '0.95rem' }}
          onClick={() => {
            setHasStarted(true);
            startExam();
          }}
        >
          بدء الاختبار الآن
        </button>
      </div>
    );
  }

  // Result screen after submission
  if (isFinished && result) {
    const isPassed = result.status === 'Passed';
    return (
      <div className="glass-card" style={{ maxWidth: '600px', margin: '2rem auto', padding: '2.5rem 2rem', textAlign: 'center' }}>
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: isPassed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: isPassed ? 'var(--success)' : 'var(--danger)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
          }}
        >
          {isPassed ? <CheckCircle size={40} /> : <XCircle size={40} />}
        </div>

        <span className={`status-badge ${isPassed ? 'status-badge--active' : 'status-badge--blocked'}`} style={{ marginBottom: '0.75rem', display: 'inline-block' }}>
          {isPassed ? 'اجتياز ناجح (Passed)' : 'لم يتم الاجتياز (Failed)'}
        </span>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-bright)', margin: '0 0 0.5rem' }}>
          درجتك: {result.score} {result.totalPoints ? `/ ${result.totalPoints}` : '%'}
        </h2>

        {result.passingScore && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            درجة النجاح المطلوبة: {result.passingScore}%
          </p>
        )}

        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '1rem 0 2rem' }}>
          {result.message || (isPassed ? 'تهانينا! لقد حققت متطلبات الاختبار ويمكنك الآن متابعة المحاضرة.' : 'للأسف لم تحقق الدرجة المطلوبة. يمكنك مراجعة المحتوى وإعادة المحاولة.')}
        </p>

        {onBackToCourse && (
          <button className="btn btn-primary" onClick={onBackToCourse}>
            العودة إلى صفحة المحاضرة
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '1.5rem auto' }}>
      {/* Sticky Exam Timer Header */}
      <div
        className="glass-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.5rem',
          marginBottom: '1.5rem',
          position: 'sticky',
          top: '1rem',
          zIndex: 30,
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
            {exam?.Title || 'الاختبار التأهيلي'}
          </h2>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            عدد الأسئلة: {questions.length} • تم الإجابة على: {Object.keys(answers).length}
          </span>
        </div>

        {/* Countdown display */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.45rem 0.9rem',
            borderRadius: 'var(--radius-md)',
            background: timeRemainingSeconds < 120 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(8, 145, 178, 0.12)',
            color: timeRemainingSeconds < 120 ? 'var(--danger)' : 'var(--primary-light)',
            fontWeight: 800,
            fontSize: '1rem',
          }}
        >
          <Clock size={18} />
          <span>{formatTimeRemaining()}</span>
        </div>
      </div>

      {/* Questions List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {questions.map((q, qIndex) => {
          const selectedOption = answers[q._id];
          return (
            <div key={q._id} className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--primary-light)' }}>
                  السؤال {qIndex + 1}
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {q.Points} درجات
                </span>
              </div>

              <p style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                {q.QuestionText}
              </p>

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {q.Options.map((opt, optIndex) => {
                  const isSelected = selectedOption === opt;
                  return (
                    <label
                      key={optIndex}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        background: isSelected ? 'rgba(8, 145, 178, 0.16)' : 'var(--bg-surface)',
                        border: `1px solid ${isSelected ? 'var(--primary-light)' : 'var(--border-glass)'}`,
                        cursor: isTimerExpired ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <input
                        type="radio"
                        name={`q-${q._id}`}
                        disabled={isTimerExpired || isSubmitting}
                        checked={isSelected}
                        onChange={() => selectAnswer(q._id, opt)}
                        style={{ accentColor: 'var(--primary-light)', width: '18px', height: '18px' }}
                      />
                      <span style={{ fontSize: '0.9rem', color: isSelected ? 'var(--text-bright)' : 'var(--text-muted)', fontWeight: isSelected ? 700 : 500 }}>
                        {opt}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Submission Card */}
      <div className="glass-card" style={{ marginTop: '1.5rem', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          تأكد من مراجعة إجاباتك قبل الضغط على زر التسليم النهائي.
        </span>

        <button
          className="btn btn-primary"
          disabled={isSubmitting || isTimerExpired}
          onClick={submitExam}
          style={{ padding: '0.65rem 1.5rem', fontSize: '0.9rem' }}
        >
          {isSubmitting ? (
            'جاري إرسال الإجابات...'
          ) : (
            <>
              <Send size={16} /> تسليم الاختبار
            </>
          )}
        </button>
      </div>
    </div>
  );
};
