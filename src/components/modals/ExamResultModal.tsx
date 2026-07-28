import React from 'react';
import { Award, CheckCircle, XCircle, RotateCcw, ArrowRight } from 'lucide-react';

interface ExamResultModalProps {
  isOpen: boolean;
  score: number;
  totalQuestions: number;
  answeredCount: number;
  onClose: () => void;
  onRetry: () => void;
}

export const ExamResultModal: React.FC<ExamResultModalProps> = ({
  isOpen,
  score,
  totalQuestions,
  answeredCount,
  onClose,
  onRetry,
}) => {
  if (!isOpen) return null;

  const percentage = Math.round((score / totalQuestions) * 100);
  const isPassed = percentage >= 60;

  return (
    <div className="modal-overlay active">
      <div className="modal-box" style={{ maxWidth: '520px', textAlign: 'center' }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: isPassed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
          border: `2px solid ${isPassed ? 'var(--success)' : 'var(--danger)'}`,
          color: isPassed ? 'var(--success)' : 'var(--danger)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem auto'
        }}>
          <Award size={40} />
        </div>

        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.25rem' }}>
          {isPassed ? 'مبـارك! تم إنهاء الامتحان بنجاح' : 'لم تتجاوز نسبة النجاح المطلوب'}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
          تم رصد وتوثيق إجاباتك وإرسال نسخة تلقائية لولي الأمر
        </p>

        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '3rem', fontWeight: 900, color: isPassed ? 'var(--success)' : 'var(--danger)' }}>
            {percentage}%
          </div>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            الدرجة المستحقة: {score} من {totalQuestions}
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-glass)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
              <CheckCircle size={18} color="var(--success)" />
              <span style={{ fontSize: '0.85rem' }}>المجاب: {answeredCount} سؤال</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
              <XCircle size={18} color="var(--warning)" />
              <span style={{ fontSize: '0.85rem' }}>المتروك: {totalQuestions - answeredCount} سؤال</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onRetry}>
            <RotateCcw size={18} /> إعادة المحاولة
          </button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={onClose}>
            متابعة المنصة <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
