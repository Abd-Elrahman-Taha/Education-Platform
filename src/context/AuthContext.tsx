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
export async function fetchBackendUserName(
  userId?: string,
  authToken?: string,
  phone?: string,
  role?: string
): Promise<string | null> {
  if (!authToken || !userId) return null;

  const isAdminRole = role && (role.toLowerCase() === 'admin' || role.toLowerCase() === 'superadmin');

  if (isAdminRole) {
    // 1. Admin endpoint: GET /users/admins/:userId
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

    // 2. Admin endpoint fallback: GET /users/admins
    try {
      const res = await apiClient.get<any>('/users/admins', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const list = res.data?.data?.admins || res.data?.admins || res.data || [];
      if (Array.isArray(list)) {
        const match = list.find((a: any) => a._id === userId || (phone && a.Phone === phone));
        if (match?.FullName && !isPlaceholderName(match.FullName, 'admin')) {
          return match.FullName.trim();
        }
      }
    } catch {}
  } else {
    // 3. Student endpoint: GET /users/students/:userId
    try {
      const res = await apiClient.get<any>(`/users/students/${userId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const cand =
        res.data?.data?.student?.FullName ||
        res.data?.student?.FullName ||
        res.data?.FullName;
      if (cand && !isPlaceholderName(cand, 'student')) {
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

  // Listen to 401 unauthenticated event from Axios response interceptor
  useEffect(() => {
    const handleAuthLogout = () => {
      logout();
    };

    window.addEventListener('auth:logout', handleAuthLogout);
    return () => window.removeEventListener('auth:logout', handleAuthLogout);
  }, []);

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
        const isSuperAdmin = roleLower === 'superadmin' || payload.isSuperAdmin === true || roleRaw === 'SuperAdmin';
        const isAdmin = roleLower === 'admin' || isSuperAdmin || roleLower === 'administrator';
        const userId = payload.userId || payload.sub || payload._id;
        const phone = payload.Phone || payload.phone || '';

        const normalizedRole: UserRole = isSuperAdmin ? 'superadmin' : (isAdmin ? 'admin' : 'student');

        // Automatically fetch real student / user name from live backend API
        if (userId || phone) {
          fetchBackendUserName(userId, token, phone, normalizedRole).then((nameFromApi) => {
            const isAdminRole = normalizedRole === 'admin' || normalizedRole === 'superadmin';
            const adminFallbackName = isAdminRole
              ? (payload.username || payload.userName || (payload.email && !payload.email.includes('user') ? payload.email.split('@')[0] : null) || (isSuperAdmin ? 'المدير العام (SuperAdmin)' : 'مدير المنصة'))
              : null;

            const resolvedName =
              (nameFromApi && !isPlaceholderName(nameFromApi, normalizedRole) ? nameFromApi.trim() : null) ||
              (!isPlaceholderName(payload.FullName, normalizedRole) ? payload.FullName.trim() : null) ||
              (!isPlaceholderName(payload.fullName, normalizedRole) ? payload.fullName.trim() : null) ||
              (!isPlaceholderName(payload.username, normalizedRole) ? payload.username.trim() : null) ||
              (!isPlaceholderName(payload.name, normalizedRole) ? payload.name.trim() : null) ||
              adminFallbackName ||
              (phone ? phone.trim() : 'حساب الطالب');

            if (resolvedName) {
              setCurrentUser((prev) => {
                if (!prev) {
                  return {
                    id: userId || `usr-${Date.now()}`,
                    name: resolvedName,
                    email: payload.email || `${phone || 'user'}@lms.edu`,
                    phone: phone,
                    role: normalizedRole,
                    isSuperAdmin: isSuperAdmin,
                    status: 'active',
                    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
                    registrationDate: new Date().toISOString().slice(0, 10),
                    isSubscribed: false,
                    subscribedYear: 'third_secondary',
                    subscription: {
                      isActive: false,
                      year: 'third_secondary',
                      plan: 'باقة التفوق',
                    },
                  };
                }
                return {
                  ...prev,
                  name: resolvedName,
                  role: normalizedRole,
                  isSuperAdmin: isSuperAdmin,
                };
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
      throw new Error('تعذر تسجيل الدخول حالياً، يرجى المحاولة مرة أخرى.');
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
    const isSuperAdmin = roleLower === 'superadmin' || payload.isSuperAdmin === true || roleRaw === 'SuperAdmin' || (res.user as any)?.isSuperAdmin === true || (res.user as any)?.Role === 'SuperAdmin';
    const isAdmin = roleLower === 'admin' || isSuperAdmin || roleLower === 'administrator';
    const userId = payload.userId || payload.sub || payload._id || res.user?.id || `usr-${Date.now()}`;

    const normalizedRole: UserRole = isSuperAdmin ? 'superadmin' : (isAdmin ? 'admin' : 'student');

    // Get the name directly from the backend API or token payload
    const isAdminUser = normalizedRole === 'admin' || normalizedRole === 'superadmin';
    const resUserAny = res.user as any;
    const candidateAdmin = isAdminUser
      ? (
          (!isPlaceholderName(resUserAny?.username, 'admin') ? resUserAny?.username : null) ||
          (!isPlaceholderName(payload.username, 'admin') ? payload.username : null) ||
          (!isPlaceholderName(payload.userName, 'admin') ? payload.userName : null) ||
          (!isPlaceholderName((res as any).username, 'admin') ? (res as any).username : null) ||
          (!isPlaceholderName((res as any).data?.username, 'admin') ? (res as any).data?.username : null) ||
          (!isPlaceholderName(res.user?.FullName, 'admin') ? res.user?.FullName : null) ||
          (!isPlaceholderName(payload.FullName, 'admin') ? payload.FullName : null) ||
          (!isPlaceholderName(resUserAny?.name, 'admin') ? resUserAny?.name : null) ||
          (!isPlaceholderName(payload.name, 'admin') ? payload.name : null) ||
          (payload.email && !payload.email.includes('user') ? payload.email.split('@')[0] : null)
        )
      : null;
    let backendName =
      candidateAdmin ||
      (!isPlaceholderName(res.user?.FullName, normalizedRole) ? res.user?.FullName : null) ||
      (!isPlaceholderName(resUserAny?.fullName, normalizedRole) ? resUserAny?.fullName : null) ||
      (!isPlaceholderName(resUserAny?.username, normalizedRole) ? resUserAny?.username : null) ||
      (!isPlaceholderName(resUserAny?.name, normalizedRole) ? resUserAny?.name : null) ||
      (!isPlaceholderName((res as any).student?.FullName, normalizedRole) ? (res as any).student?.FullName : null) ||
      (!isPlaceholderName((res as any).data?.user?.FullName, normalizedRole) ? (res as any).data?.user?.FullName : null) ||
      (!isPlaceholderName((res as any).data?.student?.FullName, normalizedRole) ? (res as any).data?.student?.FullName : null) ||
      (!isPlaceholderName(payload.FullName, normalizedRole) ? payload.FullName : null) ||
      (!isPlaceholderName(payload.fullName, normalizedRole) ? payload.fullName : null) ||
      (!isPlaceholderName(payload.username, normalizedRole) ? payload.username : null) ||
      (!isPlaceholderName(payload.name, normalizedRole) ? payload.name : null);

    if (!backendName) {
      backendName = await fetchBackendUserName(userId, jwtToken, phone.trim(), normalizedRole);
    }

    // FOR ADMIN: NEVER FALL BACK TO PHONE NUMBER!
    const finalName = (backendName && !isPlaceholderName(backendName, normalizedRole))
      ? backendName.trim()
      : (isAdminUser ? (candidateAdmin || (isSuperAdmin ? 'المدير العام (SuperAdmin)' : 'مدير المنصة')) : (phone || 'حساب الطالب'));

    const userObj: User = {
      id: userId,
      name: finalName,
      email: payload.email || `${phone}@lms.edu`,
      phone: phone.trim(),
      role: normalizedRole,
      isSuperAdmin: isSuperAdmin,
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
      registrationDate: new Date().toISOString().slice(0, 10),
      isSubscribed: !!((payload as any).isSubscribed || (res.user as any)?.isSubscribed),
      subscribedYear: (payload as any).subscribedYear || (res.user as any)?.subscribedYear || 'third_secondary',
      subscription: {
        isActive: !!((payload as any).isSubscribed || (res.user as any)?.isSubscribed),
        year: (payload as any).subscribedYear || (res.user as any)?.subscribedYear || 'third_secondary',
        plan: 'باقة التفوق',
      },
    };

    login(userObj, jwtToken);
    return normalizedRole;
  };

  /**
   * Real backend signup using student details.
   */
  const signupApi = async (
    fullName: string,
    nationalId: string,
    phone: string,
    parentPhone: string,
    password: string
  ): Promise<any> => {
    const res = await authApi.signup({
      FullName: fullName.trim(),
      NationalId: nationalId.trim(),
      Phone: phone.trim(),
      ParentPhone: parentPhone.trim(),
      password,
    });
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

