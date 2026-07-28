import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserRole, User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'syntax_current_user';

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

// Preconfigured Demo Accounts as requested
export const DEMO_USERS: Record<UserRole, User & { defaultPassword?: string }> = {
  student: {
    id: 'u_student_demo',
    name: 'أحمد طالب (طالب)',
    email: 'student.demo@edulearn.com',
    phone: '01012345678',
    role: 'student',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
    registrationDate: '2026-01-15',
    defaultPassword: 'Student123!',
  },
  parent: {
    id: 'u_parent_demo',
    name: 'محمود عبد الله (ولي أمر)',
    email: 'parent.demo@edulearn.com',
    phone: '01198765432',
    role: 'parent',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80',
    registrationDate: '2026-01-20',
    defaultPassword: 'Parent123!',
  },
  teacher: {
    id: 'u_teacher_demo',
    name: 'أ. د. محمد الشريف (معلم)',
    email: 'teacher.demo@edulearn.com',
    phone: '01055544332',
    role: 'teacher',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80',
    registrationDate: '2025-09-15',
    defaultPassword: 'Teacher123!',
  },
  admin: {
    id: 'u_admin_demo',
    name: 'المهندس طارق (مدير النظام)',
    email: 'admin.demo@edulearn.com',
    phone: '01000000001',
    role: 'admin',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=100&q=80',
    registrationDate: '2025-09-01',
    defaultPassword: 'Admin123!',
  },
};
