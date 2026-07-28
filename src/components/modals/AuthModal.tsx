import React, { useState } from 'react';
import { X, LogIn, UserPlus, Mail, Lock, User, Phone, Zap, Shield, GraduationCap, Users, UserCheck } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth, DEMO_USERS } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ROLE_OPTIONS: { value: UserRole; label: string; desc: string }[] = [
  { value: 'student', label: 'طالب (Student)', desc: 'دروس وامتحانات ومساعد AI' },
  { value: 'parent', label: 'ولي أمر (Parent)', desc: 'متابعة أداء الطالب والتقارير' },
  { value: 'teacher', label: 'معلم (Teacher)', desc: 'إدارة المحاضرات والامتحانات' },
  { value: 'admin', label: 'مدير (Admin)', desc: 'لوحة تحكم وإدارة المستخدمين' },
];

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const { showToast } = useToast();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: DEMO_USERS.student.email,
    password: DEMO_USERS.student.defaultPassword || '',
  });

  if (!isOpen) return null;

  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    const demo = DEMO_USERS[role];
    setFormData(prev => ({
      ...prev,
      email: demo.email,
      password: demo.defaultPassword || '',
    }));
  };

  const handleQuickDemoLogin = (role: UserRole) => {
    const demo = DEMO_USERS[role];
    setSelectedRole(role);
    setFormData({
      name: demo.name,
      phone: demo.phone,
      email: demo.email,
      password: demo.defaultPassword || '',
    });
    login(demo);
    showToast(`تم الدخول التلقائي كـ (${demo.name}) - دور ${role.toUpperCase()}`, 'success');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const demo = DEMO_USERS[selectedRole];
    const userToLogin = {
      ...demo,
      email: formData.email || demo.email,
      name: formData.name || demo.name,
    };
    login(userToLogin);
    showToast(
      activeTab === 'login'
        ? `مرحباً بك! تم الدخول بنجاح كـ ${userToLogin.name}`
        : `تم إنشاء حسابك بنجاح كـ ${userToLogin.name}`,
      'success'
    );
    onClose();
  };

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '620px' }}>
        <button className="modal-close" onClick={onClose}><X size={18} /></button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: '54px', height: '54px',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            borderRadius: 'var(--radius-lg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 0.75rem', fontSize: '1.8rem', color: '#fff',
            boxShadow: '0 4px 18px var(--primary-glow)'
          }}>∫</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-bright)' }}>Syntax Math Platform</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>منصة التفاضل والتكامل والهندسة الفراغية</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
          <button
            className={`btn ${activeTab === 'login' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1 }}
            onClick={() => setActiveTab('login')}
          >
            <LogIn size={17} /> تسجيل الدخول
          </button>
          <button
            className={`btn ${activeTab === 'register' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1 }}
            onClick={() => setActiveTab('register')}
          >
            <UserPlus size={17} /> حساب جديد
          </button>
        </div>

        {/* Login/Register Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Role selector buttons */}
          <div>
            <label style={{ display: 'block', fontSize: '0.83rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>اختيار نوع الحساب (Role)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {ROLE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelectRole(opt.value)}
                  style={{
                    padding: '0.6rem 0.8rem',
                    borderRadius: 'var(--radius-md)',
                    border: selectedRole === opt.value ? '2px solid var(--primary-light)' : '1px solid var(--border-glass)',
                    background: selectedRole === opt.value ? 'rgba(8,145,178,0.14)' : 'var(--bg-surface)',
                    color: selectedRole === opt.value ? 'var(--primary-light)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    textAlign: 'right',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{opt.label}</div>
                  <div style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: '0.1rem' }}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.83rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>الاسم بالكامل</label>
              <div style={{ position: 'relative' }}>
                <User size={17} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" required placeholder="أحمد محمد محمود" className="input-field" style={{ width: '100%', paddingRight: '40px' }} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
            </div>
          )}

          {activeTab === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.83rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>رقم الهاتف</label>
              <div style={{ position: 'relative' }}>
                <Phone size={17} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="tel" required placeholder="01012345678" className="input-field" style={{ width: '100%', paddingRight: '40px' }} value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.83rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>البريد الإلكتروني</label>
            <div style={{ position: 'relative' }}>
              <Mail size={17} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="email" required placeholder="user.demo@edulearn.com" className="input-field" style={{ width: '100%', paddingRight: '40px' }} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.83rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>كلمة المرور</label>
            <div style={{ position: 'relative' }}>
              <Lock size={17} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" required placeholder="Password123!" className="input-field" style={{ width: '100%', paddingRight: '40px' }} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '0.25rem', width: '100%', padding: '0.85rem' }}>
            {activeTab === 'login' ? 'تأكيد دخول الحساب' : 'إنشاء الحساب الجديد'}
          </button>
        </form>

        {/* DEMO ACCOUNTS QUICK LOGIN SECTION */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px dashed var(--border-glass)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <Zap size={16} color="var(--accent)" />
            <strong style={{ fontSize: '0.88rem', color: 'var(--text-bright)' }}>حسابات التجربة السريعة (Demo Accounts):</strong>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '0.55rem 0.75rem', fontSize: '0.78rem', justifyContent: 'flex-start', border: '1px solid rgba(16,185,129,0.35)' }}
              onClick={() => handleQuickDemoLogin('student')}
            >
              <GraduationCap size={15} color="#10B981" />
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: '#10B981' }}>Login as Student</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>student.demo@edulearn.com</div>
              </div>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '0.55rem 0.75rem', fontSize: '0.78rem', justifyContent: 'flex-start', border: '1px solid rgba(245,158,11,0.35)' }}
              onClick={() => handleQuickDemoLogin('parent')}
            >
              <Users size={15} color="#F59E0B" />
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: '#F59E0B' }}>Login as Parent</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>parent.demo@edulearn.com</div>
              </div>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '0.55rem 0.75rem', fontSize: '0.78rem', justifyContent: 'flex-start', border: '1px solid rgba(34,211,238,0.35)' }}
              onClick={() => handleQuickDemoLogin('teacher')}
            >
              <UserCheck size={15} color="#22D3EE" />
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: '#22D3EE' }}>Login as Teacher</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>teacher.demo@edulearn.com</div>
              </div>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '0.55rem 0.75rem', fontSize: '0.78rem', justifyContent: 'flex-start', border: '1px solid rgba(239,68,68,0.35)' }}
              onClick={() => handleQuickDemoLogin('admin')}
            >
              <Shield size={15} color="#EF4444" />
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: '#EF4444' }}>Login as Admin</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>admin.demo@edulearn.com</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
