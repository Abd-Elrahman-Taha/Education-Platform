import React, { useState, useEffect } from 'react';
import { User, Phone, ShieldCheck, Key, Sparkles, LogOut, Smartphone, Edit3, Check, X, GraduationCap, AlertCircle, Save, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getDeviceUuid } from '../../utils/device';
import { ChangePasswordModal } from '../../components/auth/ChangePasswordModal';
import { ScratchCardModal } from '../../components/payment/ScratchCardModal';
import { useWalletBalance } from '../../hooks/useWalletBalance';
import { usersApi } from '../../api/users.api';
import { useToast } from '../../context/ToastContext';
import { ACADEMIC_YEAR_LABELS, AcademicYear } from '../../types';
import { getFriendlyErrorMessage } from '../../utils/errors';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

interface ProfilePageProps {
  onLogoutSuccess?: () => void;
  onPasswordChanged?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onLogoutSuccess, onPasswordChanged }) => {
  const { currentUser, logout, refreshUser } = useAuth();
  const { walletBalance, updateBalance } = useWalletBalance();
  const { showToast } = useToast();

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isScratchCardOpen, setIsScratchCardOpen] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [profileData, setProfileData] = useState<any>(null);

  // Edit form state for allowed fields
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    parentPhone: '',
    academicYear: 'third_secondary',
  });

  const deviceUuid = getDeviceUuid();

  // Load user data directly from live backend GET /users/me
  const loadProfile = async () => {
    setIsLoadingProfile(true);
    setErrorMessage(null);
    try {
      const user = await usersApi.getMe();
      if (user) {
        setProfileData(user);
        setFormData({
          fullName: user.FullName || currentUser?.name || '',
          phone: user.Phone || currentUser?.phone || '',
          parentPhone: user.ParentPhone || '',
          academicYear: user.AcademicYear || currentUser?.academicYear || 'third_secondary',
        });
      }
    } catch (err: any) {
      console.warn('[Profile] Failed to fetch /users/me:', err);
      // Fallback to existing user state if network error
      setFormData({
        fullName: currentUser?.name || '',
        phone: currentUser?.phone || '',
        parentPhone: '',
        academicYear: currentUser?.academicYear || 'third_secondary',
      });
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleLogout = async () => {
    await logout();
    if (onLogoutSuccess) onLogoutSuccess();
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanFullName = formData.fullName.trim();
    const cleanPhone = formData.phone.trim();
    const cleanParentPhone = formData.parentPhone.trim();

    if (!cleanFullName || cleanFullName.length < 3) {
      setErrorMessage('يجب أن يتكون الاسم بالكامل من 3 أحرف على الأقل.');
      return;
    }

    if (!/^01[0125][0-9]{8}$/.test(cleanPhone)) {
      setErrorMessage('يرجى إدخال رقم هاتف مصري صحيح (11 رقماً يبدأ بـ 01).');
      return;
    }

    if (cleanParentPhone && !/^01[0125][0-9]{8}$/.test(cleanParentPhone)) {
      setErrorMessage('يرجى إدخال رقم هاتف ولي أمر مصري صحيح (11 رقماً يبدأ بـ 01).');
      return;
    }

    setIsSaving(true);
    try {
      const res = await usersApi.updateMe({
        FullName: cleanFullName,
        Phone: cleanPhone,
        ParentPhone: cleanParentPhone || undefined,
        AcademicYear: formData.academicYear,
      });

      showToast(res?.message || 'تم تحديث بيانات الملف الشخصي بنجاح!', 'success');
      setIsEditing(false);
      await refreshUser();
      await loadProfile();
    } catch (err: any) {
      const backendMsg = err?.response?.data?.message || err?.message;
      setErrorMessage(backendMsg || getFriendlyErrorMessage(err, 'تعذر حفظ التعديلات، يرجى مراجعة البيانات والمحاولة مجدداً.'));
    } finally {
      setIsSaving(false);
    }
  };

  const displayName = profileData?.FullName || currentUser?.name || 'طالب المنظومة';
  const displayPhone = profileData?.Phone || currentUser?.phone || '';
  const displayParentPhone = profileData?.ParentPhone || 'غير مسجل';
  const rawAcademicYear = profileData?.AcademicYear || currentUser?.academicYear || 'third_secondary';
  const displayAcademicYear = ACADEMIC_YEAR_LABELS[rawAcademicYear as AcademicYear] || rawAcademicYear;

  if (isLoadingProfile) {
    return <LoadingSpinner message="جاري تحميل بيانات الملف الشخصي من الخادم..." />;
  }

  return (
    <div className="container fade-in-up" style={{ padding: '3.5rem 1.5rem 8rem', maxWidth: '720px', minHeight: 'calc(100vh - 350px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div className="glass-card" style={{ padding: '2.25rem', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
          <img
            src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
            alt={displayName}
            style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid var(--primary-light)', objectFit: 'cover' }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-bright)', margin: 0 }}>
                {displayName}
              </h1>
              {!isEditing && (
                <button
                  className="icon-btn"
                  onClick={() => setIsEditing(true)}
                  title="تعديل البيانات"
                  style={{ width: '28px', height: '28px' }}
                >
                  <Edit3 size={14} />
                </button>
              )}
              <span className="status-badge status-badge--active">حساب مفعل</span>
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
              رقم الهاتف: {displayPhone}
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
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
              marginBottom: '1.25rem',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Edit Form or Read-only Info Grid */}
        {isEditing ? (
          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '1.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                الاسم بالكامل (Full Name)
              </label>
              <input
                type="text"
                required
                className="input-field"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="الاسم بالكامل..."
                style={{ width: '100%', fontSize: '0.9rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                رقم الهاتف (Phone)
              </label>
              <input
                type="tel"
                required
                maxLength={11}
                className="input-field"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                placeholder="010xxxxxxxx"
                style={{ width: '100%', fontSize: '0.9rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                رقم هاتف ولي الأمر (Parent Phone)
              </label>
              <input
                type="tel"
                maxLength={11}
                className="input-field"
                value={formData.parentPhone}
                onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value.replace(/\D/g, '') })}
                placeholder="011xxxxxxxx"
                style={{ width: '100%', fontSize: '0.9rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                السنة الدراسية (Academic Year)
              </label>
              <select
                className="input-field"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                style={{ width: '100%', fontSize: '0.9rem' }}
              >
                <option value="third_secondary">الصف الثالث الثانوي</option>
                <option value="second_secondary">الصف الثاني الثانوي</option>
                <option value="first_secondary">الصف الأول الثانوي</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSaving}
                style={{ flex: 1, padding: '0.65rem', fontSize: '0.88rem', justifyContent: 'center' }}
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="spin" /> جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save size={16} /> حفظ التعديلات
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={isSaving}
                onClick={() => {
                  setIsEditing(false);
                  setErrorMessage(null);
                }}
                style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem' }}
              >
                <X size={16} /> إلغاء
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '1.75rem' }}>
            <div style={{ background: 'var(--bg-subtle)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <GraduationCap size={16} color="var(--primary-light)" />
                <span>السنة الدراسية:</span>
              </div>
              <strong style={{ fontSize: '0.9rem', color: 'var(--text-bright)' }}>
                {displayAcademicYear}
              </strong>
            </div>

            <div style={{ background: 'var(--bg-subtle)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <Phone size={16} />
                <span>رقم هاتف ولي الأمر:</span>
              </div>
              <span style={{ fontSize: '0.88rem', color: 'var(--text-bright)', direction: 'ltr' }}>
                {displayParentPhone}
              </span>
            </div>

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
        )}

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
          onPasswordChanged={() => {
            if (onPasswordChanged) {
              onPasswordChanged();
            } else {
              handleLogout();
            }
          }}
        />
      )}

      {isScratchCardOpen && (
        <ScratchCardModal
          isOpen={isScratchCardOpen}
          onClose={() => setIsScratchCardOpen(false)}
          onRedeemSuccess={(_credited, newBal) => updateBalance(newBal)}
        />
      )}
    </div>
  );
};

