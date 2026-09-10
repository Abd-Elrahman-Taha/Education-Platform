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
export async function fetchBackendUserName(userId?: string, authToken?: string, phone?: string): Promise<string | null> {
  if (!authToken) return null;

  // 1. Query by phone search: GET /users/students?search=:phone
  if (phone && phone.trim()) {
    try {
      const listRes = await apiClient.get<any>('/users/students', {
        headers: { Authorization: `Bearer ${authToken}` },
        params: { search: phone.trim() },
      });
      const students: any[] = listRes.data?.data?.students || listRes.data?.students || [];
      const match = students.find((s) => 
        (s.Phone && s.Phone.trim() === phone.trim()) ||
        (userId && s._id === userId)
      );
      const cand = match?.FullName || match?.fullName || match?.name;
      if (cand && !isPlaceholderName(cand)) {
        return cand.trim();
      }
    } catch {}
  }

  // 2. Direct query: GET /users/students/:userId
  if (userId) {
    try {
      const res = await apiClient.get<any>(`/users/students/${userId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const cand = res.data?.data?.student?.FullName || res.data?.student?.FullName || res.data?.FullName || res.data?.data?.student?.name;
      if (cand && !isPlaceholderName(cand)) {
        return cand.trim();
      }
    } catch {}
  }

  // 3. Query all students list: GET /users/students
  try {
    const allRes = await apiClient.get<any>('/users/students', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const allStudents: any[] = allRes.data?.data?.students || allRes.data?.students || [];
    const found = allStudents.find((s) =>
      (userId && s._id === userId) ||
      (phone && s.Phone && s.Phone.trim() === phone.trim()) ||
      (phone && s.Phone && s.Phone.endsWith(phone.trim().slice(-8)))
    );
    const cand = found?.FullName || found?.fullName || found?.name;
    if (cand && !isPlaceholderName(cand)) {
      return cand.trim();
    }
  } catch {}

  // 4. Try current user profile / me endpoints
  const profileEndpoints = ['/users/me', '/auth/me', '/users/profile'];
  if (userId) profileEndpoints.push(`/users/${userId}`);

  for (const ep of profileEndpoints) {
    try {
      const r = await apiClient.get<any>(ep, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const cand = r.data?.data?.FullName || r.data?.user?.FullName || r.data?.FullName || r.data?.data?.name || r.data?.name;
      if (cand && !isPlaceholderName(cand)) {
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
        const isAdmin = parsed.role === 'admin' || parsed.role === 'teacher';
        // Always check if there is an updated name cached from admin edit or backend
        const cachedUpdated = (parsed.phone ? localStorage.getItem(`user_fullname_${parsed.phone.trim()}`) : null)
          || (parsed.id ? localStorage.getItem(`user_fullname_${parsed.id}`) : null)
          || (isAdmin ? localStorage.getItem('admin_username') : null)
          || localStorage.getItem('user_fullname_active');

        if (cachedUpdated && cachedUpdated.trim() && !isPlaceholderName(cachedUpdated, parsed.role)) {
          parsed.name = cachedUpdated.trim();
        } else if (isPlaceholderName(parsed.name, parsed.role)) {
          if (isAdmin) {
            // NEVER use phone number for admin!
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
            if (updated.phone) {
              localStorage.setItem(`user_fullname_${updated.phone.trim()}`, updatedName);
            }
            if (updated.id) {
              localStorage.setItem(`user_fullname_${updated.id}`, updatedName);
            }
            localStorage.setItem('user_fullname_active', updatedName);
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

    window.addEventListener('user:profile-updated', handleProfileUpdated);
    window.addEventListener('storage', handleStorageChange);
    return () => {
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
        const isAdmin = roleLower === 'admin' || roleLower === 'superadmin' || roleLower === 'administrator';
        const userId = payload.userId || payload.sub || payload._id;
        const phone = payload.Phone || payload.phone || '';

        const normalizedRole: UserRole = isAdmin ? 'admin' : 'student';

        // Automatically fetch real student / user name from live backend API
        if (userId || phone) {
          fetchBackendUserName(userId, token, phone).then((nameFromApi) => {
            const isAdminRole = normalizedRole === 'admin';
            const adminLocalUser = isAdminRole
              ? (payload.username || payload.userName || (payload.email && !payload.email.includes('user') ? payload.email.split('@')[0] : null) || localStorage.getItem('admin_username'))
              : null;

            const cachedName = (phone ? localStorage.getItem(`user_fullname_${phone.trim()}`) : null)
              || (userId ? localStorage.getItem(`user_fullname_${userId}`) : null)
              || (isAdminRole ? localStorage.getItem('admin_username') : null)
              || localStorage.getItem('user_fullname_active');

            const resolvedName =
              (nameFromApi && !isPlaceholderName(nameFromApi, normalizedRole) ? nameFromApi.trim() : null) ||
              (cachedName && !isPlaceholderName(cachedName, normalizedRole) ? cachedName.trim() : null) ||
              (adminLocalUser && !isPlaceholderName(adminLocalUser, normalizedRole) ? adminLocalUser.trim() : null) ||
              (!isPlaceholderName(payload.FullName, normalizedRole) ? payload.FullName.trim() : null) ||
              (!isPlaceholderName(payload.fullName, normalizedRole) ? payload.fullName.trim() : null) ||
              (!isPlaceholderName(payload.username, normalizedRole) ? payload.username.trim() : null) ||
              (!isPlaceholderName(payload.name, normalizedRole) ? payload.name.trim() : null) ||
              (isAdminRole ? 'مدير المنصة' : (phone ? phone.trim() : null));

            if (resolvedName) {
              if (phone && !isPlaceholderName(resolvedName, normalizedRole)) {
                try {
                  localStorage.setItem(`user_fullname_${phone.trim()}`, resolvedName);
                  localStorage.setItem('user_fullname_active', resolvedName);
                } catch {}
              }
              if (userId && !isPlaceholderName(resolvedName, normalizedRole)) {
                try {
                  localStorage.setItem(`user_fullname_${userId}`, resolvedName);
                } catch {}
              }
              if (isAdminRole && !isPlaceholderName(resolvedName, normalizedRole)) {
                try {
                  localStorage.setItem('admin_username', resolvedName);
                } catch {}
              }
              setCurrentUser((prev) => {
                if (!prev) {
                  return {
                    id: userId || `usr-${Date.now()}`,
                    name: resolvedName,
                    email: payload.email || `${phone || 'user'}@lms.edu`,
                    phone: phone,
                    role: normalizedRole,
                    status: 'active',
                    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
                    registrationDate: new Date().toISOString().slice(0, 10),
                    isSubscribed: false,
                    subscribedYear: 'third_secondary',
                    subscription: undefined,
                  };
                }
                return {
                  ...prev,
                  name: resolvedName,
                  role: normalizedRole,
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
    const isAdmin = roleLower === 'admin' || roleLower === 'superadmin' || roleLower === 'administrator';
    const userId = payload.userId || payload.sub || payload._id || res.user?.id || `usr-${Date.now()}`;

    const normalizedRole: UserRole = isAdmin ? 'admin' : 'student';

    // Get the name directly from the backend API or token payload
    const isAdminUser = normalizedRole === 'admin';
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
          (payload.email && !payload.email.includes('user') ? payload.email.split('@')[0] : null) ||
          localStorage.getItem('admin_username')
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
      backendName = await fetchBackendUserName(userId, jwtToken, phone.trim());
    }
    if (!backendName && phone) {
      const cached = localStorage.getItem(`user_fullname_${phone.trim()}`);
      if (cached && !isPlaceholderName(cached, normalizedRole)) backendName = cached.trim();
    }
    if (!backendName && isAdminUser) {
      const storedAdmin = localStorage.getItem('admin_username');
      if (storedAdmin && !isPlaceholderName(storedAdmin, 'admin')) backendName = storedAdmin.trim();
    }
    if (!backendName) {
      const activeCached = localStorage.getItem('user_fullname_active');
      if (activeCached && !isPlaceholderName(activeCached, normalizedRole)) backendName = activeCached.trim();
    }

    if (backendName && !isPlaceholderName(backendName, normalizedRole)) {
      try {
        localStorage.setItem(`user_fullname_${phone.trim()}`, backendName.trim());
        localStorage.setItem('user_fullname_active', backendName.trim());
        if (userId) localStorage.setItem(`user_fullname_${userId}`, backendName.trim());
        if (isAdminUser) localStorage.setItem('admin_username', backendName.trim());
      } catch {}
    }

    // FOR ADMIN: NEVER FALL BACK TO PHONE NUMBER!
    const finalName = (backendName && !isPlaceholderName(backendName, normalizedRole))
      ? backendName.trim()
      : (isAdminUser ? (candidateAdmin || 'مدير المنصة') : (phone || 'حساب الطالب'));

    const userObj: User = {
      id: userId,
      name: finalName,
      email: payload.email || `${phone}@lms.edu`,
      phone: phone.trim(),
      role: normalizedRole,
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
      if (prev.role === 'admin') {
        try {
          localStorage.setItem('admin_username', clean);
        } catch {}
      }
      if (prev.phone) {
        try {
          localStorage.setItem(`user_fullname_${prev.phone.trim()}`, clean);
        } catch {}
      }
      try {
        localStorage.setItem(`user_fullname_${prev.id}`, clean);
        localStorage.setItem('user_fullname_active', clean);
      } catch {}
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

