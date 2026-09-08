import React, { useState } from 'react';
import { User, Phone, ShieldCheck, Key, Sparkles, LogOut, Smartphone, Edit3, Check, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getDeviceUuid } from '../../utils/device';
import { ChangePasswordModal } from '../../components/auth/ChangePasswordModal';
import { ScratchCardModal } from '../../components/payment/ScratchCardModal';

interface ProfilePageProps {
  onLogoutSuccess?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onLogoutSuccess }) => {
  const { currentUser, logout, updateUserName } = useAuth();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isScratchCardOpen, setIsScratchCardOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(currentUser?.name || '');

  const deviceUuid = getDeviceUuid();

  const handleLogout = () => {
    logout();
    if (onLogoutSuccess) onLogoutSuccess();
  };

  const handleSaveName = () => {
    if (nameInput.trim()) {
      updateUserName(nameInput.trim());
      setIsEditingName(false);
    }
  };

  return (
    <div className="container fade-in-up" style={{ padding: '2.5rem 1.5rem 6rem', maxWidth: '680px' }}>
      <div className="glass-card" style={{ padding: '2rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
          <img
            src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
            alt={currentUser?.name}
            style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid var(--primary-light)', objectFit: 'cover' }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              {isEditingName ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
                  <input
                    type="text"
                    className="input-field"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="اسم الطالب..."
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.95rem' }}
                    autoFocus
                  />
                  <button className="btn btn-primary" onClick={handleSaveName} style={{ padding: '0.4rem 0.8rem' }}>
                    <Check size={16} />
                  </button>
                  <button className="btn btn-secondary" onClick={() => setIsEditingName(false)} style={{ padding: '0.4rem 0.8rem' }}>
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-bright)', margin: 0 }}>
                    {currentUser?.name || 'طالب المنظومة'}
                  </h1>
                  <button
                    className="icon-btn"
                    onClick={() => { setNameInput(currentUser?.name || ''); setIsEditingName(true); }}
                    title="تعديل الاسم"
                    style={{ width: '28px', height: '28px' }}
                  >
                    <Edit3 size={14} />
                  </button>
                  <span className="status-badge status-badge--active">حساب مفعل</span>
                </>
              )}
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
              رقم الهاتف: {currentUser?.phone}
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '1.75rem' }}>
          <div style={{ background: 'var(--bg-subtle)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <Smartphone size={16} />
              <span>معرّف الجهاز المعتمد (Device UUID):</span>
            </div>
            <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--primary-light)', direction: 'ltr' }}>
              {deviceUuid.substring(0, 18)}...
            </span>
          </div>

          <div style={{ background: 'var(--bg-subtle)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <Sparkles size={16} color="var(--accent)" />
              <span>رصيد المحفظة الحالي:</span>
            </div>
            <strong style={{ fontSize: '1.1rem', color: '#10B981' }}>{walletBalance} ج.م</strong>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.5rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsScratchCardOpen(true)}
            style={{ padding: '0.75rem', fontSize: '0.88rem', justifyContent: 'center' }}
          >
            <Sparkles size={16} color="var(--accent)" /> شحن كارت السنتر
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsPasswordModalOpen(true)}
            style={{ padding: '0.75rem', fontSize: '0.88rem', justifyContent: 'center' }}
          >
            <Key size={16} /> تغيير كلمة المرور
          </button>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleLogout}
          style={{ width: '100%', padding: '0.65rem', fontSize: '0.85rem', justifyContent: 'center', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}
        >
          <LogOut size={16} /> تسجيل الخروج من الحساب
        </button>
      </div>

      {/* Modals */}
      {isPasswordModalOpen && (
        <ChangePasswordModal
          isOpen={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
          onPasswordChanged={handleLogout}
        />
      )}

      {isScratchCardOpen && (
        <ScratchCardModal
          isOpen={isScratchCardOpen}
          onClose={() => setIsScratchCardOpen(false)}
          onRedeemSuccess={(_credited, newBal) => setWalletBalance(newBal)}
        />
      )}
    </div>
  );
};
