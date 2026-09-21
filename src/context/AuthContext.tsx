import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserRole, User } from '../types';
import { authApi } from '../api/auth.api';
import { apiClient, AUTH_TOKEN_KEY } from '../api/axios';
import { getDeviceUuid } from '../utils/device';
import { isPlaceholderName } from '../utils/user';

interface AuthContextType {
  currentUser: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token?: string) => void;
  logout: () => Promise<void>;
  signinApi: (phone: string, password: string) => Promise<UserRole>;
  signupApi: (
    fullName: string,
    nationalId: string,
    phone: string,
    parentPhone: string,
    password: string,
    educationStage?: string,
    grade?: string
  ) => Promise<any>;
  changePasswordApi: (oldPassword: string, newPassword: string) => Promise<void>;
  updateUserName: (newName: string) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'syntax_current_user_v2';

/**
 * Query the live backend API (GET /users/me) to retrieve the exact profile stored in the database.
 */
export async function fetchBackendUserName(
  userId?: string,
  authToken?: string,
  phone?: string,
  role?: string
): Promise<string | null> {
  if (!authToken) return null;

  // 1. Primary: GET /users/me
  try {
    const res = await apiClient.get<any>('/users/me', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const user = res.data?.data?.user || res.data?.user;
    if (user?.FullName) {
      return user.FullName.trim();
    }
  } catch {}

  const isAdminRole = role && (role.toLowerCase() === 'admin' || role.toLowerCase() === 'superadmin');
  if (isAdminRole && userId) {
    try {
      const res = await apiClient.get<any>(`/users/admins/${userId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const cand =
        res.data?.data?.admin?.FullName ||
        res.data?.admin?.FullName ||
        res.data?.data?.FullName ||
        res.data?.FullName;
      if (cand && !isPlaceholderName(cand, 'admin')) {
        return cand.trim();
      }
    } catch {}
  }

  return null;
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
        const isAdmin = parsed.role === 'admin' || parsed.role === 'superadmin' || parsed.role === 'teacher';
        if (parsed.role === 'superadmin') {
          parsed.isSuperAdmin = true;
        }
        if (isPlaceholderName(parsed.name, parsed.role)) {
          if (isAdmin) {
            parsed.name = 'مدير المنصة';
          } else if (parsed.phone) {
            parsed.name = parsed.phone.trim();
          } else {
            parsed.name = 'حساب الطالب';
          }
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });


  // Listen to real-time profile updates (e.g. from Admin Dashboard or Profile Page)
  useEffect(() => {
    const handleProfileUpdated = (event: any) => {
      const detail = event?.detail;
      if (!detail) return;
      setCurrentUser((prev) => {
        if (!prev) return null;
        if (
          (detail.userId && prev.id === detail.userId) ||
          (detail.phone && prev.phone === detail.phone) ||
          (!detail.userId && !detail.phone)
        ) {
          const updatedName = detail.fullName ? detail.fullName.trim() : prev.name;
          const updatedPhone = detail.phone ? detail.phone.trim() : prev.phone;
          const updatedRole = detail.role ? (detail.role.toLowerCase() === 'admin' ? 'admin' : 'student') : prev.role;
          const updated: User = {
            ...prev,
            name: updatedName,
            phone: updatedPhone,
            role: updatedRole as UserRole,
          };
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          } catch {}
          return updated;
        }
        return prev;
      });
    };

    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.name) {
            setCurrentUser((prev) => (prev && prev.name !== parsed.name ? parsed : prev));
          }
        }
      } catch {}
    };

    const handleAuthLogout = () => {
      setToken(null);
      setCurrentUser(null);
      try {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    };

    window.addEventListener('auth:logout', handleAuthLogout);
    window.addEventListener('user:profile-updated', handleProfileUpdated);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout);
      window.removeEventListener('user:profile-updated', handleProfileUpdated);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Sync state to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [currentUser]);

  const syncUserFromBackend = async (authToken: string) => {
    try {
      const dbUser = await authApi.getCurrentUser(authToken);
      if (dbUser) {
        const payload = parseJwt(authToken) || {};
        const roleRaw = (
          dbUser.Role ||
          dbUser.role ||
          payload.Role ||
          payload.role ||
          'Student'
        ).toString();
        const roleLower = roleRaw.toLowerCase();
        const isSuperAdmin = roleLower === 'superadmin' || roleRaw === 'SuperAdmin';
        const isAdmin = roleLower === 'admin' || isSuperAdmin;
        const normalizedRole: UserRole = isSuperAdmin ? 'superadmin' : (isAdmin ? 'admin' : 'student');

        const resolvedName = (dbUser.FullName || dbUser.name || payload.FullName || 'حساب المستخدم').trim();
        const rawAcademicYear = dbUser.AcademicYear || dbUser.academicYear || payload.AcademicYear;
        const rawEducationStage = dbUser.EducationStage || dbUser.educationStage || payload.EducationStage || payload.educationStage;
        const rawGrade = dbUser.Grade !== undefined && dbUser.Grade !== null
          ? String(dbUser.Grade)
          : (dbUser.grade !== undefined && dbUser.grade !== null
            ? String(dbUser.grade)
            : (payload.Grade !== undefined && payload.Grade !== null
              ? String(payload.Grade)
              : (payload.grade !== undefined ? String(payload.grade) : undefined)));

        let resolvedEducationStage = rawEducationStage;
        let resolvedGrade = rawGrade;
        let resolvedAcademicYear = rawAcademicYear;

        // Auto infer stage & grade from academicYear if missing
        if (!resolvedEducationStage && resolvedAcademicYear) {
          if (resolvedAcademicYear === 'first_secondary') { resolvedEducationStage = 'Secondary'; resolvedGrade = '1'; }
          else if (resolvedAcademicYear === 'second_secondary') { resolvedEducationStage = 'Secondary'; resolvedGrade = '2'; }
          else if (resolvedAcademicYear === 'third_secondary') { resolvedEducationStage = 'Secondary'; resolvedGrade = '3'; }
        } else if (!resolvedAcademicYear && resolvedEducationStage === 'Secondary' && resolvedGrade) {
          if (resolvedGrade === '1') resolvedAcademicYear = 'first_secondary';
          else if (resolvedGrade === '2') resolvedAcademicYear = 'second_secondary';
          else if (resolvedGrade === '3') resolvedAcademicYear = 'third_secondary';
        }

        if (!resolvedAcademicYear) {
          resolvedAcademicYear = 'third_secondary';
        }

        const updatedUser: User = {
          id: dbUser._id || dbUser.id || payload.userId || payload.sub || `usr-${Date.now()}`,
          name: resolvedName,
          email: dbUser.email || payload.email || `${dbUser.Phone || payload.Phone || 'user'}@lms.edu`,
          phone: (dbUser.Phone || payload.Phone || '').trim(),
          studentCode: dbUser.StudentCode || dbUser.studentCode || payload.StudentCode || payload.studentCode,
          StudentCode: dbUser.StudentCode || dbUser.studentCode || payload.StudentCode || payload.studentCode,
          nationalId: dbUser.NationalId || payload.NationalId,
          role: normalizedRole,
          isSuperAdmin,
          status: (dbUser.Status || 'active').toLowerCase() as any,
          avatar: dbUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
          registrationDate: dbUser.createdAt ? dbUser.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
          academicYear: resolvedAcademicYear as any,
          subscribedYear: resolvedAcademicYear,
          educationStage: resolvedEducationStage,
          grade: resolvedGrade,
          isSubscribed: false,
          subscription: {
            isActive: false,
            year: resolvedAcademicYear,
            plan: 'باقة التفوق',
          },
          ...(typeof dbUser.WalletBalance === 'number' ? { walletBalance: dbUser.WalletBalance } : {}),
        } as any;

        setCurrentUser(updatedUser);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
        } catch {}
        return updatedUser;
      }
    } catch (err) {
      console.warn('[AuthContext] syncUserFromBackend error:', err);
    }

    // Robust Fallback: Reconstruct valid user object from JWT payload
    const payload = parseJwt(authToken) || {};
    if (payload.userId || payload.sub) {
      const roleRaw = (payload.Role || payload.role || 'Student').toString();
      const roleLower = roleRaw.toLowerCase();
      const isSuperAdmin = roleLower === 'superadmin' || roleRaw === 'SuperAdmin';
      const isAdmin = roleLower === 'admin' || isSuperAdmin;
      const normalizedRole: UserRole = isSuperAdmin ? 'superadmin' : (isAdmin ? 'admin' : 'student');
      let fallbackEducationStage = payload.EducationStage || payload.educationStage;
      let fallbackGrade = payload.Grade !== undefined && payload.Grade !== null
        ? String(payload.Grade)
        : (payload.grade !== undefined ? String(payload.grade) : undefined);
      let fallbackAcademicYear = payload.AcademicYear;

      if (!fallbackEducationStage && fallbackAcademicYear) {
        if (fallbackAcademicYear === 'first_secondary') { fallbackEducationStage = 'Secondary'; fallbackGrade = '1'; }
        else if (fallbackAcademicYear === 'second_secondary') { fallbackEducationStage = 'Secondary'; fallbackGrade = '2'; }
        else if (fallbackAcademicYear === 'third_secondary') { fallbackEducationStage = 'Secondary'; fallbackGrade = '3'; }
      } else if (!fallbackAcademicYear && fallbackEducationStage === 'Secondary' && fallbackGrade) {
        if (fallbackGrade === '1') fallbackAcademicYear = 'first_secondary';
        else if (fallbackGrade === '2') fallbackAcademicYear = 'second_secondary';
        else if (fallbackGrade === '3') fallbackAcademicYear = 'third_secondary';
      }

      if (!fallbackAcademicYear) {
        fallbackAcademicYear = 'third_secondary';
      }

      const fallbackUser: User = {
        id: payload.userId || payload.sub,
        name: (payload.FullName || payload.name || 'حساب المستخدم').trim(),
        email: payload.email || `${payload.Phone || 'user'}@lms.edu`,
        phone: (payload.Phone || '').trim(),
        studentCode: payload.StudentCode || payload.studentCode,
        StudentCode: payload.StudentCode || payload.studentCode,
        nationalId: payload.NationalId,
        role: normalizedRole,
        isSuperAdmin,
        status: 'active',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
        registrationDate: new Date().toISOString().slice(0, 10),
        academicYear: fallbackAcademicYear as any,
        subscribedYear: fallbackAcademicYear,
        educationStage: fallbackEducationStage,
        grade: fallbackGrade,
        isSubscribed: false,
        subscription: {
          isActive: false,
          year: fallbackAcademicYear,
          plan: 'باقة التفوق',
        },
      } as any;

      setCurrentUser(fallbackUser);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fallbackUser));
      } catch {}
      return fallbackUser;
    }

    return null;
  };

  const refreshUser = async () => {
    const currentToken = token || localStorage.getItem(AUTH_TOKEN_KEY);
    if (currentToken) {
      await syncUserFromBackend(currentToken);
    }
  };

  useEffect(() => {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      syncUserFromBackend(token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  }, [token]);

  const login = (user: User, authToken?: string) => {
    setCurrentUser(user);
    if (authToken) {
      try {
        localStorage.setItem(AUTH_TOKEN_KEY, authToken);
      } catch {}
      setToken(authToken);
    }
  };

  const logout = async () => {
    const currentToken = token || localStorage.getItem(AUTH_TOKEN_KEY);
    try {
      if (currentToken) {
        await authApi.logout();
      }
    } catch (err) {
      console.warn('[Auth] Logout API notice:', err);
    } finally {
      setCurrentUser(null);
      setToken(null);
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(AUTH_TOKEN_KEY);
      } catch {}
    }
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
      throw new Error('تعذر تسجيل الدخول حالياً، يرجى المحاولة مرة أخرى.');
    }

    // Synchronously commit auth token so concurrent requests and interceptors immediately have it
    try {
      localStorage.setItem(AUTH_TOKEN_KEY, jwtToken);
    } catch {}
    setToken(jwtToken);

    // Synchronize full profile from live backend GET /users/me
    const syncedUser = await syncUserFromBackend(jwtToken);
    if (syncedUser) {
      return syncedUser.role;
    }

    // Fallback if network issue on initial me query
    const payload = parseJwt(jwtToken) || {};
    const roleRaw = (payload.Role || payload.role || 'Student').toString();
    const roleLower = roleRaw.toLowerCase();
    const isSuperAdmin = roleLower === 'superadmin' || roleRaw === 'SuperAdmin';
    const isAdmin = roleLower === 'admin' || isSuperAdmin;
    const normalizedRole: UserRole = isSuperAdmin ? 'superadmin' : (isAdmin ? 'admin' : 'student');

    return normalizedRole;
  };

  const signupApi = async (
    fullName: string,
    nationalId: string,
    phone: string,
    parentPhone: string,
    password: string,
    educationStage?: string,
    grade?: string
  ): Promise<any> => {
    const payload: any = {
      FullName: fullName.trim(),
      NationalId: nationalId.trim(),
      Phone: phone.trim(),
      ParentPhone: parentPhone.trim(),
      password,
    };
    if (educationStage) {
      payload.EducationStage = educationStage;
    }
    if (grade !== undefined && grade !== null && grade !== '') {
      payload.Grade = String(grade);
    }
    const res = await authApi.signup(payload);
    return res;
  };

  /**
   * Update student / admin display name directly.
   */
  const updateUserName = (newName: string) => {
    const clean = newName.trim();
    if (!clean) return;
    setCurrentUser((prev) => {
      if (!prev) return null;
      return { ...prev, name: clean };
    });
  };

  /**
   * Change password. Backend invalidates session immediately on success, so we force logout.
   */
  const changePasswordApi = async (oldPassword: string, newPassword: string) => {
    await authApi.changePassword({ oldPassword, newPassword });
    await logout();
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
        refreshUser,
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

