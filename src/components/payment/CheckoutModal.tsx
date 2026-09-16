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
          style={{
            maxWidth: '460px',
            width: '92%',
            padding: '1.25rem 1.5rem',
            maxHeight: 'min(92vh, 620px)',
            overflowY: 'auto',
          }}
        >
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>

          {/* Compact Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', paddingLeft: '1.5rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(8, 145, 178, 0.12)',
                color: 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Wallet size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0, lineHeight: 1.2 }}>
                الاشتراك في الكورس
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: '0.2rem 0 0' }}>
                الدفع الفوري من خلال رصيد محفظتك
              </p>
            </div>
          </div>

          {/* Success State */}
          {checkoutSuccess ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.75rem',
                }}
              >
                <CheckCircle2 size={32} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#10B981', marginBottom: '0.35rem' }}>
                {checkoutSuccess}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                تم تفعيل اشتراكك بنجاح وفتح جميع محاضرات واختبارات الكورس!
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onClose}
                style={{ width: '100%', padding: '0.65rem', fontSize: '0.9rem' }}
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
                  padding: '0.85rem 1rem',
                  marginBottom: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.55rem' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                      الكورس المختار:
                    </span>
                    <strong
                      style={{
                        fontSize: '0.95rem',
                        color: 'var(--text-bright)',
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={course.Title}
                    >
                      {course.Title}
                    </strong>
                  </div>
                  <div style={{ textAlign: 'left', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>سعر الكورس:</span>
                    <strong style={{ fontSize: '1.05rem', color: '#10B981' }}>{course.Price} ج.م</strong>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '0.5rem',
                    borderTop: '1px dashed var(--border-glass)',
                  }}
                >
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Wallet size={14} color="var(--primary-light)" />
                    رصيدك الحالي بالمحفظة:
                  </span>
                  <strong
                    style={{
                      fontSize: '1rem',
                      color: hasSufficientBalance ? '#10B981' : 'var(--danger)',
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
                    padding: '0.6rem 0.8rem',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: 'var(--danger)',
                    fontSize: '0.8rem',
                    marginBottom: '0.75rem',
                  }}
                >
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  <span>{checkoutError}</span>
                </div>
              )}

              {/* Balance State Info */}
              {!hasSufficientBalance ? (
                <div
                  style={{
                    background: 'rgba(234, 179, 8, 0.08)',
                    border: '1px solid rgba(234, 179, 8, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 0.85rem',
                    marginBottom: '0.85rem',
                    fontSize: '0.8rem',
                    color: 'var(--text-bright)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent)', fontWeight: 700 }}>
                      <AlertCircle size={14} style={{ flexShrink: 0 }} />
                      <span>رصيدك غير كافٍ للاشتراك مباشرة</span>
                    </div>
                  </div>
                  <p style={{ margin: '0 0 0.55rem', color: 'var(--text-muted)', fontSize: '0.75rem', lineHeight: 1.4 }}>
                    قيمة الكورس {course.Price} ج.م والمتبقي في محفظتك {walletBalance} ج.م. يمكنك شحن رصيدك بكارت شحن فوراً.
                  </p>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsScratchCardOpen(true)}
                    style={{
                      width: '100%',
                      padding: '0.45rem',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      background: 'rgba(234, 179, 8, 0.15)',
                      borderColor: 'rgba(234, 179, 8, 0.35)',
                      color: 'var(--accent)',
                    }}
                  >
                    <PlusCircle size={14} /> شحن المحفظة بواسطة كارت شحن
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    marginBottom: '0.85rem',
                    lineHeight: 1.4,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.35rem',
                  }}
                >
                  <ShieldCheck size={15} color="#10B981" style={{ flexShrink: 0, marginTop: '1px' }} />
                  <span>
                    سيتم خصم مبلغ <strong>{course.Price} ج.م</strong> تلقائياً من محفظتك وتفعيل الاشتراك فوراً من خلال النظام المعتمد.
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={isCheckingOut || !hasSufficientBalance}
                  onClick={handleWalletPurchase}
                  style={{ width: '100%', padding: '0.65rem', fontSize: '0.88rem', fontWeight: 700 }}
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
                  style={{
                    width: '100%',
                    padding: '0.55rem',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <Smartphone size={14} style={{ color: '#EF4444' }} />
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
