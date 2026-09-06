import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiErrorResponse } from '../types/api.types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
export const AUTH_TOKEN_KEY = 'auth_token';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Automatically attach Bearer token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // localStorage may fail in restricted sandboxes
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Centralized Error Handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    const status = error.response?.status;
    const backendData = error.response?.data;
    const errorMessage =
      backendData?.message ||
      (typeof backendData === 'string' ? backendData : undefined) ||
      error.message ||
      'حدث خطأ غير متوقع';

    // 401 Unauthorized: Invalidate session and redirect to signin
    if (status === 401) {
      try {
        localStorage.removeItem(AUTH_TOKEN_KEY);
      } catch {}
      // Emit auth:logout event so AuthContext reactively updates
      window.dispatchEvent(new CustomEvent('auth:logout', { detail: { reason: '401' } }));
    }

    // Standardized error object preserving backend status & message
    const formattedError = {
      status,
      message: errorMessage,
      isValidationError: status === 400,
      isAuthError: status === 401,
      isForbidden: status === 403,
      isNotFound: status === 404,
      isRateLimited: status === 429,
      isServerError: !!(status && status >= 500),
      raw: backendData,
    };

    return Promise.reject(formattedError);
  }
);
