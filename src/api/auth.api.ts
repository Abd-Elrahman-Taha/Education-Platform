import { apiClient } from './axios';
import {
  SignupRequest,
  SigninRequest,
  AuthResponse,
  ChangePasswordRequest,
} from '../types/api.types';

export const authApi = {
  /**
   * Register a new student. Role is forced to Student on backend.
   * FullName: 3-60 chars, Phone: Egyptian 11 digits, password: 8-40 chars.
   */
  signup: async (data: SignupRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/signup', data);
    return response.data;
  },

  /**
   * Authenticate student with phone, password, and persistent device UUID.
   */
  signin: async (data: SigninRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/signin', data);
    return response.data;
  },

  /**
   * Change account password. Backend invalidates session immediately on success.
   */
  changePassword: async (data: ChangePasswordRequest): Promise<{ message: string }> => {
    const response = await apiClient.patch<{ message: string }>('/auth/change-password', data);
    return response.data;
  },
};
