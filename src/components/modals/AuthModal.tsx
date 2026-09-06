import React, { useState } from 'react';
import { X, LogIn, UserPlus, Lock, User, Phone, Zap, Shield, GraduationCap, AlertCircle, Smartphone } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth, DEMO_USERS } from '../../context/AuthContext';
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
    phone: '',
    parentPhone: '',
    password: '',
    confirmPassword: '',
  });

  if (!isOpen) return null;

  const validateEgyptianPhone = (p: string) => /^01[0125]\d{8}$/.test(p.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    // ── REGISTER VALIDATION ──
    if (activeTab === 'register') {
      const cleanName = formData.fullName.trim();
      if (cleanName.length < 3 || cleanName.length > 60) {
        setApiError('يجب أن يتراوح الاسم بالكامل بين 3 إلى 60 حرفاً.');
        return;
      }

      if (!validateEgyptianPhone(formData.phone)) {
        setApiError('يرجى إدخال رقم هاتف مصري صحيح (11 رقماً يبدأ بـ 010 أو 011 أو 012 أو 015).');
        return;
      }

      if (formData.parentPhone && !validateEgyptianPhone(formData.parentPhone)) {
        setApiError('رقم هاتف ولي الأمر غير صحيح (يجب أن يكون 11 رقماً ويبدأ بـ 01).');
        return;
      }

      if (formData.password.length < 8 || formData.password.length > 40) {
        setApiError('يجب أن تتراوح كلمة المرور بين 8 إلى 40 حرفاً/رقماً.');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setApiError('كلمة المرور وتأكيد كلمة المرور غير متطابقتين.');
        return;
      }

      setIsSubmitting(true);
      try {
        await signupApi(cleanName, formData.phone, formData.password, formData.parentPhone || undefined);
        showToast('تم إنشاء الحساب بنجاح! مرحباً بك في المنصة التعليمية.', 'success');
        onClose();
        if (onLoginSuccess) onLoginSuccess('student');
      } catch (err: any) {
        setApiError(err?.message || 'فشل في إنشاء الحساب. يرجى التحقق من صحة البيانات.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // ── SIGNIN VALIDATION & FLOW ──
    if (!validateEgyptianPhone(formData.phone)) {
      setApiError('يرجى إدخال رقم هاتف مصري مسجل صحيح (11 رقماً يبدأ بـ 01).');
      return;
    }

    if (!formData.password) {
      setApiError('يرجى إدخال كلمة المرور.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signinApi(formData.phone, formData.password);
      showToast('تم تسجيل الدخول بنجاح!', 'success');
      onClose();
      if (onLoginSuccess) onLoginSuccess('student');
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

  const handleQuickDemoLogin = (role: 'student' | 'admin') => {
    const demo = DEMO_USERS[role];
    login(demo);
    showToast(`تم الدخول كـ (${demo.name}) - حساب تجريبي`, 'success');
    onClose();
    if (onLoginSuccess) onLoginSuccess(role === 'admin' ? 'admin' : 'student');
  };

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', padding: '1.75rem' }}>
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

          {activeTab === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                1. الاسم بالكامل (3–60 حرفاً)
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

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
              رقم الهاتف المحمول (11 رقماً يبدأ بـ 01)
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

          {activeTab === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                رقم هاتف ولي الأمر (اختياري)
              </label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="tel"
                  maxLength={11}
                  placeholder="01123456789"
                  className="input-field"
                  style={{ width: '100%', paddingRight: '38px', fontSize: '0.85rem' }}
                  value={formData.parentPhone}
                  onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value.replace(/\D/g, '') })}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
              كلمة المرور {activeTab === 'register' && '(8–40 حرفاً)'}
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

          {activeTab === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                تأكيد كلمة المرور
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

        {/* Demo Login Quick Shortcut */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px dashed var(--border-glass)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.65rem' }}>
            <Zap size={14} color="var(--accent)" />
            <strong style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>حسابات تجريبية سريعة (Demo):</strong>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '0.55rem', fontSize: '0.8rem', justifyContent: 'center' }}
              onClick={() => handleQuickDemoLogin('student')}
            >
              <GraduationCap size={16} color="#10B981" /> طالب تجريبي
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '0.55rem', fontSize: '0.8rem', justifyContent: 'center' }}
              onClick={() => handleQuickDemoLogin('admin')}
            >
              <Shield size={16} color="#22D3EE" /> معلم / مدير
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
