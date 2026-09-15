import React, { useState } from 'react';
import { X, LogIn, UserPlus, Lock, User, Phone, Zap, Shield, GraduationCap, AlertCircle, CreditCard, Check, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { EducationStage } from '../../types/api.types';
import { EDUCATION_STAGES } from '../../constants/education';
import { getFriendlyErrorMessage } from '../../utils/errors';

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
    educationStage: 'Secondary' as EducationStage,
    grade: '3',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Real-time password requirement evaluations for Sign Up
  const passwordVal = formData.password || '';
  const confirmPasswordVal = formData.confirmPassword || '';

  const passwordRequirements = [
    {
      id: 'length',
      label: '8 أحرف أو أرقام على الأقل (8–40 حرفاً)',
      isValid: passwordVal.length >= 8 && passwordVal.length <= 40,
    },
    {
      id: 'letter',
      label: 'تحتوي على حرف إنجليزي واحد على الأقل (a-z أو A-Z)',
      isValid: /[a-zA-Z]/.test(passwordVal),
    },
    {
      id: 'number',
      label: 'تحتوي على رقم واحد على الأقل (0-9)',
      isValid: /[0-9]/.test(passwordVal),
    },
  ];

  const isConfirmMatch = confirmPasswordVal.length > 0 && passwordVal === confirmPasswordVal;

  if (!isOpen) return null;

  const validateEgyptianPhone = (phone: string): boolean => {
    return /^01[0125][0-9]{8}$/.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    // ── SIGNUP VALIDATION & FLOW ──
    if (activeTab === 'register') {
      const cleanName = formData.fullName.trim();
      const cleanNationalId = formData.nationalId.trim();
      const cleanPhone = formData.phone.trim();
      const cleanParentPhone = formData.parentPhone.trim();

      // 1. FullName: Required, 3–60 characters
      if (!cleanName) {
        setApiError('يرجى إدخال الاسم بالكامل.');
        return;
      }
      if (cleanName.length < 3 || cleanName.length > 60) {
        setApiError('يجب أن يتراوح الاسم بالكامل بين 3 إلى 60 حرفاً.');
        return;
      }

      // 2. NationalId: Required, 14 digits string
      if (!cleanNationalId) {
        setApiError('يرجى إدخال الرقم القومي.');
        return;
      }
      if (!/^\d{14}$/.test(cleanNationalId)) {
        setApiError('الرقم القومي يجب أن يتكون من 14 رقماً صحيحاً (دون مسافات أو حروف).');
        return;
      }

      // 3. Phone: Required, Egyptian phone format
      if (!cleanPhone) {
        setApiError('يرجى إدخال رقم الهاتف.');
        return;
      }
      if (!validateEgyptianPhone(cleanPhone)) {
        setApiError('يرجى إدخال رقم هاتف مصري صحيح (11 رقماً يبدأ بـ 010 أو 011 أو 012 أو 015).');
        return;
      }

      // 4. ParentPhone: REQUIRED for Signup
      if (!cleanParentPhone) {
        setApiError('يرجى إدخال رقم هاتف ولي الأمر.');
        return;
      }
      if (!validateEgyptianPhone(cleanParentPhone)) {
        setApiError('رقم هاتف ولي الأمر غير صحيح (يجب أن يكون 11 رقماً مصرياً ويبدأ بـ 01).');
        return;
      }

      // 5. Password: Required, 8–40 characters, at least one letter, at least one number
      if (!formData.password) {
        setApiError('يرجى إدخال كلمة المرور.');
        return;
      }
      if (formData.password.length < 8 || formData.password.length > 40) {
        setApiError('يجب أن تتراوح كلمة المرور بين 8 إلى 40 حرفاً أو رقماً.');
        return;
      }
      if (!/[a-zA-Z]/.test(formData.password)) {
        setApiError('يجب أن تحتوي كلمة المرور على حرف إنجليزي واحد على الأقل (a-z أو A-Z).');
        return;
      }
      if (!/[0-9]/.test(formData.password)) {
        setApiError('يجب أن تحتوي كلمة المرور على رقم واحد على الأقل (0-9).');
        return;
      }

      // 6. Confirm Password: Must match password
      if (formData.password !== formData.confirmPassword) {
        setApiError('كلمة المرور وتأكيد كلمة المرور غير متطابقتين.');
        return;
      }

      setIsSubmitting(true);
      try {
        await signupApi(
          cleanName,
          cleanNationalId,
          cleanPhone,
          cleanParentPhone,
          formData.password,
          formData.educationStage,
          formData.grade
        );
        showToast('تم إنشاء الحساب بنجاح! يرجى تسجيل الدخول بحسابك الجديد.', 'success');
        setActiveTab('login');
        setFormData((prev) => ({ ...prev, password: '', confirmPassword: '' }));
      } catch (err: any) {
        console.error('[AuthModal] Signup error details:', err?.raw || err?.response?.data || err);
        const rawData = err?.raw || err?.response?.data || {};
        const rawStr = JSON.stringify(rawData).toLowerCase();
        const specificBackendMsg =
          err?.backendMessage ||
          rawData?.message ||
          rawData?.error ||
          (typeof rawData === 'string' ? rawData : '') ||
          err?.rawMessage;

        if (rawStr.includes('phone') && (rawStr.includes('exist') || rawStr.includes('duplicate') || err?.status === 409)) {
          setApiError('رقم الهاتف مسجل مسبقاً. يرجى تسجيل الدخول أو استخدام رقم آخر.');
        } else if (rawStr.includes('nationalid') && (rawStr.includes('exist') || rawStr.includes('duplicate'))) {
          setApiError('الرقم القومي مسجل مسبقاً لمستخدم آخر.');
        } else if (rawStr.includes('nationalid')) {
          setApiError('يرجى التأكد من صحة الرقم القومي (14 رقماً) والمحاولة مرة أخرى.');
        } else if (specificBackendMsg && typeof specificBackendMsg === 'string' && specificBackendMsg.trim().length > 0) {
          setApiError(specificBackendMsg);
        } else {
          setApiError(getFriendlyErrorMessage(err, 'تعذر إنشاء الحساب، يرجى مراجعة البيانات والمحاولة مرة أخرى.'));
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
        setApiError('تم تسجيل الدخول من جهاز آخر أو الحساب غير متاح حالياً. يرجى التواصل مع إدارة المنصة.');
      } else if (err?.isAuthError || err?.status === 401) {
        setApiError('بيانات الدخول غير صحيحة. تأكد من رقم الهاتف وكلمة المرور.');
      } else {
        setApiError(getFriendlyErrorMessage(err, 'تعذر تسجيل الدخول، يرجى التحقق من صحة البيانات والمحاولة مرة أخرى.'));
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

          {/* 5. Education Stage & Grade (Required for Signup) */}
          {activeTab === 'register' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                  المرحلة التعليمية (Stage) <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <GraduationCap size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <select
                    className="input-field"
                    style={{ width: '100%', paddingRight: '36px', fontSize: '0.85rem' }}
                    value={formData.educationStage}
                    onChange={(e) => {
                      const newStage = e.target.value as EducationStage;
                      const stageDef = EDUCATION_STAGES.find((s) => s.key === newStage);
                      const defaultGrade = stageDef?.grades[0]?.value || '1';
                      setFormData({ ...formData, educationStage: newStage, grade: defaultGrade });
                    }}
                  >
                    {EDUCATION_STAGES.map((stage) => (
                      <option key={stage.key} value={stage.key}>
                        {stage.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                  الصف الدراسي (Grade) <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <select
                  className="input-field"
                  style={{ width: '100%', fontSize: '0.85rem' }}
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                >
                  {EDUCATION_STAGES.find((s) => s.key === formData.educationStage)?.grades.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* 5. Password * */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
              كلمة المرور (Password) <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                className="input-field"
                style={{
                  width: '100%',
                  paddingRight: '38px',
                  paddingLeft: '38px',
                  fontSize: '0.85rem',
                  borderColor:
                    activeTab === 'register' && passwordVal.length > 0
                      ? passwordRequirements.every((r) => r.isValid)
                        ? 'rgba(16, 185, 129, 0.6)'
                        : 'rgba(239, 68, 68, 0.6)'
                      : undefined,
                  boxShadow:
                    activeTab === 'register' && passwordVal.length > 0
                      ? passwordRequirements.every((r) => r.isValid)
                        ? '0 0 8px rgba(16, 185, 129, 0.25)'
                        : '0 0 8px rgba(239, 68, 68, 0.2)'
                      : undefined,
                  transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
                }}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
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
                title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Password Requirements Checklist (Under Enter Password) */}
            {activeTab === 'register' && (
              <div
                style={{
                  marginTop: '0.65rem',
                  padding: '0.65rem 0.75rem',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-glass)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.1rem' }}>
                  شروط كلمة المرور المطلوبة:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {passwordRequirements.map((req) => (
                    <div
                      key={req.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.78rem',
                        padding: '0.35rem 0.6rem',
                        borderRadius: '6px',
                        fontWeight: 600,
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        background: req.isValid ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.1)',
                        border: req.isValid
                          ? '1px solid rgba(16, 185, 129, 0.5)'
                          : '1px solid rgba(239, 68, 68, 0.5)',
                        color: req.isValid ? '#10B981' : '#EF4444',
                        boxShadow: req.isValid
                          ? '0 0 10px rgba(16, 185, 129, 0.35)'
                          : '0 0 10px rgba(239, 68, 68, 0.25)',
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: req.isValid ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)',
                          flexShrink: 0,
                          transition: 'background 0.25s ease',
                        }}
                      >
                        {req.isValid ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
                      </span>
                      <span>{req.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  className="input-field"
                  style={{
                    width: '100%',
                    paddingRight: '38px',
                    paddingLeft: '38px',
                    fontSize: '0.85rem',
                    borderColor:
                      confirmPasswordVal.length > 0
                        ? isConfirmMatch
                          ? 'rgba(16, 185, 129, 0.6)'
                          : 'rgba(239, 68, 68, 0.6)'
                        : undefined,
                    boxShadow:
                      confirmPasswordVal.length > 0
                        ? isConfirmMatch
                          ? '0 0 8px rgba(16, 185, 129, 0.25)'
                          : '0 0 8px rgba(239, 68, 68, 0.2)'
                        : undefined,
                    transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
                  }}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                  title={showConfirmPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Confirm Password Matching Requirement */}
              <div
                style={{
                  marginTop: '0.45rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.78rem',
                  padding: '0.35rem 0.6rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: isConfirmMatch ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.1)',
                  border: isConfirmMatch
                    ? '1px solid rgba(16, 185, 129, 0.5)'
                    : '1px solid rgba(239, 68, 68, 0.5)',
                  color: isConfirmMatch ? '#10B981' : '#EF4444',
                  boxShadow: isConfirmMatch
                    ? '0 0 10px rgba(16, 185, 129, 0.35)'
                    : '0 0 10px rgba(239, 68, 68, 0.25)',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: isConfirmMatch ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)',
                    flexShrink: 0,
                    transition: 'background 0.25s ease',
                  }}
                >
                  {isConfirmMatch ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
                </span>
                <span>
                  {isConfirmMatch ? 'كلمتا المرور متطابقتان' : 'يجب تطابق كلمتي المرور'}
                </span>
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
