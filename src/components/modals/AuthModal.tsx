import React, { useState } from 'react';
import { X, LogIn, UserPlus, Lock, User, Phone, Zap, Shield, GraduationCap, AlertCircle, CreditCard } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: (role: UserRole) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { showToast } = useToast();
  const { signinApi, signupApi, login } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    nationalId: '',
    phone: '',
    parentPhone: '',
    password: '',
    confirmPassword: '',
  });

  if (!isOpen) return null;

  // Egyptian phone number: starts with 01[0125] and 11 digits total
  const validateEgyptianPhone = (p: string) => /^01[0125]\d{8}$/.test(p.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    // ── REGISTER VALIDATION ──
    if (activeTab === 'register') {
      const cleanName = formData.fullName.trim();
      const cleanNationalId = formData.nationalId.trim();
      const cleanPhone = formData.phone.trim();
      const cleanParentPhone = formData.parentPhone.trim();

      // 1. FullName: Required, 3–60 characters
      if (!cleanName) {
        setApiError('الاسم بالكامل مطلوب (Full Name is required).');
        return;
      }
      if (cleanName.length < 3 || cleanName.length > 60) {
        setApiError('يجب أن يتراوح الاسم بالكامل بين 3 إلى 60 حرفاً.');
        return;
      }

      // 2. NationalId: Required, 14 digits string (no conversion to number, preserves leading zeros)
      if (!cleanNationalId) {
        setApiError('الرقم القومي مطلوب (National ID is required).');
        return;
      }
      if (!/^\d{14}$/.test(cleanNationalId)) {
        setApiError('الرقم القومي يجب أن يتكون من 14 رقماً صحيحاً (دون مسافات أو حروف).');
        return;
      }

      // 3. Phone: Required, Egyptian phone format
      if (!cleanPhone) {
        setApiError('رقم الهاتف مطلوب (Phone is required).');
        return;
      }
      if (!validateEgyptianPhone(cleanPhone)) {
        setApiError('يرجى إدخال رقم هاتف مصري صحيح (11 رقماً يبدأ بـ 010 أو 011 أو 012 أو 015).');
        return;
      }

      // 4. ParentPhone: REQUIRED for Signup (Not optional)
      if (!cleanParentPhone) {
        setApiError('رقم هاتف ولي الأمر مطلوب للتسجيل (Parent Phone is required).');
        return;
      }
      if (!validateEgyptianPhone(cleanParentPhone)) {
        setApiError('رقم هاتف ولي الأمر غير صحيح (يجب أن يكون 11 رقماً مصرياً ويبدأ بـ 01).');
        return;
      }

      // 5. Password: Required, 8–40 characters
      if (!formData.password) {
        setApiError('كلمة المرور مطلوبة (Password is required).');
        return;
      }
      if (formData.password.length < 8 || formData.password.length > 40) {
        setApiError('يجب أن تتراوح كلمة المرور بين 8 إلى 40 حرفاً/رقماً.');
        return;
      }

      // 6. Confirm Password: Must match password
      if (formData.password !== formData.confirmPassword) {
        setApiError('كلمة المرور وتأكيد كلمة المرور غير متطابقتين.');
        return;
      }

      setIsSubmitting(true);
      try {
        await signupApi(cleanName, cleanNationalId, cleanPhone, cleanParentPhone, formData.password);
        showToast('تم إنشاء الحساب بنجاح! يرجى تسجيل الدخول بحسابك الجديد.', 'success');
        setActiveTab('login');
        setFormData((prev) => ({ ...prev, password: '', confirmPassword: '' }));
      } catch (err: any) {
        const rawStr = JSON.stringify(err?.raw || '').toLowerCase();
        const errMsg = (err?.message || '').toLowerCase();
        if (errMsg.includes('nationalid') || rawStr.includes('nationalid')) {
          setApiError(
            'تنبيه تعارض العقد (Contract Mismatch): خادم الـ Backend رفض حقل NationalId. تم إرساله كنص مطلوب وفق متطلبات التسجيل المحدثة.'
          );
        } else if (errMsg.includes('phone') && (errMsg.includes('exist') || errMsg.includes('duplicate') || err?.status === 409)) {
          setApiError('رقم الهاتف مسجل مسبقاً. يرجى تسجيل الدخول أو استخدام رقم آخر.');
        } else {
          setApiError(err?.message || 'فشل في إنشاء الحساب. يرجى التحقق من صحة البيانات.');
        }
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // ── SIGNIN VALIDATION & FLOW ──
    const cleanPhone = formData.phone.trim();
    if (!cleanPhone) {
      setApiError('يرجى إدخال رقم الهاتف المسجل.');
      return;
    }
    if (!validateEgyptianPhone(cleanPhone)) {
      setApiError('يرجى إدخال رقم هاتف مصري مسجل صحيح (11 رقماً يبدأ بـ 01).');
      return;
    }

    if (!formData.password) {
      setApiError('يرجى إدخال كلمة المرور.');
      return;
    }

    setIsSubmitting(true);
    try {
      const userRole = await signinApi(cleanPhone, formData.password);
      showToast('تم تسجيل الدخول بنجاح!', 'success');
      onClose();
      if (onLoginSuccess) onLoginSuccess(userRole);
    } catch (err: any) {
      if (err?.isForbidden || err?.status === 403) {
        setApiError('تم قفل الحساب أو تم تسجيل الدخول من جهاز آخر (Device Lock). تواصل مع الدعم الفني.');
      } else if (err?.isAuthError || err?.status === 401) {
        setApiError('بيانات الدخول غير صحيحة. تأكد من رقم الهاتف وكلمة المرور.');
      } else {
        setApiError(err?.message || 'فشل الاتصال بالخادم. يرجى المحاولة مرة أخرى.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px', padding: '1.75rem', maxHeight: '90vh', overflowY: 'auto' }}>
        <button className="modal-close" onClick={onClose}><X size={18} /></button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div style={{
            width: '52px', height: '52px',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            borderRadius: 'var(--radius-lg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 0.6rem', fontSize: '1.6rem', color: '#fff',
            boxShadow: '0 4px 18px var(--primary-glow)'
          }}>∫</div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>منصة التعلم الإلكتروني</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.25rem' }}>
            بوابة تسجيل الدخول الآمنة مع حماية قفل الجهاز (Device Lock)
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.6rem' }}>
          <button
            type="button"
            className={`btn ${activeTab === 'login' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '0.55rem' }}
            onClick={() => {
              setActiveTab('login');
              setApiError(null);
            }}
          >
            <LogIn size={16} /> تسجيل الدخول
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'register' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '0.55rem' }}
            onClick={() => {
              setActiveTab('register');
              setApiError(null);
            }}
          >
            <UserPlus size={16} /> حساب طالب جديد
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {apiError && (
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
                lineHeight: 1.5,
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{apiError}</span>
            </div>
          )}

          {/* 1. Full Name * */}
          {activeTab === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                الاسم بالكامل (Full Name) <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  required
                  placeholder="مثال: أحمد محمد محمود"
                  className="input-field"
                  style={{ width: '100%', paddingRight: '38px', fontSize: '0.85rem' }}
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* 2. National ID * (Egyptian National ID string, 14 digits, no numeric conversion) */}
          {activeTab === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                الرقم القومي (National ID) <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <CreditCard size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  maxLength={14}
                  placeholder="30101011234567 (14 رقماً)"
                  className="input-field"
                  style={{ width: '100%', paddingRight: '38px', fontSize: '0.85rem', letterSpacing: '1px' }}
                  value={formData.nationalId}
                  onChange={(e) => setFormData({ ...formData, nationalId: e.target.value.replace(/\D/g, '') })}
                />
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>
                يتم التعامل مع الرقم القومي كنص للحفاظ على الأصفار الأولى والأمان.
              </span>
            </div>
          )}

          {/* 3. Phone * */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
              رقم الهاتف (Phone) <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <Phone size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="tel"
                required
                maxLength={11}
                placeholder="01012345678"
                className="input-field"
                style={{ width: '100%', paddingRight: '38px', fontSize: '0.85rem' }}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
              />
            </div>
          </div>

          {/* 4. Parent Phone * (REQUIRED for Signup) */}
          {activeTab === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                رقم هاتف ولي الأمر (Parent Phone) <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="tel"
                  required
                  maxLength={11}
                  placeholder="01112345678"
                  className="input-field"
                  style={{ width: '100%', paddingRight: '38px', fontSize: '0.85rem' }}
                  value={formData.parentPhone}
                  onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value.replace(/\D/g, '') })}
                />
              </div>
            </div>
          )}

          {/* 5. Password * */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
              كلمة المرور (Password) <span style={{ color: 'var(--danger)' }}>*</span> {activeTab === 'register' && '(8–40 حرفاً)'}
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                required
                placeholder="••••••••"
                className="input-field"
                style={{ width: '100%', paddingRight: '38px', fontSize: '0.85rem' }}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          {/* 6. Confirm Password * */}
          {activeTab === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                تأكيد كلمة المرور <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="input-field"
                  style={{ width: '100%', paddingRight: '38px', fontSize: '0.85rem' }}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
            style={{ marginTop: '0.5rem', width: '100%', padding: '0.75rem', fontSize: '0.9rem' }}
          >
            {isSubmitting
              ? 'جاري التحقق والاتصال...'
              : activeTab === 'login'
              ? 'تأكيد تسجيل الدخول'
              : 'إنشاء حساب الطالب'}
          </button>
        </form>
      </div>
    </div>
  );
};
