import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserRole, User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'syntax_current_user_v2';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [currentUser]);

  const login = (user: User) => {
    setCurrentUser(user);
  };

  const logout = () => {
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated: !!currentUser, login, logout }}>
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

// Unified Demo Accounts for Student and Teacher/Admin
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
