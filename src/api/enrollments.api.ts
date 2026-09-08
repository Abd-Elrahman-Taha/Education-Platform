import { apiClient } from './axios';
import { Enrollment, MyCoursesResponse } from '../types/api.types';

export const enrollmentsApi = {
  /**
   * Fetch current student's enrolled courses.
   * StudentId is derived automatically by the backend from JWT (no IDOR query params).
   */
  getMyCourses: async (params?: { page?: number; limit?: number; Status?: string }): Promise<Enrollment[]> => {
    const response = await apiClient.get<MyCoursesResponse>('/enrollments/my-courses', { params });
    return response.data?.data?.enrollments || [];
  },
};
