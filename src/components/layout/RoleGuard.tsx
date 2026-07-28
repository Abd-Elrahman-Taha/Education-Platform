import React from 'react';
import { ShieldX, Home } from 'lucide-react';
import { UserRole, AppView } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  onNavigateHome?: () => void;
  fallbackView?: 'redirect' | 'block';
}

const ROLE_LABELS: Record<UserRole, string> = {
  student: 'طالب',
  parent: 'ولي أمر',
  admin: 'مدير النظام',
  teacher: 'معلم',
};

export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  children,
  onNavigateHome,
  fallbackView = 'block',
}) => {
  const { currentUser, isAuthenticated } = useAuth();

  // Not logged in at all
  if (!isAuthenticated || !currentUser) {
    return (
      <div className="role-guard-wall">
        <div className="glass-card role-guard-card">
          <div className="role-guard-icon">
            <ShieldX size={48} />
          </div>
          <h2 className="role-guard-title">تسجيل الدخول مطلوب</h2>
          <p className="role-guard-desc">
            يجب تسجيل الدخول للوصول إلى هذه الصفحة.
          </p>
          {onNavigateHome && (
            <button className="btn btn-primary" onClick={onNavigateHome}>
              <Home size={18} /> العودة للرئيسية
            </button>
          )}
        </div>
      </div>
    );
  }

  // Logged in but wrong role
  if (!allowedRoles.includes(currentUser.role)) {
    return (
      <div className="role-guard-wall">
        <div className="glass-card role-guard-card">
          <div className="role-guard-icon role-guard-icon--denied">
            <ShieldX size={48} />
          </div>
          <h2 className="role-guard-title">وصول مقيد</h2>
          <p className="role-guard-desc">
            حسابك كـ <strong className="role-badge role-badge--{currentUser.role}">{ROLE_LABELS[currentUser.role]}</strong> لا يملك صلاحية الوصول لهذه الصفحة.
          </p>
          <p className="role-guard-sub">
            هذه الصفحة متاحة فقط لـ: {allowedRoles.map(r => ROLE_LABELS[r]).join(' / ')}
          </p>
          {onNavigateHome && (
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={onNavigateHome}>
              <Home size={18} /> العودة للرئيسية
            </button>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
