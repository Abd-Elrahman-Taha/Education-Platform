import React, { useState } from 'react';
import { X, LogIn, UserPlus, Mail, Lock, User, Phone, Zap, Shield, GraduationCap, Sparkles } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth, DEMO_USERS } from '../../context/AuthContext';
import { UserRole, AcademicYear, ACADEMIC_YEAR_LABELS } from '../../types';

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
    email: DEMO_USERS.student.email,
    password: DEMO_USERS.student.defaultPassword || '',
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
      email: demo.email,
      password: demo.defaultPassword || '',
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
    const demo = DEMO_USERS[selectedRole];
    const userToLogin = {
      ...demo,
      email: formData.email || demo.email,
      name: formData.name || demo.name,
      academicYear: selectedRole === 'student' ? selectedYear : undefined,
    };
    login(userToLogin);
    showToast(
      activeTab === 'login'
        ? `مرحباً بك! تم تسجيل الدخول كـ ${userToLogin.name}`
        : `تم إنشاء حسابك بنجاح كـ ${userToLogin.name}`,
      'success'
    );
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
            className={`btn ${activeTab === 'login' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '0.55rem' }}
            onClick={() => setActiveTab('login')}
          >
            <LogIn size={16} /> تسجيل الدخول
          </button>
          <button
            className={`btn ${activeTab === 'register' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '0.55rem' }}
            onClick={() => setActiveTab('register')}
          >
            <UserPlus size={16} /> حساب طالب جديد
          </button>
        </div>

        {/* Login/Register Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* Role selector (Only 2 unified options: Student & Teacher/Admin) */}
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

          {/* Academic Year Selector for Students */}
          {selectedRole === 'student' && (
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

          {activeTab === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>الاسم بالكامل</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" required placeholder="أحمد محمد محمود" className="input-field" style={{ width: '100%', paddingRight: '38px', fontSize: '0.85rem' }} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
            </div>
          )}

          {activeTab === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>رقم الهاتف</label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="tel" required placeholder="01012345678" className="input-field" style={{ width: '100%', paddingRight: '38px', fontSize: '0.85rem' }} value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>البريد الإلكتروني</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="email" required placeholder="user.demo@edulearn.com" className="input-field" style={{ width: '100%', paddingRight: '38px', fontSize: '0.85rem' }} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>كلمة المرور</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" required placeholder="Password123!" className="input-field" style={{ width: '100%', paddingRight: '38px', fontSize: '0.85rem' }} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '0.25rem', width: '100%', padding: '0.75rem', fontSize: '0.9rem' }}>
            {activeTab === 'login' ? 'تأكيد دخول الحساب' : 'إنشاء حساب الطالب'}
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
