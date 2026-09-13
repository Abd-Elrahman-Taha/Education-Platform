import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Clock, Award, CheckCircle, XCircle, AlertTriangle, Send, ShieldCheck, FileText } from 'lucide-react';
import { useExamSession } from '../../hooks/useExamSession';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorState } from '../common/ErrorState';
import { useToast } from '../../context/ToastContext';
import { getFriendlyErrorMessage } from '../../utils/errors';

interface ExamSessionViewProps {
  examId: string;
  onBackToCourse?: () => void;
}

export const ExamSessionView: React.FC<ExamSessionViewProps> = ({
  examId,
  onBackToCourse,
}) => {
  const { showToast } = useToast();
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
    warningCount,
    showWarningModal,
    setShowWarningModal,
    autoSubmittedByCheating,
    startExam,
    selectAnswer,
    submitExam,
  } = useExamSession(examId);

  const [hasStarted, setHasStarted] = useState(false);

  if (!examId) {
    return (
      <div style={{ maxWidth: '640px', margin: '2rem auto' }}>
        <ErrorState
          title="معرّف الاختبار غير محدد"
          message="لم يتم العثور على معرّف الاختبار المطلوب. يرجى العودة لصفحة الكورس أو قائمة الاختبارات واختيار الاختبار مرة أخرى."
          onRetry={onBackToCourse}
        />
        {onBackToCourse && (
          <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
            <button className="btn btn-secondary" onClick={onBackToCourse}>
              العودة إلى صفحة المحاضرة
            </button>
          </div>
        )}
      </div>
    );
  }

  const handleStartExam = async () => {
    try {
      await startExam();
      setHasStarted(true);
    } catch (err: any) {
      showToast(getFriendlyErrorMessage(err, 'تعذر بدء الاختبار، يرجى المحاولة مرة أخرى.'), 'error');
    }
  };

  const handleSubmitExam = async () => {
    if (questions.length === 0) {
      showToast('لا توجد أسئلة لتسليمها.', 'warning');
      return;
    }

    const answeredCount = Object.keys(answers).filter(
      k => answers[k] !== undefined && answers[k] !== null && String(answers[k]).trim() !== ''
    ).length;

    if (answeredCount < questions.length) {
      const confirmSubmit = window.confirm(
        `لقد قمت بالإجابة على ${answeredCount} من أصل ${questions.length} سؤال. هل أنت متأكد من رغبتك في تسليم الاختبار الآن؟`
      );
      if (!confirmSubmit) return;
    }

    try {
      await submitExam();
      showToast('تم تسليم الاختبار بنجاح!', 'success');
    } catch (err: any) {
      showToast(getFriendlyErrorMessage(err, 'تعذر تسليم الاختبار، يرجى المحاولة مرة أخرى.'), 'error');
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="جاري إعداد جلسة الاختبار والأسئلة..." />;
  }

  if (error) {
    return (
      <div style={{ maxWidth: '640px', margin: '2rem auto' }}>
        <ErrorState
          title="تعذر بدء أو تسليم الاختبار"
          message={error}
          onRetry={hasStarted ? handleSubmitExam : handleStartExam}
        />
        {onBackToCourse && (
          <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
            <button className="btn btn-secondary" onClick={onBackToCourse}>
              العودة إلى صفحة المحاضرة
            </button>
          </div>
        )}
      </div>
    );
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
          onClick={handleStartExam}
          disabled={isLoading}
        >
          {isLoading ? 'جاري بدء الاختبار...' : 'بدء الاختبار الآن'}
        </button>
      </div>
    );
  }

  // Handle empty questions state when exam is started
  if (hasStarted && questions.length === 0) {
    return (
      <div className="glass-card" style={{ maxWidth: '640px', margin: '2rem auto', padding: '2.5rem 2rem', textAlign: 'center' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(245, 158, 11, 0.15)',
            color: '#F59E0B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
          }}
        >
          <AlertTriangle size={32} />
        </div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '0.5rem' }}>
          لا توجد أسئلة مضافة لهذا الاختبار حالياً
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          لم يقم المعلم أو إدارة المنصة بإضافة أي أسئلة لهذا الاختبار بعد، أو أن الاختبار قيد الإعداد.
        </p>
        {onBackToCourse && (
          <button className="btn btn-primary" onClick={onBackToCourse}>
            العودة إلى صفحة المحاضرة
          </button>
        )}
      </div>
    );
  }

  // Result screen after submission
  if (isFinished && result) {
    const isPendingReview = result.status === 'PendingReview';
    const isPassed = result.status === 'Passed';
    return (
      <div className="glass-card" style={{ maxWidth: '600px', margin: '2rem auto', padding: '2.5rem 2rem', textAlign: 'center' }}>
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: isPendingReview
              ? 'rgba(245, 158, 11, 0.15)'
              : isPassed
              ? 'rgba(16, 185, 129, 0.15)'
              : 'rgba(239, 68, 68, 0.15)',
            color: isPendingReview ? '#F59E0B' : isPassed ? 'var(--success)' : 'var(--danger)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
          }}
        >
          {isPendingReview ? <Clock size={40} /> : isPassed ? <CheckCircle size={40} /> : <XCircle size={40} />}
        </div>

        <span
          className={`status-badge ${isPassed ? 'status-badge--active' : 'status-badge--blocked'}`}
          style={{
            marginBottom: '0.75rem',
            display: 'inline-block',
            background: isPendingReview ? 'rgba(245, 158, 11, 0.15)' : undefined,
            color: isPendingReview ? '#F59E0B' : undefined,
            borderColor: isPendingReview ? 'rgba(245, 158, 11, 0.4)' : undefined,
          }}
        >
          {isPendingReview
            ? 'بانتظار تصحيح الأسئلة المقالية (PendingReview)'
            : isPassed
            ? 'اجتياز ناجح (Passed)'
            : 'لم يتم الاجتياز (Failed)'}
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
          {result.message ||
            (isPendingReview
              ? 'تم تسليم إجاباتك بنجاح! هذا الاختبار يحتوي على أسئلة مقالية تتطلب مراجعة من المشرفين، وستظهر نتيجتك وحالة الاعتماد فور اكتمال التصحيح.'
              : isPassed
              ? 'تهانينا! لقد حققت متطلبات الاختبار ويمكنك الآن متابعة المحاضرة.'
              : 'للأسف لم تحقق الدرجة المطلوبة. يمكنك مراجعة المحتوى وإعادة المحاولة.')}
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

              {/* Options or Essay / FillInBlank Input */}
              {q.QuestionType === 'Essay' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <textarea
                    rows={4}
                    disabled={isTimerExpired || isSubmitting}
                    placeholder="اكتب إجابتك المقالية بالتفصيل هنا..."
                    value={answers[q._id] || ''}
                    onChange={e => selectAnswer(q._id, e.target.value)}
                    className="input-field"
                    style={{ width: '100%', resize: 'vertical', lineHeight: 1.6 }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <FileText size={13} color="var(--primary-light)" /> سؤال مقالي يتطلب إجابة كتابية ويتم تقييمه يدوياً من قِبل المعلم/المشرف.
                  </span>
                </div>
              ) : q.QuestionType === 'FillInBlank' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <input
                    type="text"
                    disabled={isTimerExpired || isSubmitting}
                    placeholder="اكتب إجابتك هنا..."
                    value={answers[q._id] || ''}
                    onChange={e => selectAnswer(q._id, e.target.value)}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {q.Options && q.Options.length > 0 ? (
                    q.Options.map((opt, optIndex) => {
                      const isSelected = selectedOption === opt;
                      let displayLabel = opt;
                      if (q.QuestionType === 'TrueFalse') {
                        if (opt === 'true' || opt.toLowerCase() === 'true') displayLabel = 'صح (صواب)';
                        else if (opt === 'false' || opt.toLowerCase() === 'false') displayLabel = 'خطأ';
                      }

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
                            {displayLabel}
                          </span>
                        </label>
                      );
                    })
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      <input
                        type="text"
                        disabled={isTimerExpired || isSubmitting}
                        placeholder="اكتب إجابتك هنا..."
                        value={answers[q._id] || ''}
                        onChange={e => selectAnswer(q._id, e.target.value)}
                        className="input-field"
                        style={{ width: '100%' }}
                      />
                    </div>
                  )}
                </div>
              )}
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
          type="button"
          className="btn btn-primary"
          disabled={isSubmitting || isTimerExpired}
          onClick={handleSubmitExam}
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

      {/* ── ANTI-CHEATING WARNING MODAL (POST /exams/:id/warning) ── */}
      {showWarningModal && createPortal(
        <div className="modal-overlay active" style={{ zIndex: 999999 }}>
          <div className="modal-box" style={{ maxWidth: '460px', padding: '2rem', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.5)' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                color: 'var(--danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}
            >
              <AlertTriangle size={36} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--danger)', margin: '0 0 0.5rem' }}>
              {autoSubmittedByCheating || warningCount >= 3 ? 'تم تسليم الاختبار تلقائياً!' : 'تحذير أمني: مغادرة شاشة الاختبار!'}
            </h3>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#EF4444',
              fontWeight: 800,
              fontSize: '0.85rem',
              marginBottom: '1rem'
            }}>
              تحذير رقم {Math.min(warningCount, 3)} من أصل 3
            </div>

            <p style={{ color: 'var(--text-bright)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              {autoSubmittedByCheating || warningCount >= 3
                ? 'لقد تجاوزت الحد الأقصى المسموح به للتحذيرات (3 تحذيرات). تم قفل الامتحان وتسليم إجاباتك الحالية تلقائياً إلى خوادم المنصة.'
                : 'تم رصد محاولة مغادرة صفحة الاختبار أو تبديل النافذة. يرجى البقاء داخل شاشة الامتحان، حيث أن التحذير الثالث يؤدي لتسليم الامتحان فوراً.'}
            </p>

            {!(autoSubmittedByCheating || warningCount >= 3) ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowWarningModal(false)}
                style={{ width: '100%', padding: '0.75rem' }}
              >
                فهمت وسأواصل الاختبار
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowWarningModal(false)}
                style={{ width: '100%', padding: '0.75rem' }}
              >
                عرض النتيجة المسجلة
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
