import React, { useState } from 'react';
import { X, CreditCard, ShieldCheck, AlertCircle, Wallet, CheckCircle2, PlusCircle, Smartphone, Zap } from 'lucide-react';
import { useCheckout } from '../../hooks/useCheckout';
import { useWalletBalance } from '../../hooks/useWalletBalance';
import { useAuth } from '../../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { Course } from '../../types/api.types';
import { ScratchCardModal } from './ScratchCardModal';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  onSuccess?: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  course,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();
  const { walletBalance, refetch: refetchBalance } = useWalletBalance();
  const {
    isCheckingOut,
    checkoutError,
    checkoutSuccess,
    checkoutWithWallet,
    initiateCourseCheckout,
    clearErrors,
  } = useCheckout();

  const [isScratchCardOpen, setIsScratchCardOpen] = useState(false);

  if (!isOpen) return null;

  const hasSufficientBalance = walletBalance >= course.Price;

  const handleWalletPurchase = async () => {
    try {
      await checkoutWithWallet(course._id);

      // Invalidate enrollments and course queries so course becomes unlocked immediately
      queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['course', course._id] });
      queryClient.invalidateQueries({ queryKey: ['course-lessons', course._id] });

      // Refresh current user and wallet
      try {
        await refreshUser();
      } catch {}
      refetchBalance();

      if (onSuccess) {
        onSuccess();
      }
    } catch {
      // Error handled by hook
    }
  };

  return (
    <>
      <div className="modal-overlay active" onClick={onClose} style={{ zIndex: 99999 }}>
        <div
          className="modal-box"
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: '500px', padding: '1.75rem' }}
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
              <Wallet size={28} />
            </div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
              الاشتراك في الكورس
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
              الدفع الفوري من خلال رصيد محفظتك
            </p>
          </div>

          {/* Success State */}
          {checkoutSuccess ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                }}
              >
                <CheckCircle2 size={36} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10B981', marginBottom: '0.5rem' }}>
                {checkoutSuccess}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
                تم تفعيل اشتراكك بنجاح وفتح جميع محاضرات واختبارات الكورس!
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onClose}
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
              >
                بدء المشاهدة الآن
              </button>
            </div>
          ) : (
            <>
              {/* Course & Wallet Summary Box */}
              <div
                style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>
                    الكورس المختار:
                  </span>
                  <strong style={{ fontSize: '1.05rem', color: 'var(--text-bright)', display: 'block', marginTop: '0.25rem' }}>
                    {course.Title}
                  </strong>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.65rem 0',
                    borderTop: '1px solid var(--border-glass)',
                  }}
                >
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>سعر الكورس:</span>
                  <strong style={{ fontSize: '1.15rem', color: '#10B981' }}>{course.Price} ج.م</strong>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.65rem 0',
                    borderTop: '1px dashed var(--border-glass)',
                  }}
                >
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Wallet size={15} color="var(--primary-light)" />
                    رصيدك الحالي بالمحفظة:
                  </span>
                  <strong
                    style={{
                      fontSize: '1.15rem',
                      color: hasSufficientBalance ? 'var(--text-bright)' : 'var(--danger)',
                    }}
                  >
                    {walletBalance} ج.م
                  </strong>
                </div>
              </div>

              {/* Error Box */}
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

              {/* Balance State Info */}
              {!hasSufficientBalance ? (
                <div
                  style={{
                    background: 'rgba(234, 179, 8, 0.1)',
                    border: '1px solid rgba(234, 179, 8, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem 1rem',
                    marginBottom: '1.25rem',
                    fontSize: '0.82rem',
                    color: 'var(--text-bright)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <AlertCircle size={16} color="var(--accent)" style={{ flexShrink: 0 }} />
                    <strong>رصيدك غير كافٍ للاشتراك مباشرة</strong>
                  </div>
                  <p style={{ margin: '0 0 0.75rem', color: 'var(--text-muted)' }}>
                    قيمة الكورس {course.Price} ج.م والمتبقي في محفظتك {walletBalance} ج.م. يمكنك شحن رصيدك بكارت شحن فوراً.
                  </p>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsScratchCardOpen(true)}
                    style={{
                      width: '100%',
                      padding: '0.55rem',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      background: 'rgba(234, 179, 8, 0.15)',
                      borderColor: 'rgba(234, 179, 8, 0.4)',
                      color: 'var(--accent)',
                    }}
                  >
                    <PlusCircle size={15} /> شحن المحفظة بواسطة كارت شحن
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                    marginBottom: '1.25rem',
                    lineHeight: 1.5,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.4rem',
                  }}
                >
                  <ShieldCheck size={16} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>
                    سيتم خصم مبلغ <strong>{course.Price} ج.م</strong> تلقائياً من محفظتك وتفعيل الاشتراك فوراً من خلال النظام المعتمد.
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={isCheckingOut || !hasSufficientBalance}
                  onClick={handleWalletPurchase}
                  style={{ width: '100%', padding: '0.8rem', fontSize: '0.95rem' }}
                >
                  {isCheckingOut ? 'جاري إتمام الاشتراك...' : 'تأكيد الاشتراك بواسطة المحفظة'}
                </button>

                {/* Alternative Gateway Checkout Option */}
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={isCheckingOut}
                  onClick={() => {
                    onClose();
                    window.location.href = `/payment/gateway-egyptian?courseId=${course._id}`;
                  }}
                  style={{ width: '100%', padding: '0.65rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}
                >
                  <Smartphone size={15} style={{ verticalAlign: 'middle', marginLeft: '4px', color: '#EF4444' }} />
                  تحويل فودافون كاش / إنستاباي
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Scratch Card Recharge Modal */}
      {isScratchCardOpen && (
        <ScratchCardModal
          isOpen={isScratchCardOpen}
          onClose={() => {
            setIsScratchCardOpen(false);
            refetchBalance();
            clearErrors();
          }}
        />
      )}
    </>
  );
};
