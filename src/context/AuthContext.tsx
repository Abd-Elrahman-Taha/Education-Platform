import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserRole, User } from '../types';
import { authApi } from '../api/auth.api';
import { AUTH_TOKEN_KEY } from '../api/axios';
import { getDeviceUuid } from '../utils/device';

interface AuthContextType {
  currentUser: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token?: string) => void;
  logout: () => void;
  signinApi: (phone: string, password: string) => Promise<UserRole>;
  signupApi: (fullName: string, nationalId: string, phone: string, parentPhone: string, password: string) => Promise<any>;
  changePasswordApi: (oldPassword: string, newPassword: string) => Promise<void>;
  updateUserName: (newName: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'syntax_current_user_v2';

export function resolveDisplayName(rawName?: string, phoneNum?: string, role?: string): string {
  // If rawName is present and NOT solely numeric digits/symbols
  if (rawName && /[^\d\s\+\-]/.test(rawName)) {
    return rawName.trim();
  }
  const p = (phoneNum || '').trim();
  if (p) {
    const fromPhone = localStorage.getItem(`syntax_user_name_${p}`);
    if (fromPhone && /[^\d\s\+\-]/.test(fromPhone)) return fromPhone.trim();
  }
  const generic = localStorage.getItem('syntax_user_name');
  if (generic && /[^\d\s\+\-]/.test(generic)) return generic.trim();

  const lastReg = localStorage.getItem('syntax_last_registered_name');
  if (lastReg && /[^\d\s\+\-]/.test(lastReg)) return lastReg.trim();

  const rLower = (role || '').toLowerCase();
  if (rLower === 'admin' || rLower === 'superadmin' || rLower === 'administrator') {
    return 'المشرف العام';
  }
  return 'طالب المنصة';
}

function parseJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(AUTH_TOKEN_KEY);
    } catch {
      return null;
    }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (parsed) {
        parsed.name = resolveDisplayName(parsed.name, parsed.phone, parsed.role);
      }
      return parsed;
    } catch {
      return null;
    }
  });

  // Listen to 401 unauthenticated event from Axios response interceptor
  useEffect(() => {
    const handleAuthLogout = () => {
      logout();
    };

    window.addEventListener('auth:logout', handleAuthLogout);
    return () => window.removeEventListener('auth:logout', handleAuthLogout);
  }, []);

  // Sync state to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [currentUser]);

  useEffect(() => {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      // Automatically decode token and synchronize currentUser role with the token claims
      const payload = parseJwt(token);
      if (payload) {
        const roleRaw = (
          payload.Role ||
          payload.role ||
          payload.user?.Role ||
          payload.user?.role ||
          payload.userRole ||
          'Student'
        ).toString();
        const roleLower = roleRaw.toLowerCase();
        const isAdmin = roleLower === 'admin' || roleLower === 'superadmin' || roleLower === 'administrator';
        const normalizedRole: UserRole = isAdmin ? 'admin' : 'student';

        setCurrentUser((prev) => {
          const pPhone = payload.Phone || payload.phone || prev?.phone || '';
          const resolved = resolveDisplayName(payload.FullName || payload.name || prev?.name, pPhone, normalizedRole);
          if (!prev) {
            return {
              id: payload.userId || payload.sub || payload._id || `usr-${Date.now()}`,
              name: resolved,
              email: payload.email || 'user@lms.edu',
              phone: pPhone,
              role: normalizedRole,
              status: 'active',
              avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
              registrationDate: new Date().toISOString().slice(0, 10),
            };
          }
          if (prev.role !== normalizedRole || prev.name !== resolved) {
            return { ...prev, role: normalizedRole, name: resolved };
          }
          return prev;
        });
      }
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  }, [token]);

  const login = (user: User, authToken?: string) => {
    setCurrentUser(user);
    if (authToken) {
      setToken(authToken);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setToken(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
    } catch {}
  };

  /**
   * Real backend signin using Phone, Password, and persistent device UUID.
   */
  const signinApi = async (phone: string, password: string): Promise<UserRole> => {
    const deviceUuid = getDeviceUuid();
    const res = await authApi.signin({
      Phone: phone.trim(),
      password,
      device_uuid: deviceUuid,
    });

    const jwtToken = res.token;
    if (!jwtToken) {
      throw new Error('لم يتم استلام مفتاح المصادقة من الخادم.');
    }
    setToken(jwtToken);

    // Decode user payload from JWT (Backend returns Role: "Student" | "Admin")
    const payload = parseJwt(jwtToken) || {};
    const roleRaw = (
      payload.Role ||
      payload.role ||
      payload.user?.Role ||
      payload.user?.role ||
      payload.userRole ||
      res.user?.Role ||
      res.user?.role ||
      'Student'
    ).toString();
    const roleLower = roleRaw.toLowerCase();
    const isAdmin = roleLower === 'admin' || roleLower === 'superadmin' || roleLower === 'administrator';
    const normalizedRole: UserRole = isAdmin ? 'admin' : 'student';

    const resolvedName = resolveDisplayName(
      payload.FullName || payload.name || res.user?.FullName,
      phone,
      normalizedRole
    );

    const userObj: User = {
      id: payload.userId || payload.sub || payload._id || res.user?.id || `usr-${Date.now()}`,
      name: resolvedName,
      email: payload.email || `${phone}@lms.edu`,
      phone: phone.trim(),
      role: normalizedRole,
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
      registrationDate: new Date().toISOString().slice(0, 10),
    };

    login(userObj, jwtToken);
    return normalizedRole;
  };

  /**
   * Real backend signup (Backend automatically forces role to Student).
   * Persists name locally so subsequent logins identify the user with their name.
   */
  const signupApi = async (fullName: string, nationalId: string, phone: string, parentPhone: string, password: string) => {
    const cleanP = phone.trim();
    const cleanN = fullName.trim();
    if (cleanP && cleanN) {
      try {
        localStorage.setItem(`syntax_user_name_${cleanP}`, cleanN);
        localStorage.setItem('syntax_user_name', cleanN);
        localStorage.setItem('syntax_last_registered_name', cleanN);
      } catch {}
    }
    return await authApi.signup({
      FullName: cleanN,
      NationalId: nationalId.trim(),
      Phone: cleanP,
      ParentPhone: parentPhone.trim(),
      password,
    });
  };

  /**
   * Update student / admin display name directly and persist it.
   */
  const updateUserName = (newName: string) => {
    const clean = newName.trim();
    if (!clean) return;
    try {
      if (currentUser?.phone) {
        localStorage.setItem(`syntax_user_name_${currentUser.phone}`, clean);
      }
      localStorage.setItem('syntax_user_name', clean);
      localStorage.setItem('syntax_last_registered_name', clean);
    } catch {}
    setCurrentUser((prev) => (prev ? { ...prev, name: clean } : null));
  };

  /**
   * Change password. Backend invalidates session immediately on success, so we force logout.
   */
  const changePasswordApi = async (oldPassword: string, newPassword: string) => {
    await authApi.changePassword({ oldPassword, newPassword });
    logout();
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        isAuthenticated: !!currentUser && !!token,
        login,
        logout,
        signinApi,
        signupApi,
        changePasswordApi,
        updateUserName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Demo users preserved for optional offline demo testing
export const DEMO_USERS: Record<'student' | 'teacher' | 'admin', User & { defaultPassword?: string }> = {
  student: {
    id: 'u_student_demo',
    name: 'أحمد طالب (طالب)',
    email: 'student.demo@edulearn.com',
    phone: '01012345678',
    nationalId: '30501011234567',
    role: 'student',
    academicYear: 'third_secondary',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
    registrationDate: '2026-01-15',
    defaultPassword: 'Student123!',
  },
  teacher: {
    id: 'u_teacher_admin_demo',
    name: 'أ. د. محمد الشريف (معلم ومدير المنظومة)',
    email: 'admin.demo@edulearn.com',
    phone: '01000000001',
    role: 'admin',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80',
    registrationDate: '2025-09-01',
    defaultPassword: 'Admin123!',
    permissions: [
      'view_students',
      'view_reports',
      'upload_lessons',
      'edit_lessons',
      'publish_lessons',
      'upload_exams',
      'edit_exams',
      'publish_exams',
      'assign_lessons',
      'assign_packages',
      'view_payments',
      'manage_students',
      'manage_teachers',
    ],
  },
  admin: {
    id: 'u_teacher_admin_demo',
    name: 'أ. د. محمد الشريف (معلم ومدير المنظومة)',
    email: 'admin.demo@edulearn.com',
    phone: '01000000001',
    role: 'admin',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80',
    registrationDate: '2025-09-01',
    defaultPassword: 'Admin123!',
    permissions: [
      'view_students',
      'view_reports',
      'upload_lessons',
      'edit_lessons',
      'publish_lessons',
      'upload_exams',
      'edit_exams',
      'publish_exams',
      'assign_lessons',
      'assign_packages',
      'view_payments',
      'manage_students',
      'manage_teachers',
    ],
  },
};
