import React, { useState } from 'react';
import { X, Lock, Key, AlertCircle, CheckCircle } from 'lucide-react';
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
      setError(getFriendlyErrorMessage(err, 'تعذر تغيير كلمة المرور، يرجى التأكد من صحة كلمة المرور الحالية والمحاولة مجدداً.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay active" onClick={onClose} style={{ zIndex: 99999 }}>
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '440px', padding: '1.75rem' }}
      >
        <button className="modal-close" onClick={onClose}>
          <X size={18} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: 'rgba(8, 145, 178, 0.12)',
              color: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.75rem',
            }}
          >
            <Key size={26} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
            تغيير كلمة المرور
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.25rem' }}>
            سيتم إنهاء جلستك الحالية ومطالبتك بتسجيل الدخول بكلمة المرور الجديدة
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
              كلمة المرور الحالية
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="input-field"
              style={{ width: '100%' }}
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
              كلمة المرور الجديدة (8–40 حرفاً)
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="input-field"
              style={{ width: '100%' }}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
              تأكيد كلمة المرور الجديدة
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="input-field"
              style={{ width: '100%' }}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {error && (
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
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
          >
            {isLoading ? 'جاري تحديث كلمة المرور...' : 'تأكيد التغيير'}
          </button>
        </form>
      </div>
    </div>
  );
};
