import { apiClient } from './axios';
import { UpdateMeRequest, UserProfileResponse } from '../types/api.types';

export const usersApi = {
  /**
   * Get current authenticated user profile.
   * Backend endpoint: GET /users/me
   */
  getMe: async (): Promise<UserProfileResponse['data']['user']> => {
    const response = await apiClient.get<UserProfileResponse>('/users/me');
    const raw = response.data as any;
    return raw?.data?.user || raw?.user || raw?.data || raw;
  },

  /**
   * Update current authenticated user profile.
   * Allowed fields: FullName, Phone, ParentPhone, AcademicYear.
   * Backend endpoint: PATCH /users/me
   */
  updateMe: async (data: UpdateMeRequest): Promise<{ message: string; user?: any }> => {
    const cleanPayload: UpdateMeRequest = {};
    if (data.FullName !== undefined && data.FullName.trim()) cleanPayload.FullName = data.FullName.trim();
    if (data.Phone !== undefined && data.Phone.trim()) cleanPayload.Phone = data.Phone.trim();
    if (data.ParentPhone !== undefined && data.ParentPhone.trim()) cleanPayload.ParentPhone = data.ParentPhone.trim();
    if (data.AcademicYear !== undefined && data.AcademicYear.trim()) cleanPayload.AcademicYear = data.AcademicYear.trim();

    const response = await apiClient.patch<any>('/users/me', cleanPayload);
    return response.data;
  },
};
