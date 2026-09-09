import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiErrorResponse } from '../types/api.types';
import { getFriendlyErrorMessage } from '../utils/errors';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://edc-platform.vercel.app/api/v1';
export const AUTH_TOKEN_KEY = 'auth_token';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Automatically attach Bearer token and sanitize query params
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

    // Sanitize query params: Never send empty or whitespace strings to backend (prevents validation errors)
    if (config.params && typeof config.params === 'object') {
      const cleaned: Record<string, any> = {};
      for (const [key, val] of Object.entries(config.params)) {
        if (typeof val === 'string') {
          if (val.trim() !== '') {
            cleaned[key] = val.trim();
          }
        } else if (val !== undefined && val !== null) {
          cleaned[key] = val;
        }
      }
      config.params = cleaned;
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
    const rawErrorMessage =
      backendData?.message ||
      (typeof backendData === 'string' ? backendData : undefined) ||
      error.message;

    // Convert raw technical or backend errors into simple, friendly user messages
    const friendlyMessage = getFriendlyErrorMessage({
      status,
      message: rawErrorMessage,
      raw: backendData,
    });

    // 401 Unauthorized: Invalidate session and redirect to signin
    if (status === 401) {
      try {
        const hadToken = localStorage.getItem(AUTH_TOKEN_KEY);
        if (hadToken) {
          localStorage.removeItem(AUTH_TOKEN_KEY);
          // Emit auth:logout event so AuthContext reactively updates
          window.dispatchEvent(new CustomEvent('auth:logout', { detail: { reason: '401' } }));
        }
      } catch {}
    }

    // Standardized error object preserving backend status & message
    const formattedError = {
      status,
      message: friendlyMessage,
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
