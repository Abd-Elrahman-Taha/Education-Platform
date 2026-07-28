import React, { useState } from 'react';
import {
  Sliders, Search, Users, TrendingUp, DollarSign, Activity,
  Edit2, Trash2, Ban, Shield, ShieldOff, CheckCircle2, XCircle,
  ArrowUp, ArrowDown, UserCheck, Plus, UserPlus
} from 'lucide-react';
import { User, UserRole } from '../../types';
import { useToast } from '../../context/ToastContext';

const ROLE_LABELS: Record<UserRole, string> = {
  student: 'طالب (Student)',
  parent:  'ولي أمر (Parent)',
  admin:   'مدير (Admin)',
  teacher: 'معلم (Teacher)',
};

const initialUsers: User[] = [
  { id: 'u1', name: 'أحمد طالب (طالب)', email: 'student.demo@edulearn.com', phone: '01012345678', role: 'student', status: 'active', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80', registrationDate: '2026-01-15' },
  { id: 'u2', name: 'محمود عبد الله (ولي أمر)', email: 'parent.demo@edulearn.com', phone: '01198765432', role: 'parent', status: 'active', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80', registrationDate: '2026-01-20' },
  { id: 'u3', name: 'أ. د. محمد الشريف (معلم)', email: 'teacher.demo@edulearn.com', phone: '01055544332', role: 'teacher', status: 'active', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80', registrationDate: '2025-09-15' },
  { id: 'u4', name: 'المهندس طارق (مدير النظام)', email: 'admin.demo@edulearn.com', phone: '01000000001', role: 'admin', status: 'active', avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=100&q=80', registrationDate: '2025-09-01' },
  { id: 'u5', name: 'مريم إبراهيم حسن', email: 'maryam@edulearn.com', phone: '01599887766', role: 'student', status: 'active', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80', registrationDate: '2026-01-18' },
  { id: 'u6', name: 'مصطفى حسين مصطفى', email: 'mostafa@edulearn.com', phone: '01122334455', role: 'student', status: 'blocked', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80', registrationDate: '2026-02-01' },
  { id: 'u7', name: 'د. سارة عبد الفتاح', email: 'sara.math@edulearn.com', phone: '01211223344', role: 'teacher', status: 'active', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80', registrationDate: '2025-10-10' },
];

const enrollmentData = [
  { month: 'يناير', value: 45 },
  { month: 'فبراير', value: 62 },
  { month: 'مارس', value: 88 },
  { month: 'أبريل', value: 75 },
  { month: 'مايو', value: 110 },
  { month: 'يونيو', value: 95 },
  { month: 'يوليو', value: 130 },
];

const maxVal = Math.max(...enrollmentData.map(d => d.value));

export const AdminView: React.FC = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const stats = [
    { label: 'إجمالي المستخدمين', value: users.length, icon: Users, color: '#22D3EE', bg: 'rgba(34,211,238,.12)', delta: '+15%', up: true },
    { label: 'الطلاب النشطين', value: users.filter(u => u.role === 'student' && u.status === 'active').length, icon: TrendingUp, color: '#10B981', bg: 'rgba(16,185,129,.12)', delta: '+10%', up: true },
    { label: 'إيرادات الشهر (ج.م)', value: '34,500', icon: DollarSign, color: '#F59E0B', bg: 'rgba(245,158,11,.12)', delta: '+22%', up: true },
    { label: 'سجلات اليوم', value: 42, icon: Activity, color: '#EF4444', bg: 'rgba(239,68,68,.12)', delta: '+5%', up: true },
  ];

  const roleDist: { role: UserRole; color: string }[] = [
    { role: 'student', color: '#10B981' },
    { role: 'parent', color: '#F59E0B' },
    { role: 'teacher', color: '#22D3EE' },
    { role: 'admin', color: '#EF4444' },
  ];

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    const matchQ = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.phone.includes(q);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchQ && matchRole && matchStatus;
  });

  const toggleStatus = (id: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== id) return u;
      const next = u.status === 'active' ? 'blocked' : 'active';
      showToast(next === 'blocked' ? `تم حظر المستخدم (${u.name})` : `تم تفعيل حساب (${u.name})`, next === 'blocked' ? 'warning' : 'success');
      return { ...u, status: next };
    }));
  };

  const deleteUser = (id: string) => {
    const u = users.find(x => x.id === id);
    setUsers(prev => prev.filter(x => x.id !== id));
    showToast(`تم حذف المستخدم (${u?.name}) من المنصة`, 'danger');
  };

  const toggleRole = (id: string, targetRole: UserRole) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== id) return u;
      const newRole: UserRole = u.role === targetRole ? 'student' : targetRole;
      showToast(`تم تغيير دور (${u.name}) إلى ${ROLE_LABELS[newRole]}`, 'info');
      return { ...u, role: newRole };
    }));
  };

  return (
    <div className="container fade-in-up" style={{ padding: '2.5rem 1.5rem 5rem 1.5rem' }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px var(--primary-glow)' }}>
              <Sliders size={26} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-bright)' }}>Admin Dashboard (لوحة تحكم الأدمن)</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>إدارة المستخدمين • أدوار الصلاحيات • إحصائيات منصة التفاضل والهندسة الفراغية</p>
            </div>
          </div>

          <button className="btn btn-primary" onClick={() => showToast('إضافة مستخدم جديد...', 'info')}>
            <Plus size={16} /> إضافة مستخدم جديد
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="admin-stats-grid">
        {stats.map((s, i) => {
          const IconComp = s.icon;
          return (
            <div key={i} className="glass-card admin-stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="admin-stat-icon" style={{ background: s.bg }}>
                  <IconComp size={22} color={s.color} />
                </div>
                <span className={`admin-stat-delta ${s.up ? 'up' : 'down'}`}>
                  {s.up ? <ArrowUp size={13} /> : <ArrowDown size={13} />} {s.delta}
                </span>
              </div>
              <div className="admin-stat-value">{s.value}</div>
              <div className="admin-stat-label">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="admin-charts-grid">
        <div className="glass-card chart-card">
          <div className="chart-title">منحنى التسجيلات والاشتراكات الشهرية</div>
          <div className="bar-chart">
            {enrollmentData.map((d, i) => (
              <div key={i} className="bar-chart-col">
                <div
                  className="bar"
                  style={{ height: `${(d.value / maxVal) * 140}px` }}
                  title={`${d.month}: ${d.value} مشترك`}
                />
                <span className="bar-label">{d.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card chart-card">
          <div className="chart-title">توزيع أدوار المنصة (User Roles)</div>
          <div className="role-pie">
            {roleDist.map(({ role, color }) => {
              const count = users.filter(u => u.role === role).length;
              const pct = Math.round((count / users.length) * 100) || 0;
              return (
                <div key={role} className="role-pie-item">
                  <span className="role-pie-label" style={{ color }}>{ROLE_LABELS[role]}</span>
                  <div className="role-pie-bar-wrap">
                    <div className="role-pie-bar" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <span className="role-pie-val">{count} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* User Management Table */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <div className="table-toolbar">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-bright)' }}>User Management (إدارة المستخدمين)</h2>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div className="table-search-wrap">
              <Search size={16} />
              <input
                type="text"
                className="input-field table-search-input"
                placeholder="بحث بالاسم، البريد أو الهاتف..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ fontSize: '0.85rem' }}
              />
            </div>
            <select
              className="input-field"
              style={{ width: 'auto', fontSize: '0.85rem' }}
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
            >
              <option value="all">جميع الأدوار (All Roles)</option>
              <option value="student">Student</option>
              <option value="parent">Parent</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
            <select
              className="input-field"
              style={{ width: 'auto', fontSize: '0.85rem' }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">جميع الحالات</option>
              <option value="active">نشط (Active)</option>
              <option value="blocked">محظور (Blocked)</option>
            </select>
          </div>
        </div>

        <div className="user-table-wrapper">
          <table className="user-table">
            <thead>
              <tr>
                <th>المستخدم (User)</th>
                <th>البريد الإلكتروني</th>
                <th>الهاتف</th>
                <th>الدور (Role)</th>
                <th>الحالة</th>
                <th>تاريخ التسجيل</th>
                <th>الإجراءات (Actions)</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <img src={user.avatar} className="user-table-avatar" alt={user.name} />
                      <span style={{ fontWeight: 600, color: 'var(--text-bright)', fontSize: '0.875rem' }}>{user.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>{user.email}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.83rem', fontFamily: 'monospace' }}>{user.phone}</td>
                  <td>
                    <span className={`role-badge role-badge--${user.role}`}>
                      {ROLE_LABELS[user.role]}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-badge--${user.status}`}>
                      {user.status === 'active' ? <><CheckCircle2 size={11} /> نشط</> : <><XCircle size={11} /> محظور</>}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{user.registrationDate}</td>
                  <td>
                    <div className="user-actions-cell">
                      {/* Edit */}
                      <button
                        className="action-btn btn-secondary"
                        onClick={() => showToast(`تعديل بيانات: ${user.name}`, 'info')}
                        title="تعديل البيانات"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}
                      >
                        <Edit2 size={13} />
                      </button>
                      {/* Block/Unblock */}
                      <button
                        className={`action-btn ${user.status === 'active' ? 'btn-warning' : 'btn-secondary'}`}
                        onClick={() => toggleStatus(user.id)}
                        title={user.status === 'active' ? 'حظر الحساب' : 'تفعيل الحساب'}
                        style={user.status === 'active'
                          ? { background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#F59E0B' }
                          : { background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981' }
                        }
                      >
                        {user.status === 'active' ? <Ban size={13} /> : <CheckCircle2 size={13} />}
                      </button>
                      {/* Assign Admin / Remove Admin */}
                      <button
                        className="action-btn"
                        onClick={() => toggleRole(user.id, 'admin')}
                        title={user.role === 'admin' ? 'إزالة دور الأدمن' : 'تعيين أدمن (Make Admin)'}
                        style={user.role === 'admin'
                          ? { background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }
                          : { background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.3)', color: '#22D3EE' }
                        }
                      >
                        {user.role === 'admin' ? <ShieldOff size={13} /> : <Shield size={13} />}
                      </button>
                      {/* Assign Teacher */}
                      <button
                        className="action-btn"
                        onClick={() => toggleRole(user.id, 'teacher')}
                        title="تعيين معلم (Make Teacher)"
                        style={{ background: 'rgba(8,145,178,0.12)', border: '1px solid rgba(8,145,178,0.3)', color: 'var(--primary-light)' }}
                      >
                        <UserCheck size={13} />
                      </button>
                      {/* Delete */}
                      <button
                        className="action-btn btn-danger"
                        onClick={() => deleteUser(user.id)}
                        title="حذف المستخدم"
                        style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              لا توجد نتائج تطابق فلاتر البحث
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
