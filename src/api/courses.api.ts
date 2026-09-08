import { apiClient } from './axios';
import {
  Course,
  CourseQueryParams,
  CoursesResponse,
  CreateCourseRequest,
  UpdateCourseRequest,
} from '../types/api.types';

export const coursesApi = {
  /**
   * Fetch paginated courses with optional search and sorting.
   */
  getCourses: async (params?: CourseQueryParams): Promise<CoursesResponse> => {
    const response = await apiClient.get<any>('/courses', { params });
    const raw = response.data;
    const coursesList = raw?.data?.courses || raw?.courses || raw?.data || [];
    const pagination = raw?.pagination || { total: coursesList.length, page: 1, limit: 20, totalPages: 1 };
    return {
      courses: coursesList,
      data: { courses: coursesList },
      pagination,
    };
  },

  /**
   * Fetch single course details by ID.
   */
  getCourseById: async (courseId: string): Promise<Course> => {
    const response = await apiClient.get<any>(`/courses/${courseId}`);
    const raw = response.data;
    return raw?.data?.course || raw?.course || raw;
  },

  /**
   * Create a new course (Admin only).
   */
  createCourse: async (data: CreateCourseRequest): Promise<Course> => {
    const response = await apiClient.post<any>('/courses', data);
    return response.data?.data?.course || response.data?.course || response.data;
  },

  /**
   * Update existing course (Admin only).
   */
  updateCourse: async (courseId: string, data: UpdateCourseRequest): Promise<Course> => {
    const response = await apiClient.put<any>(`/courses/${courseId}`, data);
    return response.data?.data?.course || response.data?.course || response.data;
  },

  /**
   * Delete course (Admin only). Returns 204 No Content.
   */
  deleteCourse: async (courseId: string): Promise<void> => {
    await apiClient.delete(`/courses/${courseId}`);
  },
};
