import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserRole, User } from '../types';
import { authApi } from '../api/auth.api';
import { apiClient, AUTH_TOKEN_KEY } from '../api/axios';
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

/**
 * Query the live backend API to retrieve the exact FullName stored in the database.
 */
export async function fetchBackendUserName(userId: string, authToken: string, phone?: string): Promise<string | null> {
  if (!userId || !authToken) return null;

  // 1. Direct query: GET /users/students/:userId
  try {
    const res = await apiClient.get<any>(`/users/students/${userId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const fullName = res.data?.data?.student?.FullName || res.data?.student?.FullName || res.data?.FullName;
    if (fullName && /[^\d\s\+\-]/.test(fullName)) {
      return fullName.trim();
    }
  } catch {}

  // 2. Query: GET /users/students?search=:phone
  try {
    const listRes = await apiClient.get<any>('/users/students', {
      headers: { Authorization: `Bearer ${authToken}` },
      params: phone ? { search: phone.trim() } : undefined,
    });
    const students: any[] = listRes.data?.data?.students || listRes.data?.students || [];
    const match = students.find((s) => s._id === userId || (phone && s.Phone === phone.trim()));
    if (match?.FullName && /[^\d\s\+\-]/.test(match.FullName)) {
      return match.FullName.trim();
    }
  } catch {}

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
        // If name is phone or empty, check if we have the real FullName cached from signup/backend
        if (!parsed.name || /^\+?[0-9\s\-]+$/.test(parsed.name)) {
          const cachedName = parsed.phone ? localStorage.getItem(`user_fullname_${parsed.phone.trim()}`) : null;
          if (cachedName) {
            parsed.name = cachedName;
          } else if (parsed.role === 'admin') {
            parsed.name = 'المشرف العام';
          }
        }
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
        const userId = payload.userId || payload.sub || payload._id;
        const phone = payload.Phone || payload.phone || '';

        // Automatically fetch real student / user name from live backend API
        if (userId) {
          fetchBackendUserName(userId, token, phone).then((nameFromApi) => {
            const resolvedName =
              nameFromApi ||
              (phone ? localStorage.getItem(`user_fullname_${phone.trim()}`) : null) ||
              (isAdmin ? 'المشرف العام' : null);

            if (resolvedName) {
              if (phone) {
                try {
                  localStorage.setItem(`user_fullname_${phone.trim()}`, resolvedName);
                } catch {}
              }
              setCurrentUser((prev) => {
                if (!prev) {
                  return {
                    id: userId,
                    name: resolvedName,
                    email: payload.email || `${phone || 'user'}@lms.edu`,
                    phone: phone,
                    role: normalizedRole,
                    status: 'active',
                    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
                    registrationDate: new Date().toISOString().slice(0, 10),
                  };
                }
                return { ...prev, name: resolvedName, role: normalizedRole };
              });
            }
          });
        }
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

    const userId = payload.userId || payload.sub || payload._id || res.user?.id || `usr-${Date.now()}`;

    // Get the name directly from the backend API
    let backendName = res.user?.FullName || payload.FullName || payload.name;
    if (!backendName || /^\+?[0-9\s\-]+$/.test(backendName)) {
      backendName = await fetchBackendUserName(userId, jwtToken, phone.trim());
    }
    if (!backendName || /^\+?[0-9\s\-]+$/.test(backendName)) {
      const cached = localStorage.getItem(`user_fullname_${phone.trim()}`);
      if (cached) backendName = cached;
    }
    if (backendName && !/^\+?[0-9\s\-]+$/.test(backendName)) {
      try {
        localStorage.setItem(`user_fullname_${phone.trim()}`, backendName.trim());
      } catch {}
    }

    const finalName = backendName || (isAdmin ? 'المشرف العام' : 'طالب المنصة');

    const userObj: User = {
      id: userId,
      name: finalName,
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
   */
  const signupApi = async (fullName: string, nationalId: string, phone: string, parentPhone: string, password: string) => {
    const res = await authApi.signup({
      FullName: fullName.trim(),
      NationalId: nationalId.trim(),
      Phone: phone.trim(),
      ParentPhone: parentPhone.trim(),
      password,
    });
    // Immediately persist registered FullName associated with this phone
    try {
      localStorage.setItem(`user_fullname_${phone.trim()}`, fullName.trim());
    } catch {}
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
      if (prev.phone) {
        try {
          localStorage.setItem(`user_fullname_${prev.phone.trim()}`, clean);
        } catch {}
      }
      return { ...prev, name: clean };
    });
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

