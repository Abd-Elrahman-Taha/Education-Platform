import { apiClient } from './axios';
import { Lesson } from '../types/api.types';

export const lessonsApi = {
  /**
   * Fetch all lessons for a specific course.
   * Requires course enrollment; returns 403 if not enrolled.
   */
  getCourseLessons: async (courseId: string): Promise<Lesson[]> => {
    const response = await apiClient.get<Lesson[] | { lessons: Lesson[] } | { data: Lesson[] }>(
      `/courses/${courseId}/lessons`
    );
    const data = response.data as any;
    return Array.isArray(data) ? data : data.lessons || data.data || [];
  },

  /**
   * Fetch specific lesson by ID within a course.
   */
  getLessonById: async (courseId: string, lessonId: string): Promise<Lesson> => {
    const response = await apiClient.get<Lesson | { lesson: Lesson }>(
      `/courses/${courseId}/lessons/${lessonId}`
    );
    const data = response.data as any;
    return data.lesson || data;
  },
};
