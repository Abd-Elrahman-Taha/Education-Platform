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
  signinApi: (phone: string, password: string) => Promise<void>;
  signupApi: (fullName: string, nationalId: string, phone: string, parentPhone: string, password: string) => Promise<void>;
  changePasswordApi: (oldPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'syntax_current_user_v2';

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
      return saved ? JSON.parse(saved) : null;
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
  const signinApi = async (phone: string, password: string) => {
    const deviceUuid = getDeviceUuid();
    const res = await authApi.signin({
      Phone: phone.trim(),
      password,
      device_uuid: deviceUuid,
    });

    const jwtToken = res.token;
    setToken(jwtToken);

    // Decode user payload from JWT or response
    const payload = parseJwt(jwtToken) || {};
    const roleString = (payload.role || res.user?.role || 'student').toLowerCase();
    const normalizedRole: UserRole =
      roleString.includes('admin') ? 'admin' :
      roleString.includes('teacher') ? 'teacher' :
      roleString.includes('parent') ? 'parent' : 'student';

    const userObj: User = {
      id: payload.userId || payload.sub || payload._id || res.user?.id || `usr-${Date.now()}`,
      name: payload.FullName || payload.name || res.user?.FullName || phone,
      email: payload.email || `${phone}@lms.edu`,
      phone: phone.trim(),
      role: normalizedRole,
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
      registrationDate: new Date().toISOString().slice(0, 10),
    };

    login(userObj, jwtToken);
  };

  /**
   * Real backend signup (Backend automatically forces role to Student).
   */
  const signupApi = async (fullName: string, nationalId: string, phone: string, parentPhone: string, password: string) => {
    const res = await authApi.signup({
      FullName: fullName.trim(),
      NationalId: nationalId.trim(),
      Phone: phone.trim(),
      ParentPhone: parentPhone.trim(),
      password,
    });

    // If backend returns token upon signup, log in immediately; otherwise sign in
    if (res.token) {
      const jwtToken = res.token;
      setToken(jwtToken);
      const payload = parseJwt(jwtToken) || {};
      const userObj: User = {
        id: payload.userId || payload.sub || `usr-${Date.now()}`,
        name: fullName.trim(),
        email: `${phone}@lms.edu`,
        phone: phone.trim(),
        nationalId: nationalId.trim(),
        role: 'student',
        status: 'active',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
        registrationDate: new Date().toISOString().slice(0, 10),
      };
      login(userObj, jwtToken);
    } else {
      // Automatically sign in with credentials
      await signinApi(phone, password);
    }
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
