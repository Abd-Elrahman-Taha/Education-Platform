import { apiClient } from './axios';
import {
  Lesson,
  CreateLessonRequest,
  UpdateLessonRequest,
  LessonQueryParams,
} from '../types/api.types';

export const lessonsApi = {
  /**
   * Fetch all lessons for a specific course (Student/Admin).
   */
  getCourseLessons: async (courseId: string, params?: LessonQueryParams): Promise<Lesson[]> => {
    const response = await apiClient.get<any>(`/courses/${courseId}/lessons`, { params });
    const raw = response.data;
    return raw?.data?.lessons || raw?.lessons || (Array.isArray(raw) ? raw : []);
  },

  /**
   * Fetch specific lesson by ID within a course.
   */
  getLessonById: async (courseId: string, lessonId: string): Promise<Lesson> => {
    const response = await apiClient.get<any>(`/courses/${courseId}/lessons/${lessonId}`);
    const raw = response.data;
    return raw?.data?.lesson || raw?.lesson || raw;
  },

  /**
   * Create a new lesson under a course (Admin only).
   */
  createLesson: async (courseId: string, data: CreateLessonRequest): Promise<Lesson> => {
    const response = await apiClient.post<any>(`/courses/${courseId}/lessons`, data);
    return response.data?.data?.lesson || response.data?.lesson || response.data;
  },

  /**
   * Update a lesson (Admin only).
   */
  updateLesson: async (courseId: string, lessonId: string, data: UpdateLessonRequest): Promise<Lesson> => {
    const response = await apiClient.put<any>(`/courses/${courseId}/lessons/${lessonId}`, data);
    return response.data?.data?.lesson || response.data?.lesson || response.data;
  },

  /**
   * Delete a lesson (Admin only). Returns 204 No Content.
   */
  deleteLesson: async (courseId: string, lessonId: string): Promise<void> => {
    await apiClient.delete(`/courses/${courseId}/lessons/${lessonId}`);
  },
};
