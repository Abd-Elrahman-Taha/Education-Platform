import { apiClient } from './axios';
import { Enrollment, MyCoursesResponse, ManualEnrollmentResponse } from '../types/api.types';

export const enrollmentsApi = {
  /**
   * Fetch current student's enrolled courses.
   * StudentId is derived automatically by the backend from JWT (no IDOR query params).
   */
  getMyCourses: async (params?: { page?: number; limit?: number; Status?: string }): Promise<Enrollment[]> => {
    try {
      const response = await apiClient.get<MyCoursesResponse>('/enrollments/my-courses', { params });
      return response.data?.data?.enrollments || [];
    } catch (err: any) {
      if (err?.response?.status === 403 || err?.status === 403) {
        return [];
      }
      throw err;
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

