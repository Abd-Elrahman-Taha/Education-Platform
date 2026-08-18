import React, { useState } from 'react';
import { X, LogIn, UserPlus, Mail, Lock, User, Phone, Zap, Shield, GraduationCap, Sparkles, ShieldCheck, CreditCard } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth, DEMO_USERS } from '../../context/AuthContext';
import { UserRole, AcademicYear, ACADEMIC_YEAR_LABELS, User as UserType } from '../../types';
import { mockDB } from '../../services/db';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: (role: UserRole) => void;
}

type AuthRole = 'student' | 'admin';

const ROLE_OPTIONS: { value: AuthRole; label: string; desc: string; icon: React.ElementType }[] = [
  { value: 'student', label: 'طالب (Student)', desc: 'دروس تفاعلية، امتحانات بابل شيت ومساعد AI', icon: GraduationCap },
  { value: 'admin', label: 'معلم / مدير النظام (Teacher & Admin)', desc: 'إدارة المحتوى، تقارير الطلاب، نشر الدروس والتحكم الشامل', icon: Shield },
];

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [selectedRole, setSelectedRole] = useState<AuthRole>('student');
  const [selectedYear, setSelectedYear] = useState<AcademicYear>('third_secondary');
  const { showToast } = useToast();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    nationalId: '',
    password: '',
    confirmPassword: '',
    email: '',
  });

  if (!isOpen) return null;

  const handleSelectRole = (role: AuthRole) => {
    setSelectedRole(role);
    const demo = DEMO_USERS[role];
    setFormData(prev => ({
      ...prev,
      email: demo.email,
      password: demo.defaultPassword || '',
    }));
  };

  const handleQuickDemoLogin = (role: AuthRole) => {
    const demo = DEMO_USERS[role];
    setSelectedRole(role);
    setFormData({
      name: demo.name,
      phone: demo.phone,
      nationalId: demo.nationalId || '',
      email: demo.email,
      password: demo.defaultPassword || '',
      confirmPassword: demo.defaultPassword || '',
    });
    login(demo);
    showToast(`تم الدخول بنجاح كـ (${demo.name}) - ${role === 'admin' ? 'معلم ومدير النظام' : 'طالب'}`, 'success');
    onClose();
    if (onLoginSuccess) {
      onLoginSuccess(role);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // ── REGISTER VALIDATION & FLOW ──
    if (activeTab === 'register') {
      const cleanName = formData.name.trim();
      if (!cleanName) {
        showToast('يرجى إدخال اسم المستخدم / الاسم بالكامل', 'danger');
        return;
      }

      const cleanPhone = formData.phone.trim();
      if (!cleanPhone || !/^01[0125]\d{8}$/.test(cleanPhone)) {
        showToast('يرجى إدخال رقم هاتف صحيح (11 رقماً يبدأ بـ 010 أو 011 أو 012 أو 015)', 'danger');
        return;
      }

      const cleanNationalId = formData.nationalId.trim();
      if (!cleanNationalId || !/^[23]\d{13}$/.test(cleanNationalId)) {
        showToast('يجب أن يتكون الرقم القومي من 14 رقماً صحيحاً (مثال: 30501011234567)', 'danger');
        return;
      }

      if (!formData.password || formData.password.length < 6) {
        showToast('يجب ألا تقل كلمة المرور عن 6 أحرف أو أرقام', 'danger');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        showToast('كلمة المرور وتأكيد كلمة المرور غير متطابقتين', 'danger');
        return;
      }

      // Add student record to mockDB database
      const newStudentCode = `CODE-${Math.floor(10000 + Math.random() * 90000)}`;
      mockDB.addStudent({
        code: newStudentCode,
        nationalId: cleanNationalId,
        name: cleanName,
        email: formData.email.trim() || `${cleanPhone}@syntaxmath.com`,
        phone: cleanPhone,
        parentPhone: cleanPhone,
        academicYear: selectedYear,
        status: 'active',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
        hasAccess: true,
        assignedLessonIds: [],
        averageScore: 0,
        attendanceRate: 100,
      });

      const registeredUser: UserType = {
        id: `std-${Date.now()}`,
        name: cleanName,
        phone: cleanPhone,
        nationalId: cleanNationalId,
        email: formData.email.trim() || `${cleanPhone}@syntaxmath.com`,
        role: 'student',
        status: 'active',
        academicYear: selectedYear,
        registrationDate: new Date().toISOString().slice(0, 10),
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
      };

      login(registeredUser);
      showToast(`تم إنشاء حساب الطالب بنجاح! كودك الأكاديمي: ${newStudentCode}`, 'success');
      onClose();
      if (onLoginSuccess) {
        onLoginSuccess('student');
      }
      return;
    }

    // ── LOGIN FLOW ──
    const demo = DEMO_USERS[selectedRole];
    const userToLogin: UserType = {
      ...demo,
      email: formData.email || demo.email,
      name: formData.name || demo.name,
      academicYear: selectedRole === 'student' ? selectedYear : undefined,
    };
    login(userToLogin);
    showToast(`مرحباً بك! تم تسجيل الدخول كـ ${userToLogin.name}`, 'success');
    onClose();
    if (onLoginSuccess) {
      onLoginSuccess(selectedRole);
    }
  };

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '540px' }}>
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
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>Syntax Math Platform</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.25rem' }}>بوابة التعلم والإدارة المتخصصة في التفاضل والهندسة الفراغية</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.6rem' }}>
          <button
            type="button"
            className={`btn ${activeTab === 'login' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '0.55rem' }}
            onClick={() => setActiveTab('login')}
          >
            <LogIn size={16} /> تسجيل الدخول
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'register' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '0.55rem' }}
            onClick={() => {
              setActiveTab('register');
              setSelectedRole('student');
            }}
          >
            <UserPlus size={16} /> حساب طالب جديد
          </button>
        </div>

        {/* Login/Register Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* Role selector (Login tab only) */}
          {activeTab === 'login' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>نوع الحساب (Account Role)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                {ROLE_OPTIONS.map(opt => {
                  const IconComp = opt.icon;
                  const isSel = selectedRole === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelectRole(opt.value)}
                      style={{
                        padding: '0.75rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        border: isSel ? '2px solid var(--primary-light)' : '1px solid var(--border-glass)',
                        background: isSel ? 'rgba(8,145,178,0.16)' : 'var(--bg-surface)',
                        color: isSel ? 'var(--primary-light)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s',
                        fontFamily: 'inherit',
                      }}
                    >
                      <IconComp size={20} style={{ margin: '0 auto 0.35rem', display: 'block' }} />
                      <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{opt.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Academic Year Selector for Students */}
          {(selectedRole === 'student' || activeTab === 'register') && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                السنة الدراسية (Academic Year)
              </label>
              <select
                className="input-field"
                style={{ width: '100%', fontSize: '0.85rem' }}
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value as AcademicYear)}
              >
                <option value="first_secondary">{ACADEMIC_YEAR_LABELS.first_secondary}</option>
                <option value="second_secondary">{ACADEMIC_YEAR_LABELS.second_secondary}</option>
                <option value="third_secondary">{ACADEMIC_YEAR_LABELS.third_secondary}</option>
              </select>
            </div>
          )}

          {/* ── REGISTER FIELDS IN EXACT ORDER: 1. Username → 2. Phone → 3. National ID → 4. Password → 5. Confirm Password ── */}
          {activeTab === 'register' ? (
            <>
              {/* 1. Username */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                  1. اسم المستخدم / الاسم بالكامل
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    required
                    placeholder="مثال: أحمد محمد محمود"
                    className="input-field"
                    style={{ width: '100%', paddingRight: '38px', fontSize: '0.85rem' }}
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>

              {/* 2. Phone Number */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                  2. رقم الهاتف (Phone Number)
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
                    onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                  />
                </div>
              </div>

              {/* 3. National ID (Directly after Phone Number) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                  3. الرقم القومي (National ID — 14 رقماً)
                </label>
                <div style={{ position: 'relative' }}>
                  <ShieldCheck size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    required
                    maxLength={14}
                    placeholder="مثال: 30501011234567"
                    className="input-field"
                    style={{ width: '100%', paddingRight: '38px', fontSize: '0.85rem', letterSpacing: '1px' }}
                    value={formData.nationalId}
                    onChange={e => setFormData({ ...formData, nationalId: e.target.value.replace(/\D/g, '') })}
                  />
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>
                  🔒 الرقم القومي محمي تماماً ولا يُعرض علناً؛ يُستخدم للتحقق ومتابعة ولي الأمر فقط.
                </span>
              </div>

              {/* 4. Password */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                  4. كلمة المرور (Password)
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
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>

              {/* 5. Confirm Password */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                  5. تأكيد كلمة المرور (Confirm Password)
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
                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                  />
                </div>
              </div>
            </>
          ) : (
            /* LOGIN FIELDS */
            <>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>البريد الإلكتروني أو الهاتف</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    required
                    placeholder="student.demo@edulearn.com"
                    className="input-field"
                    style={{ width: '100%', paddingRight: '38px', fontSize: '0.85rem' }}
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>كلمة المرور</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="input-field"
                    style={{ width: '100%', paddingRight: '38px', fontSize: '0.85rem' }}
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%', padding: '0.75rem', fontSize: '0.9rem' }}>
            {activeTab === 'login' ? 'تأكيد دخول الحساب' : 'إنشاء وتأكيد حساب الطالب'}
          </button>
        </form>

        {/* DEMO ACCOUNTS QUICK LOGIN SECTION */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px dashed var(--border-glass)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.65rem' }}>
            <Zap size={15} color="var(--accent)" />
            <strong style={{ fontSize: '0.82rem', color: 'var(--text-bright)' }}>حسابات التجربة السريعة (Demo Accounts):</strong>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '0.65rem 0.75rem', fontSize: '0.8rem', flexDirection: 'column', alignItems: 'center', textAlign: 'center', border: '1px solid rgba(16,185,129,0.35)' }}
              onClick={() => handleQuickDemoLogin('student')}
            >
              <GraduationCap size={18} color="#10B981" />
              <div style={{ fontWeight: 800, color: '#10B981', marginTop: '0.25rem' }}>طالب (Student)</div>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '0.65rem 0.75rem', fontSize: '0.8rem', flexDirection: 'column', alignItems: 'center', textAlign: 'center', border: '1px solid rgba(34,211,238,0.35)' }}
              onClick={() => handleQuickDemoLogin('admin')}
            >
              <Shield size={18} color="#22D3EE" />
              <div style={{ fontWeight: 800, color: '#22D3EE', marginTop: '0.25rem' }}>معلم / مدير (Teacher & Admin)</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
