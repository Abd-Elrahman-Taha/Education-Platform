import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { useCheckout } from '../../hooks/useCheckout';

interface ScratchCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRedeemSuccess?: (creditedAmount: number, newBalance: number) => void;
}

export const ScratchCardModal: React.FC<ScratchCardModalProps> = ({
  isOpen,
  onClose,
  onRedeemSuccess,
}) => {
  const [code, setCode] = useState('');
  const { isRedeeming, redeemError, redeemSuccess, redeemScratchCard, clearErrors } = useCheckout();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    try {
      const res = await redeemScratchCard(code);
      if (onRedeemSuccess) {
        onRedeemSuccess(res.creditedAmount, res.newWalletBalance);
      }
      setCode('');
    } catch {
      // Handled by hook
    }
  };

  const handleClose = () => {
    clearErrors();
    setCode('');
    onClose();
  };

  return createPortal(
    <div className="modal-overlay active" onClick={handleClose} style={{ zIndex: 100000 }}>
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '460px', padding: '1.75rem' }}
      >
        <button className="modal-close" onClick={handleClose}>
          <X size={18} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(234, 179, 8, 0.15)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.75rem',
            }}
          >
            <Sparkles size={28} />
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
            شحن كارت السنتر
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            أدخل كود الشحن المطبوع على الكارت لشحن رصيد محفظتك فورياً
          </p>
        </div>

        {redeemSuccess ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
              }}
            >
              <CheckCircle2 size={36} />
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-bright)', margin: '0 0 0.25rem' }}>
              تمت إضافة <strong>+{redeemSuccess.creditedAmount} ج.م</strong> إلى محفظتك.
            </p>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '1.5rem' }}>
              رصيدك الحالي: {redeemSuccess.newWalletBalance} ج.م
            </span>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleClose}
              style={{ width: '100%', padding: '0.75rem' }}
            >
              تم
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                كود كارت الشحن (16 رقماً أو رمزاً)
              </label>
              <input
                type="text"
                required
                placeholder="أدخل كود الكارت هنا..."
                className="input-field"
                style={{
                  width: '100%',
                  fontSize: '1.1rem',
                  fontFamily: 'monospace',
                  letterSpacing: '2px',
                  textAlign: 'center',
                  padding: '0.85rem',
                }}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoFocus
              />
            </div>

            {redeemError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: 'var(--danger)',
                  fontSize: '0.82rem',
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{redeemError}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isRedeeming || !code.trim()}
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem' }}
            >
              {isRedeeming ? 'جاري التحقق وشحن الرصيد...' : 'تأكيد وشحن الكارت'}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};
