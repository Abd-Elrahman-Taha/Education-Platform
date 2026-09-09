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
        // If name is placeholder / role / phone, check if we have the real FullName cached from signup/backend
        if (isPlaceholderName(parsed.name)) {
          const cachedName = (parsed.phone ? localStorage.getItem(`user_fullname_${parsed.phone.trim()}`) : null)
            || (parsed.id ? localStorage.getItem(`user_fullname_${parsed.id}`) : null)
            || localStorage.getItem('user_fullname_active');
          if (cachedName && !isPlaceholderName(cachedName)) {
            parsed.name = cachedName.trim();
          } else if (parsed.phone) {
            parsed.name = parsed.phone.trim();
          } else {
            parsed.name = parsed.role === 'admin' ? 'حساب الإدارة' : 'حساب الطالب';
          }
        }
        // Check for live admin override
        if (parsed.phone) {
          const cachedRole = localStorage.getItem(`account_role_${parsed.phone.trim()}`);
          if (cachedRole) {
            parsed.role = cachedRole as UserRole;
          }
          const subRaw = localStorage.getItem(`account_subscription_${parsed.phone.trim()}`);
          if (subRaw) {
            try {
              const subObj = JSON.parse(subRaw);
              parsed.isSubscribed = subObj.isSubscribed ?? false;
              parsed.subscribedYear = subObj.subscribedYear || 'third_secondary';
              parsed.subscription = {
                isActive: !!subObj.isSubscribed,
                year: subObj.subscribedYear || 'third_secondary',
                plan: subObj.plan || 'باقة التفوق',
              };
            } catch {}
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
        const userId = payload.userId || payload.sub || payload._id;
        const phone = payload.Phone || payload.phone || '';

        // Check if role was upgraded by admin in dashboard
        const cachedRole = phone
          ? localStorage.getItem(`account_role_${phone.trim()}`) || (userId ? localStorage.getItem(`account_role_${userId}`) : null)
          : null;
        const normalizedRole: UserRole = cachedRole === 'admin' ? 'admin' : (cachedRole === 'student' ? 'student' : (isAdmin ? 'admin' : 'student'));

        // Check for subscription override
        let studentSub: any = undefined;
        if (phone || userId) {
          try {
            const subRaw = (phone && localStorage.getItem(`account_subscription_${phone.trim()}`)) || (userId && localStorage.getItem(`account_subscription_${userId}`));
            if (subRaw) {
              studentSub = JSON.parse(subRaw);
            }
          } catch {}
        }

        // Automatically fetch real student / user name from live backend API
        if (userId || phone) {
          fetchBackendUserName(userId, token, phone).then((nameFromApi) => {
            const cachedName = (phone ? localStorage.getItem(`user_fullname_${phone.trim()}`) : null)
              || (userId ? localStorage.getItem(`user_fullname_${userId}`) : null)
              || localStorage.getItem('user_fullname_active');

            const resolvedName =
              (nameFromApi && !isPlaceholderName(nameFromApi) ? nameFromApi.trim() : null) ||
              (cachedName && !isPlaceholderName(cachedName) ? cachedName.trim() : null) ||
              (!isPlaceholderName(payload.FullName) ? payload.FullName.trim() : null) ||
              (!isPlaceholderName(payload.fullName) ? payload.fullName.trim() : null) ||
              (!isPlaceholderName(payload.name) ? payload.name.trim() : null) ||
              (phone ? phone.trim() : null);

            if (resolvedName) {
              if (phone && !isPlaceholderName(resolvedName)) {
                try {
                  localStorage.setItem(`user_fullname_${phone.trim()}`, resolvedName);
                  localStorage.setItem('user_fullname_active', resolvedName);
                } catch {}
              }
              if (userId && !isPlaceholderName(resolvedName)) {
                try {
                  localStorage.setItem(`user_fullname_${userId}`, resolvedName);
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
                    isSubscribed: studentSub?.isSubscribed ?? false,
                    subscribedYear: studentSub?.subscribedYear || 'third_secondary',
                    subscription: studentSub ? {
                      isActive: !!studentSub.isSubscribed,
                      year: studentSub.subscribedYear || 'third_secondary',
                      plan: studentSub.plan || 'باقة التفوق',
                    } : undefined,
                  };
                }
                return {
                  ...prev,
                  name: resolvedName,
                  role: normalizedRole,
                  isSubscribed: studentSub?.isSubscribed ?? prev.isSubscribed,
                  subscribedYear: studentSub?.subscribedYear || prev.subscribedYear,
                  subscription: studentSub ? {
                    isActive: !!studentSub.isSubscribed,
                    year: studentSub.subscribedYear || 'third_secondary',
                    plan: studentSub.plan || 'باقة التفوق',
                  } : prev.subscription,
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
    const userId = payload.userId || payload.sub || payload._id || res.user?.id || `usr-${Date.now()}`;

    // Check if role was upgraded by admin in dashboard
    const cachedRole = phone
      ? localStorage.getItem(`account_role_${phone.trim()}`) || (userId ? localStorage.getItem(`account_role_${userId}`) : null)
      : null;
    const normalizedRole: UserRole = cachedRole === 'admin' ? 'admin' : (cachedRole === 'student' ? 'student' : (isAdmin ? 'admin' : 'student'));

    // Check for subscription assigned by admin
    let studentSub: any = undefined;
    if (phone || userId) {
      try {
        const subRaw = (phone && localStorage.getItem(`account_subscription_${phone.trim()}`)) || (userId && localStorage.getItem(`account_subscription_${userId}`));
        if (subRaw) {
          studentSub = JSON.parse(subRaw);
        }
      } catch {}
    }

    // Get the name directly from the backend API or token payload
    const resUserAny = res.user as any;
    let backendName =
      (!isPlaceholderName(res.user?.FullName) ? res.user?.FullName : null) ||
      (!isPlaceholderName(resUserAny?.fullName) ? resUserAny?.fullName : null) ||
      (!isPlaceholderName(resUserAny?.name) ? resUserAny?.name : null) ||
      (!isPlaceholderName((res as any).student?.FullName) ? (res as any).student?.FullName : null) ||
      (!isPlaceholderName((res as any).data?.user?.FullName) ? (res as any).data?.user?.FullName : null) ||
      (!isPlaceholderName((res as any).data?.student?.FullName) ? (res as any).data?.student?.FullName : null) ||
      (!isPlaceholderName(payload.FullName) ? payload.FullName : null) ||
      (!isPlaceholderName(payload.fullName) ? payload.fullName : null) ||
      (!isPlaceholderName(payload.name) ? payload.name : null);

    if (!backendName) {
      backendName = await fetchBackendUserName(userId, jwtToken, phone.trim());
    }
    if (!backendName && phone) {
      const cached = localStorage.getItem(`user_fullname_${phone.trim()}`);
      if (cached && !isPlaceholderName(cached)) backendName = cached.trim();
    }
    if (!backendName) {
      const activeCached = localStorage.getItem('user_fullname_active');
      if (activeCached && !isPlaceholderName(activeCached)) backendName = activeCached.trim();
    }

    if (backendName && !isPlaceholderName(backendName)) {
      try {
        localStorage.setItem(`user_fullname_${phone.trim()}`, backendName.trim());
        localStorage.setItem('user_fullname_active', backendName.trim());
        if (userId) localStorage.setItem(`user_fullname_${userId}`, backendName.trim());
      } catch {}
    }

    const finalName = (backendName && !isPlaceholderName(backendName))
      ? backendName.trim()
      : (phone || (normalizedRole === 'admin' ? 'حساب الإدارة' : 'حساب الطالب'));

    const userObj: User = {
      id: userId,
      name: finalName,
      email: payload.email || `${phone}@lms.edu`,
      phone: phone.trim(),
      role: normalizedRole,
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
      registrationDate: new Date().toISOString().slice(0, 10),
      isSubscribed: studentSub?.isSubscribed ?? false,
      subscribedYear: studentSub?.subscribedYear || 'third_secondary',
      subscription: studentSub ? {
        isActive: !!studentSub.isSubscribed,
        year: studentSub.subscribedYear || 'third_secondary',
        plan: studentSub.plan || 'باقة التفوق',
      } : undefined,
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
      localStorage.setItem('user_fullname_active', fullName.trim());
      if (nationalId) localStorage.setItem(`user_fullname_${nationalId.trim()}`, fullName.trim());
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

