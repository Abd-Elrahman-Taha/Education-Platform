import React from 'react';
import { X, CreditCard, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { useCheckout } from '../../hooks/useCheckout';
import { Course } from '../../types/api.types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  course,
}) => {
  const { isCheckingOut, checkoutError, initiateCourseCheckout } = useCheckout();

  if (!isOpen) return null;

  return (
    <div className="modal-overlay active" onClick={onClose} style={{ zIndex: 99999 }}>
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '480px', padding: '1.75rem' }}
      >
        <button className="modal-close" onClick={onClose}>
          <X size={18} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(8, 145, 178, 0.12)',
              color: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.75rem',
            }}
          >
            <CreditCard size={28} />
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
            تأكيد الاشتراك في الكورس
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
            بوابة الدفع الإلكتروني المعتمدة
          </p>
        </div>

        {/* Course Summary Box */}
        <div
          style={{
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-glass)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            marginBottom: '1.25rem',
          }}
        >
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>
            الكورس المختار:
          </span>
          <strong style={{ fontSize: '1rem', color: 'var(--text-bright)', display: 'block', margin: '0.25rem 0' }}>
            {course.Title}
          </strong>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-glass)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>قيمة الاشتراك:</span>
            <strong style={{ fontSize: '1.2rem', color: '#10B981' }}>{course.Price} ج.م</strong>
          </div>
        </div>

        {checkoutError && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              color: 'var(--danger)',
              fontSize: '0.82rem',
              marginBottom: '1rem',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{checkoutError}</span>
          </div>
        )}

        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
          🔒 يتم إنشاء مفتاح أمان فريد (Idempotency Key) لكل عملية دفع لمنع التكرار وحماية بياناتك المالية. سيتم توجيهك لبوابة الدفع الآمنة.
        </div>

        <button
          className="btn btn-primary"
          disabled={isCheckingOut}
          onClick={() => initiateCourseCheckout(course._id)}
          style={{ width: '100%', padding: '0.8rem', fontSize: '0.95rem' }}
        >
          {isCheckingOut ? 'جاري تجهيز بوابة الدفع...' : 'الانتقال لبوابة الدفع الإلكتروني'}
        </button>
      </div>
    </div>
  );
};
