import { apiClient } from './axios';
import { Enrollment, MyCoursesResponse, ManualEnrollmentResponse } from '../types/api.types';

export const enrollmentsApi = {
  /**
   * Fetch current student's enrolled courses.
   * StudentId is derived automatically by the backend from JWT (no IDOR query params).
   */
  getMyCourses: async (params?: { page?: number; limit?: number; Status?: string }): Promise<Enrollment[]> => {
    try {
      const response = await apiClient.get<any>('/enrollments/my-courses', { params });
      const raw = response.data;
      if (Array.isArray(raw?.data?.enrollments)) return raw.data.enrollments;
      if (Array.isArray(raw?.enrollments)) return raw.enrollments;
      if (Array.isArray(raw?.data?.courses)) return raw.data.courses;
      if (Array.isArray(raw?.courses)) return raw.courses;
      if (Array.isArray(raw?.data)) return raw.data;
      if (Array.isArray(raw)) return raw;
      return [];
    } catch (err: any) {
      if (err?.response?.status === 403 || err?.status === 403) {
        return [];
      }
      return [];
    }
  },

  /**
   * Admin-only: Manually enroll a student in a course (AdminGift).
   */
  manualEnrollStudent: async (
    studentId: string,
    courseId: string
  ): Promise<ManualEnrollmentResponse> => {
    const response = await apiClient.post<ManualEnrollmentResponse>('/enrollments', {
      StudentId: studentId,
      CourseId: courseId,
    });
    return response.data;
  },
};

