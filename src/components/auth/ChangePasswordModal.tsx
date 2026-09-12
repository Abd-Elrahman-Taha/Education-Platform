import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Key, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getFriendlyErrorMessage } from '../../utils/errors';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPasswordChanged?: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onPasswordChanged,
}) => {
  const { changePasswordApi } = useAuth();
  const { showToast } = useToast();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8 || newPassword.length > 40) {
      setError('يجب أن تتراوح كلمة المرور الجديدة بين 8 إلى 40 حرفاً/رقماً.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('كلمة المرور وتأكيد كلمة المرور غير متطابقتين.');
      return;
    }

    setIsLoading(true);
    try {
      await changePasswordApi(oldPassword, newPassword);
      showToast('تم تغيير كلمة المرور بنجاح. يرجى تسجيل الدخول مجدداً.', 'success');
      onClose();
      if (onPasswordChanged) onPasswordChanged();
    } catch (err: any) {
      if (err?.response?.status === 401 || err?.status === 401) {
        setError('كلمة المرور الحالية غير صحيحة. يرجى التأكد من كلمة المرور الحالية والمحاولة مجدداً.');
      } else if (err?.response?.status === 400 || err?.status === 400) {
        setError(err?.response?.data?.message || 'فشل التحقق من كلمة المرور الجديدة (يجب أن تتراوح بين 8 إلى 40 حرفاً/رقماً).');
      } else {
        setError(getFriendlyErrorMessage(err, 'تعذر تغيير كلمة المرور، يرجى التأكد من صحة البيانات والمحاولة مجدداً.'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <div
      className="modal-overlay active"
      onClick={onClose}
      style={{
        zIndex: 100000,
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(8, 18, 22, 0.82)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: '1.5rem',
      }}
    >
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '480px',
          width: '100%',
          padding: '2.25rem',
          borderRadius: 'var(--radius-xl)',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-glass-hover)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6), 0 0 35px rgba(8, 145, 178, 0.15)',
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <button
          className="modal-close"
          onClick={onClose}
          style={{ position: 'absolute', top: '1.25rem', left: '1.25rem' }}
          title="إغلاق"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(8, 145, 178, 0.2), rgba(13, 148, 136, 0.2))',
              border: '1.5px solid rgba(8, 145, 178, 0.4)',
              color: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.85rem',
              boxShadow: '0 4px 16px var(--primary-glow)',
            }}
          >
            <Key size={26} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-bright)', margin: 0 }}>
            تغيير كلمة المرور
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.35rem', lineHeight: 1.5 }}>
            أدخل كلمة المرور الحالية وكلمة المرور الجديدة لحماية وتحديث حسابك
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* Current Password */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-bright)', marginBottom: '0.4rem', fontWeight: 700 }}>
              كلمة المرور الحالية
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showOld ? 'text' : 'password'}
                required
                placeholder="أدخل كلمة المرور الحالية..."
                className="input-field"
                style={{ width: '100%', paddingLeft: '42px', fontSize: '0.9rem' }}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                tabIndex={-1}
              >
                {showOld ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-bright)', marginBottom: '0.4rem', fontWeight: 700 }}>
              كلمة المرور الجديدة
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNew ? 'text' : 'password'}
                required
                placeholder="8 أحرف أو أرقام على الأقل..."
                className="input-field"
                style={{ width: '100%', paddingLeft: '42px', fontSize: '0.9rem' }}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                tabIndex={-1}
              >
                {showNew ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
              يجب أن تتراوح بين 8 إلى 40 حرفاً/رقماً
            </span>
          </div>

          {/* Confirm New Password */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-bright)', marginBottom: '0.4rem', fontWeight: 700 }}>
              تأكيد كلمة المرور الجديدة
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                placeholder="أعد إدخال كلمة المرور الجديدة..."
                className="input-field"
                style={{ width: '100%', paddingLeft: '42px', fontSize: '0.9rem' }}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 0.95rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#F87171',
                fontSize: '0.82rem',
                lineHeight: 1.4,
              }}
            >
              <AlertCircle size={17} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isLoading}
              style={{ flex: 1, padding: '0.75rem', justifyContent: 'center' }}
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
              style={{ flex: 2, padding: '0.75rem', justifyContent: 'center' }}
            >
              {isLoading ? 'جاري تحديث كلمة المرور...' : 'تأكيد التغيير'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
