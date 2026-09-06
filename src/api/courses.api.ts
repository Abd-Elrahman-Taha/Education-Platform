import { apiClient } from './axios';
import { Course, CourseQueryParams, CoursesResponse } from '../types/api.types';

export const coursesApi = {
  /**
   * Fetch paginated courses with optional search and sorting.
   * Example: /courses?page=1&limit=20&search=math&sort=-Price
   */
  getCourses: async (params?: CourseQueryParams): Promise<CoursesResponse> => {
    const response = await apiClient.get<CoursesResponse>('/courses', { params });
    // Normalize response if backend returns array in data or courses
    const data = response.data;
    const coursesList = data.courses || data.data || [];
    return {
      courses: coursesList,
      data: coursesList,
      pagination: data.pagination,
    };
  },

  /**
   * Fetch single course details by ID.
   */
  getCourseById: async (courseId: string): Promise<Course> => {
    const response = await apiClient.get<Course | { course: Course }>(`/courses/${courseId}`);
    const data = response.data as any;
    return data.course || data;
  },
};
